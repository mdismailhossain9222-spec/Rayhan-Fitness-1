# RAYHAN FITNESS — Security Architecture & Policy

> Zero-tolerance policy: every control below is enforced in code, not just
> documented. Production target: **Mozilla Observatory A+ / SSL Labs A+**.

## 1. Transport & Infrastructure

| Control | Implementation |
|---|---|
| HTTPS everywhere | `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` + `upgrade-insecure-requests` in CSP. HTTP→HTTPS redirect at the edge. |
| TLS 1.3 only | Enforced at the reverse proxy / Cloudflare (minimum TLS 1.3, TLS 1.0–1.2 disabled). See `docs/DEPLOYMENT.md`. |
| WAF / DDoS / Bots | Deploy behind **Cloudflare** (Pro or higher): Managed WAF ruleset, DDoS L3/L4/L7, Bot Management / Super Bot Fight Mode, rate-limit rules mirroring Section 5. Origin must only accept Cloudflare IPs (Authenticated Origin Pulls + firewall). |
| Admin network gating | Optional IP allowlist via `ADMIN_ALLOWED_IPS` (comma-separated). When set, any `/api/auth/login` with `role=admin` from a non-listed IP is rejected with `403` + `CRITICAL` audit event. See `src/app/api/auth/login/route.ts`. |

## 2. HTTP Security Headers (Helmet-equivalent, `next.config.ts`)

- `Content-Security-Policy` — strict allowlist: `default-src 'self'`, scripts `self` + analytics, styles `self` + Google Fonts, images `self` + Pexels + OSM, `frame-src` OSM only, `object-src 'none'`, `base-uri/form-action 'self'`.
  - `'unsafe-inline'` is required by Next.js hydration; the production hardening path is **nonce-based CSP via middleware** (see backlog note in `docs/DEPLOYMENT.md`).
  - `frame-ancestors` is allowlisted for **Arena/E2B preview embedding only**. For public production, tighten to `frame-ancestors 'none'` and re-add `X-Frame-Options: DENY`.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geolocation/payment disabled), `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, `X-Permitted-Cross-Domain-Policies: none`, `X-DNS-Prefetch-Control: on`.
- `X-Powered-By` removed (`poweredByHeader: false`).

## 3. CORS (`src/proxy.ts`)

- Same-origin + explicit `ALLOWED_ORIGINS` whitelist only.
- Any `/api/*` request carrying a non-listed `Origin` is rejected with `403`.
- Preflight (`OPTIONS`) handled with a minimal allowlist of methods/headers.

## 4. CSRF — every state-changing request

Triple-layer (OWASP compliant):

1. **Custom-header token** — all browser API calls go through `apiFetch()` (`src/lib/api-client.ts`), which attaches `X-Requested-With: RayhanFitnessClient`. Edge middleware rejects any `POST/PUT/PATCH/DELETE /api/*` without it (except `/api/vitals`, `/api/webhooks/*`, `/api/health`).
2. **Double-submit cookie** — middleware provisions `rf_csrf_token`; `apiFetch()` echoes it as `X-CSRF-Token`; routes verify equality via `validateCsrfRequest()`.
3. **Origin validation** — `Origin` (when present) must be allowlisted.
4. Cookies are `SameSite=Strict`, so cross-site cookie attachment is already impossible — the layers above are defense-in-depth.

## 5. Rate limiting & brute-force protection

| Layer | Where |
|---|---|
| Edge sliding-window tiers (auth 20/15m, contact 10/15m, vitals 120/m, default 180/m) | `src/proxy.ts` |
| Route-level sliding windows (login 15/15m, signup 10/15m, contact 8/15m, refresh 30/15m, forgot 5/h, reset 10/15m, webhooks 60/m, vitals 120/m) | `checkRateLimit()` in `src/lib/security.ts` |
| **Per-account exponential lockout**: 5 failures → 60s lock, doubling per further failure up to 1h | `recordLoginFailure()` / `isAccountLocked()` |
| Cloudflare rate-limit rules (production) | `docs/DEPLOYMENT.md` |

Failed logins, lockouts and rate-limit trips are all audit-logged (`WARN`/`CRITICAL`).

## 6. Authentication & sessions

- **Passwords**: bcrypt, cost factor **12** (`hashPassword()`), 5-rule strength policy enforced client + server. (Argon2id is the approved alternative; `bcryptjs` was chosen for Edge-safe pure-JS hashing.)
- **JWT**: 15-minute access token + rotating 7/30-day refresh token, both `HttpOnly; Secure; SameSite=Strict` cookies. Silent rotation at `/api/auth/refresh`; `tokenVersion` in PostgreSQL is the global kill-switch ("logout on all devices", password reset).
- **Password reset**: single-use token, SHA-256 hashed at rest, 15-minute TTL, timing-safe compare, generic responses (no account enumeration). All-sessions revoked on success.
- **2FA**: optional OTP for members; **mandatory for Trainer/Admin** (login returns `requires2FA` until a valid OTP is presented). Toggle in Dashboard → Security.
- **Inactivity**: 30-minute client watchdog auto-logs-out idle sessions (`SessionTimeout`); access-token expiry forces re-auth.
- **RBAC**: `member` / `trainer` / `admin` enforced server-side on every privileged route (`/api/auth/me`, `/api/branches` PATCH, `/api/contact` PATCH).

## 7. Input validation & injection defense

- `sanitizeString()` (script-tag/HTML/`javascript:`/event-handler stripping + length caps), `isValidEmail()`, `isValidBdPhone()` applied on **every** form field, client + server.
- **100% parameterized ORM** (Drizzle) — no raw SQL string concatenation anywhere (the `/api/health` probe is a static `select 1`).
- File uploads: **none exist**. If profile-photo upload is added, `validateImageUpload()` enforces strict MIME + extension + 2MB policy; the production pipeline must re-encode via sharp, virus-scan, and store outside the web root (S3/Cloudinary signed URLs).

## 8. Payment security (bKash / Nagad / Card)

- Raw card/wallet credentials are **never** collected or stored — production checkout must use the official gateway SDK / hosted redirect (PCI-DSS scope stays with the gateway).
- Client "success" is never trusted: only a signed server-to-server webhook (`/api/webhooks/payment`, HMAC-SHA256 + timing-safe compare, unknown-TrxID rejection) confirms payment.
- Logs persist **masked** references only (`01712-***677`, `4321 •••• •••• 8819`).

## 9. Data protection & operations

- Secrets live in `.env` (git-ignored via `.gitignore`); `.env.example` documents every variable with no real values. No secret is ever bundled to the client (`NEXT_PUBLIC_*` holds only the public site URL).
- Least-privilege DB roles in production (app role: CRUD on app tables only; migrations via a separate owner role). Daily encrypted backups + tested restore runbook (`docs/DEPLOYMENT.md`).
- Audit log (`audit_logs` table): admin actions, pricing changes, failed/2FA logins, lockouts, reset flows, webhook verdicts — who/when/what/IP, `INFO/WARN/CRITICAL` severities.
- Errors: routes return **generic messages**; stack traces go to server logs only (wire Sentry/LogRocket via the `console.error` call sites).

## 10. Hygiene & verification

- `npm audit` on every build; enable **GitHub Dependabot + Snyk** in CI (`docs/DEPLOYMENT.md`).
- Verify headers/SSL: Mozilla Observatory + SSL Labs (target **A+**).
- Pen-test checklist (OWASP Top 10 2021): A01 broken access control (RBAC tests), A02 crypto failures (TLS/HSTS/cookies), A03 injection (XSS/SQLi payload suite on all forms), A04 insecure design (threat-model checkout), A05 misconfiguration (headers/CORS review), A06 vulnerable components (`npm audit`), A07 auth failures (lockout/2FA/reset tests), A08 integrity (webhook HMAC, SRI where CDN), A09 logging (audit coverage), A10 SSRF (no user-controlled fetch targets — verified: none).
