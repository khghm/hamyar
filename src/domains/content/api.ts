import type { ContentProject, ContentTemplate, ContentIdea } from '../types';
import { fetchCollection, syncCollection, type CollectionMapper } from '../../api/sync';
import { fromDbDate, toDbDate } from '../db-helpers';

/**
 * فاز ۲.۳ — ماژول سرویس دامنهٔ محتوا.
 *
 * `content_projects`، `content_templates` و `content_ideas` تخت‌اند و mapper دارند.
 * مواردی که هنوز در دامنهٔ محتوا هستند ولی عمداً اینجا نیامده‌اند:
 *
 *   * `content_comments` و `content_assets` — فرزند `content_projects` هستند و
 *     کلیدشان باید از `uuid` پروژه بیاید؛ mapper تخت این را نمی‌پوشاند.
 *   * `brand_book` — تک‌ردیفی با کلید `key`؛ مسیر خودش را دارد.
 *
 * `type` و `status` پروژهٔ محتوا قید `check` دارند. migration 010 آن‌ها را دقیقاً
 * روی مجموعهٔ فروشگاه بست تا این mapper بتواند مقدار خام را بنویسد؛ ترجمهٔ مقدار
 * در mapper یعنی «عکس» و «آگهی» در گزارش‌ها یکی دیده شوند.
 */

// ── پروژه‌های محتوا ────────────────────────────────────────────────────────
/**
 * فیلدهای ساختاریافته در ستون `extra` (jsonb) می‌نشینند — که migration 011 برای
 * همین کار اضافه کرده است.
 *
 * استفاده از `metrics` برای این کار اشتباه بود: از migration 003 آن ستون معنای
 * مشخصی دارد (شاخص‌های عملکردی مثل `{ views, engagement_rate }`) و قاطی کردنش
 * با فیلدهای ساختاریافته، بعداً هر گزارشی روی آن را مبهم می‌کند.
 *
 * `description` هم عمداً نوشته نمی‌شود: `ContentProject` در فروشگاه چنین فیلدی
 * ندارد و نوشتن `contentPlan` در هر دو ستون یعنی یک داده در دو جا — که هر بار
 * یکی از آن‌ها قدیمی می‌ماند.
 */
export const contentProjectMapper: CollectionMapper<ContentProject> = {
  table: 'content_projects',
  keyColumn: 'sku',
  toRow: (p) => ({
    sku: p.id,
    title: p.title,
    type: p.type,
    status: p.status,
    due_date: toDbDate(p.deadline),
    assigned_to: p.assignedTo ?? [],
    tags: p.tags ?? [],
    extra: {
      scenario: p.scenario,
      equipment: p.equipment,
      contentPlan: p.contentPlan,
      publishDate: p.publishDate,
      publishPlatform: p.publishPlatform,
      priority: p.priority,
      notes: p.notes,
      relatedProducts: p.relatedProducts,
      relatedCampaigns: p.relatedCampaigns,
      budget: p.budget,
      actualCost: p.actualCost,
      qualityScore: p.qualityScore,
      qualityChecklist: p.qualityChecklist,
      approvalStage: p.approvalStage,
      versions: p.versions,
      startDate: p.startDate,
      sourceOrderId: p.sourceOrderId,
      sourceTrackingCode: p.sourceTrackingCode,
      customerName: p.customerName,
    },
  }),
  fromRow: (r) => {
    const m = (r.extra ?? {}) as Record<string, unknown>;
    return {
      id: r.sku ?? r.id,
      title: r.title ?? '',
      type: r.type ?? 'video',
      scenario: (m.scenario as string) ?? '',
      equipment: (m.equipment as string[]) ?? [],
      contentPlan: (m.contentPlan as string) ?? '',
      assignedTo: Array.isArray(r.assigned_to) ? r.assigned_to : [],
      startDate: (m.startDate as string) ?? '',
      deadline: fromDbDate(r.due_date),
      publishDate: (m.publishDate as string) || undefined,
      publishPlatform: (m.publishPlatform as string[]) || undefined,
      status: r.status ?? 'planning',
      priority: (m.priority as ContentProject['priority']) ?? 'medium',
      notes: (m.notes as string) ?? '',
      tags: Array.isArray(r.tags) ? r.tags : [],
      relatedProducts: (m.relatedProducts as string[]) ?? [],
      relatedCampaigns: (m.relatedCampaigns as string[]) ?? [],
      budget: Number(m.budget) || 0,
      actualCost: Number(m.actualCost) || 0,
      qualityScore: Number(m.qualityScore) || 0,
      qualityChecklist: (m.qualityChecklist as ContentProject['qualityChecklist']) ?? [],
      approvalStage: (m.approvalStage as ContentProject['approvalStage']) ?? 'draft',
      versions: (m.versions as ContentProject['versions']) ?? [],
      createdAt: r.created_at ?? new Date().toISOString(),
      sourceOrderId: (m.sourceOrderId as string) || undefined,
      sourceTrackingCode: (m.sourceTrackingCode as string) || undefined,
      customerName: (m.customerName as string) || undefined,
    };
  },
};

// ── قالب‌ها ────────────────────────────────────────────────────────────────
export const contentTemplateMapper: CollectionMapper<ContentTemplate> = {
  table: 'content_templates',
  keyColumn: 'sku',
  toRow: (t) => ({
    sku: t.id,
    name: t.name,
    type: t.type,
    scenario: t.scenario ?? '',
    equipment: t.equipment ?? [],
    body: t.contentPlan ?? '',
    quality_checklist: t.qualityChecklist ?? [],
  }),
  fromRow: (r) => ({
    id: r.sku ?? r.id,
    name: r.name ?? '',
    type: r.type ?? 'video',
    scenario: r.scenario ?? '',
    equipment: Array.isArray(r.equipment) ? r.equipment : [],
    contentPlan: r.body ?? '',
    qualityChecklist: Array.isArray(r.quality_checklist) ? r.quality_checklist : [],
    createdAt: r.created_at ?? new Date().toISOString(),
  }),
};

// ── ایده‌ها ────────────────────────────────────────────────────────────────
/**
 * `converted_to_project_id` یک uuid است ولی فروشگاه با شناسهٔ خودش کار می‌کند،
 * پس نوشتنش یعنی هر بار ذخیره، پیوند ایده با پروژه را بی‌صدا پاک می‌کند. چون
 * در `toRow` نیست، در `ON CONFLICT DO UPDATE` دست‌نخورده می‌ماند؛ اما در
 * `INSERT` مقدار پیش‌فرض می‌گیرد، پس ایدهٔ تازه پیوندی ندارد و در `fromRow` هم
 * `undefined` برمی‌گردد.
 */
export const contentIdeaMapper: CollectionMapper<ContentIdea> = {
  table: 'content_ideas',
  keyColumn: 'sku',
  toRow: (i) => ({
    sku: i.id,
    title: i.title,
    description: i.description,
    type: i.type,
    votes: Math.round(i.votes ?? 0),
    voted_by: i.votedBy ?? [],
    status: i.status,
    created_by: i.createdBy ?? '',
  }),
  fromRow: (r) => ({
    id: r.sku ?? r.id,
    title: r.title ?? '',
    description: r.description ?? '',
    type: r.type ?? '',
    votes: Number(r.votes) || 0,
    votedBy: Array.isArray(r.voted_by) ? r.voted_by : [],
    status: r.status ?? 'new',
    convertedToProjectId: undefined,
    createdBy: r.created_by ?? '',
    createdAt: r.created_at ?? new Date().toISOString(),
  }),
};

export const fetchContentProjects = () => fetchCollection(contentProjectMapper);
export const fetchContentTemplates = () => fetchCollection(contentTemplateMapper);
export const fetchContentIdeas = () => fetchCollection(contentIdeaMapper);

export const syncContentProjects = (next: ContentProject[], prev: ContentProject[]) =>
  syncCollection(contentProjectMapper, next, prev);
export const syncContentTemplates = (next: ContentTemplate[], prev: ContentTemplate[]) =>
  syncCollection(contentTemplateMapper, next, prev);
export const syncContentIdeas = (next: ContentIdea[], prev: ContentIdea[]) =>
  syncCollection(contentIdeaMapper, next, prev);
