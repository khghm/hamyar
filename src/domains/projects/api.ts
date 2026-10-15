import type { Project } from '../types';
import { fetchCollection, syncCollection, type CollectionMapper } from '../../api/sync';
import { fromDbDate, toDbDate, toDbPercent } from '../db-helpers';

/**
 * فاز ۲.۳ — ماژول سرویس دامنهٔ پروژه‌های طراحی سایت.
 *
 * جدول `projects` با migration 009 هم‌تراز شد (`client_name`, `stage`,
 * `total_cost`, `paid_amount`, …). migration 011 هم `price` را که ستون تکراریِ
 * مبلغ بود حذف کرد تا فقط یک ستون پولی بماند.
 *
 * دو ستون دیتابیس هستند که فروشگاه معادلی برایشان ندارد و به‌خاطر `not null`
 * باید مقداری بگیرند:
 *
 *   * `status` — یک متن با قید `in ('idea','in_progress','review','completed','delivered')`
 *     که از قبل باقی مانده. مرحلهٔ واقعی پروژه در ستون `stage` است، پس مقدار
 *     ثابت نوشته می‌شود تا فقط قید راضی بماند.
 *   * `group_name` — قید `in ('webdesign','content')`. پروژه‌های فروشگاه همه از
 *     دستهٔ طراحی سایت‌اند.
 *
 * `assigned_to` در دیتابیس آرایه‌ای است ولی `Project` چنین فیلدی ندارد (نفرِ
 * پروژه از پرسنل جداگانه مدیریت می‌شود)، پس این mapper آن را دست نمی‌زند.
 * `start_date` هم به همین دلیل خالی نوشته می‌شود؛ این ستون nullable است و در
 * `ON CONFLICT DO UPDATE` دست‌نخورده می‌ماند.
 */
export const projectMapper: CollectionMapper<Project> = {
    table: 'projects',
    keyColumn: 'sku',
    toRow: (p) => ({
      sku: p.id,
      title: p.title,
      group_name: 'webdesign',
      status: 'in_progress',
      stage: p.stage,
      client_name: p.clientName,
      type: p.type,
      domain: p.domain ?? null,
      host: p.host ?? null,
      description: p.description,
      due_date: toDbDate(p.deadline),
      // قید `check (progress between 0 and 100)`.
      progress: toDbPercent(p.progress),
      total_cost: Math.round(p.totalCost ?? 0),
      paid_amount: Math.round(p.paidAmount ?? 0),
      hidden_from_projects: p.hiddenFromProjects ?? false,
      source_order_id: p.sourceOrderId ?? null,
    }),
    fromRow: (r) => ({
      id: r.sku ?? r.id,
      title: r.title ?? '',
      clientName: r.client_name ?? '',
      type: r.type ?? '',
      // عمداً به `status` باز نمی‌گردد: `status` مقدار ثابت `in_progress` است و
      // به‌عنوان مرحلهٔ پروژه یک مقدار ساختگی می‌شود. ردیف‌های قدیمیِ بدون `stage`
      // رشتهٔ خالی می‌گیرند که فرم‌های پروژه هم آن را به‌عنوان «مرحله تعیین نشده»
      // می‌پذیرند.
      stage: r.stage ?? '',
      domain: r.domain ?? undefined,
      host: r.host ?? undefined,
      deadline: fromDbDate(r.due_date),
      totalCost: Number(r.total_cost) || 0,
      paidAmount: Number(r.paid_amount) || 0,
      progress: Number(r.progress) || 0,
      description: r.description ?? '',
      hiddenFromProjects: r.hidden_from_projects ?? false,
      sourceOrderId: r.source_order_id ?? undefined,
    }),
  };

export const fetchProjects = () => fetchCollection(projectMapper);
export const syncProjects = (next: Project[], prev: Project[]) =>
  syncCollection(projectMapper, next, prev);
