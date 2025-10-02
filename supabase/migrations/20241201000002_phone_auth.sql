-- Migration to support phone number authentication
-- This migration adds necessary constraints and triggers for phone OTP authentication

-- Add unique constraint to phone_number in profiles table
alter table public.profiles 
add constraint profiles_phone_number_unique unique (phone_number);

-- Create function to handle new user signup with phone
create or replace function public.handle_new_user_signup()
returns trigger as $$
begin
  -- Only create profile if user signed up with phone
  if new.phone is not null then
    insert into public.profiles (
      id,
      display_name,
      phone_number,
      handle,
      role
    ) values (
      new.id,
      coalesce(new.raw_user_meta_data->>'display_name', 'User'),
      new.phone,
      new.raw_user_meta_data->>'handle',
      'rider'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user_signup();

-- Update RLS policies to work with phone authentication
-- Allow users to read their own profile by phone number
create policy "Users can view own profile by phone" on public.profiles
  for select using (
    auth.uid() = id or 
    (auth.jwt() ->> 'phone')::text = phone_number
  );

-- Create index on phone_number for better performance
create index if not exists profiles_phone_number_idx on public.profiles (phone_number);

-- Update the existing profile creation function to handle phone numbers
create or replace function public.create_profile_for_user(
  user_id uuid,
  display_name text,
  handle text default null,
  phone_number text default null
)
returns uuid as $$
declare
  profile_id uuid;
begin
  insert into public.profiles (
    id,
    display_name,
    handle,
    phone_number,
    role
  ) values (
    user_id,
    display_name,
    handle,
    phone_number,
    'rider'
  ) returning id into profile_id;
  
  return profile_id;
end;
$$ language plpgsql security definer;