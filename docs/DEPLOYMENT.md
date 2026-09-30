# RAYHAN FITNESS — Production Deployment Guide

## 1. Prerequisites

- Node.js 20 LTS, PostgreSQL 15+, a Cloudflare account (DNS + proxy).
- Environment: copy `.env.example` → `.env` and fill **every** secret with
  cryptographically random values (`openssl rand -hex 32`):
  `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CSRF_SECRET`,
  `PAYMENT_WEBHOOK_SECRET`, `ALLOWED_ORIGINS`, `ADMIN_ALLOWED_IPS`,
  `NEXT_PUBLIC_SITE_URL`, gateway keys.

## 2. Build & start

```bash
npm ci                    # reproducible install
npx drizzle-kit push      # apply schema (or run migrations)
npm run build             # Next.js production build (Turbopack)
npm start -- -p 3000      # serve behind the edge proxy
```

Health: `GET /api/health` → `{"ok":true}` (also seeds reference data).

## 3. Cloudflare edge (WAF / CDN / DDoS)

1. Proxy all DNS records (orange cloud). **SSL/TLS → Full (Strict)**, minimum
   version **TLS 1.3**, enable **HSTS** (includeSubDomains + preload) and
   **Authenticated Origin Pulls**; firewall the origin to Cloudflare IPs only.
2. **Security → WAF**: enable Managed Ruleset + OWASP pack; add custom rules:
   - Block `/api/auth/*` bursts (>20 req/15m/IP), `/api/contact` (>10/15m).
   - Challenge (managed) bot scores < 30 on `/api/*`.
3. **Speed**: Auto Minify (JS/CSS/HTML), Brotli, Early Hints, HTTP/3;
   Cache Rules: `/_next/static/*` (1y immutable), `/images/*` `/icons/*`
   (7d), HTML at edge (respect `s-maxage`, bypass `/api/*` + cookies).
4. **Bot Management** (or Super Bot Fight Mode) on; **DDoS** L3/L4/L7 automatic.

## 4. Caching, compression & rendering

- `Cache-Control` is emitted per asset class in `next.config.ts`
  (immutable build assets, 7-day media, 1-day icons, no-cache SW).
- Text compression: Next.js gzip + Cloudflare **Brotli** at the edge.
- Rendering: all marketing pages are **statically prerendered (SSG)** —
  see the `○` routes in the build output. API routes are dynamic.
  (Hourly ISR via `export const revalidate` is the upgrade path once the
  marketing pages migrate from client components to async server
  components fetching through the data layer.)
- Fonts: `next/font` self-hosts with `font-display: swap` + preload;
  Pexels preconnect + logo preload are emitted from the root layout.

## 5. Performance targets & monitoring

- Budgets: **LCP < 2.0s, CLS < 0.1, INP < 200ms, Lighthouse 95+** (mobile +
  desktop). Verify with `npx lighthouse <url> --preset=desktop` and Moto G
  throttled runs; test critical content on **3G Fast** presets.
- RUM: `WebVitalsReporter` beacons CLS/INP/LCP/FCP/TTFB to `/api/vitals`
  (server-logged; forward to Google Analytics / Vercel Analytics).
- 3D policy (**balanced — zero animation cuts**): Three.js loads **after
  paint** (`next/dynamic`, SSR-off) with zero visual reduction — full
  antialiasing, DPR up to 2, all 150 gold-dust particles, full 60fps loop
  and cursor parallax on every device. GPU work is skipped only while the
  hero is off-screen or the tab is hidden (invisible); a static-gradient
  fallback renders solely when WebGL itself is unavailable.

## 6. PWA

- `public/manifest.json` (gold-crest icons 192/512, standalone, `#0A0A0A`).
- `public/sw.js` (registered in production only): navigation network-first
  with `/offline` fallback; cache-first versioned static assets; API
  bypassed. Bump `rf-static-v1` / `rf-pages-v1` to force cache rotation.

## 7. Database & backups

- Least privilege: app role gets CRUD on app tables only; use a separate
  owner role for migrations. `pgcrypto` not required.
- Nightly `pg_dump` → encrypted object storage (SSE-S3/KMS), 30-day
  retention; quarterly restore drill. Point-in-time recovery recommended
  (RDS/Cloud SQL/Supabase).

## 8. CI/CD security gates

```yaml
- npm audit --audit-level=moderate   # fail the pipeline on new advisories
- npm run build                      # typecheck + lint + build
- lighthouse --preset=desktop --min-score=95
- zap-baseline-scan / nuclei         # DAST on preview deploys
```

Enable **Dependabot + Snyk**; rotate JWT/CSRF/webhook secrets on any
suspected leak (bump all users' `tokenVersion` to force global re-login).

## 9. Go-live verification checklist

- [ ] Observatory A+, SSL Labs A+, `curl -I` shows HSTS/CSP/nosniff.
- [ ] `frame-ancestors` tightened to `'none'` + `X-Frame-Options: DENY`
      (preview allowlist removed) — see `SECURITY.md §2`.
- [ ] Admin login from non-allowlisted IP → 403; staff login → 2FA enforced.
- [ ] Lockout after 5 bad passwords (60s, doubling); reset link single-use/15m.
- [ ] Webhook with bad HMAC → 401; unknown TrxID → 404; no raw PAN in logs.
- [ ] `/offline` renders with network disabled (PWA); manifest installable.
- [ ] OWASP Top 10 pen-test pass recorded (see `SECURITY.md §10`).
