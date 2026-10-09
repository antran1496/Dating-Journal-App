-- Migration M6: Daily Questions, Answers, Streak
-- Dating Journal v2 Phase P4

-- 1. Table questions
create table if not exists public.questions (
  id serial primary key,
  text_vi text not null,
  text_en text,
  category text default 'general',
  active boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists idx_questions_active on public.questions(active);
alter table public.questions enable row level security;

-- All authenticated users can view active questions
drop policy if exists "Authenticated users can read questions" on public.questions;
create policy "Authenticated users can read questions" on public.questions
  for select using (auth.role() = 'authenticated');

-- 2. Table couple_daily_questions
create table if not exists public.couple_daily_questions (
  couple_id uuid not null references public.couples(id) on delete cascade,
  day date not null,
  question_id int not null references public.questions(id) on delete cascade,
  primary key (couple_id, day)
);

create index if not exists idx_cdq_couple_day on public.couple_daily_questions(couple_id, day);
alter table public.couple_daily_questions enable row level security;

drop policy if exists "Members can read couple daily questions" on public.couple_daily_questions;
create policy "Members can read couple daily questions" on public.couple_daily_questions
  for select using (couple_id in (select public.get_user_couple_ids()));

drop policy if exists "Members can insert couple daily questions" on public.couple_daily_questions;
create policy "Members can insert couple daily questions" on public.couple_daily_questions
  for insert with check (couple_id in (select public.get_user_couple_ids()));

-- 3. Table daily_answers
create table if not exists public.daily_answers (
  couple_id uuid not null references public.couples(id) on delete cascade,
  day date not null,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) <= 300),
  answered_at timestamptz not null default now(),
  primary key (couple_id, day, profile_id)
);

create index if not exists idx_daily_answers_lookup on public.daily_answers(couple_id, day, profile_id);
alter table public.daily_answers enable row level security;

-- RLS: SELECT
-- A can see own answer anytime.
-- A can see partner's answer ONLY IF A has also answered for that (couple_id, day)!
drop policy if exists "Daily answers visibility policy" on public.daily_answers;
create policy "Daily answers visibility policy" on public.daily_answers
  for select using (
    profile_id = auth.uid()
    or (
      couple_id in (select public.get_user_couple_ids())
      and exists (
        select 1 from public.daily_answers my_ans
        where my_ans.couple_id = daily_answers.couple_id
          and my_ans.day = daily_answers.day
          and my_ans.profile_id = auth.uid()
      )
    )
  );

-- RLS: INSERT
-- Can only insert own answer for today in Asia/Ho_Chi_Minh timezone
drop policy if exists "Daily answers insert policy" on public.daily_answers;
create policy "Daily answers insert policy" on public.daily_answers
  for insert with check (
    profile_id = auth.uid()
    and couple_id in (select public.get_user_couple_ids())
    and day = (now() at time zone 'Asia/Ho_Chi_Minh')::date
  );

-- RLS: UPDATE
-- Can only update own answer for today, and ONLY BEFORE partner has answered
drop policy if exists "Daily answers update policy" on public.daily_answers;
create policy "Daily answers update policy" on public.daily_answers
  for update using (
    profile_id = auth.uid()
    and day = (now() at time zone 'Asia/Ho_Chi_Minh')::date
    and not exists (
      select 1 from public.daily_answers partner_ans
      where partner_ans.couple_id = daily_answers.couple_id
        and partner_ans.day = daily_answers.day
        and partner_ans.profile_id != auth.uid()
    )
  )
  with check (
    profile_id = auth.uid()
    and day = (now() at time zone 'Asia/Ho_Chi_Minh')::date
  );

-- 4. RPC get_or_create_today_question
create or replace function public.get_or_create_today_question(p_couple uuid)
returns table (
  day date,
  question_id int,
  text_vi text,
  text_en text,
  category text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date;
  v_qid int;
begin
  -- Verify membership
  if not exists (
    select 1 from public.couple_members
    where couple_id = p_couple and profile_id = auth.uid()
  ) and auth.role() != 'service_role' then
    raise exception 'Not authorized for this couple';
  end if;

  v_today := (now() at time zone 'Asia/Ho_Chi_Minh')::date;

  -- Check if already assigned
  select cdq.question_id into v_qid
  from public.couple_daily_questions cdq
  where cdq.couple_id = p_couple and cdq.day = v_today;

  if v_qid is null then
    -- Pick next unused question for this couple, or fallback to least recently used
    select q.id into v_qid
    from public.questions q
    where q.active = true
      and q.id not in (
        select used.question_id
        from public.couple_daily_questions used
        where used.couple_id = p_couple
      )
    order by q.id asc
    limit 1;

    -- If all questions have been used, pick by modulo day-of-year
    if v_qid is null then
      select q.id into v_qid
      from public.questions q
      where q.active = true
      order by ((q.id + extract(doy from v_today)::int) % 1000) asc
      limit 1;
    end if;

    if v_qid is not null then
      insert into public.couple_daily_questions (couple_id, day, question_id)
      values (p_couple, v_today, v_qid)
      on conflict (couple_id, day) do nothing;

      -- Reload in case of concurrent insert
      select cdq.question_id into v_qid
      from public.couple_daily_questions cdq
      where cdq.couple_id = p_couple and cdq.day = v_today;
    end if;
  end if;

  return query
  select v_today as day, q.id as question_id, q.text_vi, q.text_en, q.category
  from public.questions q
  where q.id = v_qid;
end;
$$;

-- 5. RPC get_streak
create or replace function public.get_streak(p_couple uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date;
  v_curr date;
  v_streak int := 0;
  v_req_count int;
  v_today_answered int;
  v_day_answered int;
begin
  -- Total members in couple (usually 2)
  select count(*) into v_req_count
  from public.couple_members
  where couple_id = p_couple;

  if v_req_count = 0 then
    return 0;
  end if;

  v_today := (now() at time zone 'Asia/Ho_Chi_Minh')::date;

  -- Check if today is completed
  select count(distinct profile_id) into v_today_answered
  from public.daily_answers
  where couple_id = p_couple and day = v_today;

  if v_today_answered >= v_req_count then
    -- Both answered today, streak includes today
    v_curr := v_today;
  else
    -- Today is pending or incomplete; check if yesterday was completed
    select count(distinct profile_id) into v_day_answered
    from public.daily_answers
    where couple_id = p_couple and day = (v_today - 1);

    if v_day_answered >= v_req_count then
      v_curr := v_today - 1;
    else
      return 0;
    end if;
  end if;

  -- Count consecutive completed days backwards
  while true loop
    select count(distinct profile_id) into v_day_answered
    from public.daily_answers
    where couple_id = p_couple and day = v_curr;

    if v_day_answered >= v_req_count then
      v_streak := v_streak + 1;
      v_curr := v_curr - 1;
    else
      exit;
    end if;
  end loop;

  return v_streak;
end;
$$;

grant execute on function public.get_or_create_today_question to authenticated, service_role;
grant execute on function public.get_streak to authenticated, service_role;
