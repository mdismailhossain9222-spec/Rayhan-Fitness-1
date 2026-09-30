-- ============================================================================
-- RAYHAN FITNESS — Trainer booking system: trainers, bookings,
-- notifications (+ auto-notify trigger, RLS, realtime, seed trainers).
-- Apply with: `supabase db push` (or paste into Dashboard → SQL Editor)
-- ============================================================================

-- ---- 7. trainers ------------------------------------------------------------
create table if not exists public.trainers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  photo_url text,
  specialty text,
  branch_id uuid references public.branches (id) on delete set null,
  bio text,
  availability jsonb not null default
    '{"days": ["Sat","Sun","Mon","Tue","Wed"], "slots": ["Morning (7:00 AM - 11:00 AM)", "Afternoon (3:00 PM - 5:00 PM)", "Evening (6:00 PM - 9:00 PM)"]}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---- 8. bookings ------------------------------------------------------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  trainer_id uuid not null references public.trainers (id) on delete restrict,
  branch_id uuid not null references public.branches (id) on delete restrict,
  session_type text not null default 'Personal Training',
  preferred_date date not null,
  preferred_time_slot text not null,
  note text,
  status text not null default 'pending'
    check (status in ('pending','confirmed','rejected','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (preferred_date >= (now()::date))
);
create index if not exists bookings_user_id_idx on public.bookings (user_id);
create index if not exists bookings_trainer_id_idx on public.bookings (trainer_id);
create index if not exists bookings_status_idx on public.bookings (status);
create index if not exists bookings_date_idx on public.bookings (preferred_date);

-- Keep updated_at fresh on every change.
create or replace function public.touch_booking_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists trg_bookings_touch on public.bookings;
create trigger trg_bookings_touch
  before update on public.bookings
  for each row execute function public.touch_booking_updated_at();

-- ---- 9. notifications -------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_role text not null check (recipient_role in ('admin','member')),
  recipient_id uuid references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  message text not null default '',
  related_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_admin_idx
  on public.notifications (recipient_role, is_read, created_at desc)
  where recipient_role = 'admin';
create index if not exists notifications_member_idx
  on public.notifications (recipient_id, is_read, created_at desc);

-- ---- Auto-notify admins on every new booking --------------------------------
create or replace function public.notify_admins_on_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member text;
  v_trainer text;
begin
  select coalesce(full_name, 'A member') into v_member
  from public.profiles where id = new.user_id;
  select coalesce(name, 'a trainer') into v_trainer
  from public.trainers where id = new.trainer_id;

  insert into public.notifications
    (recipient_role, type, title, message, related_id)
  values (
    'admin',
    'new_booking',
    'New booking request from ' || v_member,
    v_member || ' requested ' || new.session_type || ' with ' || v_trainer ||
      ' on ' || new.preferred_date::text || ' (' || new.preferred_time_slot || ').',
    new.id
  );
  return new;
end;
$$;
drop trigger if exists trg_bookings_notify_admins on public.bookings;
create trigger trg_bookings_notify_admins
  after insert on public.bookings
  for each row execute function public.notify_admins_on_booking();

-- ---- RLS --------------------------------------------------------------------
alter table public.trainers      enable row level security;
alter table public.bookings      enable row level security;
alter table public.notifications enable row level security;

-- trainers: public catalog, admin-managed
drop policy if exists "trainers_select_public" on public.trainers;
create policy "trainers_select_public"
  on public.trainers for select using (true);
drop policy if exists "trainers_write_admin" on public.trainers;
create policy "trainers_write_admin"
  on public.trainers for all
  using (public.is_admin()) with check (public.is_admin());

-- bookings: members own rows, trainer-linked staff read, admin full
drop policy if exists "bookings_select_own_staff_admin" on public.bookings;
create policy "bookings_select_own_staff_admin"
  on public.bookings for select
  using (
    auth.uid() = user_id
    or public.is_admin()
    or (
      public.is_staff()
      and trainer_id in (
        select t.id from public.trainers t
        join public.profiles p on p.full_name = t.name
        where p.id = auth.uid()
      )
    )
  );
drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own"
  on public.bookings for insert
  with check (auth.uid() = user_id and status = 'pending');
-- Members may only cancel their own pending/confirmed bookings (never
-- confirm/reject/complete — those transitions are admin-only).
drop policy if exists "bookings_member_cancel" on public.bookings;
create policy "bookings_member_cancel"
  on public.bookings for update
  using (
    auth.uid() = user_id
    and status in ('pending','confirmed')
    and not public.is_admin()
  )
  with check (
    auth.uid() = user_id
    and status = 'cancelled'
  );
drop policy if exists "bookings_update_admin" on public.bookings;
create policy "bookings_update_admin"
  on public.bookings for update
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "bookings_delete_admin" on public.bookings;
create policy "bookings_delete_admin"
  on public.bookings for delete
  using (public.is_admin());

-- notifications: admins see admin queue; members see only their own rows
drop policy if exists "notifications_select_admin" on public.notifications;
create policy "notifications_select_admin"
  on public.notifications for select
  using (public.is_admin());
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  using (recipient_id = auth.uid());
drop policy if exists "notifications_update_admin" on public.notifications;
create policy "notifications_update_admin"
  on public.notifications for update
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "notifications_member_mark_read" on public.notifications;
create policy "notifications_member_mark_read"
  on public.notifications for update
  using (recipient_id = auth.uid() and not public.is_admin())
  with check (recipient_id = auth.uid());
-- (Inserts come from the trigger + service-role server code — no client INSERT.)

-- ---- Realtime: stream booking inserts to the admin bell ----------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'bookings'
  ) then
    alter publication supabase_realtime add table public.bookings;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- ---- Seed trainers (mirrors the club roster) ---------------------------------
with b as (select id, slug from public.branches)
insert into public.trainers (name, slug, photo_url, specialty, branch_id, bio)
select v.name, v.slug, v.photo, v.specialty, b.id, v.bio
from b join (values
  ('Arif Chowdhury', 'arif-chowdhury',
   'https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=600',
   'Strength & Powerlifting', 'lalbagh',
   'Head strength coach with 9 years under the bar. Specializes in powerlifting fundamentals, progressive overload and competition prep.'),
  ('Nusrat Jahan', 'nusrat-jahan',
   'https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=600',
   'HIIT & Fat Loss', 'lalbagh',
   'Certified metabolic conditioning coach. Runs high-energy fat-loss circuits and beginner-friendly strength foundations.'),
  ('Tanvir Hasan', 'tanvir-hasan',
   'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=600',
   'Bodybuilding & Hypertrophy', 'dhanmondi',
   'Former national-level physique competitor. Hypertrophy programming, posing, contest diet planning and stage prep.'),
  ('Mim Akter', 'mim-akter',
   'https://images.pexels.com/photos/3757942/pexels-photo-3757942.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=600',
   'Yoga & Mobility', 'dhanmondi',
   'E-RYT mobility specialist blending yoga, breathwork and recovery flows for lifters and desk athletes alike.'),
  ('Rakib Ahmed', 'rakib-ahmed',
   'https://images.pexels.com/photos/1431282/pexels-photo-1431282.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=600',
   'CrossFit & Conditioning', 'mirpur',
   'CrossFit L2 trainer focused on engine building, Olympic-lift technique and functional athletic performance.'),
  ('Sadia Rahman', 'sadia-rahman',
   'https://images.pexels.com/photos/3768918/pexels-photo-3768918.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=600',
   'Nutrition & Diet Planning', 'mirpur',
   'Sports nutritionist crafting sustainable Bangladeshi meal plans for muscle gain, fat loss and performance.')
) as v(name, slug, photo, specialty, branch, bio) on v.branch = b.slug
on conflict (slug) do update set
  name = excluded.name, photo_url = excluded.photo_url,
  specialty = excluded.specialty, branch_id = excluded.branch_id,
  bio = excluded.bio;
