-- ---------------------------------------------------------------------------
-- 003_loyalty_content.sql — Loyalty, Content, Marketing, Support, Projects, etc.
-- ---------------------------------------------------------------------------

-- === Loyalty transactions (APPEND-ONLY — server writes only via 'award-loyalty' fn) ===
create type loyalty_category_t as enum ('purchase','invite','review','profile','birthday','login_streak','redeem','manual');

create table loyalty_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id),
  points      integer not null,                           -- positive = earned, negative = spent
  running_balance integer not null,                       -- balance after this txn
  reason      text not null,
  category    loyalty_category_t not null,
  by_admin    boolean not null default false,
  actor_id    uuid references auth.users(id) on delete set null, -- NULL = awarded by the system
  created_at  timestamptz not null default now()
);

-- Block direct INSERT/UPDATE/DELETE on loyalty_transactions — must go through
-- the 'award_loyalty' RPC so points can never be forged from the browser.
create policy "loyalty_insert_blocked" on loyalty_transactions
  for insert with check (false);
create policy "loyalty_update_blocked" on loyalty_transactions
  for update using (false);
create policy "loyalty_delete_blocked" on loyalty_transactions
  for delete using (false);

-- === Gamification settings (single row) ====================================
create table gamification_settings (
  id              uuid primary key default gen_random_uuid(),
  enabled         boolean not null default true,
  points_per_toman bigint not null default 10000,
  invite_bonus    integer not null default 50,
  invited_user_bonus integer not null default 50,
  review_bonus    integer not null default 10,
  daily_login_bonus integer not null default 5,
  streak_day_multiplier numeric(5,2) not null default 1,
  streak_max_days integer not null default 7,
  profile_completion_bonus integer not null default 20,
  birthday_bonus  integer not null default 100,
  config          jsonb not null,                         -- full config snapshot (tiers, rewards, badges)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- === Content projects ======================================================
create table content_projects (
  id            uuid primary key default gen_random_uuid(),
  sku           text unique,
  title         text not null,
  type          text not null check (type in ('article','social','video','seo')),
  status        text not null check (status in ('idea','draft','in_progress','review','published','archived')),
  description   text,
  due_date      timestamptz,
  assigned_to   text[],                                  -- staff usernames
  tags          text[],
  metrics       jsonb,                                   -- { views, engagement_rate, ... }
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table content_comments (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references content_projects(id) on delete cascade,
  author        text,
  body          text not null,
  created_at    timestamptz not null default now()
);

create table content_assets (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references content_projects(id) on delete set null,
  name          text not null,
  storage_path  text,
  type          text,
  created_at    timestamptz not null default now()
);

create table content_templates (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  type          text,
  body          text,
  created_at    timestamptz not null default now()
);

create table content_ideas (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  type          text,
  source        text,
  created_at    timestamptz not null default now()
);

-- === Brand book =============================================================
create table brand_book (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique,                     -- 'brand_book' (single row)
  content       jsonb not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- === Marketing =============================================================
create table campaigns (
  id            uuid primary key default gen_random_uuid(),
  sku           text unique,
  name          text not null,
  description   text,
  code          text,
  discount_type text not null check (discount_type in ('percent','fixed')),
  discount_value bigint not null check (discount_value >= 0),
  start_date    timestamptz,
  end_date      timestamptz,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table sms_logs (
  id            uuid primary key default gen_random_uuid(),
  phone         text not null,
  message       text not null,
  status        text not null check (status in ('sent','failed','pending')),
  sent_at       timestamptz not null default now()
);

create table reviews (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid references products(id),
  name          text,
  rating        integer not null check (rating between 1 and 5),
  comment       text,
  approved      boolean not null default false,
  date          text,
  created_at    timestamptz not null default now()
);

-- === Affiliates ============================================================
create table affiliates (
  id            uuid primary key default gen_random_uuid(),
  sku           text unique,
  user_id       uuid not null references profiles(id),
  code          text not null unique,
  link          text,
  tier          integer not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table affiliate_orders (
  id            uuid primary key default gen_random_uuid(),
  affiliate_id  uuid not null references affiliates(id),
  order_id      uuid not null references orders(id),
  commission_rate numeric(5,4) not null,                    -- e.g. 0.1000 = 10%
  commission_amount bigint not null,                        -- تومان
  created_at    timestamptz not null default now()
);

create table affiliate_transactions (
  id            uuid primary key default gen_random_uuid(),
  affiliate_id  uuid not null references affiliates(id),
  amount        bigint not null,                            -- تومان
  type          text not null check (type in ('commission','withdrawal','bonus')),
  status        text not null check (status in ('pending','paid','failed')),
  created_at    timestamptz not null default now()
);

-- === Personas (customer segmentation) ======================================
create table personas (
  id            uuid primary key default gen_random_uuid(),
  sku           text unique,
  name          text not null,
  avatar        text,
  tagline       text,
  demographics  jsonb,
  psychographics jsonb,
  behavior      jsonb,
  services      jsonb,
  scenario      jsonb,
  quote         text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- === Digital marketing =====================================================
create table digital_marketing (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique,
  content       jsonb not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- === OKR / KPI =============================================================
create table okrs (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  "type"        text not null check ("type" in ('organizational','employee')),
  assigned_to   text,                                     -- employee id
  quarter       text,
  "year"        integer,
  start_date    timestamptz,
  end_date      timestamptz,
  status        text not null check (status in ('active','completed','cancelled')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table key_results (
  id            uuid primary key default gen_random_uuid(),
  okr_id        uuid not null references okrs(id) on delete cascade,
  title         text not null,
  target_value  numeric,
  current_value numeric,
  unit          text,
  created_at    timestamptz not null default now()
);

create table kpis (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  category      text not null check (category in ('sales','marketing','customer','operations','financial','digital')),
  "type"        text not null check ("type" in ('organizational','employee')),
  assigned_to   text,
  target_value  numeric,
  current_value numeric,
  unit          text,
  start_date    timestamptz,
  end_date      timestamptz,
  status        text not null check (status in ('active','completed','cancelled')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- === Notes, Tickets, Projects, Training ====================================
create table notes (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  body          text,
  category      text,
  "public"      boolean not null default false,
  created_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create type ticket_priority_t as enum ('low','normal','high','urgent');
create table tickets (
  id            uuid primary key default gen_random_uuid(),
  sku           text unique,
  customer_id   uuid references profiles(id),
  title         text not null,
  description   text,
  status        text not null check (status in ('open','in_progress','resolved','closed')),
  priority      ticket_priority_t not null default 'normal',
  assigned_to   text,                                     -- staff username
  messages      jsonb,                                     -- array of {id, sender, author, text, createdAt}
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table projects (
  id            uuid primary key default gen_random_uuid(),
  sku           text unique,
  title         text not null,
  group_name    text not null check (group_name in ('webdesign','content')),
  status        text not null check (status in ('idea','in_progress','review','completed','delivered')),
  description   text,
  price         bigint check (price >= 0),
  start_date    timestamptz,
  due_date      timestamptz,
  progress      integer check (progress between 0 and 100),
  assigned_to   text[],
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table training_sites (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  url           text,
  category      text,
  description   text,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- === Notifications ==========================================================
create table notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id),             -- null = broadcast to all admins
  type          text,
  title         text,
  message       text,
  link          text,
  priority      text not null check (priority in ('low','normal','high','urgent')),
  "read"        boolean not null default false,
  created_at    timestamptz not null default now()
);

create table notification_settings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id),
  config        jsonb not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- === Triggers: updated_at =================================================
create trigger trg_gamification_updated
  before update on gamification_settings for each row execute function _set_updated_at();
create trigger trg_content_projects_updated
  before update on content_projects for each row execute function _set_updated_at();
create trigger trg_brand_book_updated
  before update on brand_book for each row execute function _set_updated_at();
create trigger trg_campaigns_updated
  before update on campaigns for each row execute function _set_updated_at();
create trigger trg_affiliates_updated
  before update on affiliates for each row execute function _set_updated_at();
create trigger trg_personas_updated
  before update on personas for each row execute function _set_updated_at();
create trigger trg_digital_marketing_updated
  before update on digital_marketing for each row execute function _set_updated_at();
create trigger trg_notes_updated
  before update on notes for each row execute function _set_updated_at();
create trigger trg_tickets_updated
  before update on tickets for each row execute function _set_updated_at();
create trigger trg_projects_updated
  before update on projects for each row execute function _set_updated_at();
create trigger trg_notification_settings_updated
  before update on notification_settings for each row execute function _set_updated_at();

-- === Indexes ==============================================================
create index idx_loyalty_user       on loyalty_transactions(user_id, created_at desc);
create index idx_loyalty_created    on loyalty_transactions(created_at desc);
create index idx_notifications_user  on notifications(user_id, created_at desc);
create index idx_tickets_customer   on tickets(customer_id);
create index idx_campaigns_active   on campaigns(active);
create index idx_order_documents_storage on order_documents(storage_path);
