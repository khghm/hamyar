-- 041 — ویرایش امن پروفایل توسط خودِ مشتری
--
-- مشکل: نقش `authenticated` روی جدول `profiles` مجوز UPDATE ندارد (فقط
-- SELECT/INSERT/DELETE). برای همین ویرایش نام و ذخیرهٔ آواتار از سمت کلاینت
-- به ۴۰۳ می‌خورد و «نمایشی» می‌ماند.
--
-- راه‌حل: یک تابع SECURITY DEFINER که فقط ردیف خودِ کاربر (`auth.uid()`) را
-- و فقط ستون‌های مجاز (نام، آواتار، شماره، تاریخ تولد) به‌روزرسانی می‌کند.
-- این از دادن مجوز UPDATE کلی به جدول امن‌تر است.

create or replace function public.update_my_profile(
  p_display_name text default null,
  p_avatar_url   text default null,
  p_phone        text default null,
  p_birth_date   date default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid  uuid := auth.uid();
  v_row  public.profiles;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  update public.profiles
     set display_name = case
           when p_display_name is null then display_name
           when length(btrim(p_display_name)) < 2 then display_name
           else btrim(p_display_name)
         end,
         avatar_url = coalesce(p_avatar_url, avatar_url),
         phone = coalesce(nullif(btrim(coalesce(p_phone, '')), ''), phone),
         birth_date = coalesce(p_birth_date, birth_date),
         updated_at = now()
   where id = v_uid
   returning * into v_row;

  if v_row.id is null then
    raise exception 'profile not found';
  end if;

  return v_row;
end;
$$;

revoke all on function public.update_my_profile(text, text, text, date) from public;
grant execute on function public.update_my_profile(text, text, text, date) to authenticated;

comment on function public.update_my_profile(text, text, text, date) is
  'ویرایش نام/آواتار/شماره/تاریخ تولد توسط خودِ مشتری (بدون نیاز به مجوز UPDATE جدول)';
