import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  users,
  memberships,
  payments,
  attendanceLogs,
  progressLogs,
  notifications,
  branches,
  trainers,
  programs,
  contactSubmissions,
  auditLogs,
} from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { eq, desc, asc } from "drizzle-orm";
import {
  getSessionUser,
  sanitizeString,
  logAuditEvent,
  getClientIp,
} from "@/lib/security";

export async function GET() {
  try {
    await ensureSeeded();
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const userMemberships = await db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, user.id))
      .orderBy(desc(memberships.createdAt));

    const userPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, user.id))
      .orderBy(desc(payments.createdAt));

    const userAttendance = await db
      .select()
      .from(attendanceLogs)
      .where(eq(attendanceLogs.userId, user.id))
      .orderBy(desc(attendanceLogs.checkedInAt));

    const userProgress = await db
      .select()
      .from(progressLogs)
      .where(eq(progressLogs.userId, user.id))
      .orderBy(asc(progressLogs.recordedAt));

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt));

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

    // Role-based extra telemetry for Trainer & Admin
    let adminData = null;
    if (user.role === "admin" || user.role === "trainer") {
      const allUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          branchSlug: users.branchSlug,
          twoFactorEnabled: users.twoFactorEnabled,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt));

      const allMemberships = await db
        .select()
        .from(memberships)
        .orderBy(desc(memberships.createdAt));

      const allPayments = await db
        .select()
        .from(payments)
        .orderBy(desc(payments.createdAt));

      const allContacts = await db
        .select()
        .from(contactSubmissions)
        .orderBy(desc(contactSubmissions.createdAt));

      const recentAuditLogs = await db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(30);

      adminData = {
        allUsers,
        allMemberships,
        allPayments,
        allContacts,
        recentAuditLogs,
      };
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        branchSlug: user.branchSlug,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
      memberships: userMemberships,
      payments: userPayments,
      attendance: userAttendance,
      progress: userProgress,
      notifications: userNotifications,
      branches: allBranches,
      trainers: allTrainers,
      programs: allPrograms,
      adminData,
    });
  } catch (err) {
    console.error("GET /api/auth/me error:", err);
    return NextResponse.json(
      { error: "Failed to load dashboard session" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureSeeded();
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updates: Partial<typeof users.$inferInsert> = {};

    if (typeof body.name === "string" && body.name.trim().length >= 2) {
      updates.name = sanitizeString(body.name, 100);
    }
    if (typeof body.phone === "string" && body.phone.trim().length >= 8) {
      updates.phone = sanitizeString(body.phone, 30);
    }
    if (
      typeof body.branchSlug === "string" &&
      ["lalbagh", "dhanmondi", "mirpur"].includes(body.branchSlug)
    ) {
      updates.branchSlug = body.branchSlug;
    }
    if (typeof body.twoFactorEnabled === "boolean") {
      updates.twoFactorEnabled = body.twoFactorEnabled;
    }

    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, session.id))
      .returning();

    await logAuditEvent({
      userId: session.id,
      userEmail: session.email,
      action: "USER_PROFILE_UPDATED",
      severity: "INFO",
      ipAddress: getClientIp(req),
      details: `Updated profile settings (branch=${updatedUser.branchSlug}, 2FA=${updatedUser.twoFactorEnabled}).`,
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        branchSlug: updatedUser.branchSlug,
        avatarUrl: updatedUser.avatarUrl,
        twoFactorEnabled: updatedUser.twoFactorEnabled,
      },
    });
  } catch (err) {
    console.error("PATCH /api/auth/me error:", err);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}
