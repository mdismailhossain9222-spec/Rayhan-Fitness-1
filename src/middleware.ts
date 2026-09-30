import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  updateSupabaseSession,
  isSupabaseMiddlewareConfigured,
} from "./lib/supabase/middleware";
import type { Database } from "./lib/supabase/types";

/**
 * Edge middleware — two jobs:
 *  A. /api/* — existing hardened shield (strict CORS, CSRF enforcement,
 *     tiered edge rate limiting, CSRF-cookie provisioning).
 *  B. Pages — Supabase session-token refresh on every request + private
 *     route protection (/dashboard/*, /admin/*).
 *
 * When Supabase is NOT configured (local preview), part B is skipped and
 * legacy demo behavior is preserved exactly. When configured, a Supabase
 * session OR a legacy rf_* cookie session grants access; /admin
 * additionally requires role='admin' (Supabase users checked here,
 * legacy sessions re-checked server-side in the admin page + API RBAC).
 *
 * NOTE: Edge runtime — no Node APIs, no direct DB access.
 */

const CSRF_COOKIE = "rf_csrf_token";
const CSRF_HEADER = "x-requested-with";
const CSRF_HEADER_VALUE = "RayhanFitnessClient";
const LEGACY_ACCESS_COOKIE = "rf_access_token";
const LEGACY_REFRESH_COOKIE = "rf_refresh_token";

// Routes exempt from the CSRF custom-header check:
// - /api/vitals: sendBeacon cannot set custom headers; no state change, heavily rate-limited.
// - /api/webhooks/*: authenticated via HMAC-SHA256 gateway signatures instead.
// - /api/health: GET-only liveness probe.
const CSRF_EXEMPT_PREFIXES = ["/api/vitals", "/api/webhooks/", "/api/health"];

function getAllowedOrigins(req: NextRequest): string[] {
  const raw = process.env.ALLOWED_ORIGINS || "";
  const list = raw
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
  // Always allow the request's own host (same-origin calls).
  const host = req.headers.get("host");
  if (host) {
    list.push(`https://${host}`, `http://${host}`);
  }
  if (process.env.NODE_ENV !== "production") {
    list.push("http://localhost:3000", "http://127.0.0.1:3000");
  }
  return list;
}

function edgeRandomHex(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

// --- Minimal in-memory sliding-window limiter for the edge ---------------
interface EdgeEntry {
  count: number;
  resetAt: number;
}
const edgeStore = new Map<string, EdgeEntry>();

function edgeRateLimit(
  key: string,
  max: number,
  windowMs: number
): { allowed: boolean; resetInSeconds: number } {
  const now = Date.now();
  const entry = edgeStore.get(key);
  if (!entry || now > entry.resetAt) {
    edgeStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, resetInSeconds: Math.ceil(windowMs / 1000) };
  }
  if (entry.count >= max) {
    return {
      allowed: false,
      resetInSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  entry.count += 1;
  edgeStore.set(key, entry);
  return {
    allowed: true,
    resetInSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

function tierFor(pathname: string): { max: number; windowMs: number } {
  if (
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/signup") ||
    pathname.startsWith("/api/auth/forgot-password") ||
    pathname.startsWith("/api/auth/reset-password")
  ) {
    return { max: 20, windowMs: 15 * 60 * 1000 }; // auth brute-force tier
  }
  if (pathname.startsWith("/api/contact")) {
    return { max: 10, windowMs: 15 * 60 * 1000 }; // spam tier
  }
  if (pathname.startsWith("/api/vitals")) {
    return { max: 120, windowMs: 60 * 1000 }; // analytics tier
  }
  return { max: 180, windowMs: 60 * 1000 }; // default API tier
}

function isProtectedPath(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  );
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ================= A. API shield (existing behavior) =====================
  if (pathname.startsWith("/api/")) {
    const origin = req.headers.get("origin");
    const allowed = getAllowedOrigins(req);

    // 1. Strict CORS: block disallowed cross-origin callers.
    if (origin && !allowed.includes(origin)) {
      return NextResponse.json(
        { error: "Forbidden: cross-origin request not allowed." },
        { status: 403 }
      );
    }

    // Preflight support for allowed origins.
    if (req.method === "OPTIONS") {
      const res = new NextResponse(null, { status: 204 });
      if (origin) {
        res.headers.set("Access-Control-Allow-Origin", origin);
        res.headers.set("Vary", "Origin");
      }
      res.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PATCH, PUT, DELETE, OPTIONS"
      );
      res.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, X-Requested-With, X-CSRF-Token, X-Gateway-Signature"
      );
      res.headers.set("Access-Control-Max-Age", "86400");
      return res;
    }

    // 2. Edge rate limiting.
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const tier = tierFor(pathname);
    const rl = edgeRateLimit(`${ip}:${pathname}`, tier.max, tier.windowMs);
    if (!rl.allowed) {
      const res = NextResponse.json(
        {
          error: `Too many requests. Please retry in ${rl.resetInSeconds} seconds.`,
        },
        { status: 429 }
      );
      res.headers.set("Retry-After", String(rl.resetInSeconds));
      return res;
    }

    // 3. CSRF token enforcement on state-changing requests.
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
    const isExempt = CSRF_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));
    if (isMutation && !isExempt) {
      const headerOk =
        req.headers.get(CSRF_HEADER) === CSRF_HEADER_VALUE;
      const csrfHeader = req.headers.get("x-csrf-token");
      const csrfCookie = req.cookies.get(CSRF_COOKIE)?.value;
      const doubleSubmitOk =
        !!csrfHeader &&
        !!csrfCookie &&
        csrfHeader === csrfCookie &&
        csrfHeader.startsWith("rf_csrf_");
      if (!headerOk && !doubleSubmitOk) {
        return NextResponse.json(
          { error: "CSRF validation failed: missing or invalid request token." },
          { status: 403 }
        );
      }
    }

    // 4. Refresh Supabase session + provision CSRF cookie + continue.
    const { response } = await updateSupabaseSession(req);
    if (origin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Vary", "Origin");
    }
    if (!req.cookies.get(CSRF_COOKIE)?.value) {
      const token = `rf_csrf_${Date.now().toString(36)}_${edgeRandomHex(12)}`;
      response.cookies.set(CSRF_COOKIE, token, {
        httpOnly: false, // readable by JS so it can echo it in X-CSRF-Token
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    return response;
  }

  // ============ B. Pages: session refresh + private routes ==================
  const { response, user } = await updateSupabaseSession(req);

  if (isSupabaseMiddlewareConfigured() && isProtectedPath(pathname)) {
    const hasLegacySession =
      req.cookies.has(LEGACY_ACCESS_COOKIE) ||
      req.cookies.has(LEGACY_REFRESH_COOKIE);

    // Unauthenticated → login (either session type grants access).
    if (!user && !hasLegacySession) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirected", "1");
      return NextResponse.redirect(loginUrl);
    }

    // /admin additionally requires role='admin' for Supabase users.
    // (Legacy-cookie sessions are role-checked server-side in the admin
    // page itself + API RBAC, so they pass through here.)
    if (user && isAdminPath(pathname)) {
      try {
        const supabase = createServerClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() {
                return req.cookies.getAll();
              },
              setAll() {
                // Refresh already handled above; read-only here.
              },
            },
          }
        );
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (data && (data as { role: string }).role !== "admin") {
          const homeUrl = req.nextUrl.clone();
          homeUrl.pathname = "/";
          homeUrl.search = "?toast=unauthorized";
          return NextResponse.redirect(homeUrl);
        }
      } catch {
        // Fail open to the page-level server check + RLS (defense in depth).
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
