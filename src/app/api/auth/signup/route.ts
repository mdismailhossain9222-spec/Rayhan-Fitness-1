import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, notifications, progressLogs } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  validatePasswordStrength,
  sanitizeString,
  isValidEmail,
  isValidBdPhone,
  signAccessToken,
  signRefreshToken,
  attachAuthCookies,
  checkRateLimit,
  getClientIp,
  logAuditEvent,
  JwtUserPayload,
} from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const ip = getClientIp(req);
    const rate = checkRateLimit(`signup:${ip}`, 10, 15 * 60 * 1000);

    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Too many signup requests. Please wait ${rate.resetInSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const name = sanitizeString(body.name, 100);
    const email = sanitizeString(body.email, 150).toLowerCase();
    const phone = sanitizeString(body.phone, 30);
    const password = String(body.password || "");
    const branchSlug = ["lalbagh", "dhanmondi", "mirpur"].includes(body.branchSlug)
      ? body.branchSlug
      : "dhanmondi";

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "Please provide your full name (minimum 2 characters)." },
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
        { error: "Please enter a valid Bangladesh phone number (e.g., 017XXXXXXXX)." },
        { status: 400 }
      );
    }

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return NextResponse.json(
        {
          error: `Password does not meet security rules: ${strength.errors.join(", ")}`,
          strengthErrors: strength.errors,
        },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        phone,
        role: "member",
        branchSlug,
        avatarUrl:
          "https://images.pexels.com/photos/29886673/pexels-photo-29886673.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
        emailVerified: true,
        twoFactorEnabled: false,
        twoFactorSecret: "RF-OTP-8842",
        tokenVersion: 1,
      })
      .returning();

    // Create initial welcome notification & baseline biometric entry
    await db.insert(notifications).values({
      userId: newUser.id,
      title: "Welcome to Rayhan Fitness — Account Verified",
      message: `Your athlete profile for the ${branchSlug.toUpperCase()} Club is active. Select a 3, 6, or 12-month package to unlock biometric turnstile entry.`,
      type: "system",
      isRead: false,
    });

    await db.insert(progressLogs).values({
      userId: newUser.id,
      weightKg: 75.0,
      bmi: 24.2,
      bodyFatPct: 18.5,
      benchPressKg: 60,
      squatKg: 80,
      deadliftKg: 100,
      caloriesBurned: 500,
      workoutNotes: "Baseline Athlete Onboarding Assessment",
    });

    const jwtPayload: JwtUserPayload = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: "member",
      branchSlug: newUser.branchSlug,
      tokenVersion: newUser.tokenVersion,
    };

    const accessToken = await signAccessToken(jwtPayload);
    const refreshToken = await signRefreshToken(jwtPayload, true);

    await logAuditEvent({
      userId: newUser.id,
      userEmail: newUser.email,
      action: "AUTH_SIGNUP_SUCCESS",
      severity: "INFO",
      ipAddress: ip,
      details: `New athlete account registered for ${branchSlug.toUpperCase()} branch.`,
    });

    const res = NextResponse.json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        branchSlug: newUser.branchSlug,
        avatarUrl: newUser.avatarUrl,
      },
    });

    attachAuthCookies(res, accessToken, refreshToken, true);
    return res;
  } catch (err) {
    console.error("POST /api/auth/signup error:", err);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
