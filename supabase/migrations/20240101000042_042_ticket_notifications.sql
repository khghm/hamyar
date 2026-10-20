-- 042 — اعلان تیکت پشتیبانی برای ادمین‌ها و مشتری
--
-- مشکل: وقتی مشتری تیکت می‌زد هیچ اعلانی برای ادمین‌ها ساخته نمی‌شد (و برعکس،
-- پاسخ پشتیبانی هم به مشتری اطلاع داده نمی‌شد). اعلان سفارش‌ها در توابع
-- `place_order`/`place_catalog_order` ساخته می‌شود، اما تیکت‌ها هیچ مسیری
-- نداشتند.
--
-- راه‌حل: دو تریگر SECURITY DEFINER روی `tickets` و `ticket_messages` که برای
-- هر کارمند فعال یک ردیف اعلان (مثل الگوی سفارش‌ها) و برای مشتری هم یک اعلان
-- تأیید/پاسخ می‌سازد. وجود تریگر یعنی حتی اگر کلاینت بسته شود، اعلان ثبت است.
--
-- نکته: ایندکس یکتای `dedupe_key` فقط برای ردیف‌های سراسری (user_id IS NULL)
-- است؛ برای اعلان‌های هر کاربر از `where not exists` استفاده می‌کنیم تا تکرار
-- نشوند.

-- ---------------------------------------------------------------------------
-- ۱) تیکت جدید
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_ticket()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_code text := coalesce(nullif(new.sku, ''), left(new.id::text, 8));
  v_customer text := coalesce(nullif(btrim(coalesce(new.customer_name, '')), ''), 'مشتری');
  v_priority text := case when new.priority in ('high', 'urgent') then 'high' else 'normal' end;
begin
  insert into public.notifications (user_id, type, title, message, link, priority, dedupe_key)
  select sa.auth_uid,
         'ticket',
         'تیکت جدید',
         'تیکت «' || coalesce(new.title, '') || '» از ' || v_customer || ' — کد ' || v_code,
         '/admin/tickets',
         v_priority,
         'ticket-staff-' || sa.auth_uid || '-' || new.id
  from public.staff_accounts sa
  where sa.active
    and not exists (
      select 1 from public.notifications n
      where n.dedupe_key = 'ticket-staff-' || sa.auth_uid || '-' || new.id
    );

  if new.customer_id is not null then
    insert into public.notifications (user_id, type, title, message, link, priority, dedupe_key)
    select new.customer_id,
           'ticket',
           'تیکت شما ثبت شد',
           'تیکت «' || coalesce(new.title, '') || '» با کد ' || v_code || ' ثبت شد؛ پاسخ تیم پشتیبانی در همین بخش اطلاع داده می‌شود.',
           '/tickets',
           'normal',
           'ticket-customer-' || new.id
    where not exists (
      select 1 from public.notifications n
      where n.dedupe_key = 'ticket-customer-' || new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_new_ticket on public.tickets;
create trigger trg_notify_new_ticket
after insert on public.tickets
for each row execute function public.notify_new_ticket();

-- ---------------------------------------------------------------------------
-- ۲) پیام جدید در تیکت (پاسخ مشتری → اعلان برای ادمین‌ها، پاسخ پشتیبانی →
--    اعلان برای مشتری)
-- ---------------------------------------------------------------------------
create or replace function public.notify_ticket_message()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ticket public.tickets%rowtype;
  v_code text;
begin
  select * into v_ticket from public.tickets where id = new.ticket_id;
  if not found then
    return new;
  end if;
  v_code := coalesce(nullif(v_ticket.sku, ''), left(v_ticket.id::text, 8));

  if new.sender = 'customer' then
    insert into public.notifications (user_id, type, title, message, link, priority, dedupe_key)
    select sa.auth_uid,
           'ticket',
           'پاسخ جدید در تیکت',
           'مشتری در تیکت «' || coalesce(v_ticket.title, '') || '» (کد ' || v_code || ') پیام جدیدی فرستاد.',
           '/admin/tickets',
           'high',
           'ticket-reply-staff-' || sa.auth_uid || '-' || new.id
    from public.staff_accounts sa
    where sa.active
      and not exists (
        select 1 from public.notifications n
        where n.dedupe_key = 'ticket-reply-staff-' || sa.auth_uid || '-' || new.id
      );
  else
    if v_ticket.customer_id is not null then
      insert into public.notifications (user_id, type, title, message, link, priority, dedupe_key)
      select v_ticket.customer_id,
             'ticket',
             'پاسخ پشتیبانی',
             'تیم پشتیبانی به تیکت «' || coalesce(v_ticket.title, '') || '» (کد ' || v_code || ') پاسخ داد.',
             '/tickets',
             'high',
             'ticket-reply-customer-' || new.id
      where not exists (
        select 1 from public.notifications n
        where n.dedupe_key = 'ticket-reply-customer-' || new.id
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_ticket_message on public.ticket_messages;
create trigger trg_notify_ticket_message
after insert on public.ticket_messages
for each row execute function public.notify_ticket_message();
