import React, { useState } from 'react';
import { useApp } from '../../store';
import { 
  TrendingUp, DollarSign, Users, ShoppingCart, Phone, MessageSquare, FileText, Clock, 
  Target, Award, BarChart3, Search, Mail, RefreshCw, MapPin, Globe, Share2, 
  Edit, Save, X, ChevronDown, ChevronUp
} from 'lucide-react';

export default function AdminDigitalMarketing() {
  const { darkMode, digitalMarketingData, setDigitalMarketingData } = useApp();
  const [activeCategory, setActiveCategory] = useState('financial');
  const [editMode, setEditMode] = useState(false);
  const [tempData, setTempData] = useState(digitalMarketingData);

  const categories = [
    { id: 'financial', label: 'مالی', icon: DollarSign, color: 'green' },
    { id: 'traffic', label: 'ترافیک', icon: Users, color: 'blue' },
    { id: 'sales', label: 'فروش', icon: ShoppingCart, color: 'purple' },
    { id: 'calls', label: 'تماس', icon: Phone, color: 'orange' },
    { id: 'chat', label: 'چت', icon: MessageSquare, color: 'cyan' },
    { id: 'pages', label: 'صفحات', icon: FileText, color: 'pink' },
    { id: 'time', label: 'زمان', icon: Clock, color: 'yellow' },
    { id: 'engagement', label: 'تعامل', icon: Target, color: 'red' },
    { id: 'registration', label: 'ثبت‌نام', icon: Users, color: 'indigo' },
    { id: 'cart', label: 'سبد خرید', icon: ShoppingCart, color: 'teal' },
    { id: 'advertising', label: 'تبلیغات', icon: BarChart3, color: 'violet' },
    { id: 'seo', label: 'SEO', icon: Search, color: 'emerald' },
    { id: 'growth', label: 'رشد', icon: TrendingUp, color: 'lime' },
    { id: 'email', label: 'ایمیل', icon: Mail, color: 'amber' },
    { id: 'roi', label: 'ROI', icon: DollarSign, color: 'rose' },
    { id: 'retention', label: 'بازگشت', icon: RefreshCw, color: 'fuchsia' },
    { id: 'demographics', label: 'جمعیت‌شناسی', icon: MapPin, color: 'sky' },
    { id: 'social', label: 'تعامل اجتماعی', icon: Share2, color: 'blue' },
    { id: 'customer', label: 'مشتری', icon: Users, color: 'green' },
    { id: 'topCustomers', label: 'مشتریان برتر', icon: Award, color: 'yellow' },
    { id: 'market', label: 'بازار', icon: Globe, color: 'purple' },
    { id: 'ux', label: 'تجربه کاربری', icon: Target, color: 'pink' },
    { id: 'content', label: 'محتوا', icon: FileText, color: 'orange' },
    { id: 'referral', label: 'ارجاع', icon: Share2, color: 'cyan' },
    { id: 'ratings', label: 'امتیازات', icon: Award, color: 'yellow' },
    { id: 'brand', label: 'برند', icon: Award, color: 'indigo' },
    { id: 'usability', label: 'کاربردپذیری', icon: Target, color: 'teal' },
    { id: 'operations', label: 'عملیات', icon: BarChart3, color: 'red' },
    { id: 'performance', label: 'عملکرد', icon: TrendingUp, color: 'green' },
    { id: 'socialMedia', label: 'شبکه‌های اجتماعی', icon: Share2, color: 'blue' },
  ];

  const metricDefinitions: Record<string, { label: string; description: string; unit: string }[]> = {
    financial: [
      { label: 'GMV (میزان فروش کل)', description: 'جمع کل مبلغ کالای فروخته‌شده', unit: 'تومان' },
      { label: 'NMV (مبلغ خالص)', description: 'جمع کل مبلغ کالای فروخته‌شده پس از کسر تخفیفات', unit: 'تومان' },
      { label: 'سود ناخالص', description: 'درآمد منهای هزینه کالای فروخته‌شده', unit: 'تومان' },
      { label: 'سود خالص', description: 'درآمد منهای تمام هزینه‌ها', unit: 'تومان' },
      { label: 'جریان نقدی', description: 'مقدار پول نقد ورودی و خروجی', unit: 'تومان' },
    ],
    traffic: [
      { label: 'ایمپرشن کل', description: 'تعداد کل نمایش‌ها', unit: 'بار' },
      { label: 'بازدید (Sessions)', description: 'تعداد کل بازدیدها', unit: 'بازدید' },
      { label: 'نرخ تعامل', description: 'نسبت بازدیدهای فعال به کل بازدیدها', unit: '%' },
      { label: 'کاربران', description: 'تعداد کاربران منحصر به فرد', unit: 'نفر' },
      { label: 'بازدید به ازای هر کاربر', description: 'میانگین تعداد بازدید هر کاربر', unit: 'بار' },
    ],
    sales: [
      { label: 'تعداد سفارشات', description: 'تعداد کل سفارشات ثبت‌شده', unit: 'سفارش' },
      { label: 'محصولات فروخته‌شده', description: 'تعداد کل محصولات فروخته‌شده', unit: 'عدد' },
      { label: 'نرخ بازگشت', description: 'درصد سفارشات برگشتی', unit: '%' },
      { label: 'نرخ عدم تأمین', description: 'درصد سفارشاتی که تأمین نشدند', unit: '%' },
      { label: 'میانگین ضرر بازگشت', description: 'میانگین ضرر به ازای هر سفارش برگشتی', unit: 'تومان' },
      { label: 'نرخ تحویل به‌موقع', description: 'درصد سفارشاتی که به‌موقع تحویل داده شدند', unit: '%' },
      { label: 'میانگین زمان تحویل', description: 'میانگین زمان رسیدن سفارش از پرداخت', unit: 'ساعت' },
      { label: 'میانگین زمان تأمین', description: 'میانگین زمان تأمین کالا', unit: 'ساعت' },
      { label: 'نرخ خرید', description: 'نسبت خرید به بازدید', unit: '%' },
      { label: 'AOV (میانگین سبد خرید)', description: 'میانگین مبلغ هر سفارش', unit: 'تومان' },
      { label: 'AOP (میانگین سود سبد)', description: 'میانگین سود هر سفارش', unit: 'تومان' },
      { label: 'میانگین قیمت محصول', description: 'میانگین قیمت محصولات', unit: 'تومان' },
      { label: 'میانگین هزینه بسته‌بندی', description: 'میانگین هزینه بسته‌بندی هر سفارش', unit: 'تومان' },
      { label: 'میانگین کلیک به ازای بازدید', description: 'میانگین تعداد کلیک در هر بازدید', unit: 'کلیک' },
    ],
    calls: [
      { label: 'تعداد تماس', description: 'تعداد کل تماس‌های دریافتی', unit: 'تماس' },
      { label: 'تماس به ازای بازدید', description: 'نسبت تماس به ویزیتور', unit: '%' },
      { label: 'نرخ تبدیل تماس به مشتری', description: 'درصد تماس‌هایی که به خرید منجر شدند', unit: '%' },
      { label: 'نرخ کلیک روی تماس', description: 'نرخ کلیک روی گزینه تماس', unit: '%' },
      { label: 'نسبت سفارشات تلفنی', description: 'نسبت سفارشات تلفنی به کل سفارشات', unit: '%' },
      { label: 'نسبت تماس‌های پیگیری', description: 'نسبت تماس‌های پیگیری سفارش به کل تماس‌ها', unit: '%' },
      { label: 'میانگین تماس هر کاربر', description: 'میانگین تعداد تماس هر کاربر', unit: 'تماس' },
      { label: 'هزینه به ازای تماس', description: 'میانگین هزینه به ازای هر تماس', unit: 'تومان' },
      { label: 'فروش به ازای تماس', description: 'میانگین فروش به ازای هر تماس', unit: 'تومان' },
      { label: 'سود به ازای تماس', description: 'میانگین سود به ازای هر تماس', unit: 'تومان' },
      { label: 'نرخ تماس بی‌پاسخ', description: 'نسبت تماس‌های بی‌پاسخ به کل تماس‌ها', unit: '%' },
    ],
    chat: [
      { label: 'شروع چت آنلاین', description: 'تعداد شروع چت آنلاین', unit: 'چت' },
      { label: 'چت به ازای بازدید', description: 'نسبت شروع چت به تعداد ویزیتور', unit: '%' },
    ],
    pages: [
      { label: 'صفحات به ازای سشن', description: 'تعداد صفحات دیده‌شده به ازای هر سشن', unit: 'صفحه' },
      { label: 'کل بازدید صفحات', description: 'مجموع تعداد بازدید صفحات وب‌سایت', unit: 'بازدید' },
      { label: 'بازدید منحصربه‌فرد', description: 'مجموعه تعداد بازدید منحصربه‌فرد صفحات', unit: 'بازدید' },
      { label: 'نرخ بازدید صفحه اصلی', description: 'نسبت بازدید صفحه اصلی به کل صفحات', unit: '%' },
      { label: 'بازدید صفحات محصول', description: 'مجموع تعداد بازدید صفحات محصول', unit: 'بازدید' },
      { label: 'نرخ بازدید محصول', description: 'نرخ بازدید صفحات محصول به کل صفحات', unit: '%' },
      { label: 'بازدید صفحات بلاگ', description: 'تعداد بازدید صفحات بلاگ', unit: 'بازدید' },
      { label: 'نرخ بازدید بلاگ', description: 'نرخ بازدید صفحات بلاگ به کل صفحات', unit: '%' },
      { label: 'نرخ بازدید دسته‌بندی', description: 'درصد بازدید هر دسته‌بندی به کل بازدیدها', unit: '%' },
      { label: 'نرخ پربازدیدترین محصول', description: 'درصد بازدید پربازدیدترین محصول', unit: '%' },
      { label: 'نرخ خطای 404', description: 'درصد بازدیدهایی که با خطای 404 مواجه شدند', unit: '%' },
    ],
    time: [
      { label: 'میانگین زمان سشن', description: 'میانگین زمان سپری‌شده در وب‌سایت', unit: 'دقیقه' },
      { label: 'کل زمان سشن', description: 'کل زمان سپری‌شده در وب‌سایت', unit: 'دقیقه' },
      { label: 'میانگین زمان فعال', description: 'میانگین زمان فعال کاربران در وب‌سایت', unit: 'دقیقه' },
      { label: 'میانگین زمان در صفحه', description: 'میانگین زمان سپری‌شده هر کاربر روی هر صفحه', unit: 'دقیقه' },
      { label: 'نسبت زمان محصول به بلاگ', description: 'نسبت میانگین زمان صفحات محصول به بلاگ', unit: 'نسبت' },
      { label: 'نسبت زمان ویدئو به غیر ویدئو', description: 'نسبت زمان ماندن در صفحات ویدئو دار به بدون ویدئو', unit: 'نسبت' },
    ],
    engagement: [
      { label: 'نرخ پرش', description: 'درصد کاربرانی که فقط یک صفحه را دیدند', unit: '%' },
      { label: 'نرخ سشن‌های عمیق', description: 'نسبت سشن‌هایی که بیش از 5 صفحه دیدند', unit: '%' },
      { label: 'نرخ سشن‌های طولانی', description: 'نسبت سشن‌هایی که بیش از 5 دقیقه ماندند', unit: '%' },
    ],
    registration: [
      { label: 'نرخ تبدیل ثبت‌نام به خرید', description: 'درصد ثبت‌نام‌هایی که به خرید منجر شدند', unit: '%' },
      { label: 'نرخ تکمیل پروفایل', description: 'نسبت کسانی که پروفایل را تکمیل کردند', unit: '%' },
      { label: 'نرخ تکمیل ثبت‌نام', description: 'نسبت تکمیل ثبت‌نام به تعداد بازدید صفحه ثبت‌نام', unit: '%' },
      { label: 'نسبت ثبت‌نام گوگل', description: 'نسبت ثبت‌نام با گوگل به ثبت‌نام با ایمیل', unit: '%' },
    ],
    cart: [
      { label: 'نرخ تبدیل سبد به خرید', description: 'نرخ تبدیل افزونندگان به سبد خرید به خریداران', unit: '%' },
      { label: 'نرخ تکمیل سبد خرید', description: 'نرخ تکمیل سبد خرید', unit: '%' },
      { label: 'نرخ ترک سبد خرید', description: 'درصد سبدهای خرید رها شده', unit: '%' },
    ],
    advertising: [
      { label: 'CPC (هزینه به ازای کلیک)', description: 'میانگین هزینه به ازای هر کلیک', unit: 'تومان' },
      { label: 'CPV (هزینه به ازای ویزیتور)', description: 'میانگین هزینه به ازای هر ویزیتور', unit: 'تومان' },
      { label: 'RPV (درآمد به ازای ویزیتور)', description: 'میانگین درآمد به ازای هر ویزیتور', unit: 'تومان' },
      { label: 'RPL (درآمد به ازای لید)', description: 'میانگین درآمد به ازای هر لید', unit: 'تومان' },
      { label: 'CPL (هزینه به ازای لید)', description: 'میانگین هزینه به ازای هر لید', unit: 'تومان' },
      { label: 'نسبت ورودی غیرپولی به پولی', description: 'نسبت ورودی غیرپولی به ورودی پولی', unit: 'نسبت' },
      { label: 'نسبت ورودی دایرکت', description: 'نسبت ورودی دایرکت به ورودی کل', unit: '%' },
      { label: 'نسبت دایرکت + برند', description: 'نسبت ورودی دایرکت + ارگانیک برند به کل', unit: '%' },
      { label: 'نسبت ورودی ارگانیک', description: 'نسبت ورودی ارگانیک به ورودی کل', unit: '%' },
      { label: 'نرخ آشنایی از گوگل', description: 'درصد مشتریانی که اولین بار از گوگل آشنا شدند', unit: '%' },
    ],
    seo: [
      { label: 'نمایش در گوگل', description: 'تعداد نمایش در گوگل', unit: 'بار' },
      { label: 'نرخ کلیک تصویر گوگل', description: 'نسبت ورودی گوگل ایمیج به کل ورودی گوگل', unit: '%' },
      { label: 'نرخ محصول ارگانیک', description: 'نسبت ورودی گوگل صفحات محصول به کل ارگانیک', unit: '%' },
      { label: 'میانگین نرخ کلیک (CTR)', description: 'میانگین نرخ کلیک', unit: '%' },
      { label: 'صفحات ایندکس‌شده', description: 'تعداد صفحات ایندکس‌شده', unit: 'صفحه' },
      { label: 'لینک‌های داخلی', description: 'تعداد لینک‌های داخلی', unit: 'لینک' },
      { label: 'دامنه‌های بک‌لینک', description: 'تعداد دامنه‌هایی که به سایت لینک داده‌اند', unit: 'دامنه' },
      { label: 'ارزش دامنه (DA)', description: 'ارزش دامنه', unit: 'امتیاز' },
      { label: 'امتیاز اسپم', description: 'امتیاز اسپم', unit: 'امتیاز' },
      { label: 'کلمات کلیدی برتر', description: 'تعداد کلماتی که جایگاه یک گوگل را دارند', unit: 'کلمه' },
      { label: 'بازدید بلاگ به فروشگاه', description: 'تعداد بازدیدهایی که از بلاگ به فروشگاه منتقل شدند', unit: 'بازدید' },
    ],
    growth: [
      { label: 'رشد ورودی', description: 'درصد رشد تعداد ورودی', unit: '%' },
      { label: 'رشد ورودی ارگانیک', description: 'میزان رشد تعداد ورودی ارگانیک', unit: '%' },
      { label: 'نرخ سرچ داخلی', description: 'نسبت بازدیدهایی که از سرچ داخلی استفاده کردند', unit: '%' },
      { label: 'نرخ سرچ بدون نتیجه', description: 'درصد سرچ‌های داخلی که نتیجه‌ای نداشتند', unit: '%' },
    ],
    email: [
      { label: 'رشد مشترکان ایمیل', description: 'نرخ رشد مشترکان ایمیل', unit: '%' },
      { label: 'نرخ بازشدن ایمیل', description: 'نرخ بازشدن ایمیل', unit: '%' },
      { label: 'نرخ کلیک ایمیل', description: 'نرخ کلیک روی لینک‌های داخل ایمیل', unit: '%' },
    ],
    roi: [
      { label: 'ROI (نرخ بازگشت سرمایه)', description: 'نرخ بازگشت سرمایه', unit: '%' },
      { label: 'ROAS (نرخ بازگشت تبلیغات)', description: 'نرخ بازگشت هزینه تبلیغات', unit: '%' },
    ],
    retention: [
      { label: 'میانگین سشن هر کاربر', description: 'هر کاربر به طور میانگین چند بار سر می‌زند', unit: 'بار' },
      { label: 'میانگین روز بین سشن', description: 'هر کاربر بعد از چند روز مجدداً سر می‌زند', unit: 'روز' },
      { label: 'نرخ تک صفحه', description: 'درصد صفحات بازدیدشده توسط کاربران بانس‌شده', unit: '%' },
      { label: 'میانگین زمان تا خرید', description: 'میانگین زمان خرید بعد از اولین بازدید', unit: 'روز' },
      { label: 'بیشترین مسیر خرید', description: 'بیشترین تعداد مسیری که برای خرید طی شده', unit: 'مسیر' },
      { label: 'نرخ خرید اولین بازدید', description: 'چه درصدی از خریدها در اولین بازدید انجام شده', unit: '%' },
      { label: 'نرخ خرید بازدیدکنندگان جدید', description: 'درصد بازدیدهای این ماه متعلق به کسانی که ماه گذشته اولین بار آشنا شدند', unit: '%' },
      { label: 'نرخ تبدیل‌های کمکی', description: 'شاخص Assisted / Last Click or Direct Conversions', unit: 'نسبت' },
      { label: 'نسبت قدیمی به جدید', description: 'نسبت بازدیدکننده‌های قدیمی به جدید', unit: 'نسبت' },
      { label: 'ارزش قدیمی به جدید', description: 'ارزش کاربر قدیمی به جدید', unit: 'نسبت' },
    ],
    demographics: [
      { label: 'نسبت موبایل به دسکتاپ', description: 'نسبت ترافیک موبایل به دسکتاپ', unit: 'نسبت' },
      { label: 'نسبت مرد به زن', description: 'نسبت ترافیک مرد به زن', unit: 'نسبت' },
      { label: 'میانگین سنی', description: 'میانگین سنی کاربران', unit: 'سال' },
    ],
    social: [
      { label: 'کامنت محصولات', description: 'تعداد کامنت محصولات', unit: 'کامنت' },
      { label: 'میانگین کامنت هر کاربر', description: 'میانگین کامنت به ازای هر کاربر ثبت‌نام‌ده', unit: 'کامنت' },
      { label: 'میانگین عمق اسکرول', description: 'میانگین عمق اسکرول', unit: '%' },
      { label: 'نرخ اسکرول 80%', description: 'نسبت پیج‌ویوها با 80 درصد اسکرول', unit: '%' },
      { label: 'نرخ بازگشت روز اول', description: 'نرخ بازگشت کاربران جدید بعد از 1 روز', unit: '%' },
      { label: 'نسبت ریتنشن هفتگی به ماهانه', description: 'نسبت ریتنشن یوزر هفتگی به ماهانه', unit: 'نسبت' },
    ],
    customer: [
      { label: 'CAC (هزینه جذب مشتری)', description: 'هزینه جذب هر مشتری', unit: 'تومان' },
      { label: 'CLV (ارزش طول عمر مشتری)', description: 'ارزش طول عمر مشتری', unit: 'تومان' },
      { label: 'CLV/CAC', description: 'شاخص CLV/CAC', unit: 'نسبت' },
      { label: 'نرخ بازگشت مشتری', description: 'نرخ بازگشت مشتری', unit: '%' },
      { label: 'نرخ ریزش مشتری', description: 'نرخ ریزش مشتری', unit: '%' },
      { label: 'نرخ مشتریان وفادار', description: 'نرخ مشتریان وفادار', unit: '%' },
      { label: 'فرکانس خرید', description: 'فرکانس خرید', unit: 'بار' },
      { label: 'میانگین زمان بین خرید', description: 'میانگین زمان بین دو خرید یک مشتری وفادار', unit: 'روز' },
    ],
    topCustomers: [
      { label: 'بزرگ‌ترین سبد خرید', description: 'تعداد کالای بزرگ‌ترین سبد خرید', unit: 'عدد' },
      { label: 'سفارش‌های پرسفارش‌ترین مشتری', description: 'تعداد سفارش پرسفارش‌ترین مشتری', unit: 'سفارش' },
      { label: 'مبلغ خرید بهترین مشتری', description: 'مجموع مبلغ خرید بهترین مشتری', unit: 'تومان' },
      { label: 'نسبت B2B به B2C', description: 'میزان سود فروش B2B نسبت به B2C', unit: 'نسبت' },
    ],
    market: [
      { label: 'سهم بازار', description: 'درصد سهم بازار', unit: '%' },
      { label: 'نرخ رقابت قیمت', description: 'درصد محصولات با قیمت پایین‌تر در سایت‌های دیگر', unit: '%' },
    ],
    ux: [
      { label: 'دد کلیک', description: 'تعداد دد کلیک', unit: 'کلیک' },
      { label: 'کوییک بک', description: 'تعداد کوییک بک', unit: 'بار' },
      { label: 'نرخ کلیک نماد اعتماد', description: 'نرخ کلیک روی نماد اعتماد', unit: '%' },
      { label: 'کلیک علاقه‌مندی', description: 'تعداد کلیک روی آیکون افزودن به علاقه‌مندی‌ها', unit: 'کلیک' },
    ],
    content: [
      { label: 'کلمات تولیدشده', description: 'تعداد کلمات تولیدشده', unit: 'کلمه' },
      { label: 'تصاویر درج‌شده', description: 'تعداد تصاویر درج‌شده', unit: 'تصویر' },
      { label: 'اینفوگرافیک', description: 'تعداد اینفوگرافیک تولیدشده', unit: 'اینفوگرافیک' },
      { label: 'ویدئوها', description: 'تعداد ویدئوهای درج‌شده', unit: 'ویدئو' },
      { label: 'محصولات اضافه‌شده', description: 'تعداد محصولات اضافه‌شده', unit: 'محصول' },
      { label: 'پست‌های بلاگ', description: 'تعداد پست بلاگ', unit: 'پست' },
      { label: 'نسبت کلمات محصول به بلاگ', description: 'نسبت تعداد کلمات تولیدشده صفحات محصول به بلاگ', unit: 'نسبت' },
      { label: 'رپورتاژ', description: 'تعداد رپورتاژ', unit: 'رپورتاژ' },
      { label: 'اصلاح محتواهای قدیمی', description: 'تعداد اصلاح محتواهای قدیمی', unit: 'محتوا' },
    ],
    referral: [
      { label: 'ورودی رفرال', description: 'ورودی رفرال', unit: 'بازدید' },
      { label: 'نرخ خروج', description: 'نرخ خروج از صفحه اصلی یا صفحات هاب', unit: '%' },
      { label: 'میانگین ارزش صفحات بلاگ', description: 'میانگین ارزش صفحات بلاگ', unit: 'تومان' },
      { label: 'نسبت ارزش بلاگ به کل', description: 'نسبت ارزش صفحات بلاگ به صفحات کل وب‌سایت', unit: '%' },
      { label: 'نرخ کاربران بلاگ', description: 'نسبت کاربرانی که حداقل یک صفحه از بلاگ را دیدند', unit: '%' },
      { label: 'نرخ بلاگ به فروشگاه', description: 'نسبت کاربرانی که بعد از بلاگ به فروشگاه کلیک کردند', unit: '%' },
      { label: 'نرخ کلیک عکس محصول', description: 'درصد بازدیدهایی که روی عکس شاخص محصول کلیک شد', unit: '%' },
      { label: 'نرخ کلیک ویدئو محصول', description: 'درصد بازدیدهایی که روی ویدئو کلیک شد', unit: '%' },
    ],
    ratings: [
      { label: 'میانگین امتیاز محصولات', description: 'میانگین امتیاز محصولات', unit: 'امتیاز' },
      { label: 'میانگین امتیاز بلاگ', description: 'میانگین امتیاز پست‌های بلاگ', unit: 'امتیاز' },
    ],
    brand: [
      { label: 'آگاهی از برند', description: 'میزان آگاهی از برند', unit: '%' },
      { label: 'محبوبیت برند', description: 'میزان محبوبیت برند (Top of Mind)', unit: '%' },
      { label: 'NPS', description: 'شاخص NPS', unit: 'امتیاز' },
      { label: 'رضایت مشتریان', description: 'درصد رضایت مشتریان', unit: '%' },
      { label: 'نرخ WOM', description: 'درصد کاربرانی که از بازاریابی دهان‌به‌دهان آشنا شدند', unit: '%' },
    ],
    usability: [
      { label: 'امتیاز طراحی', description: 'امتیاز جذابیت ظاهری وب‌سایت', unit: 'امتیاز' },
      { label: 'امتیاز پیدا کردن', description: 'راحت‌بودن پیدا کردن چیزی که کاربر دنبال آن است', unit: 'امتیاز' },
      { label: 'امتیاز فهم مطالب', description: 'آسان‌بودن فهم مطالب موجود در وب‌سایت', unit: 'امتیاز' },
      { label: 'امتیاز اعتماد', description: 'اعتماد به مطالب موجود در وب‌سایت', unit: 'امتیاز' },
      { label: 'امتیاز پشتیبانی', description: 'امتیاز کلی تیم پشتیبانی', unit: 'امتیاز' },
    ],
    operations: [
      { label: 'تأمین‌کنندگان', description: 'تعداد تأمین‌کننده', unit: 'تأمین‌کننده' },
      { label: 'پرسنل', description: 'تعداد پرسنل', unit: 'نفر' },
      { label: 'پوزیشن‌های شغلی', description: 'تعداد پوزیشن شغلی', unit: 'پوزیشن' },
      { label: 'ساعات کار روزانه', description: 'مجموع ساعات کار کارکنان در هر روز', unit: 'ساعت' },
      { label: 'درآمد به ازای ساعت کار', description: 'درآمد به‌ازای هر ساعت کار کارمندان', unit: 'تومان' },
      { label: 'میانگین حقوق ساعتی', description: 'میانگین حقوق هر ساعت کار کارمندان', unit: 'تومان' },
    ],
    performance: [
      { label: 'میانگین سرعت لود', description: 'میانگین سرعت لود صفحات وب‌سایت', unit: 'ثانیه' },
      { label: 'FCP', description: 'مدت‌زمان نمایش اولین محتوای صفحه', unit: 'ثانیه' },
      { label: 'LCP', description: 'مدت‌زمان نمایش بزرگ‌ترین بخش محتوای صفحه', unit: 'ثانیه' },
    ],
    socialMedia: [
      { label: 'ورودی سوشال', description: 'ورودی سوشال وب‌سایت', unit: 'بازدید' },
      { label: 'کلیک آیکون‌های سوشال', description: 'تعداد کلیک روی آیکون‌های سوشال', unit: 'کلیک' },
      { label: 'محتوای UGC', description: 'تعداد محتوای تولیدشده با نام برند', unit: 'محتوا' },
      { label: 'کل دنبال‌کننده‌ها', description: 'مجموع دنبال‌کننده‌های اکانت‌های سوشال', unit: 'نفر' },
      { label: 'فالوئر', description: 'تعداد فالوئر', unit: 'نفر' },
      { label: 'میانگین لایک', description: 'میانگین تعداد لایک', unit: 'لایک' },
      { label: 'میانگین کامنت', description: 'میانگین تعداد کامنت', unit: 'کامنت' },
      { label: 'اکانت ریچ', description: 'اکانت ریچ', unit: 'نفر' },
      { label: 'ویدئو ریچ', description: 'ویدئو ریچ', unit: 'نفر' },
      { label: 'پست ریچ', description: 'پست ریچ', unit: 'نفر' },
      { label: 'استوری ریچ', description: 'استوری ریچ', unit: 'نفر' },
      { label: 'تاپ پست ریچ', description: 'تاپ پست ریچ', unit: 'نفر' },
      { label: 'تاپ استوری ریچ', description: 'تاپ استوری ریچ', unit: 'نفر' },
      { label: 'تاپ ویدئو ریچ', description: 'تاپ ویدئو ریچ', unit: 'نفر' },
      { label: 'پروفایل ویزیت', description: 'پروفایل ویزیت', unit: 'بازدید' },
      { label: 'ایمپرشن', description: 'ایمپرشن', unit: 'بار' },
      { label: 'کانتنت اینتراکشن', description: 'کانتنت اینتراکشن', unit: 'تعامل' },
      { label: 'پست اینتراکشن', description: 'پست اینتراکشن', unit: 'تعامل' },
      { label: 'استوری اینتراکشن', description: 'استوری اینتراکشن', unit: 'تعامل' },
      { label: 'ویدئو اینتراکشن', description: 'ویدئو اینتراکشن', unit: 'تعامل' },
    ],
  };

  const handleSave = () => {
    setDigitalMarketingData({ ...tempData, lastUpdated: new Date().toISOString() });
    setEditMode(false);
  };

  const handleCancel = () => {
    setTempData(digitalMarketingData);
    setEditMode(false);
  };

  const currentMetrics = metricDefinitions[activeCategory] || [];
  const currentCategory = categories.find(c => c.id === activeCategory);

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 size={28} className="text-blue-600" />
            دیجیتال مارکتینگ
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            مدیریت و پایش بیش از 150 شاخص دیجیتال مارکتینگ
          </p>
        </div>
        <div className="flex gap-2">
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 flex items-center gap-2"
            >
              <Edit size={16} />
              ویرایش شاخص‌ها
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 flex items-center gap-2"
              >
                <Save size={16} />
                ذخیره
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg bg-gray-600 text-white text-sm hover:bg-gray-700 flex items-center gap-2"
              >
                <X size={16} />
                انصراف
              </button>
            </>
          )}
        </div>
      </div>

      {/* Last Updated */}
      <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-blue-50'}`}>
        <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          آخرین به‌روزرسانی: {new Date(digitalMarketingData.lastUpdated).toLocaleString('fa-IR')}
        </p>
      </div>

      {/* Categories Tabs */}
      <div className={`p-2 rounded-xl border overflow-x-auto ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex gap-2 min-w-max">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                }`}
              >
                <Icon size={16} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-6">
          {currentCategory && <currentCategory.icon size={24} className="text-blue-600" />}
          <h2 className="text-xl font-bold">{currentCategory?.label}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentMetrics.map((metric, idx) => {
            const key = Object.keys(digitalMarketingData)[idx] as keyof typeof digitalMarketingData;
            const value = editMode ? (tempData as any)[key] : (digitalMarketingData as any)[key];

            return (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="mb-2">
                  <h3 className="font-bold text-sm mb-1">{metric.label}</h3>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {metric.description}
                  </p>
                </div>
                {editMode ? (
                  <input
                    type="number"
                    value={value || 0}
                    onChange={e => setTempData({ ...tempData, [key]: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                ) : (
                  <div className="text-2xl font-bold text-blue-600">
                    {typeof value === 'number' ? value.toLocaleString('fa-IR') : '0'}
                    <span className={`text-sm font-normal mr-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {metric.unit}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <DollarSign size={20} className="text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {digitalMarketingData.profit.toLocaleString('fa-IR')}
          </div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>سود خالص (تومان)</div>
        </div>

        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {digitalMarketingData.sessions.toLocaleString('fa-IR')}
          </div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کل بازدیدها</div>
        </div>

        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <ShoppingCart size={20} className="text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {digitalMarketingData.transactions.toLocaleString('fa-IR')}
          </div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>تعداد سفارشات</div>
        </div>

        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <TrendingUp size={20} className="text-orange-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {digitalMarketingData.purchaseRate.toLocaleString('fa-IR')}%
          </div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>نرخ تبدیل</div>
        </div>
      </div>
    </div>
  );
}
