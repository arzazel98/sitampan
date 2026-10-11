-- SUPABASE SITAMPAN FINAL SCHEMA — jalankan di SQL Editor
-- 1. profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text check (role in ('OWNER','CASHIER')),
  avatar_url text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles disable row level security;

-- 2. seed rizal cashier (id dari auth.users)
insert into public.profiles (id, full_name, email, role)
values ('d0a103d7-109a-4210-b1b6-8b054910d9c0','Rizal','rizal@sitampan.id','CASHIER')
on conflict (id) do update set role='CASHIER', email='rizal@sitampan.id';

-- 3. seed owner contoh (ganti id setelah buat user owner@sitampan.id via Auth)
-- insert into public.profiles (id, full_name, email, role) values ('<owner-uuid>','Owner','owner@sitampan.id','OWNER') on conflict (id) do nothing;

-- 4. patch products
alter table public.products add column if not exists is_active boolean default true;
alter table public.products add column if not exists satuan text default 'pcs';
alter table public.products add column if not exists updated_at timestamptz default now();

-- 5. categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default now()
);
insert into public.categories (name) values ('Hair Product'),('Beverage'),('Hair Care'),('Other') on conflict (name) do nothing;
alter table public.categories disable row level security;

-- 6. store_settings
create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  store_name text default 'Barbershop Sitampan YK Pakem',
  address text default 'Pakem, Sleman, Yogyakarta',
  phone text default '08xxxxxxxxxx',
  email text,
  logo_url text,
  receipt_footer text default 'Terima kasih telah berkunjung',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
insert into public.store_settings (store_name) values ('Barbershop Sitampan YK Pakem') on conflict do nothing;
alter table public.store_settings disable row level security;

-- 7. disable RLS untuk dev (enable + policy saat production)
alter table public.products disable row level security;
alter table public.services disable row level security;
alter table public.transactions disable row level security;
alter table public.transaction_items disable row level security;
alter table public.stock_mutations disable row level security;

-- 8. confirm email rizal (butuh dijalankan sebagai postgres, jika gagal confirm manual via Auth -> Users)
update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now()), confirmed_at = coalesce(confirmed_at, now()) where email = 'rizal@sitampan.id';

-- 9. RLS template production (aktifkan bila siap)
-- alter table public.products enable row level security;
-- create policy "allow all for authenticated" on public.products for all to authenticated using (true) with check (true);
-- create policy "cashier read products" on public.products for select to authenticated using (true);
-- create policy "owner manage products" on public.products for all to authenticated using (exists (select 1 from public.profiles where id = auth.uid() and role='OWNER'));
