-- 023 — `delete_staff_account`: server-side staff deletion
--
-- ── مسئله ────────────────────────────────────────────────────────────────────
-- حذف یک کارمند از پنل RBAC (`RBAC.tsx` دکمهٔ «حذف») فقط یک `setSystemUsers`
-- محلی انجام می‌داد و هیچ چیزی در سرور حذف نمی‌شد: `staff_accounts` و
-- `auth.users` همچنان وجود داشتند و کارمند می‌توانست با همان ایمیل وارد شود.
--
-- ── راه‌حل ───────────────────────────────────────────────────────────────────
-- یک RPC `security definer` که هم `staff_accounts` و هم `auth.users` مرتبط را
-- پاک می‌کند. فقط کارمندان با دسترسی مدیریت کارمندان (perm15/perm16) می‌توانند
-- این کار را انجام دهند؛ حذف خودِ مدیرِ ورودی ممنوع است.
-- =========================================================================

create or replace function delete_staff_account(p_staff_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff   staff_accounts%rowtype;
  v_allowed boolean;
begin
  select * into v_staff from staff_accounts where id = p_staff_id;
  if not found then
    raise exception 'staff account not found';
  end if;

  -- Never let an admin delete their own active session.
  if v_staff.auth_uid = auth.uid() then
    raise exception 'permission denied: cannot delete your own account';
  end if;

  if auth.role() <> 'service_role' then
    select (has_permission('perm15') or has_permission('perm16')) into v_allowed;
    if not coalesce(v_allowed, false) then
      raise exception 'permission denied: cannot delete staff accounts';
    end if;
  end if;

  -- `staff_accounts` first (FK-safe), then the auth user.
  delete from staff_accounts where id = p_staff_id;

  if v_staff.auth_uid is not null then
    perform supabase_auth.delete_user(v_staff.auth_uid);
  end if;

  return true;
end;
$$;

revoke all on function delete_staff_account(uuid) from public;
grant execute on function delete_staff_account(uuid) to authenticated, service_role;

comment on function delete_staff_account(uuid) is
  'حذف یک کارمند: `staff_accounts` و `auth.users` مرتبط — فقط با دسترسی perm15/perm16 و نه حذف خودِ مدیر ورودی.';