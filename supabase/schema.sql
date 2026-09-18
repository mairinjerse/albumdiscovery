-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).

create table if not exists saved_albums (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  artist text not null,
  album text not null,
  reason text,
  history text,
  image text,
  tier text,
  spotify_url text,
  note text,
  share_slug text unique,
  created_at timestamptz default now()
);

alter table saved_albums enable row level security;

-- Owners can select/insert/update/delete their own rows.
create policy "own rows" on saved_albums for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Anyone (including signed-out visitors) can read a row once it has been
-- given a share slug — that's what makes /shared/[slug] work without login.
create policy "shared rows are public" on saved_albums for select
  using (share_slug is not null);
