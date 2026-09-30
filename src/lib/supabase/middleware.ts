/**
 * RAYHAN FITNESS — Supabase middleware helper (@supabase/ssr pattern).
 * Refreshes expired auth tokens on every request and returns the user.
 * Gracefully no-ops when Supabase env vars are not configured.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import type { Database } from "./types";

export function isSupabaseMiddlewareConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function updateSupabaseSession(
  request: NextRequest
): Promise<{ response: NextResponse; user: User | null }> {
  if (!isSupabaseMiddlewareConfigured()) {
    return { response: NextResponse.next({ request }), user: null };
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the session when expired; returns null when logged out.
  // IMPORTANT: never run code between createServerClient and getUser that
  // could change the response — it breaks session refresh.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, user };
}
