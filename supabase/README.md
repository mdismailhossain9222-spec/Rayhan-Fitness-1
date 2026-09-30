# Rayhan Fitness — Supabase Backend Setup

Full Postgres + Auth + Storage backend. Takes ~15 minutes, all free-tier friendly.

## 1. Create the project

1. Go to [supabase.com](https://supabase.com) → New project → name it `rayhan-fitness`.
2. Pick region `Singapore (ap-southeast-1)` (closest to Dhaka), set a strong DB password.
3. Project Settings → API → copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**server-only**, never `NEXT_PUBLIC_`)

## 2. Apply the database

```bash
# Option A — Supabase CLI (recommended)
supabase link --project-ref <YOUR-PROJECT-REF>
supabase db push            # runs supabase/migrations/*
supabase db execute -f supabase/seed.sql

# Option B — Dashboard → SQL Editor: paste & run, in order:
#   1. supabase/migrations/20260214000000_schema.sql
#   2. supabase/migrations/20260214000001_rls.sql
#   3. supabase/seed.sql
```

Verify: Table Editor shows `profiles, branches, packages, memberships, payments, attendance` — each with the RLS badge on.

## 3. Google OAuth — get the Client ID + Secret

1. [Google Cloud Console](https://console.cloud.google.com) → new/select project.
2. **APIs & Services → OAuth consent screen** → External → app name `Rayhan Fitness`,
   support email, scopes **only** `openid`, `email`, `profile`.
3. **Credentials → Create Credentials → OAuth client ID → Web application**.
4. Authorized redirect URI (exact):
   `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`
5. Copy **Client ID** + **Client Secret**.

## 4. Facebook OAuth — get the App ID + Secret

1. [Meta for Developers](https://developers.facebook.com) → Create App (Consumer).
2. Add product **Facebook Login** → Settings → Valid OAuth Redirect URIs:
   `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`
3. Permissions: request **only** `email` + `public_profile`.
4. Copy **App ID** + **App Secret**; switch the app **Live** when ready.

## 5. Wire providers into Supabase

Dashboard → **Authentication → Providers**:
- Enable **Google** → paste Client ID + Secret → Save.
- Enable **Facebook** → paste App ID + Secret → Save.

Dashboard → **Authentication → URL Configuration** (anti open-redirect):
- Site URL: `https://rayhanfitness.com`
- Redirect allowlist — **only**:
  `https://rayhanfitness.com/auth/callback`
  `http://localhost:3000/auth/callback`

Dashboard → **Authentication → Settings** (hardening):
- ✅ Confirm email before sign-in
- ✅ Rate limits on auth endpoints (defaults are fine, tighten for launch)
- ✅ hCaptcha on signup/login
- Session: JWT ~1h expiry + refresh-token rotation (defaults)

## 6. Connect the site

```bash
# .env (never commit real values — see .env.example)
NEXT_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

Restart the app. The login page will light up the Google/Facebook buttons,
`/auth/callback` completes OAuth → `/dashboard`, middleware protects
`/dashboard` + `/admin`, and RLS enforces every row.

## 7. Make yourself admin

Sign in once via the site, then in SQL Editor:

```sql
select id, email from auth.users;  -- find your id
update public.profiles set role = 'admin' where id = '<PASTE-UUID>';
```

Then visit `/admin` to manage branches, packages, members and payments.

## 8. Booking emails (Edge Function + Resend, recommended)

New bookings already notify the admin **in-app** (realtime bell + the
`notifications` table via the `trg_bookings_notify_admins` trigger). For
email too — so the admin never has to keep the dashboard open:

1. Get a free key at [resend.com](https://resend.com) → API Keys.
2. `supabase functions deploy notify-booking --no-verify-jwt`
3. `supabase secrets set RESEND_API_KEY=re_xxx ADMIN_EMAIL=admin@rayhanfitness.com`
4. Dashboard → Database → Webhooks → Create webhook:
   - Table: `public.bookings`, Events: `INSERT`
   - URL: `https://<ref>.supabase.co/functions/v1/notify-booking`
   - Include the member's email as `member_email` in the payload if you
     want the acknowledgement email (see `supabase/functions/notify-booking/index.ts`).

Members always see status changes instantly under Dashboard → My Bookings
and in their own `notifications` rows, with or without email.
