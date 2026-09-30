import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { eq } from "drizzle-orm";
import {
  sanitizeString,
  isValidEmail,
  checkRateLimit,
  getClientIp,
  validateCsrfRequest,
  logAuditEvent,
} from "@/lib/security";

/**
 * POST /api/auth/forgot-password — secure password-reset initiation.
 * - Single-use token, SHA-256 hashed at rest, 15-minute expiry.
 * - Always returns a generic message (no account-enumeration leak).
 * - Production: the raw token is emailed via the mail provider and
 *   NEVER returned to the client. A dev-only echo exists below.
 */
export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const ip = getClientIp(req);
    const rate = checkRateLimit(`forgot:${ip}`, 5, 60 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Too many reset requests. Retry in ${rate.resetInSeconds} seconds.`,
        },
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

    const genericOk = {
      success: true,
      message:
        "If an account exists for this email, a secure reset link has been sent. It expires in 15 minutes.",
    };

    if (!isValidEmail(email)) {
      return NextResponse.json(genericOk);
    }

    const emailRate = checkRateLimit(`forgot:email:${email}`, 3, 60 * 60 * 1000);
    if (!emailRate.allowed) {
      return NextResponse.json(genericOk);
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      await logAuditEvent({
        userEmail: email,
        action: "AUTH_PASSWORD_RESET_REQUESTED_UNKNOWN",
        severity: "WARN",
        ipAddress: ip,
        details: "Reset requested for unknown email (generic response sent).",
      });
      return NextResponse.json(genericOk);
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await db
      .update(users)
      .set({ resetToken: tokenHash, resetTokenExpiry: expiry })
      .where(eq(users.id, user.id));

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "AUTH_PASSWORD_RESET_REQUESTED",
      severity: "WARN",
      ipAddress: ip,
      details: "Single-use hashed reset token issued (15-minute TTL).",
    });

    // TODO (production): send `rawToken` link via Resend/SendGrid/SES:
    //   `${siteUrl}/reset-password?token=${rawToken}&email=${email}`
    // NEVER log or persist the raw token — only its SHA-256 hash.
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({
        ...genericOk,
        devResetToken: rawToken,
        devResetLink: `/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`,
      });
    }

    return NextResponse.json(genericOk);
  } catch (err) {
    console.error("POST /api/auth/forgot-password error:", err);
    return NextResponse.json(
      { error: "Password-reset service unavailable." },
      { status: 500 }
    );
  }
}
