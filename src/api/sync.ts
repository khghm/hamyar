import { supabase } from './supabase';

/**
 * Shared plumbing for the "collection" style tables (catalog, content, CRM).
 *
 * Every such table carries a `sku` column that holds the business key the SPA
 * already uses (`p1`, `m12`, `s7`, `n3`, `f2`, …). That keeps the 53 pages
 * working with the ids they already know while Postgres owns the primary key.
 *
 * The pattern is deliberately diff-based: the store hands over the *next* and
 * *previous* array, and only the rows that were added, changed or removed are
 * sent. No page has to change, and a full-array upsert of 60 rows never happens
 * on a single edit.
 *
 * Two conventions the mappers in `src/domains/*\/api.ts` rely on:
 *
 *   * `undefined` in the row object means "do not touch this column". PostgREST
 *     drops the key because `JSON.stringify` omits it, so the column keeps its
 *     `default …` on insert and its current value on conflict. Writing an
 *     explicit `null` instead would violate a `not null` column, and writing
 *     `now()` on every save would change the row fingerprint each time and
 *     produce an endless UPDATE loop.
 *   * `null` means "write NULL" and is only used for nullable columns the store
 *     can clear.
 */
export interface CollectionMapper<T> {
  table: string;
  /** Business-key column (`sku` everywhere today). */
  keyColumn: string;
  /** Store item -> database row (must not include timestamps). */
  toRow: (item: T) => Record<string, unknown>;
  /** Database row -> store item, or null to skip the row. */
  fromRow: (row: Record<string, any>) => T | null;
  /** Columns compared to decide whether a row actually changed. */
  compare?: string[];
  /** Restrict reads to active rows (public pages). */
  activeColumn?: string;
}

// ---------------------------------------------------------------------------
// Error reporting
//
// The store applies every edit optimistically, so a failed write-through used to
// disappear into `console.warn` and the admin saw "saved" while the change was
// gone. Listeners let the app surface it (the store pipes them into a toast)
// without turning a background sync into a thrown error.
// ---------------------------------------------------------------------------

export interface SyncErrorReport {
  table: string;
  /** How many rows could not be written. */
  rejected: number;
  /** Human-readable reason, straight from Postgres. */
  message: string;
  /** Business keys of the rejected rows (empty when the whole batch failed). */
  keys: string[];
}

type SyncErrorListener = (report: SyncErrorReport) => void;

const listeners = new Set<SyncErrorListener>();

/** Subscribe to write-through failures. Returns an unsubscribe function. */
export function onSyncError(listener: SyncErrorListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function reportSyncError(report: SyncErrorReport): void {
  for (const listener of listeners) {
    try {
      listener(report);
    } catch {
      // A broken listener must never break the sync itself.
    }
  }
}

export async function fetchCollection<T>(
  mapper: CollectionMapper<T>,
): Promise<T[]> {
  let query = supabase.from(mapper.table).select('*');
  if (mapper.activeColumn) query = query.eq(mapper.activeColumn, true);
  const { data, error } = await query;
  if (error) throw new Error(`${mapper.table}: ${error.message}`);
  return (data ?? [])
    .map(row => mapper.fromRow(row as Record<string, any>))
    .filter((item): item is T => item !== null);
}

function rowFingerprint(
  item: unknown,
  mapper: CollectionMapper<unknown>,
): string {
  const row = mapper.toRow(item);
  const keys = mapper.compare ?? Object.keys(row);
  const stable: Record<string, unknown> = {};
  for (const key of keys) stable[key] = row[key];
  return JSON.stringify(stable);
}

export interface SyncResult {
  ok: boolean;
  error?: string;
  inserted: number;
  updated: number;
  deleted: number;
  /** Business keys Postgres refused. Non-empty means a row needs manual fixing. */
  rejected: string[];
}

/**
 * Upserts rows, isolating a bad row instead of losing the whole batch.
 *
 * A multi-row `upsert` is a single statement, so one row that violates a CHECK
 * or a unique constraint aborts every other row too. Since the mappers are
 * written by hand against dozens of tables, a single un-normalized phone number
 * is enough to make an entire admin panel stop saving — silently. So a failed
 * batch is retried one row at a time: the good rows land, and the offending
 * business keys come back in `SyncResult.rejected` (and to the error listeners)
 * so the UI can name them.
 */
async function writeRows(
  table: string,
  keyColumn: string,
  rows: Record<string, unknown>[],
): Promise<{ saved: number; rejected: string[]; message?: string }> {
  if (!rows.length) return { saved: 0, rejected: [] };

  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: keyColumn });

  if (!error) return { saved: rows.length, rejected: [] };

  const rejected: string[] = [];
  let saved = 0;
  let lastMessage = error.message;

  for (const row of rows) {
    const { error: singleError } = await supabase
      .from(table)
      .upsert([row], { onConflict: keyColumn });
    if (singleError) {
      rejected.push(String(row[keyColumn] ?? '?'));
      lastMessage = singleError.message;
    } else {
      saved += 1;
    }
  }

  reportSyncError({ table, rejected: rejected.length, message: lastMessage, keys: rejected });
  return { saved, rejected, message: lastMessage };
}

/**
 * Reconciles one collection with Postgres. Fire-and-forget from the store: the UI
 * already applied the change optimistically, so a failure is reported through
 * `onSyncError`, not thrown.
 */
export async function syncCollection<T>(
  mapper: CollectionMapper<T>,
  next: T[],
  previous: T[],
): Promise<SyncResult> {
  const result: SyncResult = { ok: true, inserted: 0, updated: 0, deleted: 0, rejected: [] };

  try {
    const keyOf = (item: T) =>
      String((mapper.toRow(item) as Record<string, unknown>)[mapper.keyColumn] ?? '');

    const nextByKey = new Map(next.map(item => [keyOf(item), item]));
    const prevByKey = new Map(previous.map(item => [keyOf(item), item]));

    const inserted: Record<string, unknown>[] = [];
    const updated: Record<string, unknown>[] = [];

    for (const [key, item] of nextByKey) {
      if (!key) continue;
      const before = prevByKey.get(key);
      if (!before) {
        inserted.push(mapper.toRow(item));
      } else if (rowFingerprint(item, mapper as CollectionMapper<unknown>) !==
                 rowFingerprint(before, mapper as CollectionMapper<unknown>)) {
        updated.push(mapper.toRow(item));
      }
    }

    const removed = [...prevByKey.keys()].filter(key => key && !nextByKey.has(key));

    if (inserted.length) {
      const outcome = await writeRows(mapper.table, mapper.keyColumn, inserted);
      result.inserted = outcome.saved;
      result.rejected.push(...outcome.rejected);
      if (outcome.message) result.error = outcome.message;
    }

    if (updated.length) {
      const outcome = await writeRows(mapper.table, mapper.keyColumn, updated);
      result.updated = outcome.saved;
      result.rejected.push(...outcome.rejected);
      if (outcome.message) result.error = outcome.message;
    }

    if (removed.length) {
      const { error } = await supabase
        .from(mapper.table)
        .delete()
        .in(mapper.keyColumn, removed);
      if (error) {
        result.ok = false;
        result.error = error.message;
        reportSyncError({
          table: mapper.table,
          rejected: removed.length,
          message: error.message,
          keys: removed,
        });
        return result;
      }
      result.deleted = removed.length;
    }

    if (result.rejected.length) result.ok = false;
  } catch (err) {
    result.ok = false;
    result.error = err instanceof Error ? err.message : String(err);
    console.error(`[sync] ${mapper.table} write-through failed:`, result.error);
    reportSyncError({ table: mapper.table, rejected: 0, message: result.error, keys: [] });
  }

  return result;
}
