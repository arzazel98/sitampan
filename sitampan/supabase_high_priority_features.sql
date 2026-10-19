-- SUPABASE HIGH PRIORITY FEATURES — Jalankan di SQL Editor Supabase
-- Fitur:
-- 1. Master Data Kapster / Barbers (Sync Cloud + Local Cache)
-- 2. Shift Kasir Terintegrasi Cloud (Buka/Tutup Kasir real-time bisa dipantau Owner dari jauh)
-- 3. Dukungan Split Payment (Tunai + QRIS dalam 1 Transaksi)

-- 1. TABEL BARBERS (Master Kapster & Rate Komisi)
create table if not exists public.barbers (
  id text primary key,
  nama text not null,
  title text default 'Barber',
  komisi_rate numeric default 40,
  status text default 'Aktif' check (status in ('Aktif', 'Nonaktif')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.barbers disable row level security;
create index if not exists idx_barbers_status on public.barbers (status);

-- Seed daftar barber awal jika belum ada
insert into public.barbers (id, nama, title, komisi_rate, status)
values
  ('b-1', 'Doni', 'Master Barber', 40, 'Aktif'),
  ('b-2', 'Budi', 'Senior Barber', 40, 'Aktif'),
  ('b-3', 'Fajar', 'Senior Barber', 40, 'Aktif'),
  ('b-4', 'Rizal', 'Barber & Stylist', 35, 'Aktif')
on conflict (id) do nothing;


-- 2. TABEL CASHIER_SHIFTS (Sinkronisasi Shift & Laci Kasir Real-time)
create table if not exists public.cashier_shifts (
  id text primary key,
  cashier_name text not null,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  starting_cash bigint default 0,
  cash_sales bigint default 0,
  qris_sales bigint default 0,
  total_sales bigint default 0,
  transaction_count integer default 0,
  cash_expenses bigint default 0,
  actual_cash bigint default 0,
  expected_cash bigint default 0,
  discrepancy bigint default 0,
  closing_note text,
  note text,
  status text default 'OPEN' check (status in ('OPEN', 'CLOSED')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cashier_shifts disable row level security;
create index if not exists idx_cashier_shifts_status on public.cashier_shifts (status);
create index if not exists idx_cashier_shifts_opened on public.cashier_shifts (opened_at desc);


-- 3. KOLOM SPLIT PAYMENT PADA TRANSAKSI
alter table public.transactions add column if not exists split_cash bigint default 0;
alter table public.transactions add column if not exists split_qris bigint default 0;

