-- Create a table for public profiles (optional, if you want user management)
-- create table profiles (
--   id uuid references auth.users not null,
--   updated_at timestamp with time zone,
--   username text unique,
--   full_name text,
--   avatar_url text,
--   website text,
--   primary key (id),
--   unique(username),
--   constraint username_length check (char_length(username) >= 3)
-- );

-- 1. Create the 'bookings' table
create table public.bookings (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  destination text not null,
  duration text,
  package_type text,
  travel_date text,
  customer_name text not null,
  customer_mobile text not null,
  customer_email text not null,
  status text not null default 'pending', -- 'confirmed', 'pending', 'cancelled'
  constraint bookings_pkey primary key (id)
);

-- 2. Enable Row Level Security (RLS)
-- This is important properly secure your data.
alter table public.bookings enable row level security;

-- 3. Create Policy: Allow Public (Anon) to INSERT bookings
-- This allows anyone with the anon key (your frontend/backend) to create a new booking.
create policy "Enable insert for everyone"
on public.bookings
for insert
to anon, authenticated
with check (true);

-- 4. Create Policy: Allow ONLY Authenticated (Service Role/Admin) to SELECT/READ
-- This prevents random public users from reading everyone's bookings.
-- Only your admin dashboard or backend with service_role key can read all.
-- Note: If you want the backend to read using the anon key, you might need to adjust this, 
-- but for security, usually reading is restricted.
create policy "Enable read access for service role only"
on public.bookings
for select
to service_role
using (true);

-- Optional: If you want to allow reading your own bookings (if you had auth), 
-- you would add a policy checking the user_id. But since these are anon bookings, 
-- we generally don't allow public read access.

-- 5. Create Policy: Allow Service Role to UPDATE/DELETE
create policy "Enable all access for service role"
on public.bookings
for all
to service_role
using (true)
with check (true);
