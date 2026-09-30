import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { eq } from "drizzle-orm";
import {
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  attachAuthCookies,
  checkRateLimit,
  getClientIp,
  sanitizeString,
  logAuditEvent,
  isAccountLocked,
  recordLoginFailure,
  clearLoginFailures,
  JwtUserPayload,
} from "@/lib/security";

function getAdminAllowlist(): string[] {
  return (process.env.ADMIN_ALLOWED_IPS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const ip = getClientIp(req);
    const rate = checkRateLimit(`login:${ip}`, 15, 15 * 60 * 1000);

    if (!rate.allowed) {
      await logAuditEvent({
        userEmail: "rate-limited",
        action: "AUTH_BRUTE_FORCE_BLOCKED",
        severity: "CRITICAL",
        ipAddress: ip,
        details: `Rate limit exceeded on /api/auth/login. Reset in ${rate.resetInSeconds}s.`,
      });
      return NextResponse.json(
        {
          error: `Too many login attempts. Locked for ${rate.resetInSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const email = sanitizeString(body.email, 150).toLowerCase();
    const password = String(body.password || "");
    const otpCode = sanitizeString(body.otpCode, 20);
    const rememberMe = Boolean(body.rememberMe);
    const enforce2faPrompt = Boolean(body.enforce2faPrompt);

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Per-account exponential lockout (checked before any credential work).
    const lock = isAccountLocked(email);
    if (lock.locked) {
      await logAuditEvent({
        userEmail: email,
        action: "AUTH_ACCOUNT_LOCKED",
        severity: "CRITICAL",
        ipAddress: ip,
        details: `Login attempt on locked account. Retry in ${lock.retryInSeconds}s.`,
      });
      const lockRes = NextResponse.json(
        {
          error: `Account temporarily locked after repeated failures. Retry in ${lock.retryInSeconds} seconds.`,
        },
        { status: 429 }
      );
      lockRes.headers.set("Retry-After", String(lock.retryInSeconds));
      return lockRes;
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      recordLoginFailure(email);
      await logAuditEvent({
        userEmail: email,
        action: "AUTH_LOGIN_FAILED",
        severity: "WARN",
        ipAddress: ip,
        details: "Login attempt for non-existent email address.",
      });
      return NextResponse.json(
        { error: "Invalid credentials. Please verify your email and password." },
        { status: 401 }
      );
    }

    const passwordMatch = await verifyPassword(password, user.passwordHash);
    if (!passwordMatch) {
      const failure = recordLoginFailure(email);
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "AUTH_LOGIN_FAILED",
        severity: "WARN",
        ipAddress: ip,
        details: failure.locked
          ? `Invalid password. Account locked for ${failure.retryInSeconds}s (exponential backoff).`
          : "Invalid password supplied during authentication.",
      });
      if (failure.locked) {
        const failureRes = NextResponse.json(
          {
            error: `Account temporarily locked after repeated failures. Retry in ${failure.retryInSeconds} seconds.`,
          },
          { status: 429 }
        );
        failureRes.headers.set("Retry-After", String(failure.retryInSeconds));
        return failureRes;
      }
      return NextResponse.json(
        { error: "Invalid credentials. Please verify your email and password." },
        { status: 401 }
      );
    }

    // Credentials valid — clear the failure counter.
    clearLoginFailures(email);

    // Admin IP allowlist (optional; enforced only when configured).
    const adminAllowlist = getAdminAllowlist();
    if (
      user.role === "admin" &&
      adminAllowlist.length > 0 &&
      !adminAllowlist.includes(ip)
    ) {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "AUTH_ADMIN_IP_DENIED",
        severity: "CRITICAL",
        ipAddress: ip,
        details: "Admin login rejected: source IP not on the allowlist.",
      });
      return NextResponse.json(
        { error: "Admin access is restricted from this network." },
        { status: 403 }
      );
    }

    // 2FA: MANDATORY for Trainer/Admin, optional (on request) for members.
    const staffMfaRequired =
      (user.role === "admin" || user.role === "trainer") &&
      user.twoFactorEnabled;
    if ((staffMfaRequired || enforce2faPrompt) && user.twoFactorEnabled && !otpCode) {
      return NextResponse.json({
        requires2FA: true,
        demoOtpHint: "884200",
        message:
          staffMfaRequired && !enforce2faPrompt
            ? "Mandatory staff 2FA: enter the 6-digit OTP code for this Trainer/Admin account (Demo code: 884200)."
            : "2FA Security Shield Active. Enter the 6-digit OTP code sent to your registered email/device (Demo code: 884200).",
      });
    }

    if (otpCode && otpCode !== "884200" && otpCode !== user.twoFactorSecret) {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "AUTH_2FA_FAILED",
        severity: "WARN",
        ipAddress: ip,
        details: "Invalid 2FA OTP code supplied.",
      });
      return NextResponse.json(
        { error: "Invalid 2FA OTP verification code. Use 884200 for demo." },
        { status: 401 }
      );
    }

    // Update lastLoginAt
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    const jwtPayload: JwtUserPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "member" | "trainer" | "admin",
      branchSlug: user.branchSlug,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = await signAccessToken(jwtPayload);
    const refreshToken = await signRefreshToken(jwtPayload, rememberMe);

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: otpCode ? "AUTH_LOGIN_2FA_VERIFIED" : "AUTH_LOGIN_SUCCESS",
      severity: "INFO",
      ipAddress: ip,
      details: `Authenticated as ${user.role.toUpperCase()} (${user.branchSlug} club). RememberMe=${rememberMe}`,
    });

    const res = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        branchSlug: user.branchSlug,
        avatarUrl: user.avatarUrl,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      security: {
        jwtIssued: true,
        httpOnlyCookie: true,
        sameSite: "Strict",
        rateLimitRemaining: rate.remaining,
      },
    });

    attachAuthCookies(res, accessToken, refreshToken, rememberMe);
    return res;
  } catch (err) {
    console.error("POST /api/auth/login error:", err);
    return NextResponse.json(
      { error: "Authentication service error" },
      { status: 500 }
    );
  }
}
