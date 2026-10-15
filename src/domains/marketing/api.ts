import type { Campaign, Affiliate, Persona } from '../types';
import { fetchCollection, syncCollection, type CollectionMapper } from '../../api/sync';
import { fromDbDate, toDbDate, toDbPercent } from '../db-helpers';

/**
 * فاز ۲.۳ — ماژول سرویس دامنهٔ بازاریابی.
 *
 * هر سه کلکسیون تخت‌اند و `sku` دارند، پس mapper تخت کافی است. فرزندهای
 * همکاران (`affiliate_orders`, `affiliate_transactions`) چون کلیدشان از `uuid`
 * همکار می‌آید مسیر جداگانه دارند.
 */

// ── کمپین‌ها ───────────────────────────────────────────────────────────────
/**
 * نام فیلدها فرق می‌کند: فروشگاه `title`/`discount`/`type` دارد و دیتابیس
 * `name`/`discount_value`/`discount_type`. این نگاشت همان چیزی است که
 * `seed.sql` تولید می‌کند، پس دادهٔ اولیه و دادهٔ زنده یک شکل دارند.
 *
 * `description` در دیتابیس هست ولی `Campaign` در فروشگاه چنین فیلدی ندارد،
 * پس عمداً نوشته نمی‌شود (ستون‌های غایب در `ON CONFLICT DO UPDATE`
 * دست‌نخورده می‌مانند و در `INSERT` مقدار پیش‌فرض می‌گیرند).
 */
export const campaignMapper: CollectionMapper<Campaign> = {
  table: 'campaigns',
  keyColumn: 'sku',
  toRow: (c) => ({
    sku: c.id,
    name: c.title,
    code: c.code || null,
    discount_type: c.type,
    discount_value: Math.round(c.discount ?? 0),
    min_purchase: Math.round(c.minPurchase ?? 0),
    max_uses: Math.round(c.maxUses ?? 0),
    used_count: Math.round(c.usedCount ?? 0),
    start_date: toDbDate(c.startDate),
    end_date: toDbDate(c.endDate),
    active: c.active,
  }),
  fromRow: (r) => ({
    id: r.sku ?? r.id,
    title: r.name ?? '',
    code: r.code ?? '',
    discount: Number(r.discount_value) || 0,
    type: r.discount_type ?? 'percent',
    minPurchase: Number(r.min_purchase) || 0,
    maxUses: Number(r.max_uses) || 0,
    usedCount: Number(r.used_count) || 0,
    startDate: fromDbDate(r.start_date),
    endDate: fromDbDate(r.end_date),
    active: r.active ?? true,
  }),
};

// ── همکاران (affiliates) ───────────────────────────────────────────────────
/**
 * جدول `affiliates` فقط `user_id`/`code`/`link`/`tier` داشت و هر دو ستون اول
 * `not null` بودند، در حالی که فروشگاه `name`، `phone`، درصد پورسانت و چهار
 * مبلغ کیف پول را نگه می‌دارد. یعنی mapper نه‌تنها چیزی از فروشگاه را دور
 * نمی‌انداخت، بلکه حتی یک ردیف هم نمی‌توانست درج کند.
 * `011_domain_collection_repairs.sql` ستون‌ها را اضافه و `user_id` و `code` را
 * اختیاری کرده است.
 *
 * `user_id` به‌عمد نوشته نمی‌شود: یک uuid به `profiles.id` است و فروشگاه با
 * کلید تجاری کار می‌کند. همکار می‌تواند پیش از ساخت حساب مشتری ثبت شود، پس
 * خالی گذاشتنش درست است.
 *
 * `affiliate_orders` و `affiliate_transactions` جمع‌های مالی همکار را نگه
 * می‌دارند و مسیر جداگانه دارند؛ اینجا فقط سربرگ همگام می‌شود.
 */
export const affiliateMapper: CollectionMapper<Affiliate> = {
  table: 'affiliates',
  keyColumn: 'sku',
  toRow: (a) => ({
    sku: a.id,
    name: a.name,
    phone: blankToNull(a.phone),
    email: a.email ?? null,
    code: a.referralCode || null,
    commission_rate: a.commissionRate ?? 0,
    wallet_balance: Math.round(a.walletBalance ?? 0),
    total_earnings: Math.round(a.totalEarnings ?? 0),
    total_withdrawn: Math.round(a.totalWithdrawn ?? 0),
    total_spent: Math.round(a.totalSpent ?? 0),
    status: a.status,
    join_date: toDbDate(a.joinDate),
    last_activity: toDbDate(a.lastActivity),
    notes: a.notes ?? null,
  }),
  fromRow: (r) => {
    const status = String(r.status ?? 'pending') as Affiliate['status'];
    return {
      id: r.sku ?? r.id,
      name: r.name ?? '',
      phone: r.phone ?? '',
      email: r.email ?? undefined,
      referralCode: r.code ?? '',
      commissionRate: toDbPercent(r.commission_rate),
      walletBalance: Number(r.wallet_balance) || 0,
      totalEarnings: Number(r.total_earnings) || 0,
      totalWithdrawn: Number(r.total_withdrawn) || 0,
      totalSpent: Number(r.total_spent) || 0,
      status: AFFILIATE_STATUSES.includes(status) ? status : 'pending',
      joinDate: fromDbDate(r.join_date),
      lastActivity: r.last_activity ? fromDbDate(r.last_activity) : undefined,
      notes: r.notes ?? undefined,
    };
  },
};

const AFFILIATE_STATUSES: readonly Affiliate['status'][] = ['active', 'inactive', 'pending'];

/**
 * رشتهٔ خالی به `NULL`. برخلاف `suppliers`/`employees`، این جدول قید موبایل
 * ندارد پس شمارهٔ ثابت هم معتبر است و دست‌نخورده رد می‌شود.
 */
function blankToNull(value?: string | null): string | null {
  return (value ?? '').trim() || null;
}

// ── پرسوناها ───────────────────────────────────────────────────────────────
/**
 * پرسونا تقریباً تمامش `jsonb` است (جمعیت‌شناسی، روان‌شناسی، رفتار، سناریو) و
 * دقیقاً همان شکلی را دارد که فروشگاه می‌خواهد، پس نگاشت تقریباً بی‌واسطه است.
 */
export const personaMapper: CollectionMapper<Persona> = {
  table: 'personas',
  keyColumn: 'sku',
  toRow: (p) => ({
    sku: p.id,
    name: p.name,
    avatar: p.avatar,
    tagline: p.tagline ?? '',
    demographics: p.demographics,
    psychographics: p.psychographics,
    behavior: p.behavior,
    services: p.services,
    scenario: p.scenario,
    quote: p.quote ?? '',
    notes: p.notes ?? '',
  }),
  fromRow: (r) => {
    const createdAt = r.created_at ?? r.updated_at ?? new Date().toISOString();
    return {
      id: r.sku ?? r.id,
      name: r.name ?? '',
      avatar: r.avatar ?? '',
      tagline: r.tagline ?? '',
      demographics: r.demographics ?? {
        ageRange: '',
        gender: 'mixed',
        location: '',
        education: '',
        occupation: '',
        incomeLevel: 'medium',
      },
      psychographics: r.psychographics ?? {
        personality: [],
        values: [],
        interests: [],
        lifestyle: '',
      },
      behavior: r.behavior ?? {
        buyingHabits: '',
        preferredChannels: [],
        decisionFactors: [],
        painPoints: [],
        goals: [],
      },
      services: r.services ?? {
        primaryServices: [],
        frequency: 'monthly',
        avgSpending: 0,
        preferredPayment: '',
      },
      scenario: r.scenario ?? { typicalDay: '', challenges: [], solutions: [], touchpoints: [] },
      quote: r.quote ?? '',
      notes: r.notes ?? '',
      createdAt,
      updatedAt: r.updated_at ?? createdAt,
    };
  },
};

export const fetchCampaigns = () => fetchCollection(campaignMapper);
export const fetchAffiliates = () => fetchCollection(affiliateMapper);
export const fetchPersonas = () => fetchCollection(personaMapper);

export const syncCampaigns = (next: Campaign[], prev: Campaign[]) =>
  syncCollection(campaignMapper, next, prev);
export const syncAffiliates = (next: Affiliate[], prev: Affiliate[]) =>
  syncCollection(affiliateMapper, next, prev);
export const syncPersonas = (next: Persona[], prev: Persona[]) =>
  syncCollection(personaMapper, next, prev);
