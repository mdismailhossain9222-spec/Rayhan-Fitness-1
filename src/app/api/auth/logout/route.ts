import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  clearAuthCookies,
  getSessionUser,
  getClientIp,
  logAuditEvent,
} from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    let allDevices = false;
    try {
      const body = await req.json();
      allDevices = Boolean(body?.allDevices);
    } catch {
      // empty body is fine
    }

    if (session) {
      if (allDevices) {
        await db
          .update(users)
          .set({ tokenVersion: sql`${users.tokenVersion} + 1` })
          .where(eq(users.id, session.id));
      }

      await logAuditEvent({
        userId: session.id,
        userEmail: session.email,
        action: allDevices ? "AUTH_LOGOUT_ALL_DEVICES" : "AUTH_LOGOUT",
        severity: allDevices ? "WARN" : "INFO",
        ipAddress: getClientIp(req),
        details: allDevices
          ? "Token version incremented; all active JWT sessions revoked globally."
          : "Standard session logout completed.",
      });
    }

    const res = NextResponse.json({
      success: true,
      revokedAllDevices: allDevices,
    });
    clearAuthCookies(res);
    return res;
  } catch (err) {
    console.error("POST /api/auth/logout error:", err);
    const res = NextResponse.json({ success: true });
    clearAuthCookies(res);
    return res;
  }
}
