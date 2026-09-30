import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  checkRateLimit,
  getClientIp,
  logAuditEvent,
  sanitizeString,
} from "@/lib/security";

/**
 * GET /api/admin/members — list all member profiles (admin only).
 * Demonstrates the SERVICE ROLE pattern: the requester's admin role is
 * verified first (via their own RLS-readable profile row), then the
 * service-role client performs the privileged list operation.
 * BACKEND-ONLY: the service key never leaves the server.
 */
export async function GET(req: NextRequest) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: "Supabase backend is not configured." },
        { status: 503 }
      );
    }

    const ip = getClientIp(req);
    const rate = checkRateLimit(`admin-members:${ip}`, 60, 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    // 1. Who is calling? (their own Supabase session)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    // 2. Are they an admin? (RLS allows every user to read their OWN row)
    const { data: self } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!self || (self as { role: string }).role !== "admin") {
      await logAuditEvent({
        userId: null,
        userEmail: user.email ?? "unknown",
        action: "ADMIN_MEMBERS_FORBIDDEN",
        severity: "WARN",
        ipAddress: ip,
        details: "Non-admin attempted to list all members.",
      });
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    // 3. Privileged list via the service role (bypasses RLS by design).
    const admin = createAdminClient();
    const search = sanitizeString(
      req.nextUrl.searchParams.get("search") ?? "",
      100
    );
    let query = admin
      .from("profiles")
      .select("id, full_name, phone_number, preferred_branch, role, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (search) {
      query = query.ilike("full_name", `%${search}%`);
    }
    const { data: members, error } = await query;
    if (error) throw error;

    await logAuditEvent({
      userId: null,
      userEmail: user.email ?? "unknown",
      action: "ADMIN_MEMBERS_LISTED",
      severity: "INFO",
      ipAddress: ip,
      details: `Admin listed ${(members ?? []).length} member profiles.`,
    });

    return NextResponse.json({ members: members ?? [] });
  } catch (err) {
    console.error("GET /api/admin/members error:", err);
    return NextResponse.json(
      { error: "Could not load members." },
      { status: 500 }
    );
  }
}
