import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { eq } from "drizzle-orm";
import {
  sanitizeString,
  checkRateLimit,
  getClientIp,
  logAuditEvent,
} from "@/lib/security";

/**
 * POST /api/webhooks/payment — gateway callback verification.
 *
 * PRODUCTION CONTRACT (PCI-DSS):
 * - Raw card/wallet credentials are NEVER handled here. Checkout uses the
 *   official bKash / Nagad / SSLCommerz SDK or hosted redirect flow.
 * - Client-side "payment success" is NEVER trusted. Only a signed
 *   server-to-server webhook from the gateway confirms a transaction.
 * - Verification = HMAC-SHA256(rawBody, PAYMENT_WEBHOOK_SECRET) compared
 *   timing-safe against the X-Gateway-Signature header.
 */
export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const ip = getClientIp(req);
    const rate = checkRateLimit(`webhook:${ip}`, 60, 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Rate limited." }, { status: 429 });
    }

    const secret = process.env.PAYMENT_WEBHOOK_SECRET || "";
    if (!secret) {
      console.error("PAYMENT_WEBHOOK_SECRET is not configured.");
      return NextResponse.json(
        { error: "Payment webhook is not configured." },
        { status: 500 }
      );
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-gateway-signature") || "";

    const expected = createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      await logAuditEvent({
        userEmail: "gateway-webhook",
        action: "PAYMENT_WEBHOOK_SIGNATURE_REJECTED",
        severity: "CRITICAL",
        ipAddress: ip,
        details: "HMAC signature mismatch on payment callback.",
      });
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 401 }
      );
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Malformed webhook payload." },
        { status: 400 }
      );
    }

    const transactionId = sanitizeString(payload.transactionId, 60);
    const status = sanitizeString(payload.status, 20).toLowerCase();

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.transactionId, transactionId))
      .limit(1);

    if (!payment) {
      await logAuditEvent({
        userEmail: "gateway-webhook",
        action: "PAYMENT_WEBHOOK_UNKNOWN_TRX",
        severity: "WARN",
        ipAddress: ip,
        details: `Signed callback for unknown TrxID ${transactionId}.`,
      });
      return NextResponse.json(
        { error: "Unknown transaction reference." },
        { status: 404 }
      );
    }

    await logAuditEvent({
      userId: payment.userId,
      userEmail: "gateway-webhook",
      action: "PAYMENT_WEBHOOK_VERIFIED",
      severity: "INFO",
      ipAddress: ip,
      // Only masked references are ever logged — never raw credentials.
      details: `Gateway confirmed TrxID ${transactionId} (${payment.paymentMethod} ${payment.accountMasked}) status=${status} amount=৳${payment.amountBdt}.`,
    });

    return NextResponse.json({ verified: true, transactionId });
  } catch (err) {
    console.error("POST /api/webhooks/payment error:", err);
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
