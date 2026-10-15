import { describe, expect, it } from 'vitest';
import { toNotification as toNotificationRow, isServerNotificationId } from '../api/notifications';

/**
 * تست اعلان‌ها — گام ۱۸
 *
 * یک باگ واقعی: `pushNotification` در `src/store.tsx` برای هر رویداد یک
 * `key` می‌گیرد و قبل از ساخت اعلان، لیست را می‌گردد تا همان رویداد دوباره
 * اعلان نکند. ولی `dedupeKey` فقط روی شیء درون‌حافظه‌ای ست می‌شد و هرگز به
 * Postgres نمی‌رفت.
 *
 * اثر آن این بود که بعد از هر بار بارگذاری مجدد صفحه (hydrate از سرور)، تمام
 * اعلان‌ها `dedupeKey === undefined` بودند و guard آن‌ها را نمی‌دید. در عمل در
 * کمتر از یک ساعت ۳۷۳ ردیف `stock` از فقط ۲۰ پیام یکتا ساخته شد، چون هر بار
 * که پنل مدیر باز می‌شد، برای هر محصولِ زیر آستانه یک اعلان سراسری دوباره درج
 * و به همهٔ مدیران نمایش داده می‌شد.
 *
 * این تست همان نقطهٔ شکست را نگه می‌دارد: کلید باید از ردیف سرور بازسازی شود.
 */

const row = (over: Record<string, unknown> = {}) => ({
  id: '11111111-1111-1111-1111-111111111111',
  type: 'stock',
  priority: 'high',
  title: 'هشدار موجودی انبار',
  message: 'موجودی «وبکم ۴K» به ۶ عدد رسید (آستانه هشدار: ۱۰).',
  link: '/admin/products',
  read: false,
  created_at: '2026-10-05T12:00:00.000Z',
  user_id: null,
  ...over,
});

describe('بازسازی کلید یکتایی از ردیف سرور', () => {
  it('کلید ذخیره‌شده را برمی‌گرداند تا guard بعد از hydrate فعال بماند', () => {
    const n = toNotificationRow(row({ dedupe_key: 'stock-p42-6' }));
    expect(n.dedupeKey).toBe('stock-p42-6');
  });

  it('کلید نداشتن ردیف به‌معنای «بی‌کلید» است، نه کلید خالی', () => {
    // رشتهٔ خالی کلیدِ معتبرِ یکتایی می‌شد و guard آن را با ردیف‌های
    // بدون کلید اشتباه می‌گرفت؛ `undefined` درست است.
    const n = toNotificationRow(row({ dedupe_key: null }));
    expect(n.dedupeKey).toBeUndefined();
  });

  it('ستون گمشده در ردیف قدیمی، بدون خطا کلید نداشتن می‌دهد', () => {
    const n = toNotificationRow(row());
    expect(n.dedupeKey).toBeUndefined();
    expect(n.type).toBe('stock');
  });

  it('دو بار hydrate کردن یک ردیف، همان کلید را می‌دهد', () => {
    // همین ثبات است که از انباشت دوباره جلوگیری می‌کند: اگر کلید بین دو
    // بارگذاری عوض می‌شد، هر بار کلید «تازه» به نظر می‌رسید.
    const a = toNotificationRow(row({ dedupe_key: 'stock-p42-6' }));
    const b = toNotificationRow(row({ dedupe_key: 'stock-p42-6' }));
    expect(a.dedupeKey).toBe(b.dedupeKey);
  });
});

describe('مرزبندی کلید یکتایی', () => {
  it('کلید یکسان روی دو اعلان سراسری، تکرار همان رویداد است', () => {
    const first = toNotificationRow(row({ dedupe_key: 'stock-p42-6' }));
    const again = toNotificationRow(
      row({ id: '22222222-2222-2222-2222-222222222222', dedupe_key: 'stock-p42-6' }),
    );
    expect(first.dedupeKey).toBe(again.dedupeKey);
  });

  it('کلید یکسان روی دو اعلان شخصیِ دو کاربر مجاز است', () => {
    // یکتایی در پایگاه‌داده فقط برای ردیف‌های سراسری است
    // (`user_id is null`)، وگرنه اعلان یک کاربر برای دیگری حذف می‌شد.
    const a = toNotificationRow(
      row({ user_id: 'aaaaaaaa-0000-0000-0000-000000000000', dedupe_key: 'stock-p42-6' }),
    );
    const b = toNotificationRow(
      row({ user_id: 'bbbbbbbb-0000-0000-0000-000000000000', dedupe_key: 'stock-p42-6' }),
    );
    expect(a.dedupeKey).toBe(b.dedupeKey);
    expect(a.userId).not.toBe(b.userId);
  });

  it('موجودی متفاوت برای همان محصول، کلید متفاوت می‌دهد', () => {
    // الگوی کلید در store سری «موجودی» را دارد تا افت دوبارهٔ موجودی پس از
    // شارژ انبار، هشدار تازه بدهد.
    const before = toNotificationRow(row({ dedupe_key: 'stock-p42-9' }));
    const after = toNotificationRow(row({ dedupe_key: 'stock-p42-6' }));
    expect(before.dedupeKey).not.toBe(after.dedupeKey);
  });
});

describe('تشخیص شناسهٔ سروری', () => {
  it('شناسهٔ خوش‌بینانهٔ مرورگر سروری نیست و نباید روی آن نوشت', () => {
    expect(isServerNotificationId('ntf1738000000000abcd')).toBe(false);
  });

  it('uuid واقعی سروری است', () => {
    expect(isServerNotificationId('11111111-1111-1111-1111-111111111111')).toBe(true);
  });
});
