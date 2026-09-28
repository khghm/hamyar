// ---------------------------------------------------------------------------
// Digital-marketing metric catalogue (extracted from the page component so the
// admin page stays small and every metric carries an explicit state key).
//
// source: 'auto'   → computed live from real store data (orders / expenses /
//                    campaigns / contentProjects / analytics events …) – shown
//                    read-only in the UI with a «خودکار» badge.
// source: 'manual' → entered by the marketing team; only these are editable,
//                    each saved value is audit-logged and tagged as manual.
// ---------------------------------------------------------------------------

export type MetricSource = 'auto' | 'manual';
export type MetricType = 'currency' | 'percent' | 'number' | 'score' | 'time';

export interface MetricDef {
  /** exact key inside DigitalMarketingData – never derived from array index */
  key: string;
  label: string;
  description: string;
  unit: string;
  source: MetricSource;
  type: MetricType;
}

export const MARKETING_CATEGORIES: { id: string; label: string; color: string }[] = [
  { id: 'overview', label: 'نمای کلی', color: '#2563eb' },
  { id: 'financial', label: 'مالی', color: '#059669' },
  { id: 'traffic', label: 'ترافیک و وب‌سایت', color: '#2563eb' },
  { id: 'sales', label: 'فروش', color: '#7c3aed' },
  { id: 'customer', label: 'مشتری', color: '#059669' },
  { id: 'marketing', label: 'تبلیغات و کمپین', color: '#ea580c' },
  { id: 'seo', label: 'SEO', color: '#10b981' },
  { id: 'advertising', label: 'ورودی و هزینه رسانه', color: '#f97316' },
  { id: 'social', label: 'شبکه‌های اجتماعی', color: '#ec4899' },
  { id: 'content', label: 'محتوا', color: '#06b6d4' },
  { id: 'calls', label: 'تماس و چت', color: '#f59e0b' },
  { id: 'pages', label: 'صفحات و سشن', color: '#6366f1' },
  { id: 'engagement', label: 'تعامل، ثبت‌نام و سبد', color: '#8b5cf6' },
  { id: 'growth', label: 'رشد و ایمیل', color: '#14b8a6' },
  { id: 'retention', label: 'حفظ مشتری و دموگرافیک', color: '#fb923c' },
  { id: 'topCustomers', label: 'مشتریان برتر و بازار', color: '#eab308' },
  { id: 'ux', label: 'UX و امتیازات', color: '#0ea5e9' },
  { id: 'referral', label: 'رفرال و همکاران', color: '#a855f7' },
  { id: 'brand', label: 'برند', color: '#ef4444' },
  { id: 'operations', label: 'عملیات و زیرساخت', color: '#64748b' },
];

export const MARKETING_METRICS: Record<string, MetricDef[]> = {
  financial: [
    { key: 'gmv', label: 'GMV (میزان فروش کل)', description: 'جمع کل مبلغ سفارشات از داده واقعی', unit: 'تومان', source: 'auto', type: 'currency' },
    { key: 'nmv', label: 'NMV (مبلغ خالص)', description: 'جمع مبالغ پرداختی واقعی پس از کسر تخفیفات', unit: 'تومان', source: 'auto', type: 'currency' },
    { key: 'grossProfit', label: 'سود ناخالص', description: 'درآمد منهای بهای تمام‌شده کالای فروخته‌شده', unit: 'تومان', source: 'manual', type: 'currency' },
    { key: 'profit', label: 'سود خالص', description: 'درآمد منهای تمام هزینه‌ها', unit: 'تومان', source: 'manual', type: 'currency' },
    { key: 'cashFlow', label: 'جریان نقدی', description: 'پرداختی مشتریان منهای کل هزینه‌های ثبت‌شده', unit: 'تومان', source: 'auto', type: 'currency' },
  ],
  traffic: [
    { key: 'totalImpressions', label: 'ایمپرشن کل', description: 'تعداد کل نمایش‌ها (از پنل تبلیغاتی وارد کنید)', unit: 'بار', source: 'manual', type: 'number' },
    { key: 'sessions', label: 'بازدید (Sessions)', description: 'جلسات پایش‌شده توسط شمارنده داخلی سایت', unit: 'بازدید', source: 'auto', type: 'number' },
    { key: 'users', label: 'کاربران منحصر به فرد', description: 'بازدیدکنندگان یکتای پایش‌شده', unit: 'نفر', source: 'auto', type: 'number' },
    { key: 'engagementRate', label: 'نرخ تعامل', description: 'نسبت بازدیدهای دارای رویداد تعاملی به کل', unit: '%', source: 'auto', type: 'percent' },
    { key: 'sessionsPerUser', label: 'بازدید به ازای هر کاربر', description: 'میانگین تعداد بازدید هر کاربر', unit: 'بار', source: 'auto', type: 'number' },
  ],
  sales: [
    { key: 'transactions', label: 'تعداد سفارشات', description: 'تعداد کل سفارشات ثبت‌شده', unit: 'سفارش', source: 'auto', type: 'number' },
    { key: 'totalProductsSold', label: 'محصولات فروخته‌شده', description: 'اقلام کالایی فروش‌رفته', unit: 'عدد', source: 'auto', type: 'number' },
    { key: 'returnRate', label: 'نرخ بازگشت', description: 'درصد سفارشات لغوشده', unit: '%', source: 'auto', type: 'percent' },
    { key: 'outOfStockRate', label: 'نرخ عدم تأمین', description: 'درصد محصولات ناموجود انبار', unit: '%', source: 'auto', type: 'percent' },
    { key: 'avgLossPerReturn', label: 'میانگین ضرر بازگشت', description: 'میانگین مبلغ سفارشات لغوشده', unit: 'تومان', source: 'auto', type: 'currency' },
    { key: 'onTimeDeliveryRate', label: 'نرخ تحویل به‌موقع', description: 'درصد سفارشات تحویل‌شده قبل از سررسید', unit: '%', source: 'auto', type: 'percent' },
    { key: 'avgDeliveryTime', label: 'میانگین زمان تحویل', description: 'میانگین روز از ثبت تا تحویل', unit: 'روز', source: 'auto', type: 'time' },
    { key: 'avgSupplyTime', label: 'میانگین زمان تأمین', description: 'میانگین زمان تأمین کالا', unit: 'ساعت', source: 'manual', type: 'time' },
    { key: 'purchaseRate', label: 'نرخ خرید', description: 'نسبت سفارشات به بازدیدهای پایش‌شده', unit: '%', source: 'auto', type: 'percent' },
    { key: 'aov', label: 'AOV (میانگین سبد خرید)', description: 'میانگین مبلغ هر سفارش', unit: 'تومان', source: 'auto', type: 'currency' },
    { key: 'aop', label: 'AOP (میانگین سود سبد)', description: 'میانگین سود هر سفارش', unit: 'تومان', source: 'manual', type: 'currency' },
    { key: 'avgProductPrice', label: 'میانگین قیمت محصول', description: 'میانگین قیمت محصولات فروشگاه', unit: 'تومان', source: 'auto', type: 'currency' },
    { key: 'avgPackagingCost', label: 'میانگین هزینه بسته‌بندی', description: 'میانگین هزینه بسته‌بندی هر سفارش', unit: 'تومان', source: 'manual', type: 'currency' },
    { key: 'avgClicksPerVisit', label: 'میانگین کلیک به ازای بازدید', description: 'کلیک‌های ثبت‌شده به ازای هر بازدید', unit: 'کلیک', source: 'auto', type: 'number' },
  ],
  calls: [
    { key: 'totalCalls', label: 'تعداد تماس', description: 'تعداد کل تماس‌های دریافتی', unit: 'تماس', source: 'manual', type: 'number' },
    { key: 'callsPerSession', label: 'تماس به ازای بازدید', description: 'رویداد call_now به ازای هر بازدید', unit: '٪', source: 'auto', type: 'percent' },
    { key: 'callToCustomerRate', label: 'نرخ تبدیل تماس به مشتری', description: 'درصد تماس‌های منجر به خرید', unit: '%', source: 'manual', type: 'percent' },
    { key: 'clickOnCallRate', label: 'نرخ کلیک روی تماس', description: 'نرخ کلیک رویداد call_now', unit: '%', source: 'auto', type: 'percent' },
    { key: 'phoneOrdersRate', label: 'نسبت سفارشات تلفنی', description: 'سهم سفارشات کانال حضوری/تلفنی', unit: '%', source: 'auto', type: 'percent' },
    { key: 'trackingCallsRate', label: 'نسبت تماس‌های پیگیری', description: 'نسبت تماس‌های پیگیری به کل', unit: '%', source: 'manual', type: 'percent' },
    { key: 'avgCallsPerUser', label: 'میانگین تماس هر کاربر', description: 'تعداد تماس به ازای کاربر', unit: 'تماس', source: 'auto', type: 'number' },
    { key: 'costPerCall', label: 'هزینه به ازای تماس', description: 'هزینه تبلیغات تقسیم بر تماس‌ها', unit: 'تومان', source: 'auto', type: 'currency' },
    { key: 'salesPerCall', label: 'فروش به ازای تماس', description: 'درآمد تقسیم بر تماس‌ها', unit: 'تومان', source: 'auto', type: 'currency' },
    { key: 'profitPerCall', label: 'سود به ازای تماس', description: 'سود تقسیم بر تماس‌ها', unit: 'تومان', source: 'manual', type: 'currency' },
    { key: 'missedCallsRate', label: 'نرخ تماس بی‌پاسخ', description: 'نسبت تماس‌های بی‌پاسخ', unit: '%', source: 'manual', type: 'percent' },
    { key: 'chatSessionsInitiated', label: 'شروع چت آنلاین', description: 'رویدادهای chat_open (چت پشتیبانی)', unit: 'چت', source: 'auto', type: 'number' },
    { key: 'chatPerSession', label: 'چت به ازای بازدید', description: 'نسبت شروع چت به بازدید', unit: '٪', source: 'auto', type: 'percent' },
  ],
  pages: [
    { key: 'pagesPerSession', label: 'صفحات به ازای سشن', description: 'pageview تقسیم بر sessions', unit: 'صفحه', source: 'auto', type: 'number' },
    { key: 'totalPageviews', label: 'کل بازدید صفحات', description: 'مجموع رویدادهای pageview', unit: 'بازدید', source: 'auto', type: 'number' },
    { key: 'uniquePageviews', label: 'بازدید منحصربه‌فرد', description: 'تعداد کاربران یکتای پایش‌شده', unit: 'بازدید', source: 'auto', type: 'number' },
    { key: 'homepageViewsRate', label: 'نرخ بازدید صفحه اصلی', description: 'سهم صفحه اصلی از کل pageview', unit: '%', source: 'auto', type: 'percent' },
    { key: 'productPageviews', label: 'بازدید صفحات محصول', description: 'pageview مسیرهای فروشگاه و جزئیات کالا', unit: 'بازدید', source: 'auto', type: 'number' },
    { key: 'productPageviewsRate', label: 'نرخ بازدید محصول', description: 'سهم صفحات محصول', unit: '%', source: 'auto', type: 'percent' },
    { key: 'blogPageviews', label: 'بازدید صفحات بلاگ', description: 'pageview مسیرهای اخبار و بلاگ', unit: 'بازدید', source: 'auto', type: 'number' },
    { key: 'blogPageviewsRate', label: 'نرخ بازدید بلاگ', description: 'سهم صفحات بلاگ', unit: '%', source: 'auto', type: 'percent' },
    { key: 'categoryPageviewsRate', label: 'نرخ بازدید دسته‌بندی', description: 'سهم صفحات دسته‌بندی', unit: '%', source: 'auto', type: 'percent' },
    { key: 'topProductViewsRate', label: 'نرخ پربازدیدترین محصول', description: 'سهم پربازدیدترین مسیر', unit: '%', source: 'auto', type: 'percent' },
    { key: 'error404Rate', label: 'نرخ خطای 404', description: 'رویدادهای not_found به ازای بازدید', unit: '%', source: 'auto', type: 'percent' },
    { key: 'avgSessionDuration', label: 'میانگین زمان سشن', description: 'میانگین زمان سپری‌شده در سایت', unit: 'دقیقه', source: 'manual', type: 'time' },
    { key: 'totalSessionTime', label: 'کل زمان سشن', description: 'کل زمان سپری‌شده در وب‌سایت', unit: 'دقیقه', source: 'manual', type: 'time' },
    { key: 'avgEngagementTime', label: 'میانگین زمان فعال', description: 'میانگین زمان فعال کاربران', unit: 'دقیقه', source: 'manual', type: 'time' },
    { key: 'avgTimeOnPage', label: 'میانگین زمان در صفحه', description: 'میانگین زمان روی هر صفحه', unit: 'دقیقه', source: 'manual', type: 'time' },
    { key: 'productVsBlogDuration', label: 'نسبت زمان محصول به بلاگ', description: 'زمان صفحات محصول به بلاگ', unit: 'نسبت', source: 'manual', type: 'number' },
    { key: 'videoVsNonVideoDuration', label: 'نسبت زمان ویدئو به غیر ویدئو', description: 'ماندگاری در صفحات ویدئودار', unit: 'نسبت', source: 'manual', type: 'number' },
  ],
  engagement: [
    { key: 'bounceRate', label: 'نرخ پرش', description: 'درصد سشن‌های تک‌صفحه‌ای (شمارنده داخلی)', unit: '%', source: 'auto', type: 'percent' },
    { key: 'deepSessionsRate', label: 'نرخ سشن‌های عمیق', description: 'سشن‌هایی با بیش از ۵ صفحه', unit: '%', source: 'manual', type: 'percent' },
    { key: 'longSessionsRate', label: 'نرخ سشن‌های طولانی', description: 'سشن‌های بیش از ۵ دقیقه', unit: '%', source: 'manual', type: 'percent' },
    { key: 'registrationToPurchaseRate', label: 'نرخ تبدیل ثبت‌نام به خرید', description: 'کاربران ثبت‌نام‌کرده دارای سفارش', unit: '%', source: 'auto', type: 'percent' },
    { key: 'profileCompletionRate', label: 'نرخ تکمیل پروفایل', description: 'پروفایل‌های دارای نام و ایمیل/آواتار', unit: '%', source: 'auto', type: 'percent' },
    { key: 'registrationCompletionRate', label: 'نرخ تکمیل ثبت‌نام', description: 'تکمیل فرم ثبت‌نام نسبت به بازدید صفحه', unit: '%', source: 'manual', type: 'percent' },
    { key: 'googleVsEmailRate', label: 'نسبت ثبت‌نام گوگل', description: 'ثبت‌نام گوگل به ایمیل', unit: '%', source: 'manual', type: 'percent' },
    { key: 'addToCartToPurchaseRate', label: 'نرخ تبدیل سبد به خرید', description: 'checkout ÷ add_to_cart', unit: '%', source: 'auto', type: 'percent' },
    { key: 'cartCompletionRate', label: 'نرخ تکمیل سبد خرید', description: 'نسبت تکمیل سبد', unit: '%', source: 'auto', type: 'percent' },
    { key: 'cartAbandonmentRate', label: 'نرخ ترک سبد خرید', description: '۱۰۰ منهای نرخ تکمیل سبد', unit: '%', source: 'auto', type: 'percent' },
  ],
  marketing: [
    { key: 'adSpend', label: 'هزینه تبلیغات', description: 'مجموع هزینه‌های دسته «تبلیغات» از بخش مالی', unit: 'تومان', source: 'auto', type: 'currency' },
    { key: 'attributedRevenue', label: 'درآمد انتساب‌یافته', description: 'مجموع سفارشات دارای UTM یا کد تخفیف', unit: 'تومان', source: 'auto', type: 'currency' },
    { key: 'marketingConversionRate', label: 'نرخ تبدیل تبلیغات', description: 'سفارشات انتساب‌یافته به ازای کلیک‌های تبلیغاتی', unit: '%', source: 'auto', type: 'percent' },
    { key: 'roi', label: 'ROI (نرخ بازگشت سرمایه)', description: '(درآمد − هزینه تبلیغات) ÷ هزینه تبلیغات', unit: '%', source: 'auto', type: 'percent' },
    { key: 'roas', label: 'ROAS (بازگشت هزینه تبلیغات)', description: 'درآمد انتساب‌یافته ÷ هزینه تبلیغات', unit: '×', source: 'auto', type: 'number' },
    { key: 'activeCampaigns', label: 'کمپین‌های فعال', description: 'تعداد کمپین‌های تخفیف فعال', unit: 'کمپین', source: 'auto', type: 'number' },
    { key: 'couponUses', label: 'استفاده از کدهای تخفیف', description: 'مجموع استفاده ثبت‌شده از کمپین‌ها', unit: 'بار', source: 'auto', type: 'number' },
    { key: 'couponRevenue', label: 'درآمد کدهای تخفیف', description: 'مجموع مبلغ سفارشات ثبت‌شده با کد تخفیف', unit: 'تومان', source: 'auto', type: 'currency' },
  ],
  advertising: [
    { key: 'cpc', label: 'CPC (هزینه به ازای کلیک)', description: 'هزینه تبلیغات ÷ کلیک‌های ثبت‌شده', unit: 'تومان', source: 'auto', type: 'currency' },
    { key: 'cpv', label: 'CPV (هزینه به ازای ویزیتور)', description: 'هزینه تبلیغات ÷ کاربران یکتا', unit: 'تومان', source: 'auto', type: 'currency' },
    { key: 'rpv', label: 'RPV (درآمد به ازای ویزیتور)', description: 'درآمد ÷ کاربران یکتا', unit: 'تومان', source: 'auto', type: 'currency' },
    { key: 'rpl', label: 'RPL (درآمد به ازای لید)', description: 'درآمد ÷ لیدها (رویداد lead)', unit: 'تومان', source: 'auto', type: 'currency' },
    { key: 'cpl', label: 'CPL (هزینه به ازای لید)', description: 'هزینه تبلیغات ÷ لیدها', unit: 'تومان', source: 'auto', type: 'currency' },
    { key: 'organicVsPaidRate', label: 'نسبت ورودی غیرپولی به پولی', description: 'ورودی بدون UTM به ورودی دارای UTM', unit: 'نسبت', source: 'auto', type: 'number' },
    { key: 'directRate', label: 'نسبت ورودی دایرکت', description: 'سهم ورودی مستقیم از کل', unit: '%', source: 'auto', type: 'percent' },
    { key: 'directBrandedRate', label: 'نسبت دایرکت + برند', description: 'دایرکت + جستجوی برند', unit: '%', source: 'manual', type: 'percent' },
    { key: 'organicRate', label: 'نسبت ورودی ارگانیک', description: 'سهم ورودی ارگانیک از منابع ردیابی‌شده', unit: '%', source: 'auto', type: 'percent' },
    { key: 'googleFirstTimeRate', label: 'نرخ آشنایی از گوگل', description: 'مشتریان اولین‌سفارشی با منبع گوگل', unit: '%', source: 'manual', type: 'percent' },
  ],
  seo: [
    { key: 'googleImpressions', label: 'نمایش در گوگل', description: 'نمایش در نتایج گوگل (Search Console)', unit: 'بار', source: 'manual', type: 'number' },
    { key: 'googleImageClickRate', label: 'نرخ کلیک تصویر گوگل', description: 'سهم Google Images از ورودی گوگل', unit: '%', source: 'manual', type: 'percent' },
    { key: 'productOrganicRate', label: 'نرخ محصول ارگانیک', description: 'سهم صفحات محصول در ورودی ارگانیک', unit: '%', source: 'manual', type: 'percent' },
    { key: 'avgCtr', label: 'میانگین نرخ کلیک (CTR)', description: 'میانگین CTR نتایج جستجو', unit: '%', source: 'manual', type: 'percent' },
    { key: 'indexedPages', label: 'صفحات ایندکس‌شده', description: 'تعداد صفحات ایندکس‌شده', unit: 'صفحه', source: 'manual', type: 'number' },
    { key: 'internalLinks', label: 'لینک‌های داخلی', description: 'تعداد لینک‌های داخلی', unit: 'لینک', source: 'manual', type: 'number' },
    { key: 'backlinkDomains', label: 'دامنه‌های بک‌لینک', description: 'دامنه‌های لینک‌دهنده', unit: 'دامنه', source: 'manual', type: 'number' },
    { key: 'domainAuthority', label: 'ارزش دامنه (DA)', description: 'Domain Authority', unit: 'امتیاز', source: 'manual', type: 'score' },
    { key: 'spamScore', label: 'امتیاز اسپم', description: 'Spam Score', unit: 'امتیاز', source: 'manual', type: 'score' },
    { key: 'topGoogleKeywords', label: 'کلمات کلیدی برتر', description: 'کلمات با جایگاه ۱ گوگل', unit: 'کلمه', source: 'manual', type: 'number' },
    { key: 'blogToShopVisits', label: 'بازدید بلاگ به فروشگاه', description: 'رویداد blog_to_shop (انتقال کاربر از بلاگ به فروشگاه)', unit: 'بازدید', source: 'auto', type: 'number' },
  ],
  growth: [
    { key: 'sessionGrowthRate', label: 'رشد ورودی', description: 'رشد بازدید نسبت به دورهٔ قبل (خودکار)', unit: '%', source: 'auto', type: 'percent' },
    { key: 'organicGrowthRate', label: 'رشد ورودی ارگانیک', description: 'میزان رشد ورودی ارگانیک', unit: '%', source: 'manual', type: 'percent' },
    { key: 'internalSearchRate', label: 'نرخ سرچ داخلی', description: 'بازدیدهای دارای سرچ داخلی', unit: '%', source: 'manual', type: 'percent' },
    { key: 'noResultSearchRate', label: 'نرخ سرچ بدون نتیجه', description: 'سرچ‌های بی‌نتیجه', unit: '%', source: 'manual', type: 'percent' },
    { key: 'subscriberGrowthRate', label: 'رشد مشترکان ایمیل', description: 'رشد لیست ایمیل', unit: '%', source: 'manual', type: 'percent' },
    { key: 'openRate', label: 'نرخ بازشدن ایمیل', description: 'Open Rate', unit: '%', source: 'manual', type: 'percent' },
    { key: 'emailCtr', label: 'نرخ کلیک ایمیل', description: 'Email CTR', unit: '%', source: 'manual', type: 'percent' },
  ],
  retention: [
    { key: 'avgSessionsPerUser', label: 'میانگین سشن هر کاربر', description: 'sessions ÷ کاربران یکتا', unit: 'بار', source: 'auto', type: 'number' },
    { key: 'avgDaysBetweenSessions', label: 'میانگین روز بین سشن', description: 'فاصلهٔ زمانی بین بازدیدها', unit: 'روز', source: 'manual', type: 'time' },
    { key: 'singlePageViewsRate', label: 'نرخ تک صفحه', description: 'سهم صفحات کاربران بانس‌شده', unit: '%', source: 'manual', type: 'percent' },
    { key: 'avgTimeToPurchase', label: 'میانگین زمان تا خرید', description: 'میانگین روز از عضویت تا اولین سفارش', unit: 'روز', source: 'auto', type: 'time' },
    { key: 'assistedPathPosition', label: 'بیشترین مسیر خرید', description: 'طرح سفر رایج خرید', unit: 'مسیر', source: 'manual', type: 'number' },
    { key: 'firstVisitPurchaseRate', label: 'نرخ خرید اولین بازدید', description: 'خرید در همان سشن اول', unit: '%', source: 'manual', type: 'percent' },
    { key: 'newVisitorPurchaseRate', label: 'نرخ خرید بازدیدکنندگان جدید', description: 'خرید بازدیدهای ماه جاری از آشنایی قبلی', unit: '%', source: 'manual', type: 'percent' },
    { key: 'assistedConversionsRate', label: 'نرخ تبدیل‌های کمکی', description: 'Assisted / Last Click', unit: 'نسبت', source: 'manual', type: 'number' },
    { key: 'returningVsNewRate', label: 'نسبت قدیمی به جدید', description: 'مشتریان تکراری به تک‌سفارشی', unit: 'نسبت', source: 'auto', type: 'number' },
    { key: 'returningValueVsNew', label: 'ارزش قدیمی به جدید', description: 'میانگین ارزش سفارش مشتری قدیمی به جدید', unit: 'نسبت', source: 'auto', type: 'number' },
    { key: 'mobileVsDesktopRate', label: 'نسبت موبایل به دسکتاپ', description: 'ترافیک موبایل به دسکتاپ', unit: 'نسبت', source: 'manual', type: 'number' },
    { key: 'maleVsFemaleRate', label: 'نسبت مرد به زن', description: 'ترافیک مرد به زن', unit: 'نسبت', source: 'manual', type: 'number' },
    { key: 'avgUserAge', label: 'میانگین سنی کاربران', description: 'میانگین سنی کاربران', unit: 'سال', source: 'manual', type: 'number' },
    { key: 'productComments', label: 'کامنت محصولات', description: 'نظرات تأییدشده محصولات', unit: 'کامنت', source: 'auto', type: 'number' },
    { key: 'avgCommentsPerUser', label: 'میانگین کامنت هر کاربر', description: 'کامنت به ازای کاربر ثبت‌نام‌کرده', unit: 'کامنت', source: 'auto', type: 'number' },
    { key: 'avgScrollDepth', label: 'میانگین عمق اسکرول', description: 'میانگین درصد اسکرول صفحات', unit: '٪', source: 'auto', type: 'number' },
    { key: 'scroll80Rate', label: 'نرخ اسکرول ۸۰٪', description: 'رویدادهای scroll≥۸۰ به ازای pageview', unit: '%', source: 'auto', type: 'percent' },
    { key: 'day1RetentionRate', label: 'نرخ بازگشت روز اول', description: 'بازگشت کاربر جدید پس از ۱ روز', unit: '%', source: 'manual', type: 'percent' },
    { key: 'weeklyVsMonthlyRetention', label: 'نسبت ریتنشن هفتگی به ماهانه', description: 'Weekly/Monthly retention', unit: 'نسبت', source: 'manual', type: 'number' },
  ],
  customer: [
    { key: 'cac', label: 'CAC (هزینه جذب مشتری)', description: 'هزینه تبلیغات ÷ مشتریان جدید', unit: 'تومان', source: 'auto', type: 'currency' },
    { key: 'clv', label: 'CLV (ارزش طول عمر مشتری)', description: 'میانگین درآمد به ازای هر مشتری', unit: 'تومان', source: 'auto', type: 'currency' },
    { key: 'clvToCac', label: 'CLV/CAC', description: 'نسبت ارزش به هزینه جذب', unit: '×', source: 'auto', type: 'number' },
    { key: 'retentionRate', label: 'نرخ بازگشت مشتری', description: 'درصد مشتریان با بیش از یک سفارش', unit: '%', source: 'auto', type: 'percent' },
    { key: 'churnRate', label: 'نرخ ریزش مشتری', description: 'درصد مشتریان بدون فعالیت ۹۰ روزه اخیر', unit: '%', source: 'auto', type: 'percent' },
    { key: 'loyalCustomerRate', label: 'نرخ مشتریان وفادار', description: 'سطوح نقره‌ای/طلایی/VIP', unit: '%', source: 'auto', type: 'percent' },
    { key: 'purchaseFrequency', label: 'فرکانس خرید', description: 'میانگین تعداد سفارش هر مشتری', unit: 'بار', source: 'auto', type: 'number' },
    { key: 'avgTimeBetweenPurchases', label: 'میانگین زمان بین خرید', description: 'روز بین دو خرید مشتریان چندسفارشی', unit: 'روز', source: 'auto', type: 'time' },
  ],
  topCustomers: [
    { key: 'largestCartItems', label: 'بزرگ‌ترین سبد خرید', description: 'تعداد اقلام بزرگ‌ترین سبد', unit: 'عدد', source: 'auto', type: 'number' },
    { key: 'topCustomerOrders', label: 'سفارش‌های پرسفارش‌ترین مشتری', description: 'تعداد سفارش بهترین مشتری', unit: 'سفارش', source: 'auto', type: 'number' },
    { key: 'topCustomerAmount', label: 'مبلغ خرید بهترین مشتری', description: 'مجموع پرداختی بهترین مشتری', unit: 'تومان', source: 'auto', type: 'currency' },
    { key: 'b2bVsB2cRate', label: 'نسبت B2B به B2C', description: 'سهم سفارشات سازمانی (بالای ۵ میلیون تومان)', unit: '%', source: 'auto', type: 'percent' },
    { key: 'marketShare', label: 'سهم بازار', description: 'تخمین سهم بازار', unit: '%', source: 'manual', type: 'percent' },
    { key: 'cheaperCompetitorsRate', label: 'نرخ رقابت قیمت', description: 'محصولات ارزان‌تر در سایت رقبا', unit: '%', source: 'manual', type: 'percent' },
  ],
  ux: [
    { key: 'deadClicks', label: 'دد کلیک', description: 'رویدادهای dead_click (کلیک روی عنصر غیرقابل‌کلیک)', unit: 'کلیک', source: 'auto', type: 'number' },
    { key: 'quickBacks', label: 'کوییک بک', description: 'رویدادهای quick_back (بازگشت سریع)', unit: 'بار', source: 'auto', type: 'number' },
    { key: 'trustSymbolClickRate', label: 'نرخ کلیک نماد اعتماد', description: 'click_trust به ازای بازدید', unit: '%', source: 'auto', type: 'percent' },
    { key: 'wishlistClicks', label: 'کلیک علاقه‌مندی', description: 'رویدادهای wishlist', unit: 'کلیک', source: 'auto', type: 'number' },
    { key: 'designScore', label: 'امتیاز طراحی', description: 'جذابیت ظاهری وب‌سایت', unit: 'امتیاز', source: 'manual', type: 'score' },
    { key: 'findabilityScore', label: 'امتیاز پیدا کردن', description: 'راحتی یافتن محتوای موردنظر', unit: 'امتیاز', source: 'manual', type: 'score' },
    { key: 'readabilityScore', label: 'امتیاز فهم مطالب', description: 'سهولت فهم مطالب سایت', unit: 'امتیاز', source: 'manual', type: 'score' },
    { key: 'trustScore', label: 'امتیاز اعتماد', description: 'اعتماد به مطالب موجود', unit: 'امتیاز', source: 'manual', type: 'score' },
    { key: 'supportScore', label: 'امتیاز پشتیبانی', description: 'امتیاز کلی تیم پشتیبانی', unit: 'امتیاز', source: 'manual', type: 'score' },
    { key: 'avgProductRating', label: 'میانگین امتیاز محصولات', description: 'میانگین ستاره نظرات محصولات', unit: 'امتیاز', source: 'auto', type: 'score' },
    { key: 'avgBlogRating', label: 'میانگین امتیاز بلاگ', description: 'میانگین امتیاز پست‌های بلاگ', unit: 'امتیاز', source: 'manual', type: 'score' },
  ],
  content: [
    { key: 'wordsGenerated', label: 'کلمات تولیدشده', description: 'تخمین کلمات خروجی تسک‌های محتوایی انجام‌شده', unit: 'کلمه', source: 'auto', type: 'number' },
    { key: 'imagesAdded', label: 'تصاویر درج‌شده', description: 'فایل‌های تصویری بارگذاری‌شده در پروژه‌های محتوا', unit: 'تصویر', source: 'auto', type: 'number' },
    { key: 'infographicsCreated', label: 'اینفوگرافیک', description: 'تعداد تسک‌های تبلیغی/اینفو', unit: 'اینفوگرافیک', source: 'auto', type: 'number' },
    { key: 'videosAdded', label: 'ویدئوها', description: 'تعداد تسک‌های ویدئویی', unit: 'ویدئو', source: 'auto', type: 'number' },
    { key: 'productsAdded', label: 'محصولات اضافه‌شده', description: 'تعداد محصولات فروشگاه', unit: 'محصول', source: 'auto', type: 'number' },
    { key: 'blogPosts', label: 'پست‌های بلاگ', description: 'تعداد اخبار/پست‌های منتشرشده', unit: 'پست', source: 'auto', type: 'number' },
    { key: 'productVsBlogWordsRate', label: 'نسبت کلمات محصول به بلاگ', description: 'کلمات محصول به بلاگ', unit: 'نسبت', source: 'manual', type: 'number' },
    { key: 'reports', label: 'رپورتاژ', description: 'تعداد رپورتاژهای منتشرشده', unit: 'رپورتاژ', source: 'manual', type: 'number' },
    { key: 'oldContentUpdates', label: 'اصلاح محتواهای قدیمی', description: 'تعداد بروزرسانی محتواهای قدیمی', unit: 'محتوا', source: 'manual', type: 'number' },
    { key: 'contentBudget', label: 'بودجه مصوب محتوا', description: 'مجموع بودجه پروژه‌های محتوایی', unit: 'تومان', source: 'auto', type: 'currency' },
    { key: 'contentActualCost', label: 'هزینه واقعی محتوا', description: 'مجموع هزینهٔ واقعی پروژه‌های محتوایی', unit: 'تومان', source: 'auto', type: 'currency' },
    { key: 'contentPublished', label: 'محتوای منتشرشده', description: 'تعداد تسک‌های با وضعیت منتشرشده', unit: 'تسک', source: 'auto', type: 'number' },
    { key: 'contentAvgQuality', label: 'میانگین کیفیت محتوا', description: 'میانگین qualityScore تسک‌ها', unit: 'از ۱۰۰', source: 'auto', type: 'score' },
  ],
  referral: [
    { key: 'referralTraffic', label: 'ورودی رفرال', description: 'بازدیدهای با utm_medium ارجاعی/اجتماعی', unit: 'بازدید', source: 'auto', type: 'number' },
    { key: 'exitRate', label: 'نرخ خروج', description: 'خروج از صفحه اصلی یا صفحات هاب', unit: '%', source: 'manual', type: 'percent' },
    { key: 'avgBlogPageValue', label: 'میانگین ارزش صفحات بلاگ', description: 'ارزش انتسابی هر بازدید بلاگ', unit: 'تومان', source: 'manual', type: 'currency' },
    { key: 'blogVsTotalPageValue', label: 'نسبت ارزش بلاگ به کل', description: 'سهم ارزش بلاگ', unit: '%', source: 'manual', type: 'percent' },
    { key: 'blogUsersRate', label: 'نرخ کاربران بلاگ', description: 'کاربران بازدیدکننده بلاگ', unit: '%', source: 'manual', type: 'percent' },
    { key: 'blogToShopRate', label: 'نرخ بلاگ به فروشگاه', description: 'blog_to_shop به ازای بازدید بلاگ', unit: '%', source: 'auto', type: 'percent' },
    { key: 'productImageClickRate', label: 'نرخ کلیک عکس محصول', description: 'image_zoom ÷ pageview محصول', unit: '%', source: 'auto', type: 'percent' },
    { key: 'productVideoClickRate', label: 'نرخ کلیک ویدئو محصول', description: 'video_play ÷ pageview محصول', unit: '%', source: 'auto', type: 'percent' },
    { key: 'affiliateReferrals', label: 'سفارشات همکاران', description: 'سفارشات ارجاعی سیستم همکاری در فروش', unit: 'سفارش', source: 'auto', type: 'number' },
    { key: 'affiliateRevenue', label: 'درآمد همکاران', description: 'مجموع مبلغ سفارشات ارجاعی', unit: 'تومان', source: 'auto', type: 'currency' },
    { key: 'affiliateCommission', label: 'پورسانت همکاران', description: 'مجموع کمیسیون سفارشات ارجاعی', unit: 'تومان', source: 'auto', type: 'currency' },
  ],
  brand: [
    { key: 'brandAwareness', label: 'آگاهی از برند', description: 'میزان آگاهی از برند', unit: '%', source: 'manual', type: 'percent' },
    { key: 'topOfMind', label: 'محبوبیت برند', description: 'Top of Mind', unit: '%', source: 'manual', type: 'percent' },
    { key: 'nps', label: 'NPS', description: 'شاخص خالص ترویج‌کنندگان', unit: 'امتیاز', source: 'manual', type: 'score' },
    { key: 'satisfactionRate', label: 'رضایت مشتریان', description: 'میانگین امتیاز نظرات تأییدشده', unit: '%', source: 'auto', type: 'percent' },
    { key: 'womRate', label: 'نرخ WOM', description: 'آشنایی دهان‌به‌دهان', unit: '%', source: 'manual', type: 'percent' },
  ],
  operations: [
    { key: 'suppliers', label: 'تأمین‌کنندگان', description: 'تعداد تأمین‌کننده ثبت‌شده', unit: 'تأمین‌کننده', source: 'auto', type: 'number' },
    { key: 'personnel', label: 'پرسنل', description: 'تعداد کارمندان فعال', unit: 'نفر', source: 'auto', type: 'number' },
    { key: 'positions', label: 'پوزیشن‌های شغلی', description: 'تعداد نقش‌های سازمانی RBAC', unit: 'پوزیشن', source: 'auto', type: 'number' },
    { key: 'dailyWorkHours', label: 'ساعات کار روزانه', description: 'مجموع ساعات کاری روزانه پرسنل', unit: 'ساعت', source: 'auto', type: 'time' },
    { key: 'revenuePerHour', label: 'درآمد به ازای ساعت کار', description: 'درآمد ÷ ساعات کار', unit: 'تومان', source: 'auto', type: 'currency' },
    { key: 'avgHourlyWage', label: 'میانگین حقوق ساعتی', description: 'حقوق ماهانه ÷ (۲۲ × ۸) ساعت', unit: 'تومان', source: 'auto', type: 'currency' },
    { key: 'avgPageLoadTime', label: 'میانگین سرعت لود', description: 'میانگین زمان لود صفحات', unit: 'ثانیه', source: 'manual', type: 'time' },
    { key: 'fcp', label: 'FCP', description: 'First Contentful Paint', unit: 'ثانیه', source: 'manual', type: 'time' },
    { key: 'lcp', label: 'LCP', description: 'Largest Contentful Paint', unit: 'ثانیه', source: 'manual', type: 'time' },
  ],
  socialMedia: [
    { key: 'socialTraffic', label: 'ورودی سوشال', description: 'بازدیدهای با منبع شبکه‌های اجتماعی', unit: 'بازدید', source: 'auto', type: 'number' },
    { key: 'socialIconClicks', label: 'کلیک آیکون‌های سوشال', description: 'رویدادهای social_icon', unit: 'کلیک', source: 'auto', type: 'number' },
    { key: 'ugcContent', label: 'محتوای UGC', description: 'محتوای تولیدشده با نام برند', unit: 'محتوا', source: 'manual', type: 'number' },
    { key: 'totalFollowers', label: 'کل دنبال‌کننده‌ها', description: 'مجموع فالوئر اکانت‌ها', unit: 'نفر', source: 'manual', type: 'number' },
    { key: 'followers', label: 'فالوئر', description: 'فالوئر اینستاگرام', unit: 'نفر', source: 'manual', type: 'number' },
    { key: 'avgLikes', label: 'میانگین لایک', description: 'میانگین لایک پست', unit: 'لایک', source: 'manual', type: 'number' },
    { key: 'avgComments', label: 'میانگین کامنت', description: 'میانگین کامنت پست', unit: 'کامنت', source: 'manual', type: 'number' },
    { key: 'accountReach', label: 'اکانت ریچ', description: 'Account Reach', unit: 'نفر', source: 'manual', type: 'number' },
    { key: 'videoReach', label: 'ویدئو ریچ', description: 'Video Reach', unit: 'نفر', source: 'manual', type: 'number' },
    { key: 'postReach', label: 'پست ریچ', description: 'Post Reach', unit: 'نفر', source: 'manual', type: 'number' },
    { key: 'storyReach', label: 'استوری ریچ', description: 'Story Reach', unit: 'نفر', source: 'manual', type: 'number' },
    { key: 'topPostReach', label: 'تاپ پست ریچ', description: 'Top Post Reach', unit: 'نفر', source: 'manual', type: 'number' },
    { key: 'topStoryReach', label: 'تاپ استوری ریچ', description: 'Top Story Reach', unit: 'نفر', source: 'manual', type: 'number' },
    { key: 'topVideoReach', label: 'تاپ ویدئو ریچ', description: 'Top Video Reach', unit: 'نفر', source: 'manual', type: 'number' },
    { key: 'profileVisits', label: 'پروفایل ویزیت', description: 'بازدید پروفایل', unit: 'بازدید', source: 'manual', type: 'number' },
    { key: 'socialImpressions', label: 'ایمپرشن', description: 'Impressions شبکه‌های اجتماعی', unit: 'بار', source: 'manual', type: 'number' },
    { key: 'contentInteractions', label: 'کانتنت اینتراکشن', description: 'تعامل کل محتوا', unit: 'تعامل', source: 'manual', type: 'number' },
    { key: 'postInteractions', label: 'پست اینتراکشن', description: 'تعامل پست', unit: 'تعامل', source: 'manual', type: 'number' },
    { key: 'storyInteractions', label: 'استوری اینتراکشن', description: 'تعامل استوری', unit: 'تعامل', source: 'manual', type: 'number' },
    { key: 'videoInteractions', label: 'ویدئو اینتراکشن', description: 'تعامل ویدئو', unit: 'تعامل', source: 'manual', type: 'number' },
  ],
};

/** متریک‌های یک دسته (دسته‌های overview/social/content به همان شناسه‌ها نگاشت می‌شوند) */
export function metricsForCategory(catId: string): MetricDef[] {
  if (catId === 'overview') return [];
  // تب «شبکه‌های اجتماعی» شاخص‌های socialMedia را نشان می‌دهد
  if (catId === 'social') return MARKETING_METRICS.socialMedia || [];
  return MARKETING_METRICS[catId] || [];
}

export function allMetricGroups(): { catId: string; metrics: MetricDef[] }[] {
  return Object.entries(MARKETING_METRICS).map(([catId, metrics]) => ({ catId, metrics }));
}

export function findMetric(key: string): MetricDef | undefined {
  for (const list of Object.values(MARKETING_METRICS)) {
    const m = list.find(x => x.key === key);
    if (m) return m;
  }
  return undefined;
}
