// اسکریپت مهاجرت داده‌های localStorage به Supabase
// این اسکریپت تنها برای مهاجرت کاربران واقعی به محیط پروداکشن است
// استفاده: npx tsx src/scripts/migrate-local-to-supabase.ts

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ متغیرهای محیطی VITE_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY الزامی هستند');
  // eslint-disable-next-line no-process-exit
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface MigrationStats {
  table: string;
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

const KEY_MAPS: Record<string, { key: string; table: string; transform?: (data: any) => any }> = {
  products: { key: 'hamyar_products', table: 'products' },
  media: { key: 'hamyar_media', table: 'media_items' },
  services: { key: 'hamyar_services', table: 'services' },
  news: { key: 'hamyar_news', table: 'news' },
  portfolio: { key: 'hamyar_portfolio', table: 'portfolio' },
  about: { key: 'hamyar_about', table: 'about_content', transform: (d) => [d] },
  projects: { key: 'hamyar_projects', table: 'projects' },
  users: { key: 'hamyar_users', table: 'users' },
  reviews: { key: 'hamyar_reviews', table: 'reviews' },
  faqs: { key: 'hamyar_faqs', table: 'faqs' },
  orders: { key: 'hamyar_orders', table: 'orders' },
  invoices: { key: 'hamyar_invoices', table: 'invoices' },
  tickets: { key: 'hamyar_tickets', table: 'tickets' },
  loyaltyTx: { key: 'hamyar_loyalty_tx', table: 'loyalty_transactions' },
  gamificationConfig: { key: 'hamyar_gamification_config', table: 'gamification_config', transform: (d) => [d] },
  notifications: { key: 'hamyar_notifications', table: 'notifications' },
  notificationSettings: { key: 'hamyar_notification_settings', table: 'notification_settings', transform: (d) => [d] },
  suppliers: { key: 'hamyar_suppliers', table: 'suppliers' },
  employees: { key: 'hamyar_employees', table: 'employees' },
  notes: { key: 'hamyar_notes', table: 'notes' },
  expenses: { key: 'hamyar_expenses', table: 'expenses' },
  digitalMarketingData: { key: 'hamyar_digital_marketing', table: 'digital_marketing_data', transform: (d) => [d] },
  contentProjects: { key: 'hamyar_content_projects', table: 'content_projects' },
  contentComments: { key: 'hamyar_content_comments', table: 'content_comments' },
  contentAssets: { key: 'hamyar_content_assets', table: 'content_assets' },
  contentTemplates: { key: 'hamyar_content_templates', table: 'content_templates' },
  contentIdeas: { key: 'hamyar_content_ideas', table: 'content_ideas' },
  brandBook: { key: 'hamyar_brand_book', table: 'brand_book', transform: (d) => [d] },
  campaigns: { key: 'hamyar_campaigns', table: 'campaigns' },
  affiliates: { key: 'hamyar_affiliates', table: 'affiliates' },
  affiliateOrders: { key: 'hamyar_affiliate_orders', table: 'affiliate_orders' },
  affiliateTransactions: { key: 'hamyar_affiliate_transactions', table: 'affiliate_transactions' },
  personas: { key: 'hamyar_personas', table: 'personas' },
  okrs: { key: 'hamyar_okrs', table: 'okrs' },
  kpis: { key: 'hamyar_kpis', table: 'kpis' },
  cart: { key: 'hamyar_cart', table: 'cart_items' },
  rbac: { key: 'hamyar_rbac', table: 'rbac_data' },
  theme: { key: 'hamyar_theme', table: 'theme_settings', transform: (d) => [d] },
};

async function migrateTable(tableName: string, key: string, transform?: (data: any) => any): Promise<MigrationStats> {
  const stats: MigrationStats = { table: tableName, total: 0, success: 0, failed: 0, errors: [] };

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      console.log(`⏭️  ${tableName}: داده‌ای در localStorage یافت نشد`);
      return stats;
    }

    let data = JSON.parse(raw);
    if (transform) data = transform(data);

    if (!Array.isArray(data) || data.length === 0) {
      console.log(`⏭️  ${tableName}: داده معتبری یافت نشد`);
      return stats;
    }

    stats.total = data.length;
    console.log(`📦 مهاجر ${tableName}: ${data.length} ردیف`);

    // Batch upsert (500 records per batch)
    const batchSize = 500;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const { error } = await supabase.from(tableName).upsert(batch, { onConflict: 'id' });

      if (error) {
        stats.failed += batch.length;
        stats.errors.push(`Batch ${i}-${i + batch.length}: ${error.message}`);
        console.error(`❌ ${tableName} batch ${i}:`, error.message);
      } else {
        stats.success += batch.length;
      }
    }

    console.log(`✅ ${tableName}: ${stats.success}/${stats.total} موفق`);
  } catch (e: any) {
    stats.failed = stats.total;
    stats.errors.push(e.message);
    console.error(`❌ ${tableName}:`, e.message);
  }

  return stats;
}

async function main() {
  console.log('🚀 شروع مهاجرت داده‌های localStorage به Supabase\n');

  const allStats: MigrationStats[] = [];

  for (const [name, { key, table, transform }] of Object.entries(KEY_MAPS)) {
    const stats = await migrateTable(name, key, transform);
    allStats.push(stats);
  }

  console.log('\n📊 خلاصه مهاجرت:');
  console.log('─'.repeat(60));
  let totalRecords = 0;
  let totalSuccess = 0;
  let totalFailed = 0;

  for (const s of allStats) {
    if (s.total > 0) {
      console.log(`${s.table}: ${s.success}/${s.total} ✅ | ${s.failed} ❌`);
      totalRecords += s.total;
      totalSuccess += s.success;
      totalFailed += s.failed;
    }
  }

  console.log('─'.repeat(60));
  console.log(`مجموع: ${totalSuccess}/${totalRecords} موفق | ${totalFailed} ناموفق`);

  if (totalFailed > 0) {
    console.log('\n❌ خطاها:');
    for (const s of allStats) {
      for (const err of s.errors) {
        console.log(`  - ${s.table}: ${err}`);
      }
    }
  }

  console.log('\n🔍 برای حذف داده‌های محلی پس از تأیید، کلیدهای localStorage مربوطه را حذف کنید:');
  console.log('   localStorage.clear()  // یا کلیدهای خاص');

  if (totalFailed === 0 && totalRecords > 0) {
    console.log('\n✨ مهاجرت با موفقیت کامل شد!');
  }
}

main().catch(console.error);