begin;

-- Sao chép lại phần phát sinh từ lúc chạy 5.1 (lặp lại đúng 2 câu INSERT ở 5.1, giữ "on conflict do nothing")
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

do $$
declare missing int; c text;
begin
  select count(*) into missing from public.profiles p
   where not exists (select 1 from public.auth_users u where u.id = p.id);
  if missing > 0 then
    raise exception 'Cutover dừng: % profile chưa có auth_users', missing;
  end if;

  -- gỡ FK profiles.id -> auth.users, bất kể tên constraint
  select conname into c from pg_constraint
   where conrelid = 'public.profiles'::regclass and contype = 'f'
     and confrelid = 'auth.users'::regclass;
  if c is not null then execute format('alter table public.profiles drop constraint %I', c); end if;
end $$;

alter table public.profiles
  add constraint profiles_id_fkey foreign key (id) references public.auth_users(id) on delete cascade;

-- Tạo profile giờ do code ứng dụng làm; bỏ trigger trên auth.users
drop trigger if exists on_auth_user_created on auth.users;

commit;
