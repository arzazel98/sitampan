-- SUPABASE BUSINESS FEATURES — jalankan di SQL Editor setelah supabase_schema_final.sql
-- 1. Database Pelanggan (CRM sederhana)
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  phone text unique not null,
  total_kunjungan integer default 1,
  total_belanja bigint default 0,
  layanan_favorit text,
  kunjungan_terakhir timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.customers disable row level security;
create index if not exists idx_customers_phone on public.customers (phone);
create index if not exists idx_customers_nama on public.customers (nama);

-- 2. Riwayat Payout Komisi Kapster
create table if not exists public.commission_payouts (
  id uuid primary key default gen_random_uuid(),
  barber_name text not null,
  barber_title text,
  periode text,
  jumlah_payout bigint not null,
  total_komisi_saat_payout bigint default 0,
  sisa_komisi bigint default 0,
  metode text default 'Tunai' check (metode in ('Tunai','Transfer','QRIS')),
  keterangan text,
  dibayar_oleh text,
  created_at timestamptz default now()
);
alter table public.commission_payouts disable row level security;
create index if not exists idx_payouts_barber on public.commission_payouts (barber_name);
create index if not exists idx_payouts_created on public.commission_payouts (created_at desc);

-- 3. Persetujuan Beban (migrasi dari localStorage ke DB, tetap backward compatible)
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  kategori text not null,
  jumlah bigint not null,
  keterangan text not null,
  dicatat_oleh text,
  dari_kas_kasir boolean default true,
  status text default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  approved_by text,
  approved_at timestamptz,
  tanggal timestamptz default now(),
  created_at timestamptz default now()
);
alter table public.expenses disable row level security;
create index if not exists idx_expenses_status on public.expenses (status);
create index if not exists idx_expenses_tanggal on public.expenses (tanggal desc);

-- 4. Void transaksi: tambah kolom status + alasan jika belum ada
alter table public.transactions add column if not exists void_reason text;
alter table public.transactions add column if not exists void_by text;
alter table public.transactions add column if not exists void_at timestamptz;
-- status sudah ada, pastikan check mencakup Void/Batal (longgar: biarkan text bebas, app layer yang enforce)
