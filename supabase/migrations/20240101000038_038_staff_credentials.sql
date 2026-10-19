-- 038 — به‌روزرسانی اعتبارنامهٔ کارمندان از پنل RBAC
--
-- مشکل: ویرایش «نام کاربری/رمز عبور» در پنل فقط ظاهر را عوض می‌کرد؛ رکورد
-- staff_accounts و کاربر Supabase Auth دست‌نخورده می‌ماند، پس کارمند با
-- اطلاعات جدید نمی‌توانست وارد شود.
--
-- چون رمز عبور در auth.users (bcrypt) نگه‌داری می‌شود و کلاینت دسترسی
-- service_role ندارد، این عملیات در یک تابع SECURITY DEFINER انجام می‌شود که
-- خودش مجوز «مدیریت نقش‌ها» (perm35) را بررسی می‌کند.
--
-- نکته‌های پیاده‌سازی:
--   • هش با crypt(..., gen_salt('bf')) ساخته می‌شود که همان bcrypt مورد
--     استفادهٔ GoTrue است (سازگاری $2a$).
--   • برای کارمندهایی که بدون ایمیل ساخته شده‌اند، آدرس داخلی
--     `<username>@staff.local` با نام کاربری جدید هم‌گام می‌شود؛ وگرنه ورود با
--     نام کاربری جدید به کاربر Auth موجود نمی‌رسد.
--   • auth.identities هم به‌روزرسانی می‌شود چون GoTrue ایمیل را از آن می‌خواند.

create or replace function admin_update_staff_credentials(
  p_staff_id uuid,
  p_username text default null,
  p_password text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, auth, extensions, pg_catalog
as $$
declare
  v_uid       uuid;
  v_username  text;
  v_email     text;
  v_new_email text;
begin
  if not public.has_permission('perm35') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select auth_uid, username into v_uid, v_username
  from public.staff_accounts where id = p_staff_id;

  if v_uid is null then
    raise exception 'staff account not found';
  end if;

  -- ۱) نام کاربری
  if p_username is not null and length(btrim(p_username)) > 0 then
    v_username := btrim(p_username);

    if exists (
      select 1 from public.staff_accounts
      where username = v_username and id <> p_staff_id
    ) then
      raise exception 'این نام کاربری قبلاً ثبت شده است';
    end if;

    select email into v_email from auth.users where id = v_uid;

    -- فقط آدرس‌های داخلی staff.local را هم‌گام می‌کنیم؛ ایمیل واقعیِ ادمین
    -- نباید با تغییر نام کاربری عوض شود.
    if v_email is not null and v_email like '%@staff.local' then
      v_new_email := lower(v_username) || '@staff.local';

      if exists (select 1 from auth.users where email = v_new_email and id <> v_uid) then
        raise exception 'این نام کاربری قبلاً ثبت شده است';
      end if;

      update auth.users
         set email = v_new_email,
             updated_at = now()
       where id = v_uid;

      update auth.identities
         set identity_data = coalesce(identity_data, '{}'::jsonb) || jsonb_build_object('email', v_new_email),
             provider_id = v_new_email,
             updated_at = now()
       where user_id = v_uid and provider = 'email';
    end if;

    update public.staff_accounts set username = v_username where id = p_staff_id;
  end if;

  -- ۲) رمز عبور
  if p_password is not null and length(p_password) > 0 then
    if length(p_password) < 6 then
      raise exception 'رمز عبور باید حداقل ۶ کاراکتر باشد';
    end if;

    update auth.users
       set encrypted_password = crypt(p_password, gen_salt('bf')),
           updated_at = now()
     where id = v_uid;
  end if;

  return true;
end;
$$;

revoke all on function admin_update_staff_credentials(uuid, text, text) from public;
grant execute on function admin_update_staff_credentials(uuid, text, text) to authenticated, anon;

comment on function admin_update_staff_credentials(uuid, text, text) is
  'به‌روزرسانی نام کاربری/رمز عبور کارمند از پنل RBAC (نیازمند perm35)';
