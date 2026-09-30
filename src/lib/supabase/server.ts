/**
 * RAYHAN FITNESS — Supabase server clients (Route Handlers / Server Components).
 *
 * - `createClient()` → per-request client bound to the user's cookies.
 *   Use in Server Components, Server Actions and Route Handlers.
 * - `createAdminClient()` → SERVICE ROLE client. BACKEND-ONLY.
 *   NEVER import this file's admin export from a Client Component —
 *   it would leak the service key into the browser bundle.
 *   Service key lives in SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix).
 */

import { createServerClient } from "@supabase/ssr";
import { createClient as createJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./types";

export function isSupabaseServerConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function requireUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  return url;
}

function requireAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured.");
  return key;
}

/** Per-request server client (reads/writes auth cookies). */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(requireUrl(), requireAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component (read-only cookies) — the
          // middleware refreshes the session, so this can be ignored.
        }
      },
    },
  });
}

/**
 * Admin client with the SERVICE ROLE key (bypasses RLS).
 * BACKEND-ONLY — use only in Route Handlers / Server Actions for
 * admin operations (list all members, manage branches/packages).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin client is not configured. Set SUPABASE_SERVICE_ROLE_KEY server-side."
    );
  }
  return createJsClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
