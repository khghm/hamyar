-- ============================================================================
-- 037_wallet_topup_credit.sql
--
-- شارژ کیف پول پس از پرداخت موفق درگاه.
--
-- چرا تابع جدید؟ تابع `deposit_wallet` در مهاجرت 005 به هر کاربر اجازه می‌داد
-- موجودی کیف پول *خودش* را افزایش دهد (auth.uid() = p_user_id) — یعنی هر کاربر
-- وارد‌شده می‌توانست بی‌آنکه پولی بپردازد، برای خودش پول بسازد. به همین دلیل
-- این تابع در دیتابیس زنده وجود ندارد و نباید دوباره ساخته شود.
--
-- این نسخه فقط برای service_role است و صرفاً Worker (پس از verify موفق زرین‌پال)
-- آن را صدا می‌زند. تنها نویسندهٔ `profiles.wallet_balance` همان تریگر
-- `wallet_txn_trigger` است.
-- ============================================================================

create or replace function credit_wallet_payment(
  p_user_id uuid,
  p_amount  bigint,
  p_reason  text default 'شارژ کیف پول از درگاه'
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_after bigint;
begin
  if auth.role() <> 'service_role' then
    raise exception 'permission denied: wallet credit is service-role only' using errcode = '42501';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid credit amount: %', p_amount;
  end if;

  if not exists (select 1 from profiles where id = p_user_id) then
    raise exception 'profile not found for user %', p_user_id;
  end if;

  insert into wallet_transactions (user_id, amount, type, reference)
  values (p_user_id, p_amount, 'deposit', coalesce(nullif(p_reason, ''), 'شارژ کیف پول از درگاه'))
  returning balance_after into v_after;

  return v_after;
end;
$$;

revoke all on function credit_wallet_payment(uuid, bigint, text) from public;
revoke execute on function credit_wallet_payment(uuid, bigint, text) from anon, authenticated;
grant execute on function credit_wallet_payment(uuid, bigint, text) to service_role;
