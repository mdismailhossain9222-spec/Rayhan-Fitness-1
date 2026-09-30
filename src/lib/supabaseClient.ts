/**
 * RAYHAN FITNESS — shared Supabase browser instance.
 * ============================================================================
 * SETUP — Google & Facebook OAuth (do this once in Supabase Dashboard):
 *
 * 1) GOOGLE (Google Cloud Console → https://console.cloud.google.com)
 *    - Create/select a project → "APIs & Services" → "OAuth consent screen"
 *      → External → fill app name (Rayhan Fitness), support email, scopes:
 *      ONLY `openid`, `email`, `profile` (minimal scopes — no excessive data).
 *    - "Credentials" → Create Credentials → "OAuth client ID" → Web app →
 *      Authorized redirect URI:
 *        https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback
 *    - Copy the Client ID + Client Secret.
 *
 * 2) FACEBOOK (Meta for Developers → https://developers.facebook.com)
 *    - Create App (Consumer type) → Add Product → "Facebook Login" →
 *      Settings → Valid OAuth Redirect URIs:
 *        https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback
 *    - Request ONLY `email` + `public_profile` permissions.
 *    - Copy the App ID (Client ID) + App Secret (Client Secret).
 *    - Switch the app Live when ready (test mode blocks non-test users).
 *
 * 3) SUPABASE (Dashboard → Authentication → Providers)
 *    - Enable "Google" → paste Client ID + Secret → Save.
 *    - Enable "Facebook" → paste App ID + Secret → Save.
 *    - Authentication → URL Configuration → Redirect URLs allowlist:
 *      ONLY your production domain + local dev, e.g.
 *        https://rayhanfitness.com/auth/callback
 *        http://localhost:3000/auth/callback
 *      (prevents open-redirect attacks — never allow `*`).
 *    - Enable "Confirm email" + rate limiting + hCaptcha (see SECURITY.md).
 *
 * USAGE: `import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient"`
 * Always gate UI on `isSupabaseConfigured` — when false, show the built-in
 * demo auth instead of calling Supabase.
 * ============================================================================
 */

export { createClient, isSupabaseConfigured } from "./supabase/client";
import { createClient } from "./supabase/client";

/** Shared singleton browser instance (lazy — one client per page load). */
export const supabase = createClient();
