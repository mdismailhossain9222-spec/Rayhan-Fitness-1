import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  branches,
  memberships,
  payments,
  notifications,
  users,
} from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { eq } from "drizzle-orm";
import {
  getSessionUser,
  sanitizeString,
  logAuditEvent,
  getClientIp,
} from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const session = await getSessionUser();
    const body = await req.json();

    const branchSlug = ["lalbagh", "dhanmondi", "mirpur"].includes(
      body.branchSlug
    )
      ? body.branchSlug
      : "dhanmondi";

    const durationMonths = [3, 6, 12].includes(Number(body.durationMonths))
      ? Number(body.durationMonths)
      : 6;

    const paymentMethod = ["bKash", "Nagad", "Card"].includes(body.paymentMethod)
      ? body.paymentMethod
      : "bKash";

    const accountNumber = sanitizeString(
      body.accountNumber || "01712-556677",
      40
    );
    const transactionId =
      sanitizeString(body.transactionId, 40) ||
      `${paymentMethod.slice(0, 3).toUpperCase()}${Math.floor(
        100000 + Math.random() * 900000
      )}${branchSlug.slice(0, 3).toUpperCase()}`;

    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.slug, branchSlug))
      .limit(1);

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    let amountBdt = branch.price6Months;
    let planName = "6 Months";
    if (durationMonths === 3) {
      amountBdt = branch.price3Months;
      planName = "3 Months";
    } else if (durationMonths === 12) {
      amountBdt = branch.price12Months;
      planName = "12 Months";
    }

    // Resolve user ID (use logged-in user, or default primary member #1 if guest checkout)
    let targetUserId = session?.id ?? 1;
    let targetUserEmail = session?.email ?? "member@rayhanfitness.com";

    if (!session) {
      const [defaultMember] = await db
        .select()
        .from(users)
        .where(eq(users.email, "member@rayhanfitness.com"))
        .limit(1);
      if (defaultMember) {
        targetUserId = defaultMember.id;
        targetUserEmail = defaultMember.email;
      }
    }

    const startDate = new Date();
    const expiryDate = new Date(
      startDate.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000
    );

    const [createdMembership] = await db
      .insert(memberships)
      .values({
        userId: targetUserId,
        branchSlug,
        planName,
        durationMonths,
        amountBdt,
        status: "active",
        startDate,
        expiryDate,
        paymentMethod,
        transactionId,
      })
      .returning();

    const invoiceNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const maskedAccount =
      accountNumber.length > 6
        ? `${accountNumber.slice(0, 5)}***${accountNumber.slice(-3)}`
        : accountNumber;

    const [createdPayment] = await db
      .insert(payments)
      .values({
        userId: targetUserId,
        membershipId: createdMembership.id,
        invoiceNumber,
        branchSlug,
        planName: `${planName} — ${branch.name}`,
        amountBdt,
        paymentMethod,
        transactionId,
        accountMasked: maskedAccount,
        status: "paid",
      })
      .returning();

    await db.insert(notifications).values({
      userId: targetUserId,
      title: `Payment Verified: ${branch.name} (${planName})`,
      message: `We received ৳${amountBdt.toLocaleString()} via ${paymentMethod} (TrxID: ${transactionId}). Invoice ${invoiceNumber} generated.`,
      type: "promo",
      isRead: false,
    });

    await logAuditEvent({
      userId: targetUserId,
      userEmail: targetUserEmail,
      action: "MEMBERSHIP_CHECKOUT_COMPLETED",
      severity: "INFO",
      ipAddress: getClientIp(req),
      details: `Purchased ${branch.name} ${planName} for ৳${amountBdt} via ${paymentMethod} (${transactionId}).`,
    });

    return NextResponse.json({
      success: true,
      membership: createdMembership,
      payment: createdPayment,
      invoiceNumber,
      branchName: branch.name,
    });
  } catch (err) {
    console.error("POST /api/checkout error:", err);
    return NextResponse.json(
      { error: "Failed to process checkout" },
      { status: 500 }
    );
  }
}
