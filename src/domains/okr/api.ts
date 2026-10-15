import type { OKR, KPI } from '../types';
import { fetchCollection, syncCollection, type CollectionMapper } from '../../api/sync';
import { fromDbDate, toDbDate } from '../db-helpers';

/**
 * فاز ۲.۳ — ماژول سرویس دامنهٔ OKR / KPI.
 *
 * هر دو سربرگ تخت‌اند و mapper دارند. `key_results` فرزند `okrs` است: کلیدش باید
 * از `uuid` خود OKR بیاید و mapper تخت این را نمی‌پوشاند، پس `keyResults` در
 * `fromRow` خالی برمی‌گردد و همگام‌سازی آن جداگانه انجام می‌شود. بهتر از وانمود
 * کردن به این است که داده از دیتابیس آمده، وقتی نیست.
 *
 * `assigned_to` در دیتابیس متن آزاد است (نه کلید خارجی)، پس همان شناسهٔ
 * کارمند در فروشگاه (`emp1`) بی‌واسطه ذخیره و بازیابی می‌شود.
 */

export const okrMapper: CollectionMapper<OKR> = {
  table: 'okrs',
  keyColumn: 'sku',
  toRow: (o) => ({
    sku: o.id,
    title: o.title,
    description: o.description,
    type: o.type,
    assigned_to: o.assignedTo ?? null,
    quarter: o.quarter,
    year: Math.round(o.year ?? 0),
    start_date: toDbDate(o.startDate),
    end_date: toDbDate(o.endDate),
    status: o.status,
  }),
  fromRow: (r) => ({
    id: r.sku ?? r.id,
    title: r.title ?? '',
    description: r.description ?? '',
    type: (r.type as OKR['type']) ?? 'organizational',
    assignedTo: r.assigned_to ?? undefined,
    keyResults: [],
    startDate: fromDbDate(r.start_date),
    endDate: fromDbDate(r.end_date),
    quarter: r.quarter ?? '',
    year: Number(r.year) || 0,
    status: r.status ?? 'active',
    createdAt: r.created_at ?? new Date().toISOString(),
  }),
};

export const kpiMapper: CollectionMapper<KPI> = {
  table: 'kpis',
  keyColumn: 'sku',
  toRow: (k) => ({
    sku: k.id,
    title: k.title,
    description: k.description,
    category: k.category,
    type: k.type,
    assigned_to: k.assignedTo ?? null,
    target_value: k.targetValue,
    current_value: k.currentValue,
    unit: k.unit,
    start_date: toDbDate(k.startDate),
    end_date: toDbDate(k.endDate),
    status: k.status,
  }),
  fromRow: (r) => ({
    id: r.sku ?? r.id,
    title: r.title ?? '',
    description: r.description ?? '',
    category: r.category ?? 'operations',
    type: (r.type as KPI['type']) ?? 'organizational',
    assignedTo: r.assigned_to ?? undefined,
    // ستون‌ها `numeric` هستند و PostgREST آن‌ها را رشته برمی‌گرداند.
    targetValue: Number(r.target_value) || 0,
    currentValue: Number(r.current_value) || 0,
    unit: r.unit ?? '',
    startDate: fromDbDate(r.start_date),
    endDate: fromDbDate(r.end_date),
    status: r.status ?? 'active',
    createdAt: r.created_at ?? new Date().toISOString(),
  }),
};

export const fetchOkrs = () => fetchCollection(okrMapper);
export const fetchKpis = () => fetchCollection(kpiMapper);

export const syncOkrs = (next: OKR[], prev: OKR[]) => syncCollection(okrMapper, next, prev);
export const syncKpis = (next: KPI[], prev: KPI[]) => syncCollection(kpiMapper, next, prev);
