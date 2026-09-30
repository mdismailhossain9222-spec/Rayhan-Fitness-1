"use client";

/**
 * RAYHAN FITNESS — Supabase browser client (singleton).
 *
 * Uses @supabase/ssr `createBrowserClient` (NOT the deprecated auth-helpers).
 * Safe to import in Client Components: only the PUBLIC anon key is used.
 *
 * If env vars are missing (local preview without Supabase), the client is
 * created with placeholder values and `isSupabaseConfigured === false`, so
 * the app still builds/runs and falls back to the built-in demo auth.
 * Every Supabase UI component checks `isSupabaseConfigured` first.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>;

let singleton: BrowserClient | null = null;

/** Returns the shared browser-side Supabase client (lazy singleton). */
export function createClient(): BrowserClient {
  if (singleton) return singleton;
  singleton = createBrowserClient<Database>(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseAnonKey || "placeholder-anon-key"
  );
  return singleton;
}
