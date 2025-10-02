-- Initial database schema for Broad backend
-- This migration creates all the core tables needed for the motorcycle ride sharing platform

-- Enable UUID extension
create extension if not exists "uuid-ossp";
-- Enable PostGIS extension for geography types
create extension if not exists "postgis";

-- Use gen_random_uuid() instead of uuid_generate_v4() for better compatibility

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  handle text unique,
  display_name text not null,
  bio text,
  avatar_url text,
  country_code text,
  phone_number text,
  expo_push_token text,
  role text default 'rider' check (role in ('rider', 'moderator', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Rides table
create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  tagline text,
  route_summary text,
  starts_at timestamptz not null,
  meetup_location jsonb,
  pace text check (pace in ('cruise', 'group', 'spirited')),
  experience_level text check (experience_level in ('novice', 'intermediate', 'advanced')),
  max_riders int default 10 check (max_riders >= 2 and max_riders <= 50),
  status text default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ride segments table (optional waypoints/segments for rides)
create table if not exists public.ride_segments (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  sequence int not null check (sequence >= 1),
  note text not null,
  distance_km numeric check (distance_km >= 0),
  created_at timestamptz default now(),
  unique(ride_id, sequence)
);

-- Bookings table (ride participants)
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  rider_id uuid not null references public.profiles(id) on delete cascade,
  status text default 'confirmed' check (status in ('pending', 'confirmed', 'waitlisted', 'cancelled')),
  created_at timestamptz default now(),
  unique(ride_id, rider_id)
);

-- Driver locations table (for live tracking during rides)
create table if not exists public.driver_locations (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  driver_id uuid not null references public.profiles(id) on delete cascade,
  position geography(point, 4326),
  speed numeric,
  heading numeric,
  updated_at timestamptz default now()
);

-- Garages table (motorcycle collections)
create table if not exists public.garages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'Main Garage',
  created_at timestamptz default now(),
  unique(owner_id, label)
);

-- Motorcycles table
create table if not exists public.motorcycles (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references public.garages(id) on delete cascade,
  make text not null,
  model text not null,
  year int check (year >= 1960 and year <= extract(year from now()) + 1),
  nickname text,
  vin text unique,
  odometer_km numeric check (odometer_km >= 0),
  last_serviced_at date,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

-- Maintenance logs table
create table if not exists public.maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  motorcycle_id uuid not null references public.motorcycles(id) on delete cascade,
  performed_at date not null,
  description text not null,
  cost numeric check (cost >= 0),
  notes text,
  created_at timestamptz default now()
);

-- Notifications table (for future use)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- Create indexes for better performance
create index if not exists idx_profiles_handle on public.profiles(handle);
create index if not exists idx_rides_creator_id on public.rides(creator_id);
create index if not exists idx_rides_starts_at on public.rides(starts_at);
create index if not exists idx_rides_status on public.rides(status);
create index if not exists idx_bookings_ride_id on public.bookings(ride_id);
create index if not exists idx_bookings_rider_id on public.bookings(rider_id);
create index if not exists idx_motorcycles_garage_id on public.motorcycles(garage_id);
create index if not exists idx_motorcycles_deleted_at on public.motorcycles(deleted_at);
create index if not exists idx_maintenance_logs_motorcycle_id on public.maintenance_logs(motorcycle_id);
create index if not exists idx_notifications_recipient_id on public.notifications(recipient_id);
create index if not exists idx_notifications_read_at on public.notifications(read_at);

-- Enable Row Level Security (RLS) on all tables
alter table public.profiles enable row level security;
alter table public.rides enable row level security;
alter table public.ride_segments enable row level security;
alter table public.bookings enable row level security;
alter table public.driver_locations enable row level security;
alter table public.garages enable row level security;
alter table public.motorcycles enable row level security;
alter table public.maintenance_logs enable row level security;
alter table public.notifications enable row level security;

-- Basic RLS policies (will be refined during implementation)
-- For now, allow service role full access and authenticated users basic access

-- Profiles policies
create policy "Users can view all profiles" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Rides policies
create policy "Anyone can view rides" on public.rides
  for select using (true);

create policy "Authenticated users can create rides" on public.rides
  for insert with check (auth.role() = 'authenticated');

create policy "Creators can update their rides" on public.rides
  for update using (auth.uid() = creator_id);

-- Bookings policies
create policy "Users can view bookings for rides they're involved in" on public.bookings
  for select using (
    auth.uid() = rider_id or 
    auth.uid() in (select creator_id from public.rides where id = ride_id)
  );

create policy "Authenticated users can create bookings" on public.bookings
  for insert with check (auth.role() = 'authenticated');

-- Garages policies
create policy "Users can view and manage their own garages" on public.garages
  for all using (auth.uid() = owner_id);

-- Motorcycles policies
create policy "Users can manage motorcycles in their garages" on public.motorcycles
  for all using (
    garage_id in (select id from public.garages where owner_id = auth.uid())
  );

-- Maintenance logs policies
create policy "Users can manage maintenance logs for their motorcycles" on public.maintenance_logs
  for all using (
    motorcycle_id in (
      select m.id from public.motorcycles m
      join public.garages g on m.garage_id = g.id
      where g.owner_id = auth.uid()
    )
  );

-- Notifications policies
create policy "Users can view their own notifications" on public.notifications
  for select using (auth.uid() = recipient_id);

create policy "Users can update their own notifications" on public.notifications
  for update using (auth.uid() = recipient_id);

-- Function to automatically create a garage when a profile is created
create or replace function public.create_default_garage()
returns trigger as $$
begin
  insert into public.garages (owner_id, label)
  values (new.id, 'Main Garage');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create default garage
create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.create_default_garage();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_rides_updated_at
  before update on public.rides
  for each row execute function public.update_updated_at_column();