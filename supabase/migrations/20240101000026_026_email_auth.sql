-- ============================================================================
-- 026_email_auth.sql
--
-- Phase 2 — Email-Auth Migration & Full Supabase Integration
--
-- Problem
-- -------
-- Customers authenticate with phone + localStorage. The `profiles.phone`
-- column has a `unique` CHECK constraint (`^09[0-9]{9}$`) which makes email
-- the only viable primary identifier for Supabase Auth (email+password).
-- Staff accounts authenticate via username+password but need email too so
-- they can also sign in through Supabase Auth.
--
-- This migration:
--   1. Adds `email` to `profiles` (unique) for customer email/password auth
--   2. Makes `profiles.phone` nullable (phone is now profile data, not identity)
--   3. Updates `public_handle_new_user()` to populate `email` from auth.users
--   4. Updates `ensure_own_profile()` to populate `email` from the JWT
--   5. Adds `email` to `create_staff_account()` so staff can use email auth
-- ============================================================================

-- ── 1. Email column on profiles ────────────────────────────────────────────────
-- Email is the auth key (unique per auth.users), so it must be unique here too.
-- `text` not `varchar` — matches the rest of the schema convention.
alter table profiles add column if not exists email text unique;

comment on column profiles.email is
  'Email address used as the Supabase Auth identity key. Unique because it maps 1:1 to auth.users.email.';

-- ── 2. Make phone nullable ─────────────────────────────────────────────────────
-- Phone was previously required on every customer row because Auth.tsx
-- collected it at login time. With email authentication, phone becomes optional
-- profile data (collected later in the customer club / checkout).
alter table profiles drop constraint if exists profiles_phone_check cascade;
alter table profiles drop constraint if exists profiles_phone_key cascade;

alter table profiles alter column phone drop not null;

-- Re-add the format CHECK but allow NULL (NULL passes CHECK).
alter table profiles add constraint profiles_phone_check
  check (phone is null or phone ~ '^09[0-9]{9}$');

-- ── 3. Update public_handle_new_user to populate email ────────────────────────
create or replace function public.public_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- فقط مشتری؛ کارمندها با RPC/Edge Function خودشان ساخته می‌شوند.
  if not exists (select 1 from staff_accounts sa where sa.auth_uid = new.id) then
    insert into profiles (id, phone, email, display_name, invite_code)
    values (
      new.id,
      case
        when new.raw_user_meta_data ->> 'phone' ~ '^09[0-9]{9}$'
          then new.raw_user_meta_data ->> 'phone'
        else null
      end,
      lower(nullif(trim(coalesce(new.email, '')), '')),
      nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), ''),
      public.generate_invite_code()
    )
    on conflict (id) do update
      set email    = excluded.email,
          phone    = coalesce(profiles.phone, excluded.phone),
          display_name = coalesce(profiles.display_name, excluded.display_name),
          invite_code   = coalesce(profiles.invite_code, excluded.invite_code);
  end if;
  return new;
end;
$$;

-- ── 4. Update ensure_own_profile to populate email ────────────────────────────
create or replace function public.ensure_own_profile(p_display_name text default null)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_row    public.profiles;
  v_name   text;
  v_email  text;
begin
  if v_uid is null then
    raise exception 'ensure_own_profile requires an authenticated user'
      using errcode = '42501';
  end if;

  v_name  := nullif(trim(coalesce(p_display_name, '')), '');
  v_email := lower(nullif(trim(coalesce(auth.jwt() ->> 'email', '')), ''));

  -- اگر سطر هست، فقط فیلدهای خالیِ خودِ کاربر را پر کن.
  update public.profiles p
     set display_name = coalesce(p.display_name, v_name),
         email        = coalesce(p.email, v_email),
         invite_code   = coalesce(p.invite_code, public.generate_invite_code()),
         phone         = coalesce(p.phone, (auth.jwt() ->> 'phone'))
   where p.id = v_uid
  returning * into v_row;

  -- سطر نبود ⇒ همین تابع ساختش می‌دهد (به‌جای درج مستقیم از کلاینت).
  if v_row.id is null then
    insert into public.profiles (id, phone, email, display_name, invite_code)
    values (
      v_uid,
      case
        when auth.jwt() ->> 'phone' ~ '^09[0-9]{9}$' then auth.jwt() ->> 'phone'
        else null
      end,
      v_email,
      v_name,
      public.generate_invite_code()
    )
    on conflict (id) do update
      set display_name   = coalesce(public.profiles.display_name, excluded.display_name),
          email          = coalesce(public.profiles.email, excluded.email),
          invite_code     = coalesce(public.profiles.invite_code, excluded.invite_code)
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

-- ── 5. Add email to create_staff_account() ────────────────────────────────────
-- First, add the email column to staff_accounts (staff authenticate via email+password too)
alter table staff_accounts add column if not exists email text unique;
comment on column staff_accounts.email is
  'Email used as the Supabase Auth identity key for staff accounts. Unique because it maps 1:1 to auth.users.email.';

create or replace function create_staff_account(
  p_auth_uid    uuid,
  p_phone       text,
  p_display_name text,
  p_role_id     uuid,
  p_username    text default null,
  p_email       text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_auth_uid is null then
    raise exception 'auth_uid is required';
  end if;
  if p_phone !~ '^09[0-9]{9}$' then
    raise exception 'invalid phone format';
  end if;
  if not exists (select 1 from roles where id = p_role_id) then
    raise exception 'role not found';
  end if;
  if exists (select 1 from staff_accounts where phone = p_phone) then
    raise exception 'a staff account already exists for this phone';
  end if;

  insert into staff_accounts (auth_uid, phone, display_name, username, email, role_id, active)
  values (
    p_auth_uid, p_phone, p_display_name,
    coalesce(p_username, p_display_name),
    lower(nullif(trim(coalesce(p_email, '')), '')),
    p_role_id, true
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function create_staff_account(uuid, text, text, uuid, text, text) from public;
grant execute on function create_staff_account(uuid, text, text, uuid, text, text) to service_role;

-- ── 6. Migration data: backfill email for existing profiles ───────────────────
-- For any profile created before email auth, try to derive email from
-- auth.users so the identity column is populated. This is best-effort only.
update public.profiles p
   set email = (select u.email from auth.users u where u.id = p.id and u.email is not null)
 where p.email is null;

-- ── 7. Grant SELECT on email to authenticated (staff/admin pages) ─────────────
-- Staff already read the whole row through the existing RLS `select` policies
-- on `profiles`; the new column is automatically visible there.
comment on function create_staff_account(uuid, text, text, uuid, text, text) is
  'Staff provisioning with optional email. Called from the create-staff Edge Function (service_role only). The auth.user must already exist in auth.users with the given email.';


