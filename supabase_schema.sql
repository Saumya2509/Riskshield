-- ============================================================================
-- RISKSHIELD: PostgreSQL Database Schema & Row-Level Security (RLS)
-- Target Platform: Supabase / PostgreSQL 15+
-- Description: Stores multi-source reconciliation audit runs and 3-way match records
-- ============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. Table: reconciliation_runs
-- Stores high-level audit summary for each batch execution
-- ----------------------------------------------------------------------------
create table if not exists reconciliation_runs (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  total_records int not null,
  exact_matches int not null,
  fuzzy_matches int not null,
  partial_matches int not null,
  exceptions_count int not null,
  match_rate numeric(5, 2) not null,
  cleared_amount numeric(15, 2) not null,
  open_exception_amount numeric(15, 2) not null,
  run_time_ms int not null,
  status text default 'COMPLETED',
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- 2. Table: reconciliation_matches
-- Stores line-item 3-way match mappings, deltas, and analyst resolution states
-- ----------------------------------------------------------------------------
create table if not exists reconciliation_matches (
  id uuid primary key default gen_random_uuid(),
  record_id text unique not null,
  source text not null,
  counterparty text not null,
  currency text default 'INR',
  invoice_amount numeric(15, 2) not null,
  matched_ledger_id text,
  delta numeric(15, 2) default 0.00,
  match_pass int,
  status text check (status in ('Exact', 'Fuzzy', 'Partial', 'Exception')),
  confidence int default 100,
  exception_code text,
  explanation text,
  assigned_analyst text default 'Unassigned',
  is_resolved boolean default false,
  resolution_notes text,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- 3. Performance Indexes
-- ----------------------------------------------------------------------------
create index if not exists idx_recon_runs_created_at on reconciliation_runs(created_at desc);
create index if not exists idx_recon_matches_record_id on reconciliation_matches(record_id);
create index if not exists idx_recon_matches_status on reconciliation_matches(status);
create index if not exists idx_recon_matches_is_resolved on reconciliation_matches(is_resolved);

-- ----------------------------------------------------------------------------
-- 4. Row-Level Security (RLS) Policies
-- ----------------------------------------------------------------------------
alter table reconciliation_runs enable row level security;
alter table reconciliation_matches enable row level security;

-- Allow read & write access for application client
create policy "Allow all operations runs" 
  on reconciliation_runs 
  for all 
  using (true) 
  with check (true);

create policy "Allow all operations matches" 
  on reconciliation_matches 
  for all 
  using (true) 
  with check (true);
