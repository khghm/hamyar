-- ---------------------------------------------------------------------------
-- 002_orders_finance.sql — Orders, Order items, Invoices, Expenses, Suppliers, Employees
-- ---------------------------------------------------------------------------

-- === Expense categories =====================================================
create table expense_categories (
  id           text primary key,
  name         text not null,
  description  text
);

-- === Orders =================================================================
create type order_status_t as enum ('new','processing','ready','delivered','cancelled');
create type order_priority_t as enum ('normal','urgent','vip');
create type order_type_t as enum ('service','media','product','webdesign');
create type payment_method_t as enum ('online','wallet');
create type document_status_t as enum ('pending','approved','rejected');

create table orders (
  id                uuid primary key default gen_random_uuid(),
  tracking_code     text not null unique check (tracking_code ~ '^HMY-'),
  customer_id       uuid not null references profiles(id),
  customer_name     text,
  type              order_type_t not null,
  channel           text,
  status            order_status_t not null default 'new',
  priority          order_priority_t not null default 'normal',
  total             bigint not null check (total >= 0),     -- تومان — SERVER-computed
  paid              bigint not null check (paid >= 0),       -- تومان — SERVER-computed
  remaining         bigint not null check (remaining >= 0),  -- تومان — SERVER-computed
  employee_id       uuid references staff_accounts(id),
  payment_method    payment_method_t,
  gateway_ref       text,
  form_data         jsonb,
  stock_deducted    boolean not null default false,
  receipt_invoice_id uuid,                            -- FK added below (invoices must exist first)
  service_id        uuid references services(id),
  project_service_id uuid references project_services(id),
  document_status   document_status_t default 'pending',
  project_id        uuid,                                   -- FK to projects (1.3)
  content_project_id uuid,                                  -- FK to content_projects (1.3)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz                            -- soft delete
);

-- === Order line items (snapshot of price/name at purchase time) =============
create table order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id),                  -- null for service orders
  name       text not null,
  price      bigint not null check (price >= 0),            -- snapshot — تومان
  quantity   integer not null check (quantity > 0),
  total      bigint not null check (total >= 0),            -- snapshot price * qty
  image      text,
  created_at timestamptz not null default now()
);

-- === Order status history ==================================================
create table order_status_history (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  status     order_status_t not null,
  "date"     timestamptz not null default now(),
  actor_id   uuid,
  actor_name text,
  note       text,
  created_at timestamptz not null default now()
);

-- === Order documents (stored in Supabase Storage, NOT as dataUrl) ==========
create table order_documents (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references orders(id) on delete cascade,
  storage_path     text not null,                           -- path inside the bucket
  label            text,
  document_status  document_status_t not null default 'pending',
  uploaded_by      uuid references profiles(id),
  uploaded_at      timestamptz not null default now()
);

-- === Invoices / receipts ===================================================
create type invoice_status_t as enum ('draft','issued','paid','cancelled');
create type invoice_type_t as enum ('service','product','webdesign','combined','media');

create table invoices (
  id            uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  order_id      uuid references orders(id),
  type          invoice_type_t not null,
  "date"        timestamptz not null default now(),
  due_date      timestamptz,
  customer_name text,
  customer_phone text,
  customer_address text,
  customer_national_id text,
  subtotal      bigint not null check (subtotal >= 0),
  discount      bigint not null default 0,
  discount_type text not null default 'fixed' check (discount_type in ('percent','fixed')),
  discount_amount bigint not null default 0,
  tax           numeric(5,2) not null default 0,          -- tax rate %
  tax_amount    bigint not null default 0,
  total         bigint not null check (total >= 0),
  note          text,
  status        invoice_status_t not null default 'draft',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- === Invoice line items ====================================================
create table invoice_items (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references invoices(id) on delete cascade,
  name        text not null,
  quantity    integer not null,
  unit        text,
  price       bigint not null,
  created_at  timestamptz not null default now()
);

-- Add FK to invoices now that the table exists
alter table orders
  add constraint fk_orders_receipt_invoice
  foreign key (receipt_invoice_id) references invoices(id);

-- === Expenses ===============================================================
create table expenses (
  id          uuid primary key default gen_random_uuid(),
  sku         text unique,
  category_id text references expense_categories(id),
  title       text not null,
  amount      bigint not null check (amount >= 0),        -- تومان
  "date"      timestamptz not null default now(),
  receipt_url text,
  payment_method text,
  notes       text,
  approved    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- === Suppliers =============================================================
create table suppliers (
  id          uuid primary key default gen_random_uuid(),
  sku         text unique,
  name        text not null,
  phone       text check (phone ~ '^09[0-9]{9}$'),
  email       text,
  address     text,
  contact_person text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- === Employees =============================================================
create table employees (
  id          uuid primary key default gen_random_uuid(),
  sku         text unique,
  name        text not null,
  phone       text unique check (phone ~ '^09[0-9]{9}$'),
  email       text,
  position    text,
  department  text,
  hire_date   timestamptz,
  salary      bigint check (salary >= 0),                 -- تومان
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- === Triggers: updated_at =================================================
create trigger trg_orders_updated
  before update on orders for each row execute function _set_updated_at();
create trigger trg_invoices_updated
  before update on invoices for each row execute function _set_updated_at();
create trigger trg_expenses_updated
  before update on expenses for each row execute function _set_updated_at();
create trigger trg_suppliers_updated
  before update on suppliers for each row execute function _set_updated_at();
create trigger trg_employees_updated
  before update on employees for each row execute function _set_updated_at();

-- === Indexes for performance ==============================================
create index idx_orders_customer    on orders(customer_id);
create index idx_orders_status      on orders(status);
create index idx_orders_tracking    on orders(tracking_code);
create index idx_orders_created     on orders(created_at desc);
create index idx_orders_document_status on orders(document_status);
create index idx_order_items_order  on order_items(order_id);
create index idx_order_history_order on order_status_history(order_id);
create index idx_order_docs_order   on order_documents(order_id);
create index idx_invoices_order     on invoices(order_id);
create index idx_invoices_number    on invoices(invoice_number);
create index idx_expenses_date      on expenses("date" desc);
