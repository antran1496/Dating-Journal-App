-- ============================================================
-- Bảng định danh thay cho auth.users. Chỉ service role truy cập.
-- ============================================================
create table if not exists public.auth_users (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(email)),
  email_verified_at timestamptz,          -- chỉ set khi được provider (Google) xác thực
  password_hash text,                     -- null với tài khoản chỉ dùng Google
  created_at timestamptz not null default now(),
  last_sign_in_at timestamptz
);
create unique index if not exists auth_users_email_key on public.auth_users (email);

create table if not exists public.auth_accounts (
  provider text not null,
  provider_account_id text not null,
  user_id uuid not null references public.auth_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (provider, provider_account_id)
);
create index if not exists auth_accounts_user_id_idx on public.auth_accounts (user_id);

create table if not exists public.auth_login_attempts (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('login', 'register')),
  email text,
  ip text,
  success boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists auth_attempts_email_idx on public.auth_login_attempts (kind, email, created_at desc);
create index if not exists auth_attempts_ip_idx on public.auth_login_attempts (kind, ip, created_at desc);

-- RLS bật, KHÔNG có policy nào = anon/authenticated không đọc/ghi được. Service role bỏ qua RLS.
alter table public.auth_users enable row level security;
alter table public.auth_accounts enable row level security;
alter table public.auth_login_attempts enable row level security;
revoke all on public.auth_users, public.auth_accounts, public.auth_login_attempts from anon, authenticated;

-- ============================================================
-- Sao chép user hiện có (idempotent; giữ nguyên id)
-- email_verified_at: chỉ coi là đã xác thực nếu user có danh tính Google.
-- (Supabase tự confirm khi enable_confirmations=false nên email_confirmed_at KHÔNG chứng minh gì.
--  Điều này chặn kiểu tấn công đăng ký trước bằng email của nạn nhân rồi chờ họ đăng nhập Google.)
-- ============================================================
insert into public.auth_users (id, email, email_verified_at, password_hash, created_at, last_sign_in_at)
select
  u.id,
  lower(u.email),
  case when exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'google')
       then coalesce(u.email_confirmed_at, u.created_at) else null end,
  nullif(u.encrypted_password, ''),
  u.created_at,
  u.last_sign_in_at
from auth.users u
where u.deleted_at is null and u.email is not null
on conflict (id) do nothing;

insert into public.auth_accounts (provider, provider_account_id, user_id)
select 'google', coalesce(i.identity_data->>'sub', i.provider_id), i.user_id
from auth.identities i
join public.auth_users au on au.id = i.user_id
where i.provider = 'google' and coalesce(i.identity_data->>'sub', i.provider_id) is not null
on conflict do nothing;
