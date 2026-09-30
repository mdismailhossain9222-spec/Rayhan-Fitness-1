import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  attachAuthCookies,
  checkRateLimit,
  getClientIp,
  validateCsrfRequest,
  logAuditEvent,
  REFRESH_COOKIE_NAME,
  JwtUserPayload,
} from "@/lib/security";

/**
 * POST /api/auth/refresh — silent refresh-token ROTATION.
 * Verifies the HttpOnly refresh cookie, checks tokenVersion (so
 * "logout on all devices" kills it), then issues a brand-new
 * access + refresh pair. Called automatically every ~14 minutes
 * by the SessionTimeout component for active users.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`refresh:${ip}`, 30, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many refresh attempts. Please log in again." },
        { status: 429 }
      );
    }

    if (!validateCsrfRequest(req)) {
      return NextResponse.json(
        { error: "CSRF validation failed." },
        { status: 403 }
      );
    }

    const token = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { error: "No active session." },
        { status: 401 }
      );
    }

    const payload = await verifyRefreshToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Session expired. Please log in again." },
        { status: 401 }
      );
    }

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.id))
      .limit(1);

    if (!dbUser || dbUser.tokenVersion !== payload.tokenVersion) {
      return NextResponse.json(
        { error: "Session revoked. Please log in again." },
        { status: 401 }
      );
    }

    const fresh: JwtUserPayload = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role as "member" | "trainer" | "admin",
      branchSlug: dbUser.branchSlug,
      tokenVersion: dbUser.tokenVersion,
    };

    const accessToken = await signAccessToken(fresh);
    // ROTATION: the old refresh token is implicitly retired because the
    // client only ever holds the newest one (single-device model); the
    // tokenVersion gate provides the global kill-switch.
    const refreshToken = await signRefreshToken(fresh, true);

    const res = NextResponse.json({
      refreshed: true,
      user: {
        id: fresh.id,
        name: fresh.name,
        email: fresh.email,
        role: fresh.role,
        branchSlug: fresh.branchSlug,
      },
    });
    attachAuthCookies(res, accessToken, refreshToken, true);

    await logAuditEvent({
      userId: fresh.id,
      userEmail: fresh.email,
      action: "AUTH_TOKEN_ROTATED",
      severity: "INFO",
      ipAddress: ip,
      details: "Silent refresh-token rotation completed.",
    });

    return res;
  } catch (err) {
    console.error("POST /api/auth/refresh error:", err);
    return NextResponse.json(
      { error: "Session refresh failed." },
      { status: 500 }
    );
  }
}
