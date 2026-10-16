import { supabase } from './supabase';
import type { CollectionMapper } from '../api/sync';

/**
 * Supabase realtime payload for a postgres_changes event.
 */
export interface PostgresChangePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, any> | null;
  old: Record<string, any> | null;
}

export type ChangeHandler = (payload: PostgresChangePayload) => void;

/**
 * Subscribe to postgres_changes for a single table.
 *
 * Returns an unsubscribe function. The handler receives the raw Supabase
 * payload so the caller can apply incremental updates directly from `new`
 * (INSERT/UPDATE) or `old` (DELETE) — no full-table re-fetch.
 */
export function subscribeTableChanges(
  channelName: string,
  table: string,
  handler: ChangeHandler,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*',
): () => void {
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { event, schema: 'public', table }, (payload: any) => {
        handler({
          eventType: payload.eventType,
          new: payload.new ?? null,
          old: payload.old ?? null,
        });
      })
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        console.warn(`[realtime] connection ${status.toLowerCase()} on ${channelName}`);
      }
    });

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch {
      /* ignore */
    }
  };
}

/**
 * Apply a single postgres_changes event to a flat list of store items using a
 * CollectionMapper's `fromRow`.
 *
 * - INSERT: add the converted item to the front (skipping duplicates by id).
 * - UPDATE: merge the converted item into the existing one.
 * - DELETE: remove the item by its key.
 *
 * Returns a new array (immutable). When the event cannot be applied
 * incrementally (e.g. a DELETE whose old row lacks the business key), the
 * original array is returned unchanged and the caller may fall back to a
 * debounced full refresh.
 */
export function applyCollectionChange<T extends { id: string }>(
  current: T[],
  payload: PostgresChangePayload,
  mapper: CollectionMapper<T>,
): { items: T[]; changed: boolean } {
  const { eventType, new: newRow, old: oldRow } = payload;

  if (eventType === 'DELETE') {
    if (!oldRow) return { items: current, changed: false };
    const key = String(oldRow[mapper.keyColumn] ?? oldRow.id ?? '');
    if (!key) return { items: current, changed: false };
    const next = current.filter(item => item.id !== key);
    return { items: next, changed: next.length !== current.length };
  }

  if (!newRow) return { items: current, changed: false };

  const item = mapper.fromRow(newRow);
  if (!item) return { items: current, changed: false };

  const idx = current.findIndex(c => c.id === item.id);
  if (idx === -1) {
    return { items: [item, ...current], changed: true };
  }
  const merged = { ...current[idx], ...item } as T;
  const next = current.slice();
  next[idx] = merged;
  return { items: next, changed: true };
}

/**
 * Subscribe to postgres_changes for a collection table and apply incremental
 * updates directly to a Zustand store.
 *
 * This replaces the old pattern of "realtime event triggers a full table
 * re-fetch" with true incremental updates: each INSERT/UPDATE/DELETE only
 * touches the affected row, so a burst of 50 changes produces 50 cheap
 * in-memory merges instead of 50 full SELECT * queries.
 *
 * `apply` receives the new array and the caller is responsible for calling
 * `setState`. `getCurrent` returns the current list (used to compute the
 * merge). An optional `onFallback` is invoked when a DELETE cannot be
 * resolved incrementally (old row lacks the business key) so the caller can
 * trigger a debounced full refresh.
 */
export function subscribeCollectionRealtime<T extends { id: string }>(
  mapper: CollectionMapper<T>,
  getCurrent: () => T[],
  apply: (next: T[]) => void,
  onFallback?: () => void,
): () => void {
  return subscribeTableChanges(
    `${mapper.table}-realtime`,
    mapper.table,
    (payload) => {
      const current = getCurrent();
      const { items, changed } = applyCollectionChange(current, payload, mapper);
      if (changed) {
        apply(items);
      } else if (payload.eventType === 'DELETE' && onFallback) {
        onFallback();
      }
    },
  );
}

/**
 * Create a debounced version of a function. The debounced function waits
 * `wait` ms after the last call before invoking `fn`. Calls during the wait
 * window reset the timer.
 */
export function debounce<A extends any[]>(
  fn: (...args: A) => void,
  wait = 300,
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, wait);
  };
}

/**
 * Register a visibility-change listener that triggers a refresh when the tab
 * becomes visible again. The refresh is debounced so rapid tab switches don't
 * cause a storm of re-fetches.
 */
export function onTabVisible(fn: () => void, debounceMs = 500): () => void {
  const debounced = debounce(fn, debounceMs);
  const handler = () => {
    if (document.visibilityState === 'visible') {
      debounced();
    }
  };
  document.addEventListener('visibilitychange', handler);
  return () => {
    document.removeEventListener('visibilitychange', handler);
  };
}
