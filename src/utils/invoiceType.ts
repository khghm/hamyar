/**
 * برچسب فارسی نوع فاکتور.
 *
 * نکتهٔ مهم: سفارش‌های «تولید محتوا» در دیتابیس با `type = 'service'` ذخیره
 * می‌شوند و فقط از روی `projectServiceId` (الگوی `ps-ct…`) قابل تشخیص‌اند.
 * قبلاً فاکتور چاپی آن‌ها «خدمات» نشان می‌داد؛ این ماژول همان تشخیص را در یک
 * جا جمع می‌کند تا همهٔ صفحه‌ها یک برچسب نشان دهند.
 */

export const INVOICE_TYPE_LABELS: Record<string, string> = {
  service: 'خدمات',
  product: 'کالا',
  webdesign: 'طراحی سایت',
  combined: 'ترکیبی',
  media: 'مدیا',
  content: 'تولید محتوا',
};

export const CONTENT_INVOICE_LABEL = 'تولید محتوا';

type LinkedOrder = {
  type?: string;
  projectServiceId?: string | null;
  contentProjectId?: string | null;
} | null | undefined;

/**
 * سفارش «تولید محتوا» است؟
 *
 * دو نشانه دارد: یا از سرویس پروژهٔ تولید محتوا (`ps-ct…`) ساخته شده، یا در
 * «تیم تولید محتوا» تسک متناظر دارد (`contentProjectId`). نشانهٔ دوم لازم است
 * چون `project_service_id` در دیتابیس uuid است و sku فقط وقتی در کلاینت
 * پر می‌شود که سرویس مربوطه هنوز موجود باشد.
 */
export function isContentOrderLike(order?: LinkedOrder): boolean {
  if (!order) return false;
  if (order.contentProjectId) return true;
  return !!order.projectServiceId && String(order.projectServiceId).startsWith('ps-ct');
}

export function isContentInvoice(type: string | undefined, order?: LinkedOrder): boolean {
  return type === 'service' && isContentOrderLike(order);
}

export function invoiceTypeLabel(type: string | undefined, order?: LinkedOrder): string {
  if (isContentInvoice(type, order)) return CONTENT_INVOICE_LABEL;
  if (!type) return '—';
  return INVOICE_TYPE_LABELS[type] || type;
}
