-- Jalankan di Supabase Dashboard -> SQL Editor -> New Query
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text check (role in ('OWNER','CASHIER')),
  created_at timestamptz default now()
);
alter table public.profiles disable row level security;
insert into public.profiles (id, full_name, email, role)
values ('d0a103d7-109a-4210-b1b6-8b054910d9c0','Rizal','rizal@sitampan.id','CASHIER')
on conflict (id) do update set role='CASHIER', email='rizal@sitampan.id', full_name='Rizal';
-- Confirm email rizal (butuh dijalankan sebagai service_role / via Dashboard Authentication -> Users -> Confirm)
update auth.users set email_confirmed_at = now(), confirmed_at = now() where email = 'rizal@sitampan.id';
