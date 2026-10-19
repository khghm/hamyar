import type { Expense, Supplier, Employee, Invoice, InvoiceItem } from '../types';
import { supabase } from '../../api/supabase';
import { fetchCollection, syncCollection, type CollectionMapper } from '../../api/sync';
import { fromDbDate, toDbDate, toDbPhone } from '../db-helpers';

/**
 * فاز ۲.۳ — ماژول سرویس دامنهٔ مالی.
 *
 * هر mapper یک کلکسیون تخت را به جدول خودش وصل می‌کند. الگو در
 * `src/api/sync.ts` تعریف شده: کلید تجاری `sku` شناسهٔ فروشگاه را نگه می‌دارد،
 * بنابراین هیچ‌کدام از صفحه‌هایی که با `'c1'` یا `'p12'` کار می‌کنند تغییری
 * نمی‌خواهند.
 *
 * ستون‌های `009_align_collection_columns.sql` و `011_domain_collection_repairs.sql`
 * این فیلدها را اضافه کرده‌اند؛ نگاشت زیر عمداً کل‌به‌کل است تا هیچ فیلدی در هر
 * ذخیره‌سازی دور نیفتد.
 *
 * قاعدهٔ مهم برای ستون‌های `not null default …`:
 * مقدار `undefined` یعنی «این ستون را دست نزن و بگذار پیش‌فرض ستون اعمال شود»،
 * و چون `JSON.stringify` کلید `undefined` را حذف می‌کند، PostgREST اصلاً آن را
 * نمی‌فرستد. `null` برای ستون nullable یعنی «مقدارش را پاک کن». نوشتن صریح
 * `null` در ستون `not null` خطا می‌دهد، و نوشتن `now()` در هر ذخیره‌سازی اثر
 * انگشت ردیف را عوض می‌کند و باعث UPDATE بی‌پایان می‌شود.
 */

// ── هزینه‌ها ────────────────────────────────────────────────────────────────
/**
 * `category` در فروشگاه یک برچسب آزاد فارسی است («متفرقه» به‌صورت پیش‌فرض)،
 * نه شناسه. migration 010 به همین دلیل کلید خارجی `expense_categories` را حذف
 * کرد؛ قبل از آن، هر ثبت هزینه با خطای کلید خارجی رد می‌شد.
 */
export const expenseMapper: CollectionMapper<Expense> = {
  table: 'expenses',
  keyColumn: 'sku',
  toRow: (e) => ({
    sku: e.id,
    category: e.category,
    title: e.title,
    amount: Math.round(e.amount),
    // تاریخ فروشگاه فقط روز است؛ `date` در دیتابیس timestamptz و `not null`
    // است، پس تاریخ خالی «حذف ستون» می‌شود و پیش‌فرض `now()` می‌ماند.
    date: e.date ? toDbDate(e.date) : undefined,
    notes: e.description ?? null,
  }),
  fromRow: (r) => ({
    id: r.sku ?? r.id,
    title: r.title ?? '',
    category: r.category ?? '',
    amount: Number(r.amount) || 0,
    date: fromDbDate(r.date),
    description: r.notes ?? undefined,
  }),
};

// ── تأمین‌کنندگان ─────────────────────────────────────────────────────────
export const supplierMapper: CollectionMapper<Supplier> = {
  table: 'suppliers',
  keyColumn: 'sku',
  toRow: (s) => ({
    sku: s.id,
    name: s.name,
    // قید `^09[0-9]{9}$` فقط موبایل می‌پذیرد ولی ستون nullable است و فروشگاه
    // شمارهٔ ثابت هم دارد؛ چون upsert اتمیک است، یک شمارهٔ نامعتبر کل batch را
    // رد می‌کرد.
    phone: toDbPhone(s.phone),
    email: s.email ?? null,
    address: s.address ?? null,
    products: s.products ?? [],
    balance: Math.round(s.balance ?? 0),
    notes: s.notes ?? null,
  }),
  fromRow: (r) => ({
    id: r.sku ?? r.id,
    name: r.name ?? '',
    phone: r.phone ?? '',
    email: r.email ?? undefined,
    address: r.address ?? undefined,
    products: Array.isArray(r.products) ? r.products : [],
    balance: Number(r.balance) || 0,
    notes: r.notes ?? undefined,
  }),
};

// ── کارکنان ────────────────────────────────────────────────────────────────
/**
 * `role` در فروشگاه یک union محدود است و در دیتابیس ستون `position` متنی. نگاشت
 * به‌جای حدس زدن، مقدار را همان‌طور که هست می‌نویسد و در `fromRow` هم به
 * union برمی‌گرداند — اگر روزی مقدار ناشناخته‌ای در دیتابیس بود، به‌جای
 * شکستن render به 'admin' برمی‌گردد و کاربر می‌بیند چه چیزی اشتباه است.
 *
 * `phone` در دیتابیس `unique` است و فرم کارمند با شمارهٔ خالی شروع می‌شود؛
 * شمارهٔ نامعتبر `null` می‌شود که در ایندکس یکتا تکرارپذیر است.
 */
const EMPLOYEE_ROLES = ['admin', 'seller', 'operator', 'designer', 'accountant'] as const;

export const employeeMapper: CollectionMapper<Employee> = {
  table: 'employees',
  keyColumn: 'sku',
  toRow: (e) => ({
    sku: e.id,
    name: e.name,
    phone: toDbPhone(e.phone),
    position: e.role,
    hire_date: e.startDate ? toDbDate(e.startDate) : null,
    salary: Math.round(e.salary ?? 0),
    commission: Math.round(e.commission ?? 0),
    active: e.active,
  }),
  fromRow: (r) => {
    const role = String(r.position ?? 'admin') as Employee['role'];
    return {
      id: r.sku ?? r.id,
      name: r.name ?? '',
      phone: r.phone ?? '',
      role: EMPLOYEE_ROLES.includes(role) ? role : 'admin',
      salary: Number(r.salary) || 0,
      commission: Number(r.commission) || 0,
      startDate: fromDbDate(r.hire_date),
      active: r.active ?? true,
    };
  },
};

// ── فاکتورها ───────────────────────────────────────────────────────────────
/**
 * فقط سربرگ فاکتور؛ اقلام (`invoice_items`) فرزند هستند و کلیدشان از `uuid`
 * خود فاکتور می‌آید، پس mapper تخت از پسش برنمی‌آید. مسیر جداگانه‌اش
 * `fetchInvoiceItems` / `syncInvoiceItems` پایین همین فایل است.
 *
 * `order_id` هم عمداً نوشته نمی‌شود: یک uuid به `orders.id` است، در حالی که
 * فروشگاه سفارش را با شناسهٔ خودش (`Order.id`) نگه می‌دارد و نگاشتی برای آن
 * وجود ندارد. نوشتن `null` پیوند را پاک می‌کرد، پس ستون دست‌نخورده می‌ماند.
 */
export const invoiceMapper: CollectionMapper<Invoice> = {
  table: 'invoices',
  keyColumn: 'sku',
  toRow: (i) => ({
    sku: i.id,
    invoice_number: i.invoiceNumber,
    type: i.type,
    date: i.date ? toDbDate(i.date) : undefined,
    due_date: toDbDate(i.dueDate),
    customer_name: i.customerName,
    customer_phone: i.customerPhone ?? null,
    customer_address: i.customerAddress ?? null,
    customer_national_id: i.customerNationalId ?? null,
    subtotal: Math.round(i.subtotal ?? 0),
    discount: Math.round(i.discount ?? 0),
    discount_type: i.discountType,
    discount_amount: Math.round(i.discountAmount ?? 0),
    tax: i.tax ?? 0,
    tax_amount: Math.round(i.taxAmount ?? 0),
    total: Math.round(i.total ?? 0),
    note: i.note ?? null,
    status: i.status,
  }),
  fromRow: (r) => ({
    id: r.sku ?? r.id,
    invoiceNumber: r.invoice_number ?? '',
    // پیوند با سفارش: برای تشخیص «تولید محتوا» در چاپ/لیست فاکتور لازم است
    // (سفارش‌های تولید محتوا در دیتابیس type=service دارند).
    orderId: r.order_id ?? undefined,
    // اقلام در `fetchInvoices` جدا خوانده و به این رکورد الصاق می‌شوند.
    items: [],
    date: fromDbDate(r.date),
    dueDate: r.due_date ? fromDbDate(r.due_date) : undefined,
    customerName: r.customer_name ?? '',
    customerPhone: r.customer_phone ?? undefined,
    customerAddress: r.customer_address ?? undefined,
    customerNationalId: r.customer_national_id ?? undefined,
    subtotal: Number(r.subtotal) || 0,
    discount: Number(r.discount) || 0,
    discountType: r.discount_type ?? 'percent',
    discountAmount: Number(r.discount_amount) || 0,
    tax: Number(r.tax) || 0,
    taxAmount: Number(r.tax_amount) || 0,
    total: Number(r.total) || 0,
    note: r.note ?? undefined,
    status: r.status ?? 'draft',
    type: r.type ?? 'service',
    createdAt: r.created_at ?? new Date().toISOString(),
  }),
};

// ── خواندن و نوشتن فاکتورها (سربرگ + اقلام) ────────────────────────────────

/**
 * اقلام هر فاکتور را جدا می‌خواند و به سربرگ‌ها الصاق می‌کند.
 *
 * اگر کاربر اجازهٔ مالی نداشته باشد RLS خواندن `invoice_items` را رد می‌کند؛ در
 * آن حالت فاکتورها بدون اقلام برگردانده می‌شوند که بهتر از خراب شدن کل صفحهٔ
 * «فاکتورها» است.
 */
export async function fetchInvoices(): Promise<Invoice[]> {
  const invoices = await fetchCollection(invoiceMapper);
  if (!invoices.length) return invoices;

  const { data: rows, error } = await supabase
    .from('invoice_items')
    .select('invoice_id, name, quantity, unit, price');
  if (error || !rows) return invoices;

  const byInvoice = new Map<string, InvoiceItem[]>();
  for (const row of rows) {
    const list = byInvoice.get(row.invoice_id) ?? [];
    list.push({
      name: row.name ?? '',
      quantity: Number(row.quantity) || 0,
      unit: row.unit ?? '',
      price: Number(row.price) || 0,
    });
    byInvoice.set(row.invoice_id, list);
  }
  if (!byInvoice.size) return invoices;

  // `invoice_items.invoice_id` یک uuid است، پس نگاشت از راه شمارهٔ سطر برگشتی
  // انجام می‌شود: همهٔ شناسه‌های فاکتور یک‌جا خوانده می‌شوند.
  //
  // فاکتورهای قدیمی `sku` ندارند و `invoiceMapper.fromRow` برایشان `id` را همان
  // uuid می‌گذارد؛ بنابراین کلید دوم (`h.id → h.id`) لازم است، وگرنه هیچ قلمی به
  // فاکتور الصاق نمی‌شد و جدول فاکتور چاپی خالی می‌ماند.
  const { data: heads } = await supabase.from('invoices').select('id, sku');
  const idByKey = new Map<string, string>();
  for (const h of heads ?? []) {
    idByKey.set(h.id, h.id);
    if (h.sku) idByKey.set(h.sku, h.id);
  }

  return invoices.map(inv => {
    const uuid = idByKey.get(inv.id);
    const items = uuid ? byInvoice.get(uuid) : undefined;
    return items ? { ...inv, items } : inv;
  });
}

/**
 * اقلام فاکتورهایی را که در این ذخیره‌سازی تغییر کرده‌اند همگام می‌کند.
 *
 * راهبرد: حذف کامل اقلامِ فاکتور و درج دوباره. چون تعداد اقلام یک فاکتور کم است
 * و mapper تخت توان تشخیص «کدام قلم عوض شده» را ندارد، این تنها راهی است که هر
 * دو حالت «قلم حذف شد» و «قلم اضافه شد» را درست پوشش می‌دهد. برای اینکه هر
 * بار روی هر فاکتوری این کار تکرار نشود، اثر انگشت اقلام هر فاکتور نگه داشته
 * می‌شود و فقط فاکتورهای واقعاً تغییرکرده بازنویسی می‌شوند.
 */
const invoiceItemsSignature = new Map<string, string>();

export async function syncInvoiceItems(invoices: Invoice[]): Promise<void> {
  const current = new Map<string, InvoiceItem[]>();
  for (const inv of invoices) current.set(inv.id, inv.items ?? []);

  const changed = invoices.filter(inv => {
    const signature = JSON.stringify(current.get(inv.id) ?? []);
    return invoiceItemsSignature.get(inv.id) !== signature;
  });

  // فاکتورهایی که از فروشگاه حذف شده‌اند: سربرگشان را `syncCollection` حذف
  // می‌کند و `invoice_items` با `on delete cascade` می‌رود، پس فقط امضا پاک
  // می‌شود.
  for (const sku of [...invoiceItemsSignature.keys()]) {
    if (!current.has(sku)) invoiceItemsSignature.delete(sku);
  }
  if (!changed.length) return;

  const { data: heads, error } = await supabase
    .from('invoices')
    .select('id, sku')
    .in('sku', changed.map(inv => inv.id));
  if (error || !heads?.length) {
    console.error('[finance] invoice_items: resolving invoice ids failed:', error?.message);
    return;
  }

  const uuidBySku = new Map(heads.map(h => [h.sku, h.id]));
  const targetIds: string[] = [];
  const rows: Record<string, unknown>[] = [];

  for (const inv of changed) {
    const uuid = uuidBySku.get(inv.id);
    if (!uuid) continue;
    targetIds.push(uuid);
    invoiceItemsSignature.set(inv.id, JSON.stringify(inv.items ?? []));
    for (const item of inv.items ?? []) {
      rows.push({
        invoice_id: uuid,
        name: item.name,
        quantity: Math.round(item.quantity) || 0,
        unit: item.unit ?? null,
        price: Math.round(item.price) || 0,
      });
    }
  }
  if (!targetIds.length) return;

  const del = await supabase.from('invoice_items').delete().in('invoice_id', targetIds);
  if (del.error) {
    console.error('[finance] invoice_items delete failed:', del.error.message);
    return;
  }
  if (!rows.length) return;

  const ins = await supabase.from('invoice_items').insert(rows);
  if (ins.error) {
    console.error('[finance] invoice_items insert failed:', ins.error.message);
  }
}

export const fetchExpenses = () => fetchCollection(expenseMapper);
export const fetchSuppliers = () => fetchCollection(supplierMapper);
export const fetchEmployees = () => fetchCollection(employeeMapper);

export const syncExpenses = (next: Expense[], prev: Expense[]) =>
  syncCollection(expenseMapper, next, prev);
export const syncSuppliers = (next: Supplier[], prev: Supplier[]) =>
  syncCollection(supplierMapper, next, prev);
export const syncEmployees = (next: Employee[], prev: Employee[]) =>
  syncCollection(employeeMapper, next, prev);
export const syncInvoices = (next: Invoice[], prev: Invoice[]) =>
  syncCollection(invoiceMapper, next, prev);
