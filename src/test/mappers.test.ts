import { describe, expect, it } from 'vitest';
import {
  employeeMapper,
  expenseMapper,
  invoiceMapper,
  supplierMapper,
} from '../domains/finance/api';
import { affiliateMapper, campaignMapper } from '../domains/marketing/api';
import {
  contentIdeaMapper,
  contentProjectMapper,
  contentTemplateMapper,
} from '../domains/content/api';
import { okrMapper } from '../domains/okr/api';
import { projectMapper } from '../domains/projects/api';
import { noteMapper, reviewMapper, smsLogMapper } from '../domains/support/api';

/**
 * تست mapperها — فاز ۱.۱۹ / ۲.۳
 *
 * این تست‌ها یک خاصیت را تضمین می‌کنند: رفت‌وبرگشت هر mapper باید بدون افت
 * اطلاعات باشد. اگر `toRow` فیلدی را که `fromRow` برنمی‌گرداند حذف کند، آن داده
 * در هر ذخیره‌سازی بی‌صدا از بین می‌رود — دقیقاً همان اشتباهی که مهاجرت 009
 * برای کمپین و پروژه اصلاح کرد. این تست همان دستگاه را دائم نگه می‌دارد.
 */

/**
 * رفت‌وبرگشت یک mapper تخت.
 *
 * `created_at` استثناست: mapper آن را نمی‌نویسد چون ستون `default now()` دارد و
 * مالکیتش با پایگاه‌داده است. این تابع آن را شبیه‌سازی می‌کند تا تست فقط روی
 * داده‌ای تمرکز کند که واقعاً در اختیار mapper است.
 */
function roundTrip<T>(
  mapper: { toRow: (i: T) => Record<string, unknown>; fromRow: (r: Record<string, any>) => T | null },
  item: T,
): T {
  const row = mapper.toRow(item);
  row.created_at = (item as { createdAt?: string }).createdAt ?? row.created_at;
  const back = mapper.fromRow(row);
  if (back === null) throw new Error('fromRow returned null for a row it just produced');
  return back;
}

describe('expenseMapper', () => {
  it('گشت‌وبرگشت بدون افت اطلاعات', () => {
    const expense = {
      id: 'e1',
      title: 'اجاره دفتر',
      category: 'rent',
      amount: 12_000_000,
      date: '2026-03-01',
      description: 'قرارداد یک‌ساله',
    };
    expect(roundTrip(expenseMapper, expense)).toEqual(expense);
  });

  it('مبلغ اعشاری را گرد می‌کند چون ستول bigint است', () => {
    const row = expenseMapper.toRow({
      id: 'e2',
      title: 'x',
      category: 'c',
      amount: 1000.4,
      date: '2026-01-01',
    });
    expect(row.amount).toBe(1000);
  });

  it('تاریخ خالی را اصلاً نمی‌نویسد تا پیش‌فرض ستون اعمال شود', () => {
    // `date` در دیتابیس `not null default now()` است. نوشتن صریح `null` خطای
    // قید می‌داد و نوشتن `now()` در هر ذخیره‌سازی اثر انگشت ردیف را عوض می‌کرد
    // و UPDATE بی‌پایان می‌زد. `undefined` یعنی «این ستون را دست نزن».
    const row = expenseMapper.toRow({
      id: 'e3',
      title: 'x',
      category: 'متفرقه',
      amount: 1000,
      date: '',
    });
    expect(row.date).toBeUndefined();
    // کلید نباید در JSONی که واقعاً ارسال می‌شود هم باشد.
    expect(JSON.parse(JSON.stringify(row))).not.toHaveProperty('date');
  });

  it('تاریخ شمسی داده‌های قدیمی را به میلادی تبدیل می‌کند', () => {
    // داده‌های seed در `store.tsx` شمسی‌اند و اگر مستقیم نوشته شوند Postgres
    // آن‌ها را با `invalid input syntax for type date` رد می‌کند — و چون
    // upsert اتمیک است، کل ذخیره‌سازی از بین می‌رود.
    expect(
      expenseMapper.toRow({
        id: 'e5',
        title: 'x',
        category: 'متفرقه',
        amount: 1000,
        date: '1402/01/01',
      }).date,
    ).toBe('2023-03-20');
  });

  it('برچسب آزاد دسته را در ستون متنی می‌نویسد نه کلید خارجی', () => {
    // regression: `category_id` کلید خارجی به expense_categories بود و هر
    // برچسب فارسیِ فروشگاه را رد می‌کرد. migration 010 آن را به `category`
    // تبدیل کرد.
    const row = expenseMapper.toRow({
      id: 'e4',
      title: 'اجاره',
      category: 'متفرقه',
      amount: 1000,
      date: '2026-01-01',
    });
    expect(row.category).toBe('متفرقه');
    expect(row).not.toHaveProperty('category_id');
  });
});

describe('campaignMapper', () => {
  const campaign = {
    id: 'c1',
    title: 'عید نوروز',
    code: 'NOWRUZ',
    discount: 20,
    type: 'percent' as const,
    minPurchase: 500_000,
    maxUses: 100,
    usedCount: 12,
    startDate: '2026-03-01',
    endDate: '2026-04-01',
    active: true,
  };

  it('گشت‌وبرگشت بدون افت اطلاعات', () => {
    // regression: قبلاً minPurchase/maxUses/usedCount ستون نداشتند و mapper آن‌ها
    // را دور می‌ریخت.
    expect(roundTrip(campaignMapper, campaign)).toEqual(campaign);
  });

  it('نام ستون‌ها را درست نگاشت می‌کند', () => {
    const row = campaignMapper.toRow(campaign);
    expect(row.name).toBe('عید نوروز');
    expect(row.discount_value).toBe(20);
    expect(row.discount_type).toBe('percent');
    expect(row.min_purchase).toBe(500_000);
  });
});

describe('projectMapper', () => {
  const project = {
    id: 'p1',
    title: 'سایت فروشگاهی',
    clientName: 'فروشگاه نمونه',
    type: 'web',
    stage: 'design',
    domain: 'example.ir',
    host: 'https://example.ir',
    deadline: '2026-05-01',
    totalCost: 40_000_000,
    paidAmount: 20_000_000,
    progress: 50,
    description: 'طراحی و پیاده‌سازی',
    // این یکی از ورودی همیشه برمی‌گردد چون ستون دیتابیس `not null default false`
    // است و نبودنش یعنی «پنهان نیست».
    hiddenFromProjects: false,
  };

  it('گشت‌وبرگشت بدون افت اطلاعات', () => {
    // regression: clientName/stage/totalCost/paidAmount قبلاً ستون نداشتند.
    expect(roundTrip(projectMapper, project)).toEqual(project);
  });

  it('مرحلهٔ فروشگاه را در ستون stage دیتابیس می‌نویسد، نه status', () => {
    const row = projectMapper.toRow(project);
    expect(row.stage).toBe('design');
    // `status` در دیتابیس enum باقی‌مانده از قبل است و check constraint دارد؛
    // اگر مرحلهٔ فروشگاه آنجا نوشته شود هر مقداری مثل 'design' رد می‌شود.
    expect(row.status).toBe('in_progress');
  });

  it('مرحلهٔ نامشخص را رشتهٔ خالی می‌دهد، نه مقدار ساختگی از status', () => {
    // `status` در دیتابیس باقی‌ماندهٔ قبل از ۰۰۹ است و mapper همیشه مقدار ثابت
    // `in_progress` در آن می‌نویسد؛ خواندنش به‌عنوان «مرحلهٔ پروژه» یعنی
    // همهٔ پروژه‌های فروشگاه «در حال انجام» دیده می‌شدند.
    const legacy = projectMapper.fromRow({
      sku: 'p0',
      title: 'قدیمی',
      status: 'completed',
      created_at: '2026-01-01T00:00:00.000Z',
    });
    expect(legacy?.stage).toBe('');
  });

  it('پیشرفت را داخل بازهٔ قید check دیتابیس نگه می‌دارد', () => {
    expect(projectMapper.toRow({ id: 'p2', progress: 140 } as never).progress).toBe(100);
    expect(projectMapper.toRow({ id: 'p3', progress: -5 } as never).progress).toBe(0);
  });
});

describe('noteMapper', () => {
  const note = {
    id: 'n1',
    title: 'پیگیری فاکتور',
    customerName: 'مشتری نمونه',
    customerPhone: '09120000000',
    task: 'تماس و پیگیری',
    priority: 'high' as const,
    status: 'pending' as const,
    dueDate: '2026-03-10',
    createdAt: '2026-03-01T00:00:00.000Z',
    tags: ['مالی'],
    content: 'یادداشت',
  };

  it('گشت‌وبرگشت بدون افت اطلاعات', () => {
    const back = roundTrip(noteMapper, note);
    // `completedAt` در ورودی نبود و در خروجی هم نباید باشد.
    expect(back).toEqual(note);
  });

  it('تاریخ timestamptz را به رشتهٔ روز برمی‌گرداند', () => {
    const back = roundTrip(noteMapper, { ...note, dueDate: '2026-03-10' });
    expect(back.dueDate).toBe('2026-03-10');
  });
});

describe('smsLogMapper', () => {
  it('لحظهٔ ارسال را حفظ می‌کند، نه فقط روز را', () => {
    // ساعت ارسال پیامک معنا دارد. کوتاه کردن مقدار به روز، لحظهٔ واقعی را
    // برای همیشه حذف می‌کرد. Postgres مقدار را با قالب خودش برمی‌گرداند
    // (`+00:00` به‌جای `Z`)، پس مقایسه روی «همان لحظه» است نه روی رشته.
    const log = {
      id: 's1',
      phone: '09120000000',
      message: 'سلام',
      date: '2026-03-01T10:00:00.000Z',
      status: 'sent' as const,
    };
    const row = smsLogMapper.toRow(log);
    expect(row.sent_at).toBe('2026-03-01T10:00:00.000Z');
    const back = smsLogMapper.fromRow({ ...row, sent_at: '2026-03-01T10:00:00+00:00' });
    expect(back).not.toBeNull();
    expect(new Date(back?.date ?? 0).toISOString()).toBe(log.date);
    expect({ ...back, date: log.date }).toEqual(log);
  });

  it('sent_at خالی را نه null می‌نویسد و نه now؛ کلید را حذف می‌کند', () => {
    // `sent_at` در دیتابیس `not null default now()` است. نوشتن null خطای قید
    // می‌داد و نوشتن now() اثر انگشت ردیف را در هر ذخیره‌سازی عوض می‌کرد.
    const row = smsLogMapper.toRow({
      id: 's2',
      phone: '09120000000',
      message: 'سلام',
      date: '',
      status: 'sent',
    });
    expect(row.sent_at).toBeUndefined();
    expect(JSON.parse(JSON.stringify(row))).not.toHaveProperty('sent_at');
  });
});

describe('reviewMapper', () => {
  it('پیوند با محصول را از راه کلید تجاری می‌نویسد، نه uuid', () => {
    // `reviews.product_id` یک uuid به `products.id` است و فروشگاه با کلید تجاری
    // (`p1`) کار می‌کند. نوشتن `null` در `product_id` یعنی هر بار تأیید یک
    // نظر، پیوندش را پاک می‌کرد و نظر از صفحهٔ محصول ناپدید می‌شد.
    const row = reviewMapper.toRow({
      id: 'r1',
      productId: 'p1',
      customerName: 'علی',
      rating: 5,
      comment: 'خوب',
      date: '1403/07/15',
      approved: true,
    });
    expect(row).not.toHaveProperty('product_id');
    expect(row.product_sku).toBe('p1');
    expect(row.name).toBe('علی');
    // `date` در این جدول متن است و شمسی می‌ماند، پس نرمال‌سازی نمی‌شود.
    expect(row.date).toBe('1403/07/15');
  });

  it('پیوند نظر با محصول در رفت‌وبرگشت از بین نمی‌رود', () => {
    const review = {
      id: 'r2',
      productId: 'p4',
      customerName: 'رضا',
      rating: 4,
      comment: 'خوب',
      date: '1403/07/05',
      approved: true,
    };
    expect(roundTrip(reviewMapper, review)).toEqual(review);
  });

  it('امتیاز را داخل بازهٔ قید check (1..5) نگه می‌دارد', () => {
    const row = reviewMapper.toRow({
      id: 'r3',
      productId: 'p1',
      customerName: 'x',
      rating: 0,
      comment: '',
      date: '',
      approved: false,
    });
    expect(row.rating).toBe(1);
  });
});

describe('okrMapper', () => {
  it('سربرگ را بدون افت اطلاعات برمی‌گرداند و keyResults را خالی می‌گذارد', () => {
    const okr = {
      id: 'o1',
      title: 'رشد درآمد',
      description: 'افزایش فروش',
      type: 'organizational' as const,
      assignedTo: 'emp1',
      keyResults: [{ id: 'kr1', title: 'فروش ۱۰۰ میلیون', targetValue: 100, currentValue: 40, unit: 'میلیون' }],
      startDate: '2026-01-01',
      endDate: '2026-03-31',
      quarter: 'Q1',
      year: 2026,
      status: 'active' as const,
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    const back = roundTrip(okrMapper, okr);
    expect(back.title).toBe(okr.title);
    expect(back.year).toBe(2026);
    // فرزندان مسیر جداگانه دارند؛ نباید وانمود کنیم از دیتابیس آمده‌اند.
    expect(back.keyResults).toEqual([]);
  });
});

describe('contentProjectMapper', () => {
  it('فیلدهای ساختاریافته را در extra نگه می‌دارد و برمی‌گرداند', () => {
    const project = {
      id: 'cp1',
      title: 'تیزر تبلیغاتی',
      type: 'video' as const,
      scenario: 'معرفی محصول',
      equipment: ['دوربین'],
      contentPlan: 'برنامهٔ فیلم‌برداری',
      assignedTo: ['u1'],
      startDate: '2026-03-01',
      deadline: '2026-03-10',
      publishDate: '2026-03-12',
      publishPlatform: ['اینستاگرام'],
      status: 'in-progress' as const,
      priority: 'high' as const,
      notes: 'یادداشت',
      tags: ['برند'],
      relatedProducts: ['p1'],
      relatedCampaigns: ['c1'],
      budget: 5_000_000,
      actualCost: 1_200_000,
      qualityScore: 4,
      qualityChecklist: [{ item: 'کیفیت تصویر', checked: true }],
      approvalStage: 'content-manager' as const,
      versions: [{ version: 1, date: '2026-03-02', notes: 'v1', data: {} }],
      createdAt: '2026-03-01T00:00:00.000Z',
    };
    // regression: اینها قبلاً در `metrics` می‌رفتند، ولی آن ستون از migration
    // 003 معنای مشخص خودش را دارد (شاخص‌های عملکردی) و قاطی کردنش با
    // فیلدهای ساختاریافته هر گزارشی روی آن را مبهم می‌کند.
    const row = contentProjectMapper.toRow(project);
    expect(row).toHaveProperty('extra');
    expect(row).not.toHaveProperty('metrics');
    // `contentPlan` فقط یک جا ذخیره می‌شود؛ نوشتن دوبارهٔ آن در
    // `description` یعنی یک داده در دو ستون که یکی‌شان همیشه قدیمی می‌ماند.
    expect(row).not.toHaveProperty('description');
    expect(roundTrip(contentProjectMapper, project)).toEqual(project);
  });

  it('آرایه‌ها را در ستون‌های ARRAY می‌نویسد نه extra', () => {
    const row = contentProjectMapper.toRow({
      id: 'cp2',
      title: 'x',
      type: 'video',
      scenario: '',
      equipment: [],
      contentPlan: '',
      assignedTo: ['u1', 'u2'],
      startDate: '',
      deadline: '',
      status: 'planning',
      priority: 'medium',
      notes: '',
      tags: ['a'],
      relatedProducts: [],
      relatedCampaigns: [],
      budget: 0,
      actualCost: 0,
      qualityScore: 0,
      qualityChecklist: [],
      approvalStage: 'draft',
      versions: [],
      createdAt: '',
    });
    expect(row.assigned_to).toEqual(['u1', 'u2']);
    expect(row.tags).toEqual(['a']);
  });

  it('type و status خامِ فروشگاه را می‌نویسد نه ترجمه‌شده', () => {
    // regression: دیتابیس 'photo'/'ad' را در type و 'planning'/'completed' را در
    // status رد می‌کرد. راه‌حل در migration 010 بود (باز کردن قید)، نه ترجمهٔ
    // مقدار — وگرنه این دو نوع محتوا در گزارش‌ها یکی می‌شدند.
    const row = contentProjectMapper.toRow({
      id: 'cp3',
      title: 'عکاسی محصول',
      type: 'photo',
      scenario: '',
      equipment: [],
      contentPlan: '',
      assignedTo: [],
      startDate: '',
      deadline: '',
      status: 'planning',
      priority: 'low',
      notes: '',
      tags: [],
      relatedProducts: [],
      relatedCampaigns: [],
      budget: 0,
      actualCost: 0,
      qualityScore: 0,
      qualityChecklist: [],
      approvalStage: 'draft',
      versions: [],
      createdAt: '',
    });
    expect(row.type).toBe('photo');
    expect(row.status).toBe('planning');
  });
});

describe('contentIdeaMapper', () => {
  const idea = {
    id: 'i1',
    title: 'ریلز معرفی محصول',
    description: 'یک ایدهٔ خوب',
    type: 'video',
    votes: 3,
    votedBy: ['u1', 'u2'],
    status: 'accepted' as const,
    createdBy: 'u1',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  it('گشت‌وبرگشت بدون افت اطلاعات', () => {
    expect(roundTrip(contentIdeaMapper, idea)).toEqual(idea);
  });

  it('converted_to_project_id را نمی‌نویسد چون uuid است نه شناسهٔ فروشگاهی', () => {
    const row = contentIdeaMapper.toRow(idea);
    expect(row).not.toHaveProperty('converted_to_project_id');
  });
});

describe('contentTemplateMapper', () => {
  it('گشت‌وبرگشت بدون افت اطلاعات', () => {
    const template = {
      id: 'ct1',
      name: 'قالب ریلز',
      type: 'social' as const,
      scenario: 'معرفی سریع',
      equipment: ['موبایل'],
      contentPlan: 'گام‌به‌گام',
      qualityChecklist: ['نور مناسب'],
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    expect(roundTrip(contentTemplateMapper, template)).toEqual(template);
  });
});

describe('invoiceMapper', () => {
  const invoice = {
    id: 'inv1',
    invoiceNumber: 'INV-240001',
    type: 'service' as const,
    date: '2026-03-01',
    dueDate: '2026-03-31',
    customerName: 'مشتری نمونه',
    customerPhone: '09120000000',
    items: [] as never[],
    subtotal: 1_000_000,
    discount: 10,
    discountType: 'percent' as const,
    discountAmount: 100_000,
    tax: 9,
    taxAmount: 81_000,
    total: 981_000,
    note: '',
    status: 'issued' as const,
    createdAt: '2026-03-01T00:00:00.000Z',
  };

  it('گشت‌وبرگشت سربرگ بدون افت اطلاعات', () => {
    expect(roundTrip(invoiceMapper, invoice)).toEqual(invoice);
  });

  it('تاریخ خالی را null نمی‌نویسد چون invoices.date ستون not null است', () => {
    // regression: نوشتن صریح `null` روی ستون `not null` درج را رد می‌کرد
    // (`null value in column "date"`). کلید باید حذف شود تا `default now()`
    // اعمال شود.
    const row = invoiceMapper.toRow({ ...invoice, date: '' });
    expect(row.date).toBeUndefined();
    expect(JSON.parse(JSON.stringify(row))).not.toHaveProperty('date');
  });

  it('order_id را نمی‌نویسد چون uuid است نه شناسهٔ فروشگاهی سفارش', () => {
    expect(invoiceMapper.toRow(invoice)).not.toHaveProperty('order_id');
  });
});

describe('supplierMapper', () => {
  it('شمارهٔ ثابت را null می‌نویسد چون قید ستون فقط موبایل می‌پذیرد', () => {
    // `suppliers.phone` قید `^09[0-9]{9}$` دارد ولی nullable است و دادهٔ seed
    // خودش شمارهٔ ثابت دارد. چون upsert اتمیک است، یک شمارهٔ نامعتبر کل batch
    // تأمین‌کنندگان را رد می‌کرد.
    const landline = supplierMapper.toRow({
      id: 'sup1',
      name: 'شرکت سامسونگ',
      phone: '02188776655',
      products: [],
      balance: 0,
    });
    expect(landline.phone).toBeNull();

    const mobile = supplierMapper.toRow({
      id: 'sup2',
      name: 'پخش پارسیان',
      phone: '09121234567',
      products: [],
      balance: 0,
    });
    expect(mobile.phone).toBe('09121234567');
  });
});

describe('employeeMapper', () => {
  it('شمارهٔ خالی فرم را null می‌نویسد نه رشتهٔ خالی', () => {
    // قید `phone ~ '^09[0-9]{9}$'` رشتهٔ خالی را رد می‌کند و `unique` هم
    // هست؛ دو کارمند تازه با شمارهٔ خالی کل batch را می‌شکستند.
    expect(
      employeeMapper.toRow({
        id: 'emp1',
        name: 'محمد',
        phone: '',
        role: 'seller',
        salary: 0,
        startDate: '',
        active: true,
        commission: 0,
      }).phone,
    ).toBeNull();
  });

  it('گشت‌وبرگشت بدون افت اطلاعات', () => {
    const employee = {
      id: 'emp3',
      name: 'امیر حسینی',
      phone: '09123333333',
      role: 'designer' as const,
      salary: 12_000_000,
      startDate: '2026-05-01',
      active: true,
      commission: 10,
    };
    expect(roundTrip(employeeMapper, employee)).toEqual(employee);
  });
});

describe('affiliateMapper', () => {
  const affiliate = {
    id: 'aff1',
    name: 'زهرا محمدی',
    phone: '09120000000',
    referralCode: 'ZAHRA10',
    commissionRate: 12,
    walletBalance: 500_000,
    totalEarnings: 1_200_000,
    totalWithdrawn: 700_000,
    totalSpent: 0,
    status: 'active' as const,
    joinDate: '2026-02-01',
  };

  it('گشت‌وبرگشت بدون افت اطلاعات', () => {
    // regression: جدول `affiliates` هیچ‌کدام از این ستون‌ها را نداشت و
    // `user_id`/`code` هر دو `not null` بودند، پس mapper نه فیلدی نگه می‌داشت و
    // نه حتی یک ردیف می‌توانست درج کند.
    expect(roundTrip(affiliateMapper, affiliate)).toEqual(affiliate);
  });

  it('کد خالی را null می‌نویسد تا قید unique نشکند', () => {
    expect(
      affiliateMapper.toRow({ ...affiliate, referralCode: '', phone: '' }).code,
    ).toBeNull();
  });

  it('user_id را نمی‌نویسد چون uuid است و همکار می‌تواند بی‌حساب مشتری باشد', () => {
    expect(affiliateMapper.toRow(affiliate)).not.toHaveProperty('user_id');
  });
});

describe('سازگاری کلی mapperها', () => {
  const mappers = [
    expenseMapper,
    invoiceMapper,
    supplierMapper,
    employeeMapper,
    campaignMapper,
    affiliateMapper,
    projectMapper,
    noteMapper,
    reviewMapper,
    smsLogMapper,
    okrMapper,
    contentProjectMapper,
    contentTemplateMapper,
  ];

  it('همه کلید تجاری را روی sku دارند و مقدارش حذف نمی‌شود', () => {
    for (const m of mappers) {
      expect(m.keyColumn).toBe('sku');
    }
  });

  it('id فروشگاهی به‌عنوان sku نوشته می‌شود', () => {
    for (const m of mappers) {
      const row = m.toRow({ id: 'KEY-42' } as never);
      expect(row.sku).toBe('KEY-42');
    }
  });

  it('هیچ ستونی که mapper نمی‌شناسد وجود ندارد (سهوِ یک‌کلمه‌ای نه)', () => {
    // ستون‌هایی که `toRow` نمی‌نویسد در `ON CONFLICT DO UPDATE` دست‌نخورده
    // می‌مانند — پس این تست اجازه نمی‌دهد ستونی «اتفاقی» در mapper اضافه شود که
    // در دیتابیس وجود ندارد و کل batch را رد کند.
    const allowed: Record<string, string[]> = {
      expenses: ['sku', 'category', 'title', 'amount', 'date', 'notes'],
      invoices: ['sku', 'invoice_number', 'type', 'date', 'due_date', 'customer_name',
        'customer_phone', 'customer_address', 'customer_national_id', 'subtotal', 'discount',
        'discount_type', 'discount_amount', 'tax', 'tax_amount', 'total', 'note', 'status'],
      suppliers: ['sku', 'name', 'phone', 'email', 'address', 'products', 'balance', 'notes'],
      employees: ['sku', 'name', 'phone', 'position', 'hire_date', 'salary', 'commission', 'active'],
      campaigns: ['sku', 'name', 'code', 'discount_type', 'discount_value', 'min_purchase',
        'max_uses', 'used_count', 'start_date', 'end_date', 'active'],
      affiliates: ['sku', 'name', 'phone', 'email', 'code', 'commission_rate', 'wallet_balance',
        'total_earnings', 'total_withdrawn', 'total_spent', 'status', 'join_date',
        'last_activity', 'notes'],
      projects: ['sku', 'title', 'group_name', 'status', 'stage', 'client_name', 'type', 'domain',
        'host', 'description', 'due_date', 'progress', 'total_cost', 'paid_amount',
        'hidden_from_projects', 'source_order_id'],
      notes: ['sku', 'title', 'customer_name', 'customer_phone', 'task', 'priority', 'status',
        'due_date', 'completed_at', 'tags', 'content'],
      reviews: ['sku', 'product_sku', 'name', 'rating', 'comment', 'date', 'approved'],
      sms_logs: ['sku', 'phone', 'message', 'status', 'sent_at'],
      okrs: ['sku', 'title', 'description', 'type', 'assigned_to', 'quarter', 'year',
        'start_date', 'end_date', 'status'],
      content_projects: ['sku', 'title', 'type', 'status', 'due_date', 'assigned_to', 'tags', 'extra'],
      content_templates: ['sku', 'name', 'type', 'scenario', 'equipment', 'body', 'quality_checklist'],
    };
    for (const m of mappers) {
      const columns = Object.keys(m.toRow({ id: 'x' } as never));
      for (const column of columns) {
        expect(allowed[m.table], `${m.table}.${column}`).toContain(column);
      }
    }
  });
});