import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * GET /auth/callback — OAuth + email-verification return route.
 * Exchanges the provider `code` for a Supabase session, guarantees a
 * `profiles` row exists (safety net behind the DB trigger), then sends
 * the member to /dashboard. All failures land on /login with a friendly
 * error flag (rendered as a toast, never a raw dump).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  // Provider-side refusal (user pressed Cancel/Deny at Google/Facebook).
  if (searchParams.get("error")) {
    return NextResponse.redirect(`${origin}/login?error=cancelled`);
  }

  const code = searchParams.get("code");
  const requested = searchParams.get("next") ?? "/dashboard";
  const next =
    requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) throw error ?? new Error("Code exchange failed");

    // Safety net: the handle_new_user() trigger normally creates the
    // profile row. If it ever lags, backfill it here with the service
    // role (code exchange already proved account ownership).
    try {
      const admin = createAdminClient();
      const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
      const pick = (v: unknown) =>
        typeof v === "string" && v.trim() ? v.trim().slice(0, 500) : null;
      const branchRaw = pick(meta.preferred_branch);
      const branch =
        branchRaw === "lalbagh" ||
        branchRaw === "dhanmondi" ||
        branchRaw === "mirpur"
          ? branchRaw
          : null;
      await admin.from("profiles").upsert(
        {
          id: data.user.id,
          full_name:
            pick(meta.full_name) ?? pick(meta.name) ?? pick(meta.fullName),
          avatar_url: pick(meta.avatar_url) ?? pick(meta.picture),
          phone_number:
            typeof meta.phone_number === "string"
              ? meta.phone_number.trim().slice(0, 30)
              : null,
          preferred_branch: branch,
        },
        { onConflict: "id", ignoreDuplicates: true }
      );
    } catch {
      // Non-fatal: the DB trigger is the primary path.
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }
}
