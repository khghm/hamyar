-- 015 — تفکیک «خواندن» از «نوشتن» در سیاست‌های RLS
--
-- ── مسئله ────────────────────────────────────────────────────────────────────
-- ۲۰ سیاست با الگوی زیر نوشته شده بودند:
--
--   create policy <p> on <t> for all
--     using      (has_permission('<read>') or has_permission('<write>'))
--     with check (has_permission('<write>'));
--
-- برای `select` و `update` درست کار می‌کند: `with check` روی ردیف جدیدِ update
-- اعمال می‌شود و مجوزِ نوشتن را می‌خواهد. ولی `for all` یعنی `using` به
-- `delete` هم حاکم است و `delete` اصلاً `with check` ندارد:
--
--   * delete  → فقط `using` دارد  → مجوزِ *مشاهده* کافی است
--   * insert  → فقط `with check`  → مجوزِ نوشتن لازم است (درست)
--
-- نتیجه: هر کارمندی که فقط مجوزِ «مشاهده» داشت می‌توانست سطرها را `delete` کند.
-- بدترین نمونه `staff_accounts` بود: `perm15` («مشاهده کارمندان») اجازهٔ حذف
-- حساب‌های کارمندی را می‌داد. بقیه هم به همین شکل — حذف محصول با `perm5`،
-- حذف مدیا با `perm7`، حذف تنظیمات باشگاه مشتریان با `perm29` و…
--
-- ── راه‌حل ───────────────────────────────────────────────────────────────────
-- هر سیاست به چهار سیاستِ تفکیک‌شده بر اساس *دستور* شکسته می‌شود:
--
--   select → مجوزِ مشاهده یا نوشتن   (همان رفتار قبلی)
--   insert → مجوزِ نوشتن
--   update → مجوزِ نوشتن (در `using` و `with check` هر دو)
--   delete → مجوزِ نوشتن
--
-- policyها به‌صورت پیش‌فرض `permissive` هستند و بین خود OR می‌شوند، پس خواندنِ
-- مهمان (`anon_read_*`) و خواندنِ کارمندی دست‌نخورده می‌ماند و تنها DELETE
-- بسته می‌شود. هیچ عملیاتِ مجازِ قبلی از کار نمی‌افتد.
--
-- ── چرا این با گیتِ UI هم‌خوان است ───────────────────────────────────────────
-- `ADMIN_PAGE_PERMISSIONS` در `src/store.tsx` برای هر صفحه یک مجوزِ مشاهده
-- می‌گذارد و تب‌های ویرایشی با مجوزِ مدیریت گیت می‌شوند. پس «مشاهده» و
-- «ویرایش» دو تصمیم امنیتی جدا هستند و RLS هم باید همین‌طور باشد — وگرنه
-- دکمه در UI نیست ولی درخواست مستقیم موفق می‌شود.

do $$
declare
  r record;
begin
  for r in
    select * from (
      values
        ('invoice_items',         'staff_own_invoice_items',          'has_permission(''perm13''::text) or has_permission(''perm14''::text)', 'has_permission(''perm14''::text)'),
        ('key_results',           'staff_key_results',               'has_permission(''perm15''::text) or has_permission(''perm16''::text) or has_permission(''perm34''::text)', 'has_permission(''perm16''::text)'),
        ('kpis',                  'staff_kpis',                      'has_permission(''perm15''::text) or has_permission(''perm16''::text) or has_permission(''perm34''::text)', 'has_permission(''perm34''::text)'),
        ('media_items',           'staff_manage_media_items',        'has_permission(''perm7''::text) or has_permission(''perm8''::text)',   'has_permission(''perm8''::text)'),
        ('news',                  'staff_manage_news',               'has_permission(''perm30''::text) or has_permission(''perm31''::text)','has_permission(''perm31''::text)'),
        ('notes',                 'staff_notes',                     'has_permission(''perm1''::text) or has_permission(''perm2''::text)',  'has_permission(''perm2''::text)'),
        ('okrs',                  'staff_okrs',                      'has_permission(''perm15''::text) or has_permission(''perm16''::text) or has_permission(''perm34''::text)', 'has_permission(''perm16''::text)'),
        ('personas',              'staff_personas',                  'has_permission(''perm3''::text) or has_permission(''perm4''::text)',  'has_permission(''perm4''::text)'),
        ('portfolio',             'staff_manage_portfolio',          'has_permission(''perm30''::text) or has_permission(''perm31''::text)','has_permission(''perm31''::text)'),
        ('products',              'staff_manage_products',           'has_permission(''perm5''::text) or has_permission(''perm6''::text)',  'has_permission(''perm6''::text)'),
        ('project_services',      'staff_manage_project_services',   'has_permission(''perm9''::text) or has_permission(''perm10''::text)', 'has_permission(''perm10''::text)'),
        ('projects',              'staff_projects',                  'has_permission(''perm11''::text) or has_permission(''perm12''::text)','has_permission(''perm12''::text)'),
        ('reviews',               'staff_reviews',                   'has_permission(''perm23''::text) or has_permission(''perm24''::text)','has_permission(''perm24''::text)'),
        ('services',              'staff_manage_services',           'has_permission(''perm9''::text) or has_permission(''perm10''::text)', 'has_permission(''perm10''::text)'),
        ('site_settings',         'staff_manage_site_settings',      'has_permission(''perm30''::text) or has_permission(''perm31''::text)','has_permission(''perm31''::text)'),
        ('sms_logs',              'staff_sms',                       'has_permission(''perm21''::text) or has_permission(''perm22''::text)','has_permission(''perm22''::text)'),
        ('staff_accounts',        'staff_manage_staff',              'has_permission(''perm15''::text) or has_permission(''perm16''::text)','has_permission(''perm16''::text)'),
        ('suppliers',             'staff_view_suppliers',            'has_permission(''perm17''::text) or has_permission(''perm18''::text)','has_permission(''perm18''::text)'),
        ('tickets',               'staff_tickets',                   'has_permission(''perm41''::text) or has_permission(''perm42''::text)','has_permission(''perm42''::text)'),
        ('gamification_settings', 'staff_manage_gamification',       'has_permission(''perm29''::text) or has_permission(''perm43''::text)','has_permission(''perm43''::text)')
    ) as v(tbl, pol, read_expr, write_expr)
  loop
    execute format('drop policy if exists %I on public.%I', r.pol, r.tbl);

    execute format('create policy %I on public.%I for select using (%s)',
                   r.pol || '_read', r.tbl, r.read_expr);

    execute format('create policy %I on public.%I for insert with check (%s)',
                   r.pol || '_insert', r.tbl, r.write_expr);

    execute format('create policy %I on public.%I for update using (%s) with check (%s)',
                   r.pol || '_update', r.tbl, r.write_expr, r.write_expr);

    -- قلب اصلاح: پیش از این مهاجرت، delete با مجوزِ *مشاهده* هم ممکن بود.
    execute format('create policy %I on public.%I for delete using (%s)',
                   r.pol || '_delete', r.tbl, r.write_expr);
  end loop;
end $$;

comment on policy "staff_manage_staff_read" on staff_accounts is
  'پیش از ۰۱۵، perm15 («مشاهده کارمندان») اجازهٔ delete روی staff_accounts می‌داد، چون using روی delete هم حاکم بود.';
comment on policy "staff_manage_staff_delete" on staff_accounts is
  'حذف حساب کارمندی فقط با perm16 («مدیریت کارمندان»).';
comment on policy "staff_manage_gamification_read" on gamification_settings is
  'خواندن: perm29 (گیت صفحهٔ /admin/invites) یا perm43.';
comment on policy "staff_manage_gamification_delete" on gamification_settings is
  'پیش از ۰۱۵، perm29 اجازهٔ delete روی سطر تنظیمات را می‌داد؛ حالا فقط perm43.';