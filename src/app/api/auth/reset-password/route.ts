import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { eq, sql } from "drizzle-orm";
import {
  sanitizeString,
  hashPassword,
  validatePasswordStrength,
  checkRateLimit,
  getClientIp,
  validateCsrfRequest,
  logAuditEvent,
} from "@/lib/security";

/**
 * POST /api/auth/reset-password — consumes a single-use reset token.
 * - Timing-safe hash comparison, 15-minute expiry enforced.
 * - Token is single-use (cleared on success) and a password change
 *   bumps tokenVersion, revoking ALL sessions on every device.
 */
export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const ip = getClientIp(req);
    const rate = checkRateLimit(`reset:${ip}`, 10, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please request a fresh reset link." },
        { status: 429 }
      );
    }

    if (!validateCsrfRequest(req)) {
      return NextResponse.json(
        { error: "CSRF validation failed." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const email = sanitizeString(body.email, 150).toLowerCase();
    const token = String(body.token || "");
    const newPassword = String(body.newPassword || "");

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return NextResponse.json(
        {
          error: `Password does not meet security rules: ${strength.errors.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (!/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 }
      );
    }

    const incomingHash = createHash("sha256").update(token).digest("hex");
    const a = Buffer.from(user.resetToken, "utf8");
    const b = Buffer.from(incomingHash, "utf8");
    const match = a.length === b.length && timingSafeEqual(a, b);
    const expired = new Date(user.resetTokenExpiry).getTime() < Date.now();

    if (!match || expired) {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "AUTH_PASSWORD_RESET_REJECTED",
        severity: "WARN",
        ipAddress: ip,
        details: expired
          ? "Expired reset token presented."
          : "Invalid reset token presented.",
      });
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(newPassword);
    await db
      .update(users)
      .set({
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        tokenVersion: sql`${users.tokenVersion} + 1`,
      })
      .where(eq(users.id, user.id));

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "AUTH_PASSWORD_RESET_COMPLETED",
      severity: "WARN",
      ipAddress: ip,
      details: "Password rotated; all sessions revoked via tokenVersion bump.",
    });

    return NextResponse.json({
      success: true,
      message:
        "Password updated. All devices have been signed out — please log in again.",
    });
  } catch (err) {
    console.error("POST /api/auth/reset-password error:", err);
    return NextResponse.json(
      { error: "Password-reset service unavailable." },
      { status: 500 }
    );
  }
}
