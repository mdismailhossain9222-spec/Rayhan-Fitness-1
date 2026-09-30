-- ============================================================================
-- RAYHAN FITNESS — seed data (3 branches + 9 packages, official BDT pricing).
-- Run AFTER the migrations: `supabase db execute -f supabase/seed.sql`
-- (Seeds run as service role / postgres, so RLS is bypassed.)
-- ============================================================================

-- ---- Branches ---------------------------------------------------------------
insert into public.branches (slug, name, location_address, map_lat, map_lng, phone, image_urls)
values
  ('lalbagh', 'Lalbagh Branch', '42 Shaheed Nagar, Lalbagh Fort Road, Old Dhaka 1211',
   23.7197, 90.3881, '01736-574900', '{}'),
  ('dhanmondi', 'Dhanmondi Branch', 'Level 5 & 6, House 24, Road 27 (Old), Dhanmondi, Dhaka 1209',
   23.7465, 90.3760, '01736-574900', '{}'),
  ('mirpur', 'Mirpur Branch', 'Plot 14, Block C, Rokeya Sarani, Mirpur-10 Circle, Dhaka 1216',
   23.8069, 90.3687, '01736-574900', '{}')
on conflict (slug) do update set
  name = excluded.name,
  location_address = excluded.location_address,
  map_lat = excluded.map_lat,
  map_lng = excluded.map_lng,
  phone = excluded.phone;

-- ---- Packages (exact live pricing; 6-month plan is the popular one) ---------
with b as (select id, slug from public.branches)
insert into public.packages (branch_id, duration_months, price_tk, is_popular, features)
select b.id, v.months, v.price, v.popular, v.features
from b
join (values
  ('lalbagh',   3,  1700.00, false, '["Full gym floor access","Biometric entry + smart locker","1 baseline body-composition scan","Certified floor-coach supervision"]'::jsonb),
  ('lalbagh',   6,  3200.00, true,  '["Everything in 3 Months","3 monthly body-composition scans","2 one-on-one form clinics","Steam recovery access","Custom Bangladeshi macro plan","15-day freeze privilege"]'::jsonb),
  ('lalbagh',  12,  5700.00, false, '["Everything in 6 Months","Unlimited monthly scans","6 personal-training sessions","4 monthly guest passes","45-day freeze privilege"]'::jsonb),
  ('dhanmondi', 3,  3450.00, false, '["Flagship two-floor access","Infrared sauna + cold plunge","1 InBody 770 scan","25m sled turf + MMA cage"]'::jsonb),
  ('dhanmondi', 6,  6300.00, true,  '["Everything in 3 Months","3 InBody 770 scans","2 one-on-one form clinics","Custom macro blueprint","15-day freeze privilege"]'::jsonb),
  ('dhanmondi',12,  9800.00, false, '["Everything in 6 Months","Unlimited scans + recovery lounge","6 PT sessions","Cross-branch guest passes","45-day freeze privilege"]'::jsonb),
  ('mirpur',    3,  3500.00, false, '["Performance Lab floor access","30m sprint + sled turf","Steam + hydro-recovery suite","Private women''s studio floor"]'::jsonb),
  ('mirpur',    6,  6000.00, true,  '["Everything in 3 Months","3 body-composition scans","2 PT form clinics","Custom macro blueprint","15-day freeze privilege"]'::jsonb),
  ('mirpur',   12, 10000.00, false, '["Everything in 6 Months","Unlimited scans + steam suite","6 PT sessions","Cross-branch guest passes","45-day freeze privilege"]'::jsonb)
) as v(slug, months, price, popular, features) on v.slug = b.slug
on conflict (branch_id, duration_months) do update set
  price_tk = excluded.price_tk,
  is_popular = excluded.is_popular,
  features = excluded.features;

-- ---- First admin (optional): promote YOUR user after your first sign-in -----
-- 1. Sign up / sign in once via the site (Google, Facebook or email).
-- 2. Find your id:  select id, email from auth.users;
-- 3. Run:  update public.profiles set role = 'admin' where id = '<PASTE-UUID>';
-- Never expose this step in client code — it runs here, server-side only.
