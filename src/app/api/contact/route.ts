import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contactSubmissions } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { eq } from "drizzle-orm";
import {
  sanitizeString,
  isValidEmail,
  isValidBdPhone,
  checkRateLimit,
  getClientIp,
  getSessionUser,
  logAuditEvent,
} from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const ip = getClientIp(req);
    const rate = checkRateLimit(`contact:${ip}`, 8, 15 * 60 * 1000);

    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit reached. Please wait ${rate.resetInSeconds} seconds before sending another message.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const name = sanitizeString(body.name, 100);
    const email = sanitizeString(body.email, 150).toLowerCase();
    const phone = sanitizeString(body.phone, 30);
    const branchSlug = ["lalbagh", "dhanmondi", "mirpur"].includes(body.branchSlug)
      ? body.branchSlug
      : "dhanmondi";
    const goal =
      sanitizeString(body.goal, 120) || "General Membership & Club Tour";
    const message = sanitizeString(body.message, 1500);

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "Please enter your full name." },
        { status: 400 }
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }
    if (!isValidBdPhone(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid Bangladesh phone number." },
        { status: 400 }
      );
    }
    if (!message || message.length < 5) {
      return NextResponse.json(
        { error: "Please include a brief message or inquiry." },
        { status: 400 }
      );
    }

    const [submission] = await db
      .insert(contactSubmissions)
      .values({
        name,
        email,
        phone,
        branchSlug,
        goal,
        message,
        status: "new",
        ipAddress: ip,
      })
      .returning();

    await logAuditEvent({
      userEmail: email,
      action: "CONTACT_INQUIRY_SUBMITTED",
      severity: "INFO",
      ipAddress: ip,
      details: `Inquiry from ${name} for ${branchSlug.toUpperCase()} branch (${goal}).`,
    });

    return NextResponse.json({
      success: true,
      submission,
      message:
        "Thank you! Our branch team will contact you within 2 hours.",
    });
  } catch (err) {
    console.error("POST /api/contact error:", err);
    return NextResponse.json(
      { error: "Failed to submit inquiry" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureSeeded();
    const session = await getSessionUser();
    if (!session || (session.role !== "admin" && session.role !== "trainer")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const id = Number(body.id);
    const status = ["new", "contacted", "resolved"].includes(body.status)
      ? body.status
      : "contacted";

    const [updated] = await db
      .update(contactSubmissions)
      .set({ status })
      .where(eq(contactSubmissions.id, id))
      .returning();

    return NextResponse.json({ submission: updated });
  } catch (err) {
    console.error("PATCH /api/contact error:", err);
    return NextResponse.json(
      { error: "Failed to update inquiry status" },
      { status: 500 }
    );
  }
}
