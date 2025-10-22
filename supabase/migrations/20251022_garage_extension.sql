-- Garage schema extension for garage screen features
-- Adds workspace notes and primary/backup bike references
alter table if exists public.garages
  add column if not exists workspace_notes text,
  add column if not exists primary_bike_id uuid references public.motorcycles(id) on delete set null,
  add column if not exists backup_bike_id uuid references public.motorcycles(id) on delete set null;

-- Extend motorcycles with optional metadata used by UI
alter table if exists public.motorcycles
  add column if not exists category text,
  add column if not exists colorway text,
  add column if not exists plate text,
  add column if not exists next_service_on date,
  add column if not exists deleted_at timestamptz;

-- Maintenance logs per motorcycle
create table if not exists public.maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  motorcycle_id uuid not null references public.motorcycles(id) on delete cascade,
  title text not null,
  performed_at date not null,
  summary text,
  created_at timestamptz not null default now()
);
create index if not exists maintenance_logs_motorcycle_idx on public.maintenance_logs(motorcycle_id, performed_at desc);

-- Simple tasks scoped to a garage
create table if not exists public.garage_tasks (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references public.garages(id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now()
);
create index if not exists garage_tasks_garage_idx on public.garage_tasks(garage_id, created_at desc);

-- Documents scoped to a garage
create table if not exists public.garage_documents (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references public.garages(id) on delete cascade,
  title text not null,
  status text not null,
  updated_on date not null,
  expires_on date,
  storage text not null default 'local',
  created_at timestamptz not null default now()
);
create index if not exists garage_documents_garage_idx on public.garage_documents(garage_id, updated_on desc);
