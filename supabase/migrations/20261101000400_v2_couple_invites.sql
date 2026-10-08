-- Migration M2: Couple Invites & Redeem RPC
-- Dating Journal v2

-- 1. couple_invites table
create table if not exists public.couple_invites (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  token_hash text not null unique,        -- sha256(token)
  code_hash  text not null,               -- sha256(code), tra cứu theo code + active
  code_hint  text not null,               -- 2 ký tự đầu để gợi ý/debug
  message    text check (char_length(message) <= 140),
  expires_at timestamptz not null default now() + interval '48 hours',
  used_at    timestamptz,
  used_by    uuid references public.profiles(id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists couple_invites_code_hash_idx
  on public.couple_invites (code_hash)
  where used_at is null and revoked_at is null;

create index if not exists couple_invites_couple_id_idx
  on public.couple_invites (couple_id);

alter table public.couple_invites enable row level security;

-- Policy: Chỉ member của couple mới được SELECT invite của couple mình
create policy "couple_members_select_invites"
  on public.couple_invites
  for select
  to authenticated
  using (
    couple_id in (
      select cm.couple_id
      from public.couple_members cm
      where cm.profile_id = auth.uid() and cm.left_at is null
    )
  );

-- Thu hồi quyền ghi trực tiếp từ client (chỉ admin / RPC được ghi)
revoke insert, update, delete on public.couple_invites from anon, authenticated;

-- 2. invite_attempts table cho rate limit redeem
create table if not exists public.invite_attempts (
  id bigint generated always as identity primary key,
  profile_id uuid references public.profiles(id) on delete cascade,
  ip text,
  success boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists invite_attempts_user_idx on public.invite_attempts (profile_id, created_at desc);
create index if not exists invite_attempts_ip_idx on public.invite_attempts (ip, created_at desc);

alter table public.invite_attempts enable row level security;
revoke all on public.invite_attempts from public, anon, authenticated;

-- 3. RPC redeem_invite
create or replace function public.redeem_invite(
  p_user uuid,
  p_token_hash text default null,
  p_code_hash text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite record;
  v_couple_member_count int;
  v_existing_couple_id uuid;
begin
  -- 1. Tìm invite khớp token_hash hoặc code_hash
  if p_token_hash is not null then
    select * into v_invite
    from public.couple_invites
    where token_hash = p_token_hash
    for update;
  elsif p_code_hash is not null then
    -- Khi tìm theo code_hash, chỉ tìm các invite đang active
    select * into v_invite
    from public.couple_invites
    where code_hash = p_code_hash
      and used_at is null
      and revoked_at is null
      and expires_at > now()
    order by created_at desc
    limit 1
    for update;
  else
    raise exception 'invite_invalid';
  end if;

  if v_invite.id is null then
    raise exception 'invite_invalid';
  end if;

  if v_invite.used_at is not null or v_invite.revoked_at is not null then
    raise exception 'invite_invalid';
  end if;

  if v_invite.expires_at <= now() then
    raise exception 'invite_expired';
  end if;

  if v_invite.created_by = p_user then
    raise exception 'self_invite';
  end if;

  -- 2. Kiểm tra user chưa thuộc couple nào
  select couple_id into v_existing_couple_id
  from public.couple_members
  where profile_id = p_user and left_at is null
  limit 1;

  if v_existing_couple_id is not null then
    raise exception 'already_in_couple';
  end if;

  -- 3. Khóa chống race condition và kiểm tra số thành viên < 2
  perform pg_advisory_xact_lock(hashtext(v_invite.couple_id::text));

  select count(*) into v_couple_member_count
  from public.couple_members
  where couple_id = v_invite.couple_id and left_at is null;

  if v_couple_member_count >= 2 then
    raise exception 'couple_full';
  end if;

  -- 4. Thêm thành viên vào couple
  insert into public.couple_members (couple_id, profile_id, role)
  values (v_invite.couple_id, p_user, 'member');

  -- 5. Đánh dấu invite đã sử dụng
  update public.couple_invites
  set used_at = now(),
      used_by = p_user
  where id = v_invite.id;

  return v_invite.couple_id;
end;
$$;

-- Cấp quyền gọi RPC cho service role
grant execute on function public.redeem_invite to service_role;
