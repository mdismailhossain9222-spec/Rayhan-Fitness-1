import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  progressLogs,
  attendanceLogs,
  notifications,
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
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const actionType = body.type || "progress";

    if (actionType === "checkin") {
      const branchSlug = ["lalbagh", "dhanmondi", "mirpur"].includes(body.branchSlug)
        ? body.branchSlug
        : session.branchSlug;
      const workoutFocus =
        sanitizeString(body.workoutFocus, 150) || "Hypertrophy & Strength Block";
      const durationMinutes = Math.min(
        240,
        Math.max(15, Number(body.durationMinutes) || 75)
      );

      const [entry] = await db
        .insert(attendanceLogs)
        .values({
          userId: session.id,
          branchSlug,
          workoutFocus,
          durationMinutes,
        })
        .returning();

      await logAuditEvent({
        userId: session.id,
        userEmail: session.email,
        action: "MEMBER_BIOMETRIC_CHECKIN",
        severity: "INFO",
        ipAddress: getClientIp(req),
        details: `Checked in at ${branchSlug.toUpperCase()} Club for "${workoutFocus}" (${durationMinutes} mins).`,
      });

      return NextResponse.json({ entry });
    }

    if (actionType === "mark_notifications_read") {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, session.id));
      return NextResponse.json({ success: true });
    }

    // Default: log biometric progress
    const weightKg = Number(body.weightKg) || 78.5;
    const heightCm = Number(body.heightCm) || 176;
    const bmi =
      Number(body.bmi) ||
      Number((weightKg / Math.pow(heightCm / 100, 2)).toFixed(1));
    const bodyFatPct = Number(body.bodyFatPct) || 16.0;
    const benchPressKg = Number(body.benchPressKg) || 100;
    const squatKg = Number(body.squatKg) || 140;
    const deadliftKg = Number(body.deadliftKg) || 180;
    const caloriesBurned = Number(body.caloriesBurned) || 720;
    const workoutNotes =
      sanitizeString(body.workoutNotes, 300) ||
      "Progressive overload session completed.";

    const [created] = await db
      .insert(progressLogs)
      .values({
        userId: session.id,
        weightKg,
        bmi,
        bodyFatPct,
        benchPressKg,
        squatKg,
        deadliftKg,
        caloriesBurned,
        workoutNotes,
      })
      .returning();

    return NextResponse.json({ progressEntry: created });
  } catch (err) {
    console.error("POST /api/dashboard/progress error:", err);
    return NextResponse.json(
      { error: "Failed to save telemetry log" },
      { status: 500 }
    );
  }
}
