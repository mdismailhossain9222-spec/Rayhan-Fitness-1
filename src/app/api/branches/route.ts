import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { branches, trainers, programs } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { eq, asc } from "drizzle-orm";
import {
  getSessionUser,
  logAuditEvent,
  getClientIp,
  validateCsrfRequest,
} from "@/lib/security";

export async function GET() {
  try {
    await ensureSeeded();
    const allBranches = await db
      .select()
      .from(branches)
      .orderBy(asc(branches.id));
    const allTrainers = await db
      .select()
      .from(trainers)
      .orderBy(asc(trainers.id));
    const allPrograms = await db
      .select()
      .from(programs)
      .orderBy(asc(programs.id));

    return NextResponse.json({
      branches: allBranches,
      trainers: allTrainers,
      programs: allPrograms,
    });
  } catch (err) {
    console.error("GET /api/branches error:", err);
    return NextResponse.json(
      { error: "Failed to load club branch data" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureSeeded();
    if (!validateCsrfRequest(req)) {
      return NextResponse.json({ error: "CSRF token validation failed" }, { status: 403 });
    }

    const session = await getSessionUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin RBAC clearance required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const slug = String(body.slug || "");
    const price3Months = Number(body.price3Months);
    const price6Months = Number(body.price6Months);
    const price12Months = Number(body.price12Months);

    if (
      !["lalbagh", "dhanmondi", "mirpur"].includes(slug) ||
      isNaN(price3Months) ||
      isNaN(price6Months) ||
      isNaN(price12Months)
    ) {
      return NextResponse.json({ error: "Invalid branch pricing payload" }, { status: 400 });
    }

    const [updated] = await db
      .update(branches)
      .set({
        price3Months,
        price6Months,
        price12Months,
      })
      .where(eq(branches.slug, slug))
      .returning();

    await logAuditEvent({
      userId: session.id,
      userEmail: session.email,
      action: "ADMIN_BRANCH_PRICING_UPDATED",
      severity: "WARN",
      ipAddress: getClientIp(req),
      details: `Updated ${slug.toUpperCase()} pricing to 3M: ৳${price3Months}, 6M: ৳${price6Months}, 12M: ৳${price12Months}`,
    });

    return NextResponse.json({ branch: updated });
  } catch (err) {
    console.error("PATCH /api/branches error:", err);
    return NextResponse.json({ error: "Failed to update branch" }, { status: 500 });
  }
}
