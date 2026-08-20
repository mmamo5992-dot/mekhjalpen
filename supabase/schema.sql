-- ============================================================================
-- MekHjälpen — full database schema, RLS, RPCs and storage policies
-- Paste this whole file into Supabase → SQL Editor → Run.
-- Safe to re-run (drops and recreates policies).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLES
-- ----------------------------------------------------------------------------

-- 1.1 profiles — one row per auth user, holds the role
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'customer' check (role in ('mechanic', 'customer')),
  shop_name   text,
  created_at  timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (lower(email));

-- 1.2 vehicles — VIN is the permanent primary key
create table if not exists public.vehicles (
  vin                  text primary key check (char_length(vin) between 6 and 17),
  make                 text not null,
  model                text not null,
  year                 int  not null,
  fuel_type            text not null,
  body_type            text not null,
  mileage              int  not null default 0,
  owner_id             uuid references public.profiles(id) on delete set null,
  -- If the owner has no account yet, the mechanic records their email here.
  -- It is claimed automatically when that person signs up (trigger below).
  pending_owner_email  text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists vehicles_owner_idx on public.vehicles (owner_id);
create index if not exists vehicles_pending_idx on public.vehicles (lower(pending_owner_email));

-- 1.3 service_records — append-only verified stamps, bound to the VIN
create table if not exists public.service_records (
  id            uuid primary key default gen_random_uuid(),
  vin           text not null references public.vehicles(vin) on delete cascade,
  mechanic_id   uuid not null references public.profiles(id) on delete restrict,
  mechanic_name text not null,
  shop_name     text,
  service_date  date not null,
  mileage       int  not null,
  work_done     text not null,
  notes         text,
  -- [{ "name": "invoice.pdf", "path": "VIN/1699.../invoice.pdf" }]
  files         jsonb not null default '[]'::jsonb,
  verified      boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists service_records_vin_idx on public.service_records (vin, service_date desc);

-- 1.4 ownership_transfers — the transfer stamps shown in the timeline
create table if not exists public.ownership_transfers (
  id              uuid primary key default gen_random_uuid(),
  vin             text not null references public.vehicles(vin) on delete cascade,
  from_owner_id   uuid references public.profiles(id) on delete set null,
  from_owner_name text,
  to_owner_email  text not null,
  to_owner_name   text,
  transferred_at  timestamptz not null default now()
);

create index if not exists transfers_vin_idx on public.ownership_transfers (vin, transferred_at desc);

-- 1.5 diagnostic_logs — every DTC lookup a mechanic runs
create table if not exists public.diagnostic_logs (
  id           uuid primary key default gen_random_uuid(),
  mechanic_id  uuid not null references public.profiles(id) on delete cascade,
  vin          text references public.vehicles(vin) on delete set null,
  dtc_code     text not null,
  year         int,
  make         text,
  model        text,
  fuel_type    text,
  body_type    text,
  result       jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists diagnostic_logs_mechanic_idx on public.diagnostic_logs (mechanic_id, created_at desc);