-- ============================================================================
-- RAYHAN FITNESS — Row Level Security (mandatory on EVERY table).
-- Access control is enforced HERE at the database level — frontend checks
-- are UX only and never trusted. Admins are resolved via is_admin().
-- ============================================================================

alter table public.profiles     enable row level security;
alter table public.branches     enable row level security;
alter table public.packages     enable row level security;
alter table public.memberships  enable row level security;
alter table public.payments     enable row level security;
alter table public.attendance   enable row level security;

-- ============================ profiles =======================================
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());
-- NOTE: role self-escalation is additionally blocked by the
-- prevent_role_escalation trigger (see schema migration).

drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin"
  on public.profiles for insert
  with check (public.is_admin());
-- (Normal signups are inserted by the handle_new_user trigger, which
-- bypasses RLS as SECURITY DEFINER — clients never insert directly.)

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
  on public.profiles for delete
  using (public.is_admin());

-- ============================ branches =======================================
-- Public catalog: anyone (even logged out) can view branches.
drop policy if exists "branches_select_public" on public.branches;
create policy "branches_select_public"
  on public.branches for select
  using (true);

drop policy if exists "branches_write_admin" on public.branches;
create policy "branches_write_admin"
  on public.branches for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================ packages =======================================
drop policy if exists "packages_select_public" on public.packages;
create policy "packages_select_public"
  on public.packages for select
  using (true);

drop policy if exists "packages_write_admin" on public.packages;
create policy "packages_write_admin"
  on public.packages for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================ memberships ====================================
drop policy if exists "memberships_select_own_or_admin" on public.memberships;
create policy "memberships_select_own_or_admin"
  on public.memberships for select
  using (auth.uid() = user_id or public.is_admin());

-- Purchases are created ONLY by secure server code (service role, which
-- bypasses RLS) after payment verification — never by direct client INSERT.
drop policy if exists "memberships_insert_admin" on public.memberships;
create policy "memberships_insert_admin"
  on public.memberships for insert
  with check (public.is_admin());

drop policy if exists "memberships_update_admin" on public.memberships;
create policy "memberships_update_admin"
  on public.memberships for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "memberships_delete_admin" on public.memberships;
create policy "memberships_delete_admin"
  on public.memberships for delete
  using (public.is_admin());

-- ============================ payments =======================================
drop policy if exists "payments_select_own_or_admin" on public.payments;
create policy "payments_select_own_or_admin"
  on public.payments for select
  using (auth.uid() = user_id or public.is_admin());

-- Payment rows are written ONLY by the verified webhook handler via the
-- service role — clients can never INSERT/UPDATE payment records.
drop policy if exists "payments_insert_admin" on public.payments;
create policy "payments_insert_admin"
  on public.payments for insert
  with check (public.is_admin());

drop policy if exists "payments_update_admin" on public.payments;
create policy "payments_update_admin"
  on public.payments for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "payments_delete_admin" on public.payments;
create policy "payments_delete_admin"
  on public.payments for delete
  using (public.is_admin());

-- ============================ attendance =====================================
drop policy if exists "attendance_select_own_or_staff" on public.attendance;
create policy "attendance_select_own_or_staff"
  on public.attendance for select
  using (auth.uid() = user_id or public.is_staff());

-- Check-ins are recorded by staff kiosks or secure server functions only.
drop policy if exists "attendance_insert_staff" on public.attendance;
create policy "attendance_insert_staff"
  on public.attendance for insert
  with check (public.is_staff());

drop policy if exists "attendance_manage_admin" on public.attendance;
create policy "attendance_manage_admin"
  on public.attendance for update
  using (public.is_admin())
  with check (public.is_admin());

-- ================== Storage: private avatars bucket ==========================
-- Custom profile pictures live in a PRIVATE bucket; clients get short-lived
-- signed URLs. Each user may only touch their own `userId/*` folder.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

drop policy if exists "avatars_select_own_or_admin" on storage.objects;
create policy "avatars_select_own_or_admin"
  on storage.objects for select
  using (
    bucket_id = 'avatars'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.is_admin()
    )
  );

drop policy if exists "avatars_upload_own" on storage.objects;
create policy "avatars_upload_own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_delete_own_or_admin" on storage.objects;
create policy "avatars_delete_own_or_admin"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.is_admin()
    )
  );
