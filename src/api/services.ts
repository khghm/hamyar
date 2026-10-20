import type { Service, ProjectService, NewsItem, FaqItem, PortfolioItem } from '../store';
import { fetchCollection, syncCollection, type CollectionMapper } from './sync';

/**
 * Catalog + content services. `fields` / `docs` (the ordering wizard schema)
 * are JSONB columns, so they travel as-is.
 *
 * چرا هیچ mapper از `activeColumn` استفاده نمی‌کند
 * -------------------------------------------------
 * `activeColumn` یعنی «هنگام خواندن فقط ردیف‌های فعال را بیاور». برای سایت
 * عمومی درست است، ولی یک مشکل می‌سازد: state فروشگاه بین سایت عمومی و پنل مدیریت
 * مشترک است. اگر ردیف‌های غیرفعال اصلاً وارد state نشوند، مدیری که یک خدمت یا
 * خبر را غیرفعال می‌کند، بعد از بارگذاری مجدد آن را در پنل نمی‌بیند و دیگر
 * نمی‌تواند دوباره فعالش کند — عملاً رکورد برای همیشه گم می‌شود.
 *
 * نکتهٔ کلیدی: این فیلتر سمت کلاینت اعمال می‌شود، پس نقش را نمی‌فهمد — برای
 * مهمان و کارمند یکسان است. یعنی حتی وقتی RLS اجازهٔ خواندن ردیف غیرفعال را به
 * کارمند داده باشد، این `.eq()` باز هم آن را حذف می‌کند. مجوز RLS را دور زدن
 * با فیلتر کلاینت، بدترین حالت است: پنل بی‌دلیل رکورد را نشان نمی‌دهد.
 *
 * بنابراین برای `services` و `news` این فیلتر برداشته شده و تضمین «منتشرشده
 * فقط وقتی فعال است» به دو جای دیگر منتقل شده که هر دو مستقل از state هستند:
 *
 *   * policy مربوطه در RLS (`anon_read_services` / `anon_read_news`) که
 *     `active = true` را برای همه اعمال می‌کند، پس بازدیدکنندهٔ مهمان اصلاً
 *     ردیف غیرفعال را از دیتابیس نمی‌گیرد؛
 *   * خود صفحه‌های عمومی که روی `active` فیلتر می‌کنند
 *     (`Services.tsx`، `News.tsx`، `Home.tsx`، `NewsDetail.tsx`،
 *     `ServiceOrder.tsx`).
 *
 * `portfolio` هم از همین فیلتر بیرون آمد. قبلاً استثنا بود با این استدلال که
 * `PortfolioItem` در فروشگاه فیلد `active` ندارد و پس «این فیلتر تنها محافظ آن
 * است»؛ ولی همان نداشتنِ فیلد، فیلتر را بی‌فایده و مضر می‌کرد: کلاینت `.eq('active',
 * true)` را برای *هر* نقش اعمال می‌کرد، پس کارمندِ دارای `perm30`/`perm31` هم
 * ردیف غیرفعال را از RLS رد می‌کرد و هرگز نمی‌دیدش — و چون فیلدی برای نمایشش
 * وجود نداشت، راهی هم برای فعال‌کردن دوبارهٔ آن نبود. یعنی یک ردیف با
 * `active = false` عملاً برای همیشه گم می‌شد. امروز همان دو سازوکار مستقلِ بالا
 * کافی‌اند: `anon_read_portfolio` برای بازدیدکنندهٔ مهمان و
 * `staff_manage_portfolio` (مهاجرت ۰۱۲، `for all`) برای کارمند.
 *
 * توجه: `toRow` همچنان `active` را همیشه `true` می‌نویسد، چون `PortfolioItem`
 * فیلد `active` ندارد و مدلِ نوشتنِ این جدول همین است. این یعنی فعال/غیرفعال
 * کردن نمونهٔ کار از پنل اصلاً پشتیبانی نمی‌شود — اگر روزی لازم شد، باید فیلد
 * `active` به `PortfolioItem` اضافه و در صفحهٔ پنل هم ویرایش‌پذیر شود، نه اینکه
 * به فیلترِ خواندن پناه ببریم.
 *
 * گزینهٔ `activeColumn` در `CollectionMapper` عمداً نگه داشته شده (هیچ mapper
 * فعلی ستش نمی‌کند) چون زیرساخت عمومی است؛ اگر روزی لازم شد، شرطش این است که
 * جدول فقط یک نقش داشته باشد — یعنی هیچ کارمندی نباید به رکورد غیرفعال نیاز داشته
 * باشد. برای هر کاتالوگی که پنل مدیریت دارد، جای درستش policy است نه این گزینه.
 */
export const serviceMapper: CollectionMapper<Service> = {
  table: 'services',
  keyColumn: 'sku',
  toRow: (s) => ({
    sku: s.id,
    name: s.name,
    category: s.category,
    base_price: Math.round(s.basePrice),
    unit: s.unit,
    description: s.description,
    active: s.active,
    fields: s.fields ?? null,
    docs: s.docs ?? null,
  }),
  fromRow: (r) => ({
    id: r.sku ?? r.id,
    name: r.name,
    category: r.category ?? '',
    basePrice: Number(r.base_price) || 0,
    unit: r.unit,
    description: r.description ?? '',
    active: r.active !== false,
    fields: r.fields ?? undefined,
    docs: r.docs ?? undefined,
  }),
};

export const projectServiceMapper: CollectionMapper<ProjectService> = {
  table: 'project_services',
  keyColumn: 'sku',
  toRow: (p) => ({
    sku: p.id,
    title: p.title,
    group: p.group,
    icon: p.icon,
    desc: p.desc,
    features: p.features ?? [],
    base_price: Math.round(p.basePrice),
    unit: p.unit,
    fields: p.fields ?? [],
    docs: p.docs ?? [],
  }),
  fromRow: (r) => ({
    id: r.sku ?? r.id,
    title: r.title,
    group: r.group,
    icon: r.icon ?? '',
    desc: r.desc ?? '',
    features: r.features ?? [],
    basePrice: Number(r.base_price) || 0,
    unit: r.unit ?? '',
    fields: r.fields ?? [],
    docs: r.docs ?? [],
  }),
};

export const newsMapper: CollectionMapper<NewsItem> = {
  table: 'news',
  keyColumn: 'sku',
  toRow: (n) => ({
    sku: n.id,
    title: n.title,
    image: n.image || null,
    caption: n.caption ?? null,
    content: n.content ?? null,
    date: n.date,
    active: n.active,
    ...(n.slug !== undefined ? { slug: n.slug } : {}),
    ...(n.excerpt !== undefined ? { excerpt: n.excerpt } : {}),
    ...(n.category !== undefined ? { category: n.category } : {}),
    ...(n.tags !== undefined ? { tags: n.tags } : {}),
    ...(n.status !== undefined ? { status: n.status } : {}),
    ...(n.publishedAt !== undefined ? { published_at: n.publishedAt } : {}),
    ...(n.seoTitle !== undefined ? { seo_title: n.seoTitle } : {}),
    ...(n.seoDescription !== undefined ? { seo_description: n.seoDescription } : {}),
    ...(n.coverAlt !== undefined ? { cover_alt: n.coverAlt } : {}),
    ...(n.author !== undefined ? { author: n.author } : {}),
    ...(n.readingMinutes !== undefined ? { reading_minutes: n.readingMinutes } : {}),
    ...(n.views !== undefined ? { views: n.views } : {}),
  }),
  fromRow: (r) => ({
    id: r.sku ?? r.id,
    title: r.title,
    image: r.image ?? '',
    caption: r.caption ?? '',
    content: r.content ?? '',
    date: r.date ?? '',
    active: r.active !== false,
    slug: r.slug ?? '',
    excerpt: r.excerpt ?? '',
    category: r.category ?? '',
    tags: Array.isArray(r.tags) ? r.tags : [],
    status: (r.status === 'draft' ? 'draft' : 'published') as 'draft' | 'published',
    publishedAt: r.published_at ?? undefined,
    seoTitle: r.seo_title ?? '',
    seoDescription: r.seo_description ?? '',
    coverAlt: r.cover_alt ?? '',
    author: r.author ?? '',
    readingMinutes: Number(r.reading_minutes) || undefined,
    views: Number(r.views) || 0,
  }),
};

export const faqMapper: CollectionMapper<FaqItem> = {
  table: 'faqs',
  keyColumn: 'sku',
  toRow: (f) => ({
    sku: f.id,
    question: f.question,
    answer: f.answer,
    category: f.category,
  }),
  fromRow: (r) => ({
    id: r.sku ?? r.id,
    question: r.question,
    answer: r.answer,
    category: r.category ?? 'عمومی',
  }),
};

export const portfolioMapper: CollectionMapper<PortfolioItem> = {
  table: 'portfolio',
  keyColumn: 'sku',
  toRow: (p) => ({
    sku: p.id,
    title: p.title,
    description: p.description ?? null,
    image: p.image || null,
    link: p.link ?? null,
    type: p.type,
    technologies: p.technologies ?? [],
    active: true,
  }),
  fromRow: (r) => ({
    id: r.sku ?? r.id,
    title: r.title,
    description: r.description ?? '',
    image: r.image ?? '',
    link: r.link ?? '',
    type: r.type ?? '',
    technologies: r.technologies ?? [],
  }),
};

export const fetchServices = () => fetchCollection(serviceMapper);
export const fetchProjectServices = () => fetchCollection(projectServiceMapper);
export const fetchNews = () => fetchCollection(newsMapper);
export const fetchFaqs = () => fetchCollection(faqMapper);
export const fetchPortfolio = () => fetchCollection(portfolioMapper);

export const syncServices = (next: Service[], previous: Service[]) =>
  syncCollection(serviceMapper, next, previous);
export const syncProjectServices = (next: ProjectService[], previous: ProjectService[]) =>
  syncCollection(projectServiceMapper, next, previous);
export const syncNews = (next: NewsItem[], previous: NewsItem[]) =>
  syncCollection(newsMapper, next, previous);
export const syncFaqs = (next: FaqItem[], previous: FaqItem[]) =>
  syncCollection(faqMapper, next, previous);
export const syncPortfolio = (next: PortfolioItem[], previous: PortfolioItem[]) =>
  syncCollection(portfolioMapper, next, previous);
