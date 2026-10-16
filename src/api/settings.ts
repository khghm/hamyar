import { supabase } from './supabase';

/**
 * Single-row / single-document settings tables. Two shapes exist in the schema:
 *
 *   • keyed documents — `about_content(key, content)`, `site_settings(key, value)`
 *   • singleton documents — `gamification_settings(config)`,
 *     `notification_settings(user_id, config)`
 *
 * Both get a tiny API here instead of the collection helpers in `sync.ts`,
 * because a document is written as a whole, never diffed row by row.
 */

// --- keyed documents ---------------------------------------------------------

export async function fetchSettingsDoc<T>(
  table: string,
  key: string,
  column = 'value',
): Promise<T | null> {
  const { data, error } = await supabase
    .from(table)
    .select(column)
    .eq('key', key)
    .maybeSingle();
  if (error) {
    console.warn(`[settings] ${table}/${key} read failed:`, error.message);
    return null;
  }
  const row = data as Record<string, unknown> | null;
  return row ? (row[column] as T) : null;
}

export async function saveSettingsDoc<T>(
  table: string,
  key: string,
  value: T,
  column = 'value',
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from(table)
    .upsert({ key, [column]: value }, { onConflict: 'key' });
  if (error) {
    console.warn(`[settings] ${table}/${key} write failed:`, error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export const fetchAboutContent = <T>() => fetchSettingsDoc<T>('about_content', 'about', 'content');
export const saveAboutContent = <T>(value: T) => saveSettingsDoc('about_content', 'about', value, 'content');

/**
 * بنرهای صفحات. تصویر هر بنر خودش در باکت `images` می‌نشیند و اینجا فقط سندِ
 * بنرها (شامل URL تصویر) نگه‌داری می‌شود. عمداً از جدول `about_content`
 * استفاده می‌کنیم نه `site_settings`: پالیسی `anon_read_about` خواندن این جدول را
 * برای بازدیدکنندهٔ مهمان آزاد می‌گذارد، پس سایت عمومی می‌تواند بنرها را
 * مستقیماً از دیتابیس بخواند؛ `site_settings` فقط با `perm30/perm31` خوانده
 * می‌شود و برای مهمان قابل دسترسی نیست.
 */
export const fetchBanners = <T>() => fetchSettingsDoc<T>('about_content', 'banners', 'content');
export const saveBanners = <T>(value: T) => saveSettingsDoc('about_content', 'banners', value, 'content');

export const fetchSiteSettings = <T>() => fetchSettingsDoc<T>('site_settings', 'site');
export const saveSiteSettings = <T>(value: T) => saveSettingsDoc('site_settings', 'site', value);

// --- gamification (singleton row) -------------------------------------------

export async function fetchGamificationConfig<T>(): Promise<T | null> {
  const { data, error } = await supabase
    .from('gamification_settings')
    .select('config')
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn('[settings] gamification_settings read failed:', error.message);
    return null;
  }
  return (data?.config as T) ?? null;
}

export async function saveGamificationConfig<T>(config: T): Promise<{ ok: boolean; error?: string }> {
  const { data: existing } = await supabase
    .from('gamification_settings')
    .select('id')
    .limit(1)
    .maybeSingle();

  const query = existing
    ? supabase.from('gamification_settings').update({ config }).eq('id', existing.id)
    : supabase.from('gamification_settings').insert({ config });

  const { error } = await query;
  if (error) {
    console.warn('[settings] gamification_settings write failed:', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// --- notification settings (per user) ---------------------------------------

export async function fetchNotificationConfig<T>(userId: string): Promise<T | null> {
  const { data, error } = await supabase
    .from('notification_settings')
    .select('config')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.warn('[settings] notification_settings read failed:', error.message);
    return null;
  }
  return (data?.config as T) ?? null;
}

export async function saveNotificationConfig<T>(
  userId: string,
  config: T,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('notification_settings')
    .upsert({ user_id: userId, config }, { onConflict: 'user_id' });
  if (error) {
    console.warn('[settings] notification_settings write failed:', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
