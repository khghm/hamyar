-- ---------------------------------------------------------------------------
-- 001_core_schema.sql — Identity, Access Control, Catalog, Content
-- Tables: profiles, staff_accounts, roles, permissions, audit_logs
--         products, media_items, services, project_services, portfolio
--         news, faqs, about_content, site_settings
-- ---------------------------------------------------------------------------

-- === Helpers: timestamps & soft-delete =====================================
create extension if not exists "uuid-ossp";

create table _meta (
  key   text primary key,
  value text
);

-- === Authentication identity: customers ====================================
-- Rows are created by a BEFORE INSERT trigger on auth.users (see migration
-- 004) so every new customer auth.uid() maps to a profile row.
create table profiles (
  id            uuid primary key references auth.users on delete cascade,
  display_name  text,
  phone         text unique check (phone ~ '^09[0-9]{9}$'),
  level         text not null default 'normal' check (level in ('normal','silver','gold','vip')),
  loyalty_points bigint not null default 0,
  total_earned_points bigint not null default 0,
  wallet_balance bigint not null default 0,          -- تومان
  invite_code   text unique,
  invited_by    uuid references profiles(id),
  birth_date    timestamptz,
  last_login_streak_date  text,
  login_streak  integer default 0,
  last_profile_bonus_date timestamptz,
  last_birthday_bonus_date timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- === RBAC: permissions, roles =============================================
-- این دو جدول باید پیش از `staff_accounts` ساخته شوند، چون FK نقش به آن‌ها
-- ارجاع می‌دهد.
create table permissions (
  id          text primary key,                     -- e.g. 'perm1'
  name        text not null,
  description text,
  module      text not null
);

create table roles (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  description  text,
  permissions  text[] not null default '{}',         -- array of permission ids
  is_default   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- === Staff accounts (RBAC) ================================================
-- Staff authenticate via Supabase Auth (phone + password); this table links
-- auth.uid() → role for permission checks.  `username` is a free-text display
-- identifier — NOT an email or auth subject.
create table staff_accounts (
  id            uuid primary key default gen_random_uuid(),
  auth_uid      uuid not null unique references auth.users on delete cascade,
  phone         text unique check (phone ~ '^09[0-9]{9}$'),
  display_name  text not null,
  username      text,                               -- internal display identifier
  password_hash text,                               -- kept for audit / legacy import
  role_id       uuid not null references roles(id),
  active        boolean not null default true,
  last_login    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- === Audit log =============================================================
create table audit_logs (
  id         uuid primary key default gen_random_uuid(),
  actor      text,                                   -- display name of actor
  actor_id   uuid,                                   -- auth.uid() or staff id
  is_admin   boolean default false,
  action     text not null,
  details    text,
  module     text,
  ip         inet,
  user_agent text,
  created_at timestamptz not null default now()
);

-- === Catalog: products ====================================================
create table products (
  id              uuid primary key default gen_random_uuid(),
  sku             text unique,                        -- stable business key (e.g. 'p1')
  name            text not null,
  brand           text,
  category        text,
  price           bigint not null check (price >= 0), -- تومان
  original_price  bigint check (original_price >= 0),
  stock           integer not null default 0 check (stock >= 0),
  image           text,
  description     text,
  barcode         text,
  warranty        text,
  alert_threshold integer,
  last_restocked  timestamptz,
  supplier        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- === Catalog: media items =================================================
create table media_items (
  id          uuid primary key default gen_random_uuid(),
  sku         text unique,
  title       text not null,
  year        integer,
  genre       text[],
  type        text not null check (type in ('movie','series','animation','anime')),
  quality     text,
  language    text,
  subtitle    text,
  volume      text,
  rating      numeric(3,1),
  image       text,
  description text,
  director    text,
  country     text,
  imdb        numeric(3,1),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- === Catalog: services (internet-cafe services) ===========================
-- `fields` and `docs` store the dynamic wizard form schema as JSONB so the
-- ordering wizard can render the right inputs without extra server round-trips.
create table services (
  id         uuid primary key default gen_random_uuid(),
  sku        text unique,
  name       text not null,
  category   text,
  base_price bigint not null check (base_price >= 0),
  unit       text not null,
  description text,
  active     boolean not null default true,
  fields     jsonb,                                 -- array of ServiceFormField
  docs       jsonb,                                 -- array of ServiceDocField
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- === Catalog: project services (وب‌سایت / تولید محتوا) ====================
create table project_services (
  id         uuid primary key default gen_random_uuid(),
  sku        text unique,
  title      text not null,
  "group"    text not null check ("group" in ('webdesign','content')),
  icon       text,
  "desc"     text,                                  -- `desc` کلمهٔ رزرو شده است
  features   text[],
  base_price bigint not null check (base_price >= 0),
  unit       text,
  fields     jsonb not null,                        -- array of ServiceFormField
  docs       jsonb not null,                        -- array of ServiceDocField
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- === Catalog: portfolio / case studies ====================================
create table portfolio (
  id           uuid primary key default gen_random_uuid(),
  sku          text unique,
  title        text not null,
  description  text,
  image        text,
  link         text,
  type         text,                                -- 'فروشگاهی' | 'شرکتی' | 'شخصی'
  technologies text[],
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- === Content: news =========================================================
create table news (
  id      uuid primary key default gen_random_uuid(),
  sku     text unique,
  title   text not null,
  image   text,
  caption text,
  content text,
  "date"  text,                                    -- Persian calendar date string
  active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- === Content: FAQs =========================================================
create table faqs (
  id       uuid primary key default gen_random_uuid(),
  sku      text unique,
  question text not null,
  answer   text not null,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- === Site content / settings ==============================================
create table about_content (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,                -- 'about' | 'team' | etc.
  content     jsonb not null,                      -- rich structured content
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table site_settings (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  value       jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- === Triggers: updated_at =================================================
create or replace function _set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated
  before update on profiles for each row execute function _set_updated_at();
create trigger trg_staff_accounts_updated
  before update on staff_accounts for each row execute function _set_updated_at();
create trigger trg_roles_updated
  before update on roles for each row execute function _set_updated_at();
create trigger trg_products_updated
  before update on products for each row execute function _set_updated_at();
create trigger trg_media_items_updated
  before update on media_items for each row execute function _set_updated_at();
create trigger trg_services_updated
  before update on services for each row execute function _set_updated_at();
create trigger trg_project_services_updated
  before update on project_services for each row execute function _set_updated_at();
create trigger trg_portfolio_updated
  before update on portfolio for each row execute function _set_updated_at();
create trigger trg_news_updated
  before update on news for each row execute function _set_updated_at();
create trigger trg_faqs_updated
  before update on faqs for each row execute function _set_updated_at();
create trigger trg_about_content_updated
  before update on about_content for each row execute function _set_updated_at();
create trigger trg_site_settings_updated
  before update on site_settings for each row execute function _set_updated_at();
