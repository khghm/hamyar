import { supabase } from './supabase';
import type { AdminNotification } from '../store';

/**
 * Maps a Postgres row to the store shape. Exported for the mapper tests, which
 * pin the `dedupe_key` round-trip that stops re-announced events.
 */
export const toNotification = (r: Record<string, any>): AdminNotification => ({
  id: r.id,
  type: r.type,
  priority: r.priority,
  title: r.title ?? '',
  message: r.message ?? '',
  link: r.link ?? undefined,
  read: r.read === true,
  createdAt: r.created_at,
  userId: r.user_id ?? null,
  // Must be restored from the row, otherwise the dedupe guard in
  // `pushNotification` sees every rehydrated notification as keyless and
  // re-announces it on the next page load.
  dedupeKey: r.dedupe_key ?? undefined,
});

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * True when the id came from Postgres. Optimistic rows created in the browser use
 * a `ntf…` prefix, and server writes must never be attempted for those.
 */
export function isServerNotificationId(id: string): boolean {
  return UUID_PATTERN.test(id);
}

export async function fetchNotifications(): Promise<AdminNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    console.warn('[notifications] read failed:', error.message);
    return [];
  }
  return (data ?? []).map(toNotification);
}

export async function createNotification(input: {
  type: string;
  priority: string;
  title: string;
  message: string;
  link?: string;
  userId?: string | null;
  dedupeKey?: string;
}): Promise<{ ok: boolean; error?: string; id?: string; duplicate?: boolean }> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      type: input.type,
      priority: input.priority,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
      user_id: input.userId ?? null, // null = broadcast to every admin
      dedupe_key: input.dedupeKey ?? null,
      read: false,
    })
    .select('id')
    .single();
  if (error) {
    // The partial unique index already rejected a re-announced event. Two admins
    // can open the admin panel at the same moment, so the loser's insert races
    // here. That is the dedupe working, not a failure: report success without an
    // id and the caller keeps only the authoritative row.
    if (error.code === '23505') return { ok: true, duplicate: true };
    return { ok: false, error: error.message };
  }
  return { ok: true, id: data.id };
}

export async function markNotificationRead(
  id: string,
  read = true,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('notifications').update({ read }).eq('id', id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/**
 * Marks the caller's own unread notifications as read.
 *
 * The scope is deliberately restricted to `user_id = <caller>`: broadcast rows
 * (`user_id is null`) are a single shared record, so marking them read would
 * clear the inbox of every other admin as well. Broadcast rows therefore stay
 * unread in the list.
 */
export async function markAllNotificationsRead(
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!userId) return { ok: false, error: 'missing user id' };
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false)
    .eq('user_id', userId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/**
 * حذف یک اعلان از سرور.
 *
 * `select('id')` عمداً اضافه شده است: PostgREST برای DELETE‌ای که با RLS هیچ
 * ردیفی را حذف نکند هم ۲۰۴ برمی‌گرداند و خطا نمی‌دهد؛ بدون این کار نمی‌شد فهمید
 * حذف واقعاً انجام شده یا فقط از state محلی پاک شده است.
 */
export async function deleteNotification(id: string): Promise<{ ok: boolean; error?: string; deleted?: boolean }> {
  const { data, error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .select('id');
  if (error) return { ok: false, error: error.message };
  return { ok: true, deleted: Array.isArray(data) && data.length > 0 };
}

/** پاک کردن همهٔ اعلان‌های خوانده‌شده — این بار واقعاً روی سرور. */
export async function clearReadNotifications(): Promise<{ ok: boolean; error?: string; deleted?: number }> {
  const { data, error } = await supabase
    .from('notifications')
    .delete()
    .eq('read', true)
    .select('id');
  if (error) return { ok: false, error: error.message };
  return { ok: true, deleted: Array.isArray(data) ? data.length : 0 };
}
