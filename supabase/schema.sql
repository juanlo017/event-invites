-- Event Invitations Schema
-- Run this in your Supabase SQL editor

create table if not exists invitations (
  id          uuid primary key default gen_random_uuid(),
  token       uuid not null unique default gen_random_uuid(),
  label       text,                          -- optional friendly label (e.g. guest name as entered by admin)
  confirmado  boolean default null,          -- null = pending, true = accepted, false = rejected
  asistente_principal_nombre text,
  acompanante_nombre         text,
  created_at  timestamptz not null default now(),
  email        text,
  responded_at timestamptz,
  expires_at  timestamptz not null default '2026-04-24 23:59:59+00'
);

-- Index for fast token lookups
create index if not exists invitations_token_idx on invitations(token);

-- ─── Group invitations ───────────────────────────────────────────────────────
-- One link shared with many people; each person self-registers.

create table if not exists group_invitations (
  id         uuid primary key default gen_random_uuid(),
  token      uuid not null unique default gen_random_uuid(),
  label      text not null,
  capacity   int not null default 50,
  expires_at timestamptz not null default '2026-04-24 23:59:59+00',
  created_at timestamptz not null default now()
);

create table if not exists group_registrations (
  id             uuid primary key default gen_random_uuid(),
  group_id       uuid not null references group_invitations(id) on delete cascade,
  nombre         text not null,
  acompanante_nombre text,
  email          text,
  registered_at  timestamptz not null default now()
);

create index if not exists group_invitations_token_idx on group_invitations(token);
create index if not exists group_registrations_group_idx on group_registrations(group_id);

alter table group_invitations  enable row level security;
alter table group_registrations enable row level security;

-- ─── Individual invitations ───────────────────────────────────────────────────
-- Row Level Security
alter table invitations enable row level security;

-- No policies for the anon role = deny everything for anon/authenticated roles.
-- All DB access goes through server-side API routes using the service role key,
-- which bypasses RLS entirely. The anon key (exposed client-side) therefore
-- cannot read or modify any row directly via the Supabase REST API.
