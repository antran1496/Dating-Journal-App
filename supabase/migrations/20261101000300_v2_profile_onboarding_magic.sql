-- Migration M3: Profile Onboarding & Magic Link Auth
-- Dating Journal v2

-- 1. auth_login_tokens for passwordless magic link
create table if not exists public.auth_login_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null default now() + interval '15 minutes',
  used_at timestamptz,
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists auth_login_tokens_hash_idx on public.auth_login_tokens(token_hash) where used_at is null;

alter table public.auth_login_tokens enable row level security;
revoke all on public.auth_login_tokens from public, anon, authenticated;

-- 2. Expand auth_login_attempts.kind to allow 'magic'
alter table public.auth_login_attempts drop constraint if exists auth_login_attempts_kind_check;
alter table public.auth_login_attempts add constraint auth_login_attempts_kind_check check (kind in ('login', 'register', 'magic'));

-- 3. Backfill profiles.onboarded_at for existing users that already have birth_date
update public.profiles
set onboarded_at = created_at
where onboarded_at is null and birth_date is not null;
