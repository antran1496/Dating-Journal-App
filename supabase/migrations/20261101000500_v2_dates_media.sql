-- Migration M4: Dates v2, Date Places, Date Media, RPCs
-- Dating Journal v2

-- 1. Mở rộng bảng dates
alter table public.dates
  add column if not exists title text,
  add column if not exists note text,
  add column if not exists mood text check (mood in ('love','happy','calm','excited','tired','sad')),
  add column if not exists spend_vnd bigint check (spend_vnd is null or spend_vnd >= 0),
  add column if not exists paid_by uuid references public.profiles(id) on delete set null,
  add column if not exists paid_split boolean not null default false,
  add column if not exists song text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists updated_at timestamptz default now(),
  add column if not exists client_id uuid unique;

-- 2. Bảng date_places
create table if not exists public.date_places (
  id uuid primary key default gen_random_uuid(),
  date_id uuid not null references public.dates(id) on delete cascade,
  position int not null,
  name text not null,
  lat double precision,
  lng double precision,
  area_label text,                      -- "Quận 1", "Đà Lạt" dùng cho thẻ chia sẻ
  unique (date_id, position)
);

create index if not exists date_places_date_id_idx on public.date_places(date_id);

alter table public.date_places enable row level security;

create policy "date_places_select"
  on public.date_places
  for select
  using (date_id in (select id from public.dates where couple_id in (select get_user_couple_ids())));

create policy "date_places_all"
  on public.date_places
  for all
  using (date_id in (select id from public.dates where couple_id in (select get_user_couple_ids())))
  with check (date_id in (select id from public.dates where couple_id in (select get_user_couple_ids())));

-- 3. Bảng date_media
create table if not exists public.date_media (
  id uuid primary key default gen_random_uuid(),
  date_id uuid not null references public.dates(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  kind text not null check (kind in ('image','video')),
  path text not null,                   -- trong bucket checkin-images
  thumb_path text,
  width int,
  height int,
  duration_s int,
  bytes int,
  position int not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists date_media_date_id_idx on public.date_media(date_id);
create index if not exists date_media_couple_id_idx on public.date_media(couple_id);

alter table public.date_media enable row level security;

create policy "date_media_select"
  on public.date_media
  for select
  using (couple_id in (select get_user_couple_ids()));

create policy "date_media_all"
  on public.date_media
  for all
  using (couple_id in (select get_user_couple_ids()))
  with check (couple_id in (select get_user_couple_ids()));

-- 4. Trigger kiểm tra số lượng media (tối đa 9 media, tối đa 1 video)
create or replace function public.check_date_media_limit()
returns trigger
language plpgsql
as $$
declare
  v_total_media int;
  v_video_count int;
begin
  select count(*), count(*) filter (where kind = 'video')
  into v_total_media, v_video_count
  from public.date_media
  where date_id = new.date_id;

  if v_total_media >= 9 then
    raise exception 'media_limit_exceeded: Mỗi kỷ niệm chỉ được lưu tối đa 9 ảnh hoặc video.';
  end if;

  if new.kind = 'video' and v_video_count >= 1 then
    raise exception 'video_limit_exceeded: Mỗi kỷ niệm chỉ được lưu tối đa 1 video.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_check_date_media_limit on public.date_media;
create trigger trg_check_date_media_limit
before insert on public.date_media
for each row
execute function public.check_date_media_limit();

-- 5. RPC Ngày này năm ngoái (on_this_day)
create or replace function public.on_this_day(
  p_couple uuid,
  p_day date
) returns setof public.dates
language sql
security definer
set search_path = public
stable
as $$
  select *
  from public.dates
  where couple_id = p_couple
    and to_char(date_time, 'MM-DD') = to_char(p_day, 'MM-DD')
    and date_time::date < p_day
  order by date_time desc;
$$;

-- 6. RPC dates_by_day_range cho lịch tình yêu
create or replace function public.dates_by_day_range(
  p_couple uuid,
  p_start date,
  p_end date
) returns setof public.dates
language sql
security definer
set search_path = public
stable
as $$
  select *
  from public.dates
  where couple_id = p_couple
    and date_time::date <= p_end
    and coalesce(end_date::date, date_time::date) >= p_start
  order by date_time asc;
$$;

-- 7. Tìm kiếm pg_trgm
create extension if not exists pg_trgm;
create index if not exists dates_title_trgm_idx on public.dates using gin (title gin_trgm_ops);
create index if not exists dates_note_trgm_idx on public.dates using gin (note gin_trgm_ops);

grant execute on function public.on_this_day to authenticated, service_role;
grant execute on function public.dates_by_day_range to authenticated, service_role;
