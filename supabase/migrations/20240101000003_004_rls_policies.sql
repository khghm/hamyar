-- ---------------------------------------------------------------------------
-- 004_rls_policies.sql — Row Level Security, has_permission(), triggers
--
-- Roles:
--   anon      — guest: read-only on public catalog (active only)
--   customer  — authenticated + has a profiles row: own data only
--   staff     — authenticated + has a staff_accounts row: gated by has_permission
--   service_role — Edge Functions / admin: bypasses all RLS
-- ---------------------------------------------------------------------------

-- === has_permission() — SECURITY DEFINER, STABLE ==========================
-- Reads the permission list from the staff member's role.  Returns true when
-- auth.uid() maps to an active staff account whose role grants permission `p`.
create or replace function has_permission(p text)
returns boolean
language plpgsql
stable
security definer
as $$
begin
  return exists (
    select 1
    from staff_accounts sa
    join roles r on r.id = sa.role_id
    where sa.auth_uid = auth.uid()
      and sa.active
      and r.permissions @> array[p]
  );
end;
$$;

-- Helper: is the current authenticated user a staff member?
create or replace function is_staff()
returns boolean
language plpgsql
stable
security definer
as $$
begin
  return exists (
    select 1 from staff_accounts sa where sa.auth_uid = auth.uid() and sa.active
  );
end;
$$;

-- === Auto-create profile on signup ========================================
-- New auth.users rows that are NOT staff get a profiles row automatically.
-- Staff rows are created explicitly via the create-staff RPC/Edge Function.
create or replace function public_handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Only create a profile for customer sign-ups (staff are handled separately)
  if not exists (select 1 from staff_accounts sa where sa.auth_uid = new.id) then
    -- ستون در auth.users اسمش `raw_user_meta_data` است. شماره فقط وقتی
    -- نوشته می‌شود که با قالب مجاز ستون phone بخواند، وگرنه NULL می‌ماند تا
    -- CHECK constraint ثبت‌نام را با شکست مواجه نکند.
    insert into profiles (id, phone)
    values (
      new.id,
      case
        when new.raw_user_meta_data ->> 'phone' ~ '^09[0-9]{9}$'
          then new.raw_user_meta_data ->> 'phone'
        else null
      end
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public_handle_new_user();

-- === ENABLE ROW LEVEL SECURITY on every table =============================
-- Tables were created in migrations 001-003; no-op marker was removed.
alter table profiles enable row level security;
alter table staff_accounts enable row level security;
alter table roles enable row level security;
alter table permissions enable row level security;
alter table audit_logs enable row level security;

-- Catalog (no RLS needed — all reads via anon; writes via staff)
alter table products enable row level security;
alter table media_items enable row level security;
alter table services enable row level security;
alter table project_services enable row level security;
alter table portfolio enable row level security;
alter table news enable row level security;
alter table faqs enable row level security;
alter table about_content enable row level security;
alter table site_settings enable row level security;

-- Orders & Finance
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_status_history enable row level security;
alter table order_documents enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table expenses enable row level security;
alter table suppliers enable row level security;
alter table employees enable row level security;

-- Loyalty & Content
alter table loyalty_transactions enable row level security;
alter table gamification_settings enable row level security;
alter table content_projects enable row level security;
alter table content_comments enable row level security;
alter table content_assets enable row level security;
alter table content_templates enable row level security;
alter table content_ideas enable row level security;
alter table brand_book enable row level security;
alter table campaigns enable row level security;
alter table sms_logs enable row level security;
alter table reviews enable row level security;
alter table affiliates enable row level security;
alter table affiliate_orders enable row level security;
alter table affiliate_transactions enable row level security;
alter table personas enable row level security;
alter table digital_marketing enable row level security;
alter table okrs enable row level security;
alter table key_results enable row level security;
alter table kpis enable row level security;
alter table notes enable row level security;
alter table tickets enable row level security;
alter table projects enable row level security;
alter table training_sites enable row level security;
alter table notifications enable row level security;
alter table notification_settings enable row level security;

-- =========================================================================
-- 1. PUBLIC (anon) — read-only catalog, active only
-- =========================================================================

-- --- products ---
create policy "anon_read_products" on products
  for select using (true);

-- --- media_items ---
create policy "anon_read_media" on media_items
  for select using (true);

-- --- services ---
create policy "anon_read_services" on services
  for select using (active = true);

-- --- project_services ---
create policy "anon_read_project_services" on project_services
  for select using (true);

-- --- portfolio ---
create policy "anon_read_portfolio" on portfolio
  for select using (active = true);

-- --- news ---
create policy "anon_read_news" on news
  for select using (active = true);

-- --- faqs ---
create policy "anon_read_faqs" on faqs
  for select using (true);

-- --- about_content ---
create policy "anon_read_about" on about_content
  for select using (true);

-- --- training_sites ---
create policy "anon_read_training" on training_sites
  for select using (active = true);

-- =========================================================================
-- 2. CUSTOMER — authenticated users with a profiles row
-- =========================================================================

-- --- profiles: customers can read & update their own profile ---
create policy "customer_select_own_profile"
  on profiles for select using (id = auth.uid());
create policy "customer_update_own_profile"
  on profiles for update using (id = auth.uid())
  with check (id = auth.uid());

-- --- orders: customers can read their own orders and cancel them ---
--
-- Deliberately NOT `for update`/`for insert`: the client never writes an order
-- row. Pricing, `total`, `paid` and `status` are all server-authoritative —
-- created by `place_order` and advanced only by `change_order_status`, which
-- carries the permission check, the audit entry, the delivery receipt and the
-- stock deduction. A row-level UPDATE policy here would let a customer raise
-- `paid` to `total` or set `status = 'delivered'` directly, skipping all of it.
-- The cancellation guard below is the single customer-writable transition.
create policy "customer_select_own_orders"
  on orders for select using (customer_id = auth.uid());

create policy "customer_cancel_own_order"
  on orders for update using (customer_id = auth.uid() and status <> 'cancelled')
  with check (customer_id = auth.uid() and status = 'cancelled');

-- --- order_items: via orders FK ---
--
-- Read-only for customers. `orders_enforce_authority` recomputes `orders.total`
-- as `sum(price * quantity)` over these rows, so write access here would make
-- the server-authoritative total derive from client-controlled data — a customer
-- could zero out their order's price. Line items are written by `place_order`.
create policy "customer_select_own_order_items"
  on order_items for select using (
    exists (select 1 from orders o where o.id = order_items.order_id and o.customer_id = auth.uid())
  );

-- --- order_status_history ---
create policy "customer_own_order_history"
  on order_status_history for select using (
    exists (select 1 from orders o where o.id = order_status_history.order_id and o.customer_id = auth.uid())
  );

-- --- order_documents: private storage paths, customer sees own orders' docs ---
create policy "customer_own_order_documents"
  on order_documents for all using (
    exists (select 1 from orders o where o.id = order_documents.order_id and o.customer_id = auth.uid())
  );

-- --- invoices: linked to own orders ---
create policy "customer_own_invoices"
  on invoices for all using (
    (order_id is not null and exists (
      select 1 from orders o where o.id = invoices.order_id and o.customer_id = auth.uid()
    ))
    or customer_phone = (select phone from profiles where id = auth.uid())
  );

-- --- invoices_items ---
create policy "customer_own_invoice_items"
  on invoice_items for all using (
    exists (select 1 from invoices i where i.id = invoice_items.invoice_id
            and i.order_id is not null
            and exists (select 1 from orders o where o.id = i.order_id and o.customer_id = auth.uid()))
  );

-- --- loyalty_transactions: own only, append-only (no update/delete) ---
create policy "customer_own_loyalty"
  on loyalty_transactions for select using (user_id = auth.uid());

-- --- reviews ---
create policy "customer_insert_own_review"
  on reviews for insert with check (true);
create policy "customer_select_reviews"
  on reviews for select using (approved = true or product_id is null);

-- --- tickets: own only ---
create policy "customer_own_tickets"
  on tickets for all using (
    customer_id = auth.uid()
    or customer_id is null  -- public support ticket
  );

-- --- notifications: own only ---
create policy "customer_own_notifications"
  on notifications for all using (user_id = auth.uid() or user_id is null);

-- --- notification_settings ---
create policy "customer_own_notification_settings"
  on notification_settings for all using (user_id = auth.uid());

-- =========================================================================
-- 3. STAFF — authenticated users with a staff_accounts row
--    Access gated by has_permission(perm_id)
-- =========================================================================

-- --- roles & permissions: only staff with perm35 (manage roles) ---
create policy "staff_manage_roles" on roles
  for all using (has_permission('perm35')) with check (has_permission('perm35'));

create policy "staff_read_roles" on roles
  for select using (is_staff());

create policy "staff_manage_permissions" on permissions
  for all using (has_permission('perm35')) with check (has_permission('perm35'));

create policy "staff_read_permissions" on permissions
  for select using (is_staff());

-- --- staff_accounts ---
create policy "staff_manage_staff" on staff_accounts
  for all using (has_permission('perm15') or has_permission('perm16'))
  with check (has_permission('perm16'));
create policy "staff_read_staff" on staff_accounts
  for select using (is_staff());

-- --- orders: staff who can view orders ---
create policy "staff_view_orders" on orders
  for select using (has_permission('perm1') or has_permission('perm2'));
create policy "staff_manage_orders" on orders
  for insert with check (has_permission('perm2'));
create policy "staff_update_orders" on orders
  for update using (has_permission('perm2'))
  with check (has_permission('perm2') or has_permission('perm1'));
-- NOTE: total, paid, remaining, status are SERVER-authoritative — a trigger
-- (defined in 002) REWRITES them from DB data regardless of client input.

create policy "staff_own_order_items" on order_items
  for all using (has_permission('perm2'));

create policy "staff_own_order_history" on order_status_history
  for all using (has_permission('perm2'));

create policy "staff_manage_order_documents" on order_documents
  for all using (has_permission('perm2'));

-- --- invoices ---
create policy "staff_view_invoices" on invoices
  for select using (has_permission('perm13') or has_permission('perm14'));
create policy "staff_manage_invoices" on invoices
  for insert with check (has_permission('perm14'));

create policy "staff_own_invoice_items" on invoice_items
  for all using (has_permission('perm13') or has_permission('perm14'));

-- --- finances: expenses, suppliers, employees ---
create policy "staff_view_suppliers" on suppliers for all using (has_permission('perm17') or has_permission('perm18')) with check (has_permission('perm18'));
create policy "staff_view_employees" on employees for all using (has_permission('perm15') or has_permission('perm16')) with check (has_permission('perm16'));
create policy "staff_view_expenses" on expenses for all using (has_permission('perm13') or has_permission('perm14')) with check (has_permission('perm14'));

-- --- gamification: staff can read/write config ---
create policy "staff_manage_gamification" on gamification_settings
  for all using (has_permission('perm35') or is_staff())
  with check (has_permission('perm35') or is_staff());

-- --- loyalty_transactions: staff can insert (award), append-only ---
create policy "staff_award_loyalty" on loyalty_transactions
  for insert with check (is_staff());

-- --- profile: staff can read for customer management ---
create policy "staff_view_profiles" on profiles
  for select using (has_permission('perm3') or has_permission('perm4'));

-- --- audit_logs: staff with perm32 ---
create policy "staff_view_audit" on audit_logs
  for select using (has_permission('perm32'));
create policy "staff_insert_audit" on audit_logs
  for insert with check (has_permission('perm32'));

-- --- content & marketing (staff-only) ---
create policy "staff_content_management" on content_projects
  for all using (has_permission('perm27') or has_permission('perm28'))
  with check (has_permission('perm28'));
create policy "staff_content_comments" on content_comments
  for all using (has_permission('perm27') or has_permission('perm28'))
  with check (has_permission('perm28'));
create policy "staff_content_assets" on content_assets
  for all using (has_permission('perm27') or has_permission('perm28'))
  with check (has_permission('perm28'));
create policy "staff_content_templates" on content_templates
  for all using (has_permission('perm27') or has_permission('perm28'))
  with check (has_permission('perm28'));
create policy "staff_content_ideas" on content_ideas
  for all using (has_permission('perm27') or has_permission('perm28'))
  with check (has_permission('perm28'));
create policy "staff_brand_book" on brand_book
  for all using (is_staff()) with check (is_staff());

create policy "staff_marketing" on campaigns
  for all using (has_permission('perm19') or has_permission('perm20'))
  with check (has_permission('perm20'));
create policy "staff_sms" on sms_logs
  for all using (has_permission('perm21') or has_permission('perm22'))
  with check (has_permission('perm22'));
create policy "staff_reviews" on reviews
  for all using (has_permission('perm23') or has_permission('perm24'))
  with check (has_permission('perm24'));

create policy "staff_affiliates" on affiliates
  for all using (has_permission('perm36') or has_permission('perm37') or has_permission('perm38') or has_permission('perm39') or has_permission('perm40'))
  with check (has_permission('perm37'));
create policy "staff_affiliate_orders" on affiliate_orders
  for all using (has_permission('perm36') or has_permission('perm38'));
create policy "staff_affiliate_transactions" on affiliate_transactions
  for all using (has_permission('perm36') or has_permission('perm39'));

create policy "staff_personas" on personas
  for all using (has_permission('perm3') or has_permission('perm4'))
  with check (has_permission('perm4'));
create policy "staff_digital_marketing" on digital_marketing
  for all using (has_permission('perm34'));
create policy "staff_okrs" on okrs
  for all using (has_permission('perm15') or has_permission('perm16') or has_permission('perm34'))
  with check (has_permission('perm16'));
create policy "staff_key_results" on key_results
  for all using (has_permission('perm15') or has_permission('perm16') or has_permission('perm34'))
  with check (has_permission('perm16'));
create policy "staff_kpis" on kpis
  for all using (has_permission('perm15') or has_permission('perm16') or has_permission('perm34'))
  with check (has_permission('perm34'));
create policy "staff_notes" on notes
  for all using (has_permission('perm1') or has_permission('perm2'))
  with check (has_permission('perm2'));
create policy "staff_tickets" on tickets
  for all using (has_permission('perm41') or has_permission('perm42'))
  with check (has_permission('perm42'));
create policy "staff_projects" on projects
  for all using (has_permission('perm11') or has_permission('perm12'))
  with check (has_permission('perm12'));
-- Training is intentionally open to every staff account
-- (`ADMIN_PAGE_PERMISSIONS['/admin/training'] = []`), but `using (true)` also
-- matched ordinary *customers*, and the blanket table grant in migration 007
-- gave them full DML. Staff-scoped instead of open, so the public read stays
-- with `anon_read_training` above.
create policy "staff_training" on training_sites
  for all using (is_staff()) with check (is_staff());
create policy "staff_notifications" on notifications
  for all using (is_staff()) with check (is_staff());
create policy "staff_notification_settings" on notification_settings
  for all using (is_staff()) with check (is_staff());

-- =========================================================================
-- 4. SERVER-AUTHORITY TRIGGER: order totals are always recomputed =========
-- Prevents the client from sending a fake `total`/`paid`/`status`.
-- =========================================================================
create or replace function orders_enforce_authority()
returns trigger
language plpgsql
as $$
begin
  -- total = sum of order_items.total (price * qty snapshot)
  if exists (select 1 from order_items where order_id = new.id) then
    select coalesce(sum(price * quantity), 0)
      into new.total
    from order_items
    where order_id = new.id;
  end if;

  -- paid can never exceed total
  if new.paid > new.total then new.paid := new.total; end if;
  -- remaining = total - paid, clamped to 0
  new.remaining := greatest(0, new.total - new.paid);

  -- status cannot be reverted from delivered
  if old is not null and old.status = 'delivered' then
    new.status := old.status;
  end if;

  return new;
end;
$$;

create trigger trg_orders_authority
  before insert or update on orders
  for each row execute function orders_enforce_authority();

-- Trigger: auto-insert initial status history row
create or replace function orders_init_history()
returns trigger
language plpgsql
as $$
begin
  insert into order_status_history (order_id, status, "date")
  values (new.id, new.status, now());
  return new;
end;
$$;

create trigger trg_orders_init_history
  after insert on orders
  for each row execute function orders_init_history();

-- =========================================================================
-- 5. STORAGE BUCKET: order-documents (private) ===========================
-- =========================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('order-documents', 'order-documents', false, 26214400,
        ARRAY['image/jpeg','image/png','image/jpg','application/pdf'])
on conflict (id) do nothing;

-- Storage path convention: private/<order_uuid>/<filename>
-- Customers can upload to their own order's folder or read docs of their orders;
-- staff with perm2 can access everything.
create policy "storage_order_docs_upload" on storage.objects
  for insert with check (
    bucket_id = 'order-documents'
    and (storage.foldername(name))[1] = 'private'
    and (
      -- path is private/<order_uuid>/... — check the caller owns that order
      exists (
        select 1 from orders o
        where o.id::text = (storage.foldername(name))[2]
          and o.customer_id = auth.uid()
      )
      or has_permission('perm2')
      or has_permission('perm32')
    )
  );

create policy "storage_order_docs_read" on storage.objects
  for select using (
    bucket_id = 'order-documents'
    and (storage.foldername(name))[1] = 'private'
    and (
      exists (
        select 1 from orders o
        where o.id::text = (storage.foldername(name))[2]
          and o.customer_id = auth.uid()
      )
      or has_permission('perm2')
      or has_permission('perm32')
    )
  );

create policy "storage_order_docs_update" on storage.objects
  for update using (
    bucket_id = 'order-documents'
    and (has_permission('perm2') or has_permission('perm32'))
  )
  with check (
    bucket_id = 'order-documents'
    and (has_permission('perm2') or has_permission('perm32'))
  );

create policy "storage_order_docs_delete" on storage.objects
  for delete using (
    bucket_id = 'order-documents'
    and (has_permission('perm2') or has_permission('perm32'))
  );
