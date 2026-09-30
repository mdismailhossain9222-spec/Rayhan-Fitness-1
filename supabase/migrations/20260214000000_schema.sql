-- ============================================================================
-- RAYHAN FITNESS — Supabase schema (profiles, branches, packages,
-- memberships, payments, attendance) + auth trigger + helper functions.
-- Apply with: `supabase db push`  (or paste into Dashboard → SQL Editor)
-- ============================================================================

-- ---- Helper: is the current JWT user an admin? (SECURITY DEFINER so it
-- ---- bypasses RLS and can be safely used inside every policy) --------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---- Helper: is the current user staff (trainer OR admin)? -----------------
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('trainer', 'admin')
  );
$$;

-- ---- 1. profiles (extends auth.users, 1 row per user) ----------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  phone_number text,
  preferred_branch text check (preferred_branch in ('lalbagh', 'dhanmondi', 'mirpur')),
  role text not null default 'member' check (role in ('member', 'trainer', 'admin')),
  created_at timestamptz not null default now()
);

-- ---- 2. branches ------------------------------------------------------------
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug in ('lalbagh', 'dhanmondi', 'mirpur')),
  location_address text,
  map_lat double precision,
  map_lng double precision,
  phone text,
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ---- 3. packages ------------------------------------------------------------
create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  duration_months integer not null check (duration_months in (3, 6, 12)),
  price_tk numeric(10, 2) not null check (price_tk >= 0),
  features jsonb not null default '[]'::jsonb,
  is_popular boolean not null default false,
  created_at timestamptz not null default now(),
  unique (branch_id, duration_months)
);

-- ---- 4. memberships ---------------------------------------------------------
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  branch_id uuid not null references public.branches (id) on delete restrict,
  package_id uuid references public.packages (id) on delete set null,
  start_date date not null default (now()::date),
  end_date date not null,
  status text not null default 'active'
    check (status in ('active', 'expired', 'cancelled')),
  payment_status text not null default 'pending'
    check (payment_status in ('paid', 'pending', 'failed')),
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index if not exists memberships_user_id_idx on public.memberships (user_id);
create index if not exists memberships_status_idx on public.memberships (status);

-- ---- 5. payments ------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid references public.memberships (id) on delete set null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount_tk numeric(10, 2) not null check (amount_tk >= 0),
  payment_method text not null check (payment_method in ('bkash', 'nagad', 'card')),
  transaction_id text unique,
  status text not null default 'pending'
    check (status in ('paid', 'pending', 'failed')),
  created_at timestamptz not null default now()
);
create index if not exists payments_user_id_idx on public.payments (user_id);

-- ---- 6. attendance (gym check-ins) ------------------------------------------
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  branch_id uuid references public.branches (id) on delete set null,
  check_in_time timestamptz not null default now()
);
create index if not exists attendance_user_id_idx on public.attendance (user_id);

-- ---- Trigger: auto-create a profile row on every signup --------------------
-- Pulls name/avatar from OAuth metadata (Google/Facebook) or the email
-- sign-up form. Runs as SECURITY DEFINER so it bypasses RLS.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_branch text;
begin
  v_branch := nullif(new.raw_user_meta_data ->> 'preferred_branch', '');
  if v_branch not in ('lalbagh', 'dhanmondi', 'mirpur') then
    v_branch := null;
  end if;

  insert into public.profiles (id, full_name, avatar_url, phone_number, preferred_branch)
  values (
    new.id,
    nullif(coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ), ''),
    nullif(coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    ), ''),
    nullif(new.raw_user_meta_data ->> 'phone_number', ''),
    v_branch
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- Guard: members can never escalate their own role -----------------------
-- Even if a client UPDATE slips past policies, this trigger blocks any
-- role change attempted by a non-admin. Admins (and service role) pass.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change user roles.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_role on public.profiles;
create trigger guard_profile_role
  before update of role on public.profiles
  for each row execute function public.prevent_role_escalation();
