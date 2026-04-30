-- Trackline initial schema.
--
-- Run this once in Supabase SQL Editor (or via `supabase db push` if using
-- the local CLI). Designed to be re-runnable: every CREATE uses IF NOT EXISTS
-- and every policy/trigger drops itself first.
--
-- Conventions:
--   * Primary keys: short text ids (so existing localStorage IDs port over).
--   * Money: integer FCFA — no fractional currency in Cameroon.
--   * Timestamps: timestamptz, set automatically.
--   * RLS: ON for every table. Public reads (anon) for catalog, writes via
--     service role only. Bookings: insert allowed via anon for the booking
--     flow; reads restricted to service role.

create extension if not exists "pgcrypto";

-- ============================================================
--  Catalog
-- ============================================================

create table if not exists public.cities (
  id          text primary key,
  name        text not null,
  code        text not null check (char_length(code) = 3),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create unique index if not exists cities_code_uniq on public.cities(code);

create table if not exists public.dropoffs (
  id          text primary key,
  city_id     text not null references public.cities(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists dropoffs_city_idx on public.dropoffs(city_id);

create table if not exists public.agencies (
  id          text primary key,
  name        text not null,
  logo_color  text not null,
  image_url   text,
  created_at  timestamptz not null default now()
);

create table if not exists public.bus_templates (
  id          text primary key,
  name        text not null,
  type        text not null check (type in ('VIP','Regular')),
  layout      jsonb not null,
  locked      boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.routes (
  id            text primary key,
  from_city_id  text not null references public.cities(id) on delete restrict,
  to_city_id    text not null references public.cities(id) on delete restrict,
  created_at    timestamptz not null default now(),
  check (from_city_id <> to_city_id)
);
create index if not exists routes_from_idx on public.routes(from_city_id);
create index if not exists routes_to_idx   on public.routes(to_city_id);

create table if not exists public.schedules (
  id          text primary key,
  time        text not null,
  label       text,
  created_at  timestamptz not null default now()
);

create table if not exists public.trips (
  id                text primary key,
  agency_id         text not null references public.agencies(id) on delete restrict,
  route_id          text not null references public.routes(id) on delete restrict,
  bus_template_id   text not null references public.bus_templates(id) on delete restrict,
  date              date not null,
  time              text not null,
  price_regular     integer not null check (price_regular > 0),
  price_vip         integer not null check (price_vip > 0),
  taken_seats       text[] not null default '{}',
  drop_off_id       text references public.dropoffs(id) on delete set null,
  created_at        timestamptz not null default now()
);
create index if not exists trips_route_date_idx on public.trips(route_id, date);
create index if not exists trips_agency_idx     on public.trips(agency_id);

-- ============================================================
--  Bookings & payments
-- ============================================================

create table if not exists public.bookings (
  consignment        text primary key,
  trip_id            text not null references public.trips(id) on delete restrict,
  passenger_name     text not null,
  passenger_phone    text not null,
  passenger_email    text,
  seat               text not null,
  seat_class         text not null check (seat_class in ('VIP','Regular')),
  amount             integer not null check (amount > 0),
  payment_method     text not null check (payment_method in ('MTN','ORANGE')),
  payment_trans_id   text,
  status             text not null default 'valid'
                        check (status in ('valid','used','cancelled')),
  drop_off           text,
  created_at         timestamptz not null default now()
);
create index if not exists bookings_trip_idx     on public.bookings(trip_id);
create index if not exists bookings_phone_idx    on public.bookings(passenger_phone);
create index if not exists bookings_created_idx  on public.bookings(created_at desc);

create table if not exists public.payments (
  trans_id        text primary key,
  external_id     text not null,
  amount          integer not null,
  status          text not null check (status in ('PENDING','SUCCESSFUL','FAILED','EXPIRED')),
  medium          text,
  payer_phone     text,
  payer_name      text,
  email           text,
  message         text,
  date_initiated  timestamptz not null default now(),
  date_confirmed  timestamptz,
  raw             jsonb
);
create index if not exists payments_external_idx on public.payments(external_id);

-- ============================================================
--  Audit / notifications feed (read by the dashboard bell)
-- ============================================================

create table if not exists public.events (
  id          bigserial primary key,
  kind        text not null,        -- 'booking.created' | 'payment.failed' | ...
  ref_id      text,                  -- booking.consignment or payments.trans_id
  payload     jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists events_created_idx on public.events(created_at desc);

-- ============================================================
--  RLS
-- ============================================================

alter table public.cities         enable row level security;
alter table public.dropoffs       enable row level security;
alter table public.agencies       enable row level security;
alter table public.bus_templates  enable row level security;
alter table public.routes         enable row level security;
alter table public.schedules      enable row level security;
alter table public.trips          enable row level security;
alter table public.bookings       enable row level security;
alter table public.payments       enable row level security;
alter table public.events         enable row level security;

-- Public catalog: anon can SELECT, only service role can mutate.
do $$
declare
  tbl text;
begin
  for tbl in
    select unnest(array[
      'cities','dropoffs','agencies','bus_templates','routes',
      'schedules','trips'
    ])
  loop
    execute format(
      'drop policy if exists "anon read %1$s" on public.%1$I;', tbl
    );
    execute format(
      'create policy "anon read %1$s" on public.%1$I for select using (true);',
      tbl
    );
  end loop;
end$$;

-- Bookings: anon can INSERT (booking flow) but cannot read other people's
-- bookings. Operators read everything via service role.
drop policy if exists "anon insert bookings" on public.bookings;
create policy "anon insert bookings"
  on public.bookings for insert
  with check (true);

-- Payments + events: service role only (no anon policy = no anon access)
-- Storage bucket for agency images
insert into storage.buckets (id, name, public)
  values ('agency-images', 'agency-images', true)
  on conflict (id) do nothing;

drop policy if exists "public read agency images" on storage.objects;
create policy "public read agency images"
  on storage.objects for select
  using (bucket_id = 'agency-images');
