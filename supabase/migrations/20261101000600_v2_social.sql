-- Migration M5: Reactions, Comments, Views for Dates
-- Dating Journal v2 Phase P4

-- 1. Table date_reactions
create table if not exists public.date_reactions (
  date_id uuid not null references public.dates(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null default '💗',
  created_at timestamptz not null default now(),
  primary key (date_id, profile_id)
);

create index if not exists idx_date_reactions_date_id on public.date_reactions(date_id);
create index if not exists idx_date_reactions_profile_id on public.date_reactions(profile_id);

alter table public.date_reactions enable row level security;

-- 2. Table date_comments
create table if not exists public.date_comments (
  id uuid primary key default gen_random_uuid(),
  date_id uuid not null references public.dates(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null check (char_length(body) <= 500),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create index if not exists idx_date_comments_date_id on public.date_comments(date_id);
create index if not exists idx_date_comments_author_id on public.date_comments(author_id);

alter table public.date_comments enable row level security;

-- 3. Table date_views
create table if not exists public.date_views (
  date_id uuid not null references public.dates(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (date_id, profile_id)
);

create index if not exists idx_date_views_date_id on public.date_views(date_id);
create index if not exists idx_date_views_profile_id on public.date_views(profile_id);

alter table public.date_views enable row level security;

-- 4. RLS Policies for date_reactions
drop policy if exists "Members can read reactions" on public.date_reactions;
create policy "Members can read reactions" on public.date_reactions
  for select using (
    date_id in (
      select id from public.dates where couple_id in (select public.get_user_couple_ids())
    )
  );

drop policy if exists "Users can add own reactions" on public.date_reactions;
create policy "Users can add own reactions" on public.date_reactions
  for insert with check (
    profile_id = auth.uid() and
    date_id in (
      select id from public.dates where couple_id in (select public.get_user_couple_ids())
    )
  );

drop policy if exists "Users can update own reactions" on public.date_reactions;
create policy "Users can update own reactions" on public.date_reactions
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists "Users can delete own reactions" on public.date_reactions;
create policy "Users can delete own reactions" on public.date_reactions
  for delete using (profile_id = auth.uid());

-- 5. RLS Policies for date_comments
drop policy if exists "Members can read comments" on public.date_comments;
create policy "Members can read comments" on public.date_comments
  for select using (
    date_id in (
      select id from public.dates where couple_id in (select public.get_user_couple_ids())
    )
  );

drop policy if exists "Users can insert comments" on public.date_comments;
create policy "Users can insert comments" on public.date_comments
  for insert with check (
    author_id = auth.uid() and
    date_id in (
      select id from public.dates where couple_id in (select public.get_user_couple_ids())
    )
  );

drop policy if exists "Authors can update own comments" on public.date_comments;
create policy "Authors can update own comments" on public.date_comments
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists "Authors can delete own comments" on public.date_comments;
create policy "Authors can delete own comments" on public.date_comments
  for delete using (author_id = auth.uid());

-- 6. RLS Policies for date_views
drop policy if exists "Members can read views" on public.date_views;
create policy "Members can read views" on public.date_views
  for select using (
    date_id in (
      select id from public.dates where couple_id in (select public.get_user_couple_ids())
    )
  );

drop policy if exists "Users can record own view" on public.date_views;
create policy "Users can record own view" on public.date_views
  for insert with check (
    profile_id = auth.uid() and
    date_id in (
      select id from public.dates where couple_id in (select public.get_user_couple_ids())
    )
  );

drop policy if exists "Users can update own view" on public.date_views;
create policy "Users can update own view" on public.date_views
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists "Users can delete own view" on public.date_views;
create policy "Users can delete own view" on public.date_views
  for delete using (profile_id = auth.uid());
