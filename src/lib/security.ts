import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { eq } from "drizzle-orm";

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || "rayhan-fitness-production-access-secret-key-2026-dhaka"
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || "rayhan-fitness-production-refresh-secret-key-2026-dhaka"
);
const CSRF_SECRET =
  process.env.CSRF_SECRET || "rayhan-fitness-csrf-hmac-token-2026";

export interface JwtUserPayload {
  id: number;
  email: string;
  name: string;
  role: "member" | "trainer" | "admin";
  branchSlug: string;
  tokenVersion: number;
}

// ============================================================================
// 1. PASSWORD HASHING & STRENGTH VALIDATION (BCRYPT COST 12 + SALT)
// ============================================================================
export async function hashPassword(plain: string): Promise<string> {
  // Cost factor 12 per policy (Argon2id is the approved alternative).
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function validatePasswordStrength(password: string): {
  valid: boolean;
  score: number; // 0 to 5
  errors: string[];
} {
  const errors: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else errors.push("Minimum 8 characters required");

  if (/[A-Z]/.test(password)) score++;
  else errors.push("At least one uppercase letter (A-Z)");

  if (/[a-z]/.test(password)) score++;
  else errors.push("At least one lowercase letter (a-z)");

  if (/[0-9]/.test(password)) score++;
  else errors.push("At least one numeric digit (0-9)");

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else errors.push("At least one special symbol (!@#$%^&*)");

  return {
    valid: errors.length === 0,
    score,
    errors,
  };
}

// ============================================================================
// 2. INPUT SANITIZATION & XSS PREVENTION
// ============================================================================
export function sanitizeString(input: unknown, maxLength = 1000): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .slice(0, maxLength);
}

export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(email) && email.length <= 150;
}

export function isValidBdPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  return /^(\+?8801|01)[3-9]\d{8}$/.test(cleaned) || cleaned.length >= 8;
}

// ============================================================================
// 3. JWT ACCESS & REFRESH TOKENS (JOSE HS256)
// ============================================================================
export async function signAccessToken(payload: JwtUserPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("rayhan-fitness-auth")
    .setExpirationTime("15m")
    .sign(ACCESS_SECRET);
}

export async function signRefreshToken(
  payload: JwtUserPayload,
  rememberMe = false
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("rayhan-fitness-auth")
    .setExpirationTime(rememberMe ? "30d" : "7d")
    .sign(REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<JwtUserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    return payload as unknown as JwtUserPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<JwtUserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return payload as unknown as JwtUserPayload;
  } catch {
    return null;
  }
}

// ============================================================================
// 4. HTTP-ONLY, SECURE, SAMESITE=STRICT COOKIES
// ============================================================================
export const ACCESS_COOKIE_NAME = "rf_access_token";
export const REFRESH_COOKIE_NAME = "rf_refresh_token";
export const CSRF_COOKIE_NAME = "rf_csrf_token";

export function attachAuthCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken: string,
  rememberMe = false
): void {
  const isProd = process.env.NODE_ENV === "production";

  res.cookies.set(ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 15, // 15 minutes
  });

  res.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7,
  });

  const csrfToken = generateCsrfToken();
  res.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // readable by frontend JS to send in X-CSRF-Token header
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookies(res: NextResponse): void {
  res.cookies.delete(ACCESS_COOKIE_NAME);
  res.cookies.delete(REFRESH_COOKIE_NAME);
}

// ============================================================================
// 5. CSRF TOKEN GENERATION & VALIDATION
// ============================================================================
export function generateCsrfToken(): string {
  const timestamp = Date.now().toString(36);
  const sig = Buffer.from(`${timestamp}:${CSRF_SECRET}`).toString("base64url").slice(0, 24);
  return `rf_csrf_${timestamp}_${sig}`;
}

export function validateCsrfRequest(req: NextRequest): boolean {
  // 1. Double-submit cookie: an echoed header token must EXACTLY match it.
  const headerToken = req.headers.get("x-csrf-token");
  const cookieToken = req.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (headerToken && cookieToken) {
    return headerToken === cookieToken && headerToken.startsWith("rf_csrf_");
  }
  // 2. Custom-header + Origin allowlist (OWASP "custom request header"
  //    defense). Cross-site <form> posts cannot set custom headers without
  //    a preflight, and SameSite=Strict cookies never attach cross-site.
  if (req.headers.get("x-requested-with") !== "RayhanFitnessClient") {
    return false;
  }
  const origin = req.headers.get("origin");
  if (origin && !isOriginAllowed(origin, req.headers.get("host"))) {
    return false;
  }
  return true;
}

// ============================================================================
// 6. BRUTE-FORCE & RATE LIMITER (SLIDING WINDOW IN-MEMORY STORE)
// ============================================================================
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  identifier: string,
  maxRequests = 12,
  windowMs = 15 * 60 * 1000
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetInSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

export function getClientIp(req?: NextRequest): string {
  if (!req) return "127.0.0.1";
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

// ============================================================================
// 7. CURRENT SESSION RESOLVER & RBAC VERIFICATION
// ============================================================================
export async function getSessionUser(): Promise<JwtUserPayload | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
    const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

    let payload: JwtUserPayload | null = null;
    if (accessToken) {
      payload = await verifyAccessToken(accessToken);
    }
    if (!payload && refreshToken) {
      payload = await verifyRefreshToken(refreshToken);
    }
    if (!payload) return null;

    // Verify tokenVersion in PostgreSQL so "Logout on All Devices" immediately invalidates old tokens
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.id))
      .limit(1);

    if (!dbUser || dbUser.tokenVersion !== payload.tokenVersion) {
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role as "member" | "trainer" | "admin",
      branchSlug: dbUser.branchSlug,
      tokenVersion: dbUser.tokenVersion,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// 8. AUDIT LOGGING (PERSISTED TO POSTGRESQL)
// ============================================================================
export async function logAuditEvent(params: {
  userId?: number | null;
  userEmail: string;
  action: string;
  severity?: "INFO" | "WARN" | "CRITICAL";
  ipAddress?: string;
  details: string;
}) {
  try {
    await db.insert(auditLogs).values({
      userId: params.userId ?? null,
      userEmail: params.userEmail,
      action: params.action,
      severity: params.severity ?? "INFO",
      ipAddress: params.ipAddress ?? "127.0.0.1",
      details: params.details,
    });
  } catch (err) {
    console.error("Failed to record audit log:", err);
  }
}

// ============================================================================
// 9. PER-ACCOUNT LOGIN LOCKOUT (EXPONENTIAL BACKOFF)
// ============================================================================
interface LockoutEntry {
  failures: number;
  lockUntil: number;
}

const loginLockoutStore = new Map<string, LockoutEntry>();

export function isAccountLocked(email: string): {
  locked: boolean;
  retryInSeconds: number;
} {
  const entry = loginLockoutStore.get(email.toLowerCase());
  if (!entry || Date.now() >= entry.lockUntil) {
    return { locked: false, retryInSeconds: 0 };
  }
  return {
    locked: true,
    retryInSeconds: Math.max(1, Math.ceil((entry.lockUntil - Date.now()) / 1000)),
  };
}

export function recordLoginFailure(email: string): {
  locked: boolean;
  retryInSeconds: number;
} {
  const key = email.toLowerCase();
  const now = Date.now();
  const entry = loginLockoutStore.get(key) ?? { failures: 0, lockUntil: 0 };
  entry.failures += 1;
  // 5 failures → 60s lock, doubling every further failure, capped at 1 hour.
  if (entry.failures >= 5) {
    const seconds = Math.min(3600, 60 * Math.pow(2, entry.failures - 5));
    entry.lockUntil = now + seconds * 1000;
  }
  loginLockoutStore.set(key, entry);
  return entry.lockUntil > now
    ? { locked: true, retryInSeconds: Math.ceil((entry.lockUntil - now) / 1000) }
    : { locked: false, retryInSeconds: 0 };
}

export function clearLoginFailures(email: string): void {
  loginLockoutStore.delete(email.toLowerCase());
}

// ============================================================================
// 10. ORIGIN ALLOWLIST (STRICT CORS)
// ============================================================================
export function isOriginAllowed(origin: string, host: string | null): boolean {
  const raw = process.env.ALLOWED_ORIGINS || "";
  const list = raw
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
  if (list.includes(origin)) return true;
  if (
    host &&
    (origin === `https://${host}` || origin === `http://${host}`)
  ) {
    return true;
  }
  if (
    process.env.NODE_ENV !== "production" &&
    (origin === "http://localhost:3000" || origin === "http://127.0.0.1:3000")
  ) {
    return true;
  }
  return false;
}

// ============================================================================
// 11. FILE-UPLOAD VALIDATION POLICY
// ============================================================================
const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

/**
 * Strict upload gate for profile photos (no upload UI exists yet — when one
 * is added it MUST pass through here). Production pipeline: re-encode via
 * sharp (strips EXIF + embedded payloads), virus-scan, store outside the web
 * root (S3/Cloudinary), serve via signed URLs only.
 */
export function validateImageUpload(file: {
  mimeType: string;
  sizeBytes: number;
  fileName: string;
}): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_MIME.has(file.mimeType)) {
    return {
      valid: false,
      error: "Only JPG, PNG, WebP or AVIF images are allowed.",
    };
  }
  if (file.sizeBytes > 2 * 1024 * 1024) {
    return { valid: false, error: "Image must be under 2 MB." };
  }
  if (!/\.(jpe?g|png|webp|avif)$/i.test(file.fileName)) {
    return {
      valid: false,
      error: "File extension does not match an allowed image type.",
    };
  }
  return { valid: true };
}

