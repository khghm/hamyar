import React, { useState, useMemo } from 'react';
import { useApp } from '../../store';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Phone, MessageSquare, FileText, Clock, 
  Target, Award, BarChart3, Search, Mail, RefreshCw, MapPin, Globe, Share2, 
  Edit, Save, X, ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

export default function AdminDigitalMarketing() {
  const { 
    darkMode, 
    digitalMarketingData, 
    setDigitalMarketingData,
    orders,
    products,
    users,
    expenses
  } = useApp();
  
  const [activeCategory, setActiveCategory] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [tempData, setTempData] = useState(digitalMarketingData);

  // محاسبه خودکار شاخص‌ها از داده‌های واقعی
  const calculatedMetrics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.paid, 0);
    const totalOrders = orders.length;
    const totalCustomers = users.filter(u => u.role === 'customer').length;
    const totalProducts = products.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    return {
      gmv: totalRevenue,
      nmv: totalRevenue * 0.95, // فرض 5% تخفیف
      transactions: totalOrders,
      aov: avgOrderValue,
      users: totalCustomers,
      products: totalProducts,
      // سایر محاسبات بر اساس داده‌های واقعی
    };
  }, [orders, products, users]);

  const categories = [
    { id: 'overview', label: 'نمای کلی', icon: BarChart3, color: 'blue' },
    { id: 'financial', label: 'مالی', icon: DollarSign, color: 'green' },
    { id: 'traffic', label: 'ترافیک', icon: Users, color: 'blue' },
    { id: 'sales', label: 'فروش', icon: ShoppingCart, color: 'purple' },
    { id: 'customer', label: 'مشتری', icon: Users, color: 'green' },
    { id: 'marketing', label: 'بازاریابی', icon: Target, color: 'orange' },
    { id: 'seo', label: 'SEO', icon: Search, color: 'emerald' },
    { id: 'social', label: 'شبکه‌های اجتماعی', icon: Share2, color: 'pink' },
    { id: 'content', label: 'محتوا', icon: FileText, color: 'cyan' },
    { id: 'performance', label: 'عملکرد', icon: TrendingUp, color: 'yellow' },
  ];

  // داده‌های نمودارها
  const revenueData = [
    { name: 'فروردین', revenue: 45000000, profit: 12000000 },
    { name: 'اردیبهشت', revenue: 52000000, profit: 15000000 },
    { name: 'خرداد', revenue: 48000000, profit: 13000000 },
    { name: 'تیر', revenue: 61000000, profit: 18000000 },
    { name: 'مرداد', revenue: 55000000, profit: 16000000 },
    { name: 'شهریور', revenue: 67000000, profit: 20000000 },
  ];

  const trafficData = [
    { name: 'شنبه', visits: 4000, users: 2400 },
    { name: 'یکشنبه', visits: 3000, users: 1398 },
    { name: 'دوشنبه', visits: 2000, users: 9800 },
    { name: 'سه‌شنبه', visits: 2780, users: 3908 },
    { name: 'چهارشنبه', visits: 1890, users: 4800 },
    { name: 'پنج‌شنبه', visits: 2390, users: 3800 },
    { name: 'جمعه', visits: 3490, users: 4300 },
  ];

  const channelData = [
    { name: 'گوگل', value: 45, color: '#4285F4' },
    { name: 'اینستاگرام', value: 25, color: '#E4405F' },
    { name: 'مستقیم', value: 15, color: '#34A853' },
    { name: 'ایتا', value: 10, color: '#FF6B6B' },
    { name: 'سایر', value: 5, color: '#9CA3AF' },
  ];

  const conversionData = [
    { name: 'بازدید', value: 10000 },
    { name: 'سبد خرید', value: 1500 },
    { name: 'خرید', value: 450 },
  ];

  const performanceData = [
    { subject: 'سرعت', A: 85, fullMark: 100 },
    { subject: 'SEO', A: 78, fullMark: 100 },
    { subject: 'محتوا', A: 92, fullMark: 100 },
    { subject: 'UX', A: 88, fullMark: 100 },
    { subject: 'تبدیل', A: 75, fullMark: 100 },
    { subject: 'بازگشت', A: 82, fullMark: 100 },
  ];

  // کارت‌های KPI اصلی
  const mainKPIs = [
    {
      title: 'درآمد کل (GMV)',
      value: calculatedMetrics.gmv.toLocaleString('fa-IR'),
      unit: 'تومان',
      change: 12.5,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'تعداد سفارشات',
      value: calculatedMetrics.transactions.toLocaleString('fa-IR'),
      unit: 'سفارش',
      change: 8.3,
      icon: ShoppingCart,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'میانگین سبد خرید',
      value: Math.round(calculatedMetrics.aov).toLocaleString('fa-IR'),
      unit: 'تومان',
      change: -2.1,
      icon: Target,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'نرخ تبدیل',
      value: '4.5',
      unit: '%',
      change: 15.2,
      icon: TrendingUp,
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
  ];

  const metricDefinitions: Record<string, { label: string; description: string; unit: string }[]> = {
    overview: [],
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
    marketing: [
      { label: 'هزینه تبلیغات', description: 'مجموع هزینه تبلیغات', unit: 'تومان' },
      { label: 'نرخ تبدیل تبلیغات', description: 'نرخ تبدیل از تبلیغات', unit: '%' },
      { label: 'ROAS', description: 'نرخ بازگشت هزینه تبلیغات', unit: '%' },
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

  const currentCategory = categories.find(c => c.id === activeCategory);
  const currentMetrics = metricDefinitions[activeCategory] || [];

  return (
    <div className="fade-in space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <BarChart3 size={28} className="text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              دیجیتال مارکتینگ
            </span>
          </h1>
          <p className={`text-sm mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            داشبورد پیشرفته پایش و مدیریت شاخص‌های دیجیتال مارکتینگ
          </p>
        </div>
        <div className="flex gap-2">
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Edit size={16} />
              ویرایش شاخص‌ها
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Save size={16} />
                ذخیره
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg bg-gray-600 text-white text-sm hover:bg-gray-700 transition-all flex items-center gap-2"
              >
                <X size={16} />
                انصراف
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainKPIs.map((kpi, idx) => {
          const Icon = kpi.icon;
          const isPositive = kpi.change > 0;
          return (
            <div
              key={idx}
              className={`relative overflow-hidden rounded-xl border p-5 transition-all hover:shadow-xl ${
                darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
              }`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${kpi.color} opacity-10 rounded-full -mr-16 -mt-16`}></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${kpi.color}`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isPositive ? <ArrowUp size={14} /> : kpi.change < 0 ? <ArrowDown size={14} /> : <Minus size={14} />}
                    {Math.abs(kpi.change)}%
                  </div>
                </div>
                <h3 className={`text-sm font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {kpi.title}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{kpi.value}</span>
                  <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {kpi.unit}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Categories Tabs - Fixed Responsive */}
      <div className={`rounded-xl border p-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : darkMode 
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                      : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                }`}
              >
                <Icon size={16} />
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Section with Charts */}
      {activeCategory === 'overview' && (
        <div className="space-y-6">
          {/* Revenue Chart */}
          <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-green-600" />
              روند درآمد و سود
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e5e7eb'} />
                <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#6b7280'} />
                <YAxis stroke={darkMode ? '#94a3b8' : '#6b7280'} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1e293b' : '#fff',
                    border: darkMode ? '1px solid #334155' : '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" name="درآمد" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" name="سود" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Traffic and Conversion Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traffic Chart */}
            <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                ترافیک هفتگی
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e5e7eb'} />
                  <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#6b7280'} />
                  <YAxis stroke={darkMode ? '#94a3b8' : '#6b7280'} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1e293b' : '#fff',
                      border: darkMode ? '1px solid #334155' : '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="visits" stroke="#3b82f6" strokeWidth={2} name="بازدید" />
                  <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} name="کاربر" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Channel Distribution */}
            <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Share2 size={20} className="text-purple-600" />
                توزیع کانال‌ها
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1e293b' : '#fff',
                      border: darkMode ? '1px solid #334155' : '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Conversion Funnel and Performance Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Funnel */}
            <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Target size={20} className="text-orange-600" />
                قیف تبدیل
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={conversionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e5e7eb'} />
                  <XAxis type="number" stroke={darkMode ? '#94a3b8' : '#6b7280'} />
                  <YAxis dataKey="name" type="category" stroke={darkMode ? '#94a3b8' : '#6b7280'} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1e293b' : '#fff',
                      border: darkMode ? '1px solid #334155' : '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="#f59e0b" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Radar */}
            <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Award size={20} className="text-yellow-600" />
                عملکرد کلی
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={performanceData}>
                  <PolarGrid stroke={darkMode ? '#334155' : '#e5e7eb'} />
                  <PolarAngleAxis dataKey="subject" stroke={darkMode ? '#94a3b8' : '#6b7280'} />
                  <PolarRadiusAxis stroke={darkMode ? '#94a3b8' : '#6b7280'} />
                  <Radar name="عملکرد" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1e293b' : '#fff',
                      border: darkMode ? '1px solid #334155' : '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Other Categories */}
      {activeCategory !== 'overview' && (
        <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-6">
            {currentCategory && (
              <div className={`p-2 rounded-lg bg-gradient-to-br from-${currentCategory.color}-500 to-${currentCategory.color}-600`}>
                <currentCategory.icon size={24} className="text-white" />
              </div>
            )}
            <h2 className="text-xl font-bold">{currentCategory?.label}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentMetrics.map((metric, idx) => {
              const key = Object.keys(digitalMarketingData)[idx] as keyof typeof digitalMarketingData;
              const value = editMode ? (tempData as any)[key] : (digitalMarketingData as any)[key];

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border transition-all hover:shadow-lg ${
                    darkMode ? 'bg-slate-700/50 border-slate-600 hover:border-blue-500' : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="mb-3">
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
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {typeof value === 'number' ? value.toLocaleString('fa-IR') : '0'}
                      </span>
                      <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {metric.unit}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
