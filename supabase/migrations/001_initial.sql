-- NeverExpire Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Records table
create table if not exists records (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in (
    'Vendor Contract',
    'Compliance Certificate',
    'Safety Training',
    'Insurance Policy',
    'Inspection Report',
    'Government License',
    'Other'
  )),
  owner text not null,
  department text,
  issue_date date not null,
  expiry_date date not null,
  renewal_reminder_days int not null default 30,
  notes text,
  attachment_url text,
  is_high_risk boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Audit trail table
create table if not exists record_history (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references records(id) on delete cascade,
  action text not null check (action in ('created', 'updated', 'renewed', 'deleted')),
  changed_by text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Auto-update updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger records_updated_at
  before update on records
  for each row execute function update_updated_at();

-- Indexes for performance
create index if not exists idx_records_expiry_date on records(expiry_date);
create index if not exists idx_records_category on records(category);
create index if not exists idx_record_history_record_id on record_history(record_id);

-- Row Level Security
alter table records enable row level security;
alter table record_history enable row level security;

-- Allow authenticated users to read all records
create policy "authenticated_read_records" on records
  for select to authenticated using (true);

-- Allow authenticated users to insert records
create policy "authenticated_insert_records" on records
  for insert to authenticated with check (true);

-- Allow authenticated users to update records
create policy "authenticated_update_records" on records
  for update to authenticated using (true);

-- Allow authenticated users to delete records
create policy "authenticated_delete_records" on records
  for delete to authenticated using (true);

-- Allow authenticated users to read history
create policy "authenticated_read_history" on record_history
  for select to authenticated using (true);

-- Allow authenticated users to insert history
create policy "authenticated_insert_history" on record_history
  for insert to authenticated with check (true);
