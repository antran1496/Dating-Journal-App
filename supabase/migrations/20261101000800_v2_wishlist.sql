-- Migration M7: Wishlist (Cùng nhau)
-- Dating Journal v2 Phase P4

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null check (char_length(title) <= 120),
  note text,
  budget_vnd bigint,
  created_by uuid references public.profiles(id) on delete set null,
  done_at timestamptz,
  done_by uuid references public.profiles(id) on delete set null,
  linked_date_id uuid references public.dates(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_wishlist_couple on public.wishlist_items(couple_id);
create index if not exists idx_wishlist_done on public.wishlist_items(couple_id, done_at);

alter table public.wishlist_items enable row level security;

drop policy if exists "Members can read wishlist items" on public.wishlist_items;
create policy "Members can read wishlist items" on public.wishlist_items
  for select using (couple_id in (select public.get_user_couple_ids()));

drop policy if exists "Members can create wishlist items" on public.wishlist_items;
create policy "Members can create wishlist items" on public.wishlist_items
  for insert with check (
    couple_id in (select public.get_user_couple_ids())
  );

drop policy if exists "Members can update wishlist items" on public.wishlist_items;
create policy "Members can update wishlist items" on public.wishlist_items
  for update using (
    couple_id in (select public.get_user_couple_ids())
  )
  with check (
    couple_id in (select public.get_user_couple_ids())
  );

drop policy if exists "Members can delete wishlist items" on public.wishlist_items;
create policy "Members can delete wishlist items" on public.wishlist_items
  for delete using (
    couple_id in (select public.get_user_couple_ids())
  );
