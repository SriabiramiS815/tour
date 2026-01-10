# 🚀 Supabase Setup Guide for Sri Tours Assistant

Follow this guide to connect your local app to a live Supabase database.

## 1. Create a Supabase Project
1. Go to [Supabase.com](https://supabase.com/) and Sign In.
2. Click **"New Project"**.
3. Select your Organization.
4. **Name**: `sri-tours-db` (or any name).
5. **Database Password**: Generate a strong password and save it safely.
6. **Region**: Choose a region close to you (e.g., Mumbai, Singapore).
7. Click **"Create new project"**.

## 2. Get API Credentials
Once your project is ready (takes ~1 minute):
1. Go to **Project Settings** (gear icon) -> **API**.
2. Find the **Project URL** and copy it.
3. Find the **Project API keys** section:
   - Copy the `anon` `public` key.

## 3. Configure Local Environment
1. Open your project in VS Code.
2. Open the `.env` file.
3. Paste your credentials:
   ```env
   SUPABASE_URL="https://your-project-id.supabase.co"
   SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
   ```

## 4. Run the Database Script
1. In Supabase Dashboard, go to **SQL Editor** (terminal icon on the left).
2. Click **"New Query"**.
3. Copy the SQL script below and paste it into the editor.
4. Click **"Run"** (bottom right).

### SQL Script
```sql
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
  status text not null default 'pending', 
  constraint bookings_pkey primary key (id)
);

-- 2. Enable Security
alter table public.bookings enable row level security;

-- 3. Allow Public to INSERT (so your app can save bookings)
create policy "Enable insert for everyone"
on public.bookings
for insert
to anon, authenticated
with check (true);

-- 4. Allow Dashboard Admin to VIEW/EDIT everything
create policy "Enable all access for service role"
on public.bookings
for all
to service_role
using (true)
with check (true);
```

## 5. Verify Setup
1. Go to **Table Editor** (table icon on the left) in Supabase.
2. You should see a new table named `bookings`.
3. Restart your local server:
   ```powershell
   npm run dev
   ```
4. Book a tour in the app! It should now confirm "Saved to DB".

## Troubleshooting
- **Network Error**: Check if `SUPABASE_URL` is correct in `.env`.
- **Permission Denied**: Ensure you ran the RLS policies part of the SQL script.
