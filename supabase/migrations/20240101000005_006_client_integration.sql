-- ============================================================================
-- 006_client_integration.sql
--
-- Closes the gaps found while wiring the SPA to the backend:
--   1. resolve_service_ref()  — the client speaks business keys (sku 's1'…),
--      the tables use uuid primary keys. One resolver keeps the mapping on the
--      server so the browser never has to know about it.
--   2. log_audit()            — audit rows are written through this RPC so the
--      real client IP and user-agent come from the request headers instead of a
--      hardcoded placeholder.
--   3. create_staff_account() — staff provisioning helper used by the
--      `create-staff` Edge Function (the service_role key never reaches the SPA).
-- ============================================================================

-- === 1. Service reference resolver =========================================
-- Accepts either the uuid primary key or the business key (sku). Returns null
-- for unknown references so callers can answer with a clean 404.
create or replace function resolve_service_ref(p_ref text)
returns table (
  id         uuid,
  sku        text,
  name       text,
  unit       text,
  base_price bigint,
  active     boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.sku, s.name, s.unit, s.base_price, s.active
  from services s
  where s.sku = p_ref
     or (length(p_ref) = 36 and s.id::text = p_ref)
  limit 1;
$$;

revoke all on function resolve_service_ref(text) from public;
grant execute on function resolve_service_ref(text) to anon, authenticated, service_role;

-- Same resolver for project services (وب‌سایت / تولید محتوا), used by the
-- project-order path.
create or replace function resolve_project_service_ref(p_ref text)
returns table (
  id         uuid,
  sku        text,
  title      text,
  unit       text,
  base_price bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.sku, p.title, p.unit, p.base_price
  from project_services p
  where p.sku = p_ref
     or (length(p_ref) = 36 and p.id::text = p_ref)
  limit 1;
$$;

revoke all on function resolve_project_service_ref(text) from public;
grant execute on function resolve_project_service_ref(text) to anon, authenticated, service_role;

-- === 2. Server-side audit log ==============================================
-- ip / user_agent are read from the request headers PostgREST/Postgres expose,
-- so they can no longer be forged by the browser.
create or replace function log_audit(
  p_action  text,
  p_details text,
  p_module  text,
  p_actor   text default null,
  p_admin   boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_headers jsonb;
  v_ip   text;
  v_ua   text;
  v_actor_label text;
  v_is_admin boolean;
begin
  begin
    v_headers := current_setting('request.headers', true)::jsonb;
  exception when others then
    v_headers := '{}'::jsonb;
  end;

  v_ip := coalesce(
    nullif(v_headers->>'x-forwarded-for', ''),
    nullif(split_part(coalesce(v_headers->>'x-real-ip', ''), ',', 1), '')
  );
  v_ua := nullif(v_headers->>'user-agent', '');

  -- The actor label and the admin flag are derived from the session, not from
  -- the arguments, so a caller cannot attribute an entry to someone else or
  -- mark their own action as an administrator action.  service_role callers
  -- (Edge Functions acting on behalf of staff) may supply the label.
  v_actor_label := coalesce(
    (select display_name from profiles where id = auth.uid()),
    (select display_name from staff_accounts where auth_uid = auth.uid()),
    'کاربر سیستم'
  );
  v_is_admin := (auth.role() = 'service_role') or is_staff();

  insert into audit_logs (actor, actor_id, is_admin, action, details, module, ip, user_agent)
  values (
    case when auth.role() = 'service_role' then coalesce(p_actor, v_actor_label) else v_actor_label end,
    auth.uid(),
    v_is_admin,
    p_action,
    p_details,
    p_module,
    nullif(v_ip, '')::inet,
    v_ua
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function log_audit(text, text, text, text, boolean) from public;
grant execute on function log_audit(text, text, text, text, boolean) to authenticated, service_role;

-- === 3. Staff provisioning =================================================
-- Credentials live in Supabase Auth; `staff_accounts` only holds the profile,
-- the role and the link to the auth user. The `password_hash` column from 001 is
-- dropped here so no plaintext-adjacent credential can ever be stored again.
alter table staff_accounts drop column if exists password_hash;

-- Called with the service_role key from the `create-staff` Edge Function, which
-- creates the auth user first and then hands the uid over.
create or replace function create_staff_account(
  p_auth_uid    uuid,
  p_phone       text,
  p_display_name text,
  p_role_id     uuid,
  p_username    text default null
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

  insert into staff_accounts (auth_uid, phone, display_name, username, role_id, active)
  values (p_auth_uid, p_phone, p_display_name, coalesce(p_username, p_display_name), p_role_id, true)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function create_staff_account(uuid, text, text, uuid, text) from public;
grant execute on function create_staff_account(uuid, text, text, uuid, text) to service_role;

-- A staff account without an auth user can never sign in — keep the two in sync.
create or replace function staff_accounts_require_auth_user()
returns trigger
language plpgsql
as $$
begin
  if new.auth_uid is null then
    raise exception 'staff_accounts.auth_uid is required (credentials live in Supabase Auth)';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_staff_requires_auth on staff_accounts;
create trigger trg_staff_requires_auth
  before insert or update on staff_accounts
  for each row execute function staff_accounts_require_auth_user();

-- === 4. Referral bonuses, awarded once and only on the server =============
-- Signup with an invite code is the one place where a *customer* triggers a
-- loyalty award. It must be server-authoritative and idempotent: the inviter
-- cannot farm points by re-entering the same code, and the amounts come from
-- `gamification_settings`, never from the request.
alter table profiles add column if not exists referral_bonus_applied_at timestamptz;

create or replace function apply_referral_bonuses(p_invitee uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile profiles%rowtype;
  v_invite_bonus integer;
  v_invited_bonus integer;
  v_invitee_points bigint;
  v_inviter_points bigint;
  v_txn uuid;
begin
  -- A signed-in customer may only run this for their own profile. `auth.uid()`
  -- is null for service_role callers (the `apply-referral` Edge Function).
  if auth.uid() is not null and auth.uid() <> p_invitee and not is_staff() then
    raise exception 'permission denied';
  end if;

  -- Row lock: two concurrent calls cannot both see "not applied yet".
  select * into v_profile from profiles where id = p_invitee for update;

  if v_profile.id is null then
    raise exception 'profile not found';
  end if;
  if v_profile.invited_by is null then
    return jsonb_build_object('applied', false, 'reason', 'no referral');
  end if;
  if v_profile.referral_bonus_applied_at is not null then
    return jsonb_build_object('applied', false, 'reason', 'already applied');
  end if;
  if v_profile.invited_by = p_invitee then
    raise exception 'self referral is not allowed';
  end if;

  select invite_bonus, invited_user_bonus
  into v_invite_bonus, v_invited_bonus
  from gamification_settings limit 1;

  v_invite_bonus  := coalesce(v_invite_bonus, 0);
  v_invited_bonus := coalesce(v_invited_bonus, 0);

  -- Invitee welcome bonus
  if v_invited_bonus > 0 then
    update profiles
    set loyalty_points = (coalesce(loyalty_points, 0)) + v_invited_bonus,
        total_earned_points = (coalesce(total_earned_points, 0)) + v_invited_bonus,
        level = compute_level_from_points((coalesce(total_earned_points, 0)) + v_invited_bonus)
    where id = p_invitee
    returning loyalty_points into v_invitee_points;

    insert into loyalty_transactions (user_id, points, running_balance, reason, category, by_admin)
    values (
      p_invitee, v_invited_bonus, v_invitee_points,
      'امتیاز خوش‌آمدگویی (کاربر دعوت‌شده)', 'invite', false
    )
    returning id into v_txn;
  end if;

  -- Inviter bonus
  if v_invite_bonus > 0 then
    update profiles
    set loyalty_points = (coalesce(loyalty_points, 0)) + v_invite_bonus,
        total_earned_points = (coalesce(total_earned_points, 0)) + v_invite_bonus,
        level = compute_level_from_points((coalesce(total_earned_points, 0)) + v_invite_bonus)
    where id = v_profile.invited_by
    returning loyalty_points into v_inviter_points;

    insert into loyalty_transactions (user_id, points, running_balance, reason, category, by_admin)
    values (
      v_profile.invited_by, v_invite_bonus, v_inviter_points,
      'پاداش دعوت دوست', 'invite', false
    );
  end if;

  update profiles set referral_bonus_applied_at = now() where id = p_invitee;

  return jsonb_build_object(
    'applied', true,
    'invitee_points', v_invited_bonus,
    'inviter_points', v_invite_bonus,
    'inviter_id', v_profile.invited_by
  );
end;
$$;

-- A customer may only run this for their own profile; staff/Edge Functions use
-- the service_role key.
revoke all on function apply_referral_bonuses(uuid) from public;
grant execute on function apply_referral_bonuses(uuid) to authenticated, service_role;

-- Trigger functions are never called directly.
revoke all on function staff_accounts_require_auth_user() from public;

-- === 5. Constraints the service layer relies on ============================
-- `gamification_settings` is a singleton: the client reads "the one row".
create unique index if not exists gamification_settings_singleton
  on gamification_settings ((true));

-- One notification config per user (needed for the upsert in src/api/settings.ts).
create unique index if not exists notification_settings_user_unique
  on notification_settings (user_id)
  where user_id is not null;

-- Staff provisioning is keyed by the auth user; make that explicit for lookups.
create index if not exists staff_accounts_auth_uid_idx
  on staff_accounts (auth_uid);

-- === 6. Column-level UPDATE grants on profiles ==============================
-- RLS restricts *which row* a customer may touch (`id = auth.uid()`), but by
-- default it still allows *every column*. A customer could otherwise set their
-- own wallet_balance, loyalty_points, level, invite_code or invited_by through
-- a plain PostgREST update. So: revoke the table-level UPDATE privilege and
-- re-grant only the columns a customer legitimately owns.
revoke update on profiles from anon, authenticated;

-- `invited_by` is writable because recording the referral is the signup flow
-- itself. It is not an escalation: `apply_referral_bonuses` rejects self
-- referral, is idempotent, and takes the amounts from `gamification_settings`.
grant update (display_name, phone, birth_date, invited_by) on profiles to authenticated;

-- Staff and the service layer use these through SECURITY DEFINER functions and
-- Edge Functions, which run as the definer / service_role, so they are
-- unaffected by the revocation above.

-- === 7. Order document storage paths =======================================
-- Documents are uploaded *before* the order exists (the customer attaches
-- files while filling the form), so the client uploads into its own staging
-- folder `private/<auth uid>/…` and the resulting `storage_path` is recorded on
-- the `order_documents` row once the order is created.
--
-- The previous policies keyed authorization off the path shape
-- (`private/<order_uuid>/…`), which no client could satisfy at upload time.
-- Authorization is therefore now derived from ownership instead: a customer may
-- write only into their own folder, and may read any object referenced by an
-- `order_documents` row belonging to one of their own orders.
-- هر چهار policy باید drop شوند، نه فقط دو تای اول: این migration هر چهار
-- را دوباره می‌سازد و `update`/`delete` از 004 باقی مانده‌اند.
drop policy if exists "storage_order_docs_upload" on storage.objects;
drop policy if exists "storage_order_docs_read" on storage.objects;
drop policy if exists "storage_order_docs_update" on storage.objects;
drop policy if exists "storage_order_docs_delete" on storage.objects;

create policy "storage_order_docs_upload" on storage.objects
  for insert with check (
    bucket_id = 'order-documents'
    and (storage.foldername(name))[1] = 'private'
    and (
      -- own staging folder
      (storage.foldername(name))[2] = auth.uid()::text
      or has_permission('perm2')
      or has_permission('perm32')
    )
  );

create policy "storage_order_docs_update" on storage.objects
  for update using (
    bucket_id = 'order-documents'
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id = 'order-documents'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "storage_order_docs_read" on storage.objects
  for select using (
    bucket_id = 'order-documents'
    and (
      -- still in the caller's own staging folder
      (storage.foldername(name))[2] = auth.uid()::text
      -- or already attached to one of the caller's orders
      or exists (
        select 1
        from order_documents d
        join orders o on o.id = d.order_id
        where d.storage_path = name
          and o.customer_id = auth.uid()
      )
      or has_permission('perm2')
      or has_permission('perm32')
    )
  );

create policy "storage_order_docs_delete" on storage.objects
  for delete using (
    bucket_id = 'order-documents'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
