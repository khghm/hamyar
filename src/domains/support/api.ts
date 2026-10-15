import type { Note, Review, SmsLog } from '../types';
import { fetchCollection, syncCollection, type CollectionMapper } from '../../api/sync';
import { fromDbDate, fromDbTimestamp, toDbDate, toDbRating, toDbTimestamp } from '../db-helpers';

/**
 * فاز ۲.۳ — ماژول سرویس دامنهٔ پشتیبانی و بازخورد.
 *
 * `tickets` و `training_sites` عمداً اینجا نیستند:
 *
 *   * `tickets` چون RLS آن «فقط خودِ مشتری» است و کلیدش `sku` دارد اما ستون
 *     `code` ندارد و پیام‌ها ساختار jsonb جداگانه‌ای می‌خواهند؛ مسیر حساسِ
 *     مالکیت مشتری جداست.
 *   * `training_sites` گروه‌بندی‌شده است و ساختارش با سایر کلکسیون‌ها فرق دارد.
 */

// ── یادداشت‌ها ─────────────────────────────────────────────────────────────
/**
 * `created_by` عمداً نوشته نمی‌شود: در دیتابیس نام کارمند است و در فروشگاه
 * `Note` چنین فیلدی ندارد. نوشتن `customerName` آنجا یعنی نام مشتری به‌جای نام
 * کارمند ذخیره شود — داده‌ای که هرگز درست نیست.
 *
 * ستون‌های قدیمی `body`/`category`/`public` هم نوشته نمی‌شوند چون معادلی در
 * `Note` ندارند.
 */
export const noteMapper: CollectionMapper<Note> = {
  table: 'notes',
  keyColumn: 'sku',
  toRow: (n) => ({
    sku: n.id,
    title: n.title,
    customer_name: n.customerName || null,
    customer_phone: n.customerPhone || null,
    task: n.task || null,
    priority: n.priority,
    status: n.status,
    due_date: toDbDate(n.dueDate),
    completed_at: toDbDate(n.completedAt),
    tags: n.tags ?? [],
    content: n.content ?? '',
  }),
  fromRow: (r) => ({
    id: r.sku ?? r.id,
    title: r.title ?? '',
    customerName: r.customer_name ?? '',
    customerPhone: r.customer_phone ?? '',
    task: r.task ?? '',
    priority: (r.priority as Note['priority']) ?? 'medium',
    status: (r.status as Note['status']) ?? 'pending',
    dueDate: r.due_date ? fromDbDate(r.due_date) : undefined,
    createdAt: r.created_at ?? new Date().toISOString(),
    completedAt: r.completed_at ? fromDbDate(r.completed_at) : undefined,
    tags: Array.isArray(r.tags) ? r.tags : [],
    content: r.content ?? '',
  }),
};

// ── نظرات ──────────────────────────────────────────────────────────────────
/**
 * پیوند نظر با محصول از راه کلید تجاری (`product_sku`) نگه داشته می‌شود، نه
 * `product_id`. ستون `product_id` یک uuid به `products.id` است و فروشگاه با
 * کلید تجاری (`p1`) کار می‌کند، پس نوشتن `null` در آن یعنی هر بار تأیید یک
 * نظر، پیوندش را پاک می‌کرد و نظر از صفحهٔ محصول ناپدید می‌شد.
 * `migration 011` ستون `product_sku` را اضافه کرد و ردیف‌های قدیمی را از روی
 * `product_id` برگرداند.
 *
 * `date` در این جدول عمداً متن است، چون در فروشگاه تاریخ نمایشی شمسی ذخیره
 * می‌شود؛ پس برخلاف بقیهٔ mapperها نرمال‌سازی نمی‌شود.
 */
export const reviewMapper: CollectionMapper<Review> = {
  table: 'reviews',
  keyColumn: 'sku',
  toRow: (r) => ({
    sku: r.id,
    product_sku: r.productId || null,
    name: r.customerName,
    rating: toDbRating(r.rating),
    comment: r.comment,
    date: r.date,
    approved: r.approved,
  }),
  fromRow: (r) => ({
    id: r.sku ?? r.id,
    productId: r.product_sku ?? '',
    customerName: r.name ?? '',
    rating: Number(r.rating) || 0,
    comment: r.comment ?? '',
    date: r.date ?? '',
    approved: r.approved ?? false,
  }),
};

// ── پیامک‌ها ───────────────────────────────────────────────────────────────
/**
 * نکتهٔ مهم: این کلکسیون فقط زیاد می‌شود و کاربر معمولاً هرگز آن را ویرایش یا
 * حذف نمی‌کند. diff-based sync برایش هزینه دارد بی‌دلیل، ولی چون کلید `sku`
 * دارد همان مسان استاندارد را می‌رود و رفتار یکدست می‌ماند.
 *
 * `sent_at` در دیتابیس `not null default now()` است. تاریخ خالی فروشگاه به
 * `now()` تبدیل نمی‌شود — کلید از payload حذف می‌شود تا پیش‌فرض ستون اعمال شود،
 * وگرنه اثر انگشت ردیف در هر ذخیره‌سازی عوض می‌شد و UPDATE بی‌پایان می‌زد.
 *
 * ساعت اینجا معنا دارد (پیامک دقیقاً کِی ارسال شد)، پس برخلاف بقیهٔ
 * mapperها مقدار به روز کوتاه نمی‌شود.
 */
export const smsLogMapper: CollectionMapper<SmsLog> = {
  table: 'sms_logs',
  keyColumn: 'sku',
  toRow: (s) => ({
    sku: s.id,
    phone: s.phone,
    message: s.message,
    status: s.status,
    sent_at: toDbTimestamp(s.date),
  }),
  fromRow: (r) => ({
    id: r.sku ?? r.id,
    phone: r.phone ?? '',
    message: r.message ?? '',
    status: (r.status as SmsLog['status']) ?? 'sent',
    date: fromDbTimestamp(r.sent_at) || fromDbTimestamp(r.created_at),
  }),
};

export const fetchNotes = () => fetchCollection(noteMapper);
export const fetchReviews = () => fetchCollection(reviewMapper);
export const fetchSmsLogs = () => fetchCollection(smsLogMapper);

export const syncNotes = (next: Note[], prev: Note[]) => syncCollection(noteMapper, next, prev);
export const syncReviews = (next: Review[], prev: Review[]) =>
  syncCollection(reviewMapper, next, prev);
export const syncSmsLogs = (next: SmsLog[], prev: SmsLog[]) =>
  syncCollection(smsLogMapper, next, prev);
