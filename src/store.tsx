import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { logActivity } from './utils/auditLog';
import { track } from './utils/analytics';

// Types
export interface CartItem {
  productId: string;
  quantity: number;
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'customer';
  name: string;
  phone: string;
  // Admin-only fields: link to the staff account created in the RBAC section
  currentAdminId?: string;
  roleId?: string;
  permissions?: string[];
  inviteCode?: string;
  invitedBy?: string;
  invitedCount?: number;
  loyaltyPoints: number;
  // Lifetime points earned — `loyaltyPoints` is the spendable balance after redemptions.
  totalEarnedPoints?: number;
  // Last day the daily-login streak was credited (YYYY-MM-DD).
  lastLoginStreakDate?: string;
  // Consecutive days of logging in (resets when a day is skipped).
  loginStreak?: number;
  level: 'normal' | 'silver' | 'gold' | 'vip';
  favorites: string[];
  selectedMedia: string[];
  personaIds?: string[]; // IDs of personas assigned to this customer
  cart?: CartItem[]; // Shopping cart items
  avatar?: string; // User avatar image URL
  walletBalance?: number; // Wallet balance in Tomans
  birthDate?: string; // ISO date — used by the gamification birthday bonus
  // Last time the one-time profile-completion bonus was credited (ISO).
  lastProfileBonusDate?: string;
  // Last time the birthday bonus was credited (ISO) — once per year.
  lastBirthdayBonusDate?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Customer club / gamification engine (managed from admin «کدهای دعوت»)
// ---------------------------------------------------------------------------
export type LoyaltyCategory =
  | 'invite'        // دعوت دوست
  | 'purchase'      // خرید
  | 'review'        // ثبت نظر
  | 'login_streak'  // ورود روزانه
  | 'profile'       // تکمیل پروفایل
  | 'birthday'      // هدیه تولد
  | 'manual'        // اعطای دستی ادمین
  | 'redeem';       // خرج امتیاز (قرارداد پاداش)

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  points: number;               // positive = credit, negative = debit
  reason: string;               // human readable description (Persian)
  category: LoyaltyCategory;
  byAdmin?: boolean;            // credited/debited manually from the panel
  createdAt: string;
}

export interface LoyaltyTierRule {
  level: User['level'];
  label: string;
  minPoints: number;            // lifetime earned points needed for this tier
  discountPercent: number;
  multiplier: number;           // earning multiplier on purchases while in tier
  perks: string[];
}

export interface LoyaltyRewardItem {
  id: string;
  title: string;
  description: string;
  cost: number;                 // spendable points required
  icon: string;                 // emoji shown in the club UI
  enabled: boolean;
}

export interface GamificationBadgeDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  metric: 'invitedCount' | 'totalEarnedPoints' | 'ordersCount' | 'reviewsCount' | 'loginStreak';
  threshold: number;
}

export interface GamificationConfig {
  enabled: boolean;
  pointsPerToman: number;             // purchase amount / pointsPerToman = points
  inviteBonus: number;                // bonus granted to the inviter per invite
  invitedUserBonus: number;           // welcome bonus for a newly invited user
  reviewBonus: number;                // bonus per approved/registered review
  dailyLoginBonus: number;            // base daily-login points
  streakDayMultiplier: number;        // bonus * day * multiplier (capped below)
  streakMaxDays: number;              // cap of the consecutive-day bonus
  profileCompletionBonus: number;
  birthdayBonus: number;
  tiers: LoyaltyTierRule[];
  rewards: LoyaltyRewardItem[];
  badges: GamificationBadgeDef[];
}

export const DEFAULT_TIERS: LoyaltyTierRule[] = [
  { level: 'normal', label: 'عادی', minPoints: 0, discountPercent: 0, multiplier: 1, perks: ['شرکت در جشنواره‌های عضویت'] },
  { level: 'silver', label: 'نقره‌ای', minPoints: 100, discountPercent: 5, multiplier: 1.25, perks: ['۵٪ تخفیف عضویت', 'کسب امتیاز ۱.۲۵ برابر'] },
  { level: 'gold', label: 'طلایی', minPoints: 500, discountPercent: 10, multiplier: 1.5, perks: ['۱۰٪ تخفیف عضویت', 'ارسال رایگان ماهانه', 'پشتیبانی اولویت‌دار'] },
  { level: 'vip', label: 'VIP', minPoints: 1000, discountPercent: 15, multiplier: 2, perks: ['۱۵٪ تخفیف عضویت', 'اولویت در پروژه‌ها', 'پاداش تولد دوچندان'] },
];

export const DEFAULT_REWARDS: LoyaltyRewardItem[] = [
  { id: 'rw1', title: '۵۰ هزار تومان اعتبار کیف پول', description: 'اعتبار نقدی به کیف پول شما افزوده می‌شود.', cost: 200, icon: '💰', enabled: true },
  { id: 'rw2', title: 'یک ماه اینترنت رایگان', description: 'فعال‌سازی بسته یک‌ماهه برای حساب کاربری.', cost: 350, icon: '📶', enabled: true },
  { id: 'rw3', title: 'کد تخفیف ۲۰٪ خدمات طراحی', description: 'روی سفارش بعدی طراحی سایت قابل استفاده است.', cost: 500, icon: '🎨', enabled: true },
  { id: 'rw4', title: 'مشاوره رایگان سئو (۴۵ دقیقه)', description: 'جلسه مشاوره تخصصی با تیم دیجیتال مارکتینگ.', cost: 800, icon: '🚀', enabled: true },
];

export const DEFAULT_BADGES: GamificationBadgeDef[] = [
  { id: 'bg-invite-1', name: 'دعوت‌کننده نقره‌ای', icon: '🤝', description: 'حداقل ۳ دوست را با کد دعوت خود وارد کرده‌اید.', metric: 'invitedCount', threshold: 3 },
  { id: 'bg-invite-2', name: 'سفیر برند', icon: '📣', description: 'حداقل ۱۰ دعوت موفق دارید.', metric: 'invitedCount', threshold: 10 },
  { id: 'bg-points-1', name: 'امتیازآور برنزی', icon: '⭐', description: 'در مجموع ۲۵۰ امتیاز کسب کرده‌اید.', metric: 'totalEarnedPoints', threshold: 250 },
  { id: 'bg-points-2', name: 'امتیازآور طلایی', icon: '🌟', description: 'در مجموع ۱۰۰۰ امتیاز کسب کرده‌اید.', metric: 'totalEarnedPoints', threshold: 1000 },
  { id: 'bg-orders-1', name: 'خریدار وفادار', icon: '🛒', description: 'بیش از ۵ سفارش موفق داشته‌اید.', metric: 'ordersCount', threshold: 5 },
  { id: 'bg-reviews-1', name: 'نظردهنده فعال', icon: '✍️', description: 'حداقل ۳ نظر ثبت کرده‌اید.', metric: 'reviewsCount', threshold: 3 },
  { id: 'bg-streak-1', name: 'ورود هفتگی', icon: '🔥', description: '۷ روز پشت سر هم وارد شوید.', metric: 'loginStreak', threshold: 7 },
  { id: 'bg-streak-2', name: 'وفادار ماهانه', icon: '🏆', description: '۳۰ روز پشت سر هم وارد شوید.', metric: 'loginStreak', threshold: 30 },
];

export const DEFAULT_GAMIFICATION_CONFIG: GamificationConfig = {
  enabled: true,
  pointsPerToman: 10000,
  inviteBonus: 50,
  invitedUserBonus: 50,
  reviewBonus: 10,
  dailyLoginBonus: 5,
  streakDayMultiplier: 1,
  streakMaxDays: 7,
  profileCompletionBonus: 20,
  birthdayBonus: 100,
  tiers: DEFAULT_TIERS,
  rewards: DEFAULT_REWARDS,
  badges: DEFAULT_BADGES,
};

// Tier used when a legacy record has no explicit level or points.
export function computeLevelFromPoints(points: number, tiers: LoyaltyTierRule[]): User['level'] {
  const sorted = [...tiers].sort((a, b) => b.minPoints - a.minPoints);
  for (const t of sorted) if (points >= t.minPoints) return t.level;
  return 'normal';
}

// ---------------------------------------------------------------------------
// Hard-coded loyalty cleanup — the customer club is now 100% config-driven
// (managed from the admin «کدهای دعوت» section). Any balances / transactions
// produced by the old hard-coded rules are wiped once on startup so every point
// from now on comes from the gamification engine & admin settings.
// ---------------------------------------------------------------------------
const GAMIFICATION_RESET_KEY = 'hamyar_gamification_reset_v1';

function stripLegacyLoyalty(users: User[]): User[] {
  let touched = false;
  const next = users.map(u => {
    if (u.role !== 'customer') return u;
    const hadBalance = (u.loyaltyPoints || 0) !== 0;
    const hadTotal = (u.totalEarnedPoints ?? 0) !== 0;
    const hadStreak = !!u.lastLoginStreakDate || (u.loginStreak || 0) > 0;
    if (!hadBalance && !hadTotal && !hadStreak) return u;
    touched = true;
    return {
      ...u,
      loyaltyPoints: 0,
      totalEarnedPoints: 0,
      lastLoginStreakDate: undefined,
      loginStreak: undefined,
      level: 'normal' as const,
    };
  });
  return touched ? next : users;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  image: string;
  description: string;
  barcode?: string;
  warranty?: string;
  alertThreshold?: number;
  lastRestocked?: string;
  supplier?: string;
}

export interface MediaItem {
  id: string;
  title: string;
  year: number;
  genre: string[];
  type: 'movie' | 'series' | 'animation' | 'anime';
  quality: string;
  language: string;
  subtitle: string;
  volume: string;
  rating: number;
  image: string;
  description: string;
  director?: string;
  country?: string;
  imdb?: number;
}

// A dynamic form field shown in the "اطلاعات سفارش" step of the service
// order wizard. The key is stored inside order.formData.
export interface ServiceFormField {
  key: string;
  label: string;
  type: 'text' | 'tel' | 'number' | 'email' | 'date' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: string[]; // used when type === 'select'
}

// A document slot shown in the "بارگذاری مدارک" step (uploaded from disk).
export interface ServiceDocField {
  key: string;
  label: string;
  required?: boolean;
  hint?: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  unit: string;
  description: string;
  active: boolean;
  // Optional per-service customization of the ordering wizard. When missing,
  // sensible defaults are derived from the service itself so every item in the
  // internet-cafe services page stays fully orderable.
  fields?: ServiceFormField[];
  docs?: ServiceDocField[];
}

// ---------------------------------------------------------------------------
// Orderable items of the «طراحی سایت» and «تولید محتوا» pages. Each card on
// those public pages links to /project-services/:id and goes through the same
// 3-step wizard (details → documents → payment) as the internet-cafe services.
// The catalogue is shared between the public pages, the details wizard and the
// admin panel (orders / invoices / projects), so everything stays in sync.
// ---------------------------------------------------------------------------
export interface ProjectService {
  id: string;
  title: string;
  group: 'webdesign' | 'content';
  icon: string; // lucide icon name used by the public cards
  desc: string;
  features: string[];
  basePrice: number; // starting price in Toman (پیش‌فاکتور)
  unit: string;
  fields: ServiceFormField[];
  docs: ServiceDocField[];
}

const PROJECT_CONTACT_FIELDS: ServiceFormField[] = [
  { key: 'fullName', label: 'نام و نام خانوادگی / نام برند', type: 'text', required: true, placeholder: 'مثلاً علی رضایی' },
  { key: 'phone', label: 'شماره موبایل', type: 'tel', required: true, placeholder: '09xxxxxxxxx' },
  { key: 'email', label: 'ایمیل کاری (اختیاری)', type: 'email', required: false },
];

// Maps each online content-marketing service to the matching task type used by
// the admin "تیم تولید محتوا" section, so orders flow into the content pipeline.
export const CONTENT_SERVICE_TYPE_MAP: Record<string, ContentProject['type']> = {
  'ps-ct-text': 'article',
  'ps-ct-social': 'social',
  'ps-ct-video': 'video',
  'ps-ct-seo': 'article',
};

export const PROJECT_SERVICES: ProjectService[] = [
  // ------------------------- طراحی سایت، اپلیکیشن و ربات -------------------------
  {
    id: 'ps-wd-shop', group: 'webdesign', icon: 'ShoppingCart', title: 'سایت فروشگاهی',
    desc: 'طراحی فروشگاه آنلاین با سبد خرید، پرداخت آنلاین و پنل مدیریت',
    features: ['مدیریت محصولات', 'سبد خرید', 'درگاه پرداخت', 'پنل مدیریت'],
    basePrice: 25000000, unit: 'پروژه',
    fields: [...PROJECT_CONTACT_FIELDS,
      { key: 'industry', label: 'حوزه فعالیت کسب‌وکار', type: 'text', required: true, placeholder: 'مثلاً پوشاک، لوازم دیجیتال' },
      { key: 'productCount', label: 'تعداد تقریبی محصولات', type: 'number', required: true, placeholder: '100' },
      { key: 'domainName', label: 'دامنه (در صورت وجود)', type: 'text', required: false, placeholder: 'example.ir' },
      { key: 'payments', label: 'درگاه‌های پرداخت مورد نیاز', type: 'select', required: true, options: ['زرین‌پال', 'آی‌دی‌پی', 'سامان', 'چند درگاه'] },
      { key: 'features', label: 'امکانات مورد نیاز', type: 'textarea', required: true, placeholder: 'مثلاً باشگاه مشتریان، چندفروشندگی، اپلیکیشن...' },
      { key: 'deadline', label: 'مهلت تحویل مورد نظر', type: 'date', required: false },
      { key: 'budget', label: 'بودجه تقریبی (تومان)', type: 'number', required: false },
    ],
    docs: [
      { key: 'brief', label: 'بریف / فایل نیازمندی‌ها', required: true, hint: 'pdf, docx، حداکثر ۵ مگابایت' },
      { key: 'brandAssets', label: 'لوگو و تصاویر برند', required: false, hint: 'zip یا تصاویر png/jpg' },
      { key: 'samples', label: 'نمونه سایت مورد علاقه', required: false, hint: 'می‌توانید چند اسکرین‌شات بارگذاری کنید' },
    ],
  },
  {
    id: 'ps-wd-corp', group: 'webdesign', icon: 'Globe', title: 'سایت شرکتی',
    desc: 'طراحی وب‌سایت حرفه‌ای برای شرکت‌ها و سازمان‌ها',
    features: ['معرفی خدمات', 'نمونه‌کارها', 'فرم تماس', 'بلاگ'],
    basePrice: 15000000, unit: 'پروژه',
    fields: [...PROJECT_CONTACT_FIELDS,
      { key: 'industry', label: 'حوزه فعالیت شرکت', type: 'text', required: true },
      { key: 'pagesCount', label: 'تعداد صفحات تقریبی', type: 'number', required: true, placeholder: '8' },
      { key: 'domainName', label: 'دامنه (در صورت وجود)', type: 'text', required: false },
      { key: 'features', label: 'امکانات مورد نیاز', type: 'textarea', required: true, placeholder: 'بلاگ، فرم استخدام، چندزبانه...' },
      { key: 'deadline', label: 'مهلت تحویل مورد نظر', type: 'date', required: false },
      { key: 'budget', label: 'بودجه تقریبی (تومان)', type: 'number', required: false },
    ],
    docs: [
      { key: 'brief', label: 'بریف / فایل نیازمندی‌ها', required: true },
      { key: 'brandAssets', label: 'لوگو و تصاویر برند', required: false },
    ],
  },
  {
    id: 'ps-wd-personal', group: 'webdesign', icon: 'User', title: 'سایت شخصی',
    desc: 'طراحی پورتفولیو و سایت شخصی برای افراد',
    features: ['رزومه آنلاین', 'نمونه‌کارها', 'فرم ارتباط', 'شبکه‌های اجتماعی'],
    basePrice: 7000000, unit: 'پروژه',
    fields: [...PROJECT_CONTACT_FIELDS,
      { key: 'profession', label: 'حوزه کاری شما', type: 'text', required: true, placeholder: 'مثلاً عکاسی، معماری' },
      { key: 'siteType', label: 'نوع سایت', type: 'select', required: true, options: ['پورتفولیو', 'وبلاگ شخصی', 'رزومه آنلاین', 'فروش خدمات'] },
      { key: 'domainName', label: 'دامنه (در صورت وجود)', type: 'text', required: false },
      { key: 'features', label: 'امکانات مورد نیاز', type: 'textarea', required: true },
      { key: 'deadline', label: 'مهلت تحویل مورد نظر', type: 'date', required: false },
    ],
    docs: [
      { key: 'bio', label: 'متن بیو / رزومه', required: false },
      { key: 'works', label: 'نمونه‌کارها و تصاویر', required: false },
      { key: 'brandAssets', label: 'لوگو شخصی', required: false },
    ],
  },
  {
    id: 'ps-wd-app', group: 'webdesign', icon: 'Smartphone', title: 'ساخت اپلیکیشن موبایل',
    desc: 'طراحی و توسعه اپلیکیشن اندروید و iOS برای کسب‌وکار شما',
    features: ['اپلیکیشن فروشگاهی', 'اپلیکیشن سازمانی', 'رابط کاربری اختصاصی', 'انتشار در کافه‌بازار و مایکت'],
    basePrice: 60000000, unit: 'پروژه',
    fields: [...PROJECT_CONTACT_FIELDS,
      { key: 'appType', label: 'نوع اپلیکیشن', type: 'select', required: true, options: ['فروشگاهی', 'سازمانی', 'خدماتی', 'آموزشی', 'دیگر'] },
      { key: 'platforms', label: 'پلتفرم هدف', type: 'select', required: true, options: ['اندروید', 'iOS', 'اندروید و iOS'] },
      { key: 'backendNeeded', label: 'نیاز به پنل مدیریت / بک‌اند', type: 'select', required: true, options: ['بله', 'خیر'] },
      { key: 'features', label: 'امکانات مورد نیاز', type: 'textarea', required: true, placeholder: 'ورود با شماره، نوتیفیکیشن، درگاه پرداخت...' },
      { key: 'deadline', label: 'مهلت تحویل مورد نظر', type: 'date', required: false },
      { key: 'budget', label: 'بودجه تقریبی (تومان)', type: 'number', required: false },
    ],
    docs: [
      { key: 'brief', label: 'بریف / وایرفریم اپلیکیشن', required: true },
      { key: 'brandAssets', label: 'لوگو و هویت بصری', required: false },
      { key: 'samples', label: 'نمونه اپلیکیشن مورد نظر', required: false },
    ],
  },
  {
    id: 'ps-wd-tgbot', group: 'webdesign', icon: 'Bot', title: 'ربات تلگرام',
    desc: 'ساخت ربات‌های تلگرامی فروشگاهی، پشتیبانی، مدیریت گروه و اطلاع‌رسانی',
    features: ['فروش خودکار در تلگرام', 'مدیریت گروه و کانال', 'اتصال به درگاه پرداخت', 'پشتیبانی هوشمند'],
    basePrice: 8000000, unit: 'پروژه',
    fields: [...PROJECT_CONTACT_FIELDS,
      { key: 'botType', label: 'نوع ربات', type: 'select', required: true, options: ['فروشگاهی', 'پشتیبانی', 'مدیریت گروه/کانال', 'اطلاع‌رسانی', 'دیگر'] },
      { key: 'paymentNeeded', label: 'نیاز به درگاه پرداخت', type: 'select', required: true, options: ['بله', 'خیر'] },
      { key: 'channelLink', label: 'لینک کانال/گروه (اختیاری)', type: 'text', required: false },
      { key: 'features', label: 'امکانات مورد نیاز', type: 'textarea', required: true, placeholder: 'ثبت‌نام خودکار، فاکتور، پنل مدیریتی...' },
      { key: 'deadline', label: 'مهلت تحویل مورد نظر', type: 'date', required: false },
    ],
    docs: [
      { key: 'brief', label: 'بریف / سناریوی ربات', required: true },
      { key: 'flows', label: 'فلوچارت یا نمونه صوتی/متنی منوها', required: false },
    ],
  },
  {
    id: 'ps-wd-otherbot', group: 'webdesign', icon: 'MessageSquare', title: 'ربات غیرتلگرامی',
    desc: 'ساخت چت‌بات و ربات برای واتساپ، اینستاگرام، وب‌سایت و سایر پیام‌رسان‌ها',
    features: ['چت‌بات سایت', 'ربات واتساپ و اینستاگرام', 'پاسخ‌گویی خودکار', 'اتصال به CRM و پنل سفارش'],
    basePrice: 10000000, unit: 'پروژه',
    fields: [...PROJECT_CONTACT_FIELDS,
      { key: 'platform', label: 'پلتفرم هدف', type: 'select', required: true, options: ['واتساپ', 'اینستاگرام', 'چت‌بات وب‌سایت', 'ایتا/بله', 'دیگر'] },
      { key: 'crmConnect', label: 'اتصال به CRM یا پنل سفارش', type: 'select', required: true, options: ['بله', 'خیر'] },
      { key: 'features', label: 'امکانات مورد نیاز', type: 'textarea', required: true },
      { key: 'deadline', label: 'مهلت تحویل مورد نظر', type: 'date', required: false },
    ],
    docs: [
      { key: 'brief', label: 'بریف / سناریوی ربات', required: true },
      { key: 'accessInfo', label: 'دسترسی‌های لازم (API/توکن)', required: false, hint: 'در صورت وجود حساب تجاری' },
    ],
  },
  // ------------------------- تولید محتوا -------------------------
  {
    id: 'ps-ct-text', group: 'content', icon: 'PenTool', title: 'تولید محتوای متنی',
    desc: 'نوشتن مقاله، متن تبلیغاتی و محتوای سئو شده برای سایت و شبکه‌های اجتماعی',
    features: ['مقالات سئو شده', 'کپی‌رایتینگ تبلیغاتی', 'تولید محتوای بلاگ'],
    basePrice: 1500000, unit: 'بسته ۵ مقاله',
    fields: [...PROJECT_CONTACT_FIELDS,
      { key: 'contentType', label: 'نوع محتوا', type: 'select', required: true, options: ['مقاله وبلاگ', 'متن تبلیغاتی', 'توضیح محصول', 'سناریو ویدیو', 'دیگر'] },
      { key: 'topic', label: 'موضوع / حوزه فعالیت', type: 'text', required: true, placeholder: 'مثلاً تجهیزات پزشکی' },
      { key: 'articlesCount', label: 'تعداد مقاله / متن', type: 'number', required: true, placeholder: '5' },
      { key: 'keywords', label: 'کلمات کلیدی مدنظر (اختیاری)', type: 'textarea', required: false },
      { key: 'deadline', label: 'مهلت تحویل مورد نظر', type: 'date', required: false },
    ],
    docs: [
      { key: 'brief', label: 'بریف محتوایی / لیست موضوعات', required: true },
      { key: 'brandAssets', label: 'راهنمای لحن و هویت برند', required: false },
    ],
  },
  {
    id: 'ps-ct-social', group: 'content', icon: 'Instagram', title: 'مدیریت شبکه‌های اجتماعی',
    desc: 'مدیریت و ادمین اینستاگرام، تلگرام و لینکدین با تقویم محتوایی منظم',
    features: ['تقویم محتوایی', 'پست و استوری روزانه', 'گزارش عملکرد ماهانه'],
    basePrice: 5000000, unit: 'ماه',
    fields: [...PROJECT_CONTACT_FIELDS,
      { key: 'package', label: 'پکیج ماهانه', type: 'select', required: true, options: ['برنزی (۱۲ پست + ۳۰ استوری)', 'نقره‌ای (۲۰ پست + ۶۰ استوری + گرافیک)', 'طلایی (۳۰ پست + استوری روزانه + ریلز + سئو)'] },
      { key: 'platform', label: 'پلتفرم(ها)', type: 'select', required: true, options: ['اینستاگرام', 'تلگرام', 'لینکدین', 'همه مورد‌ها'] },
      { key: 'accountLink', label: 'آیدی / لینک پیج', type: 'text', required: true, placeholder: '@yourbrand' },
      { key: 'duration', label: 'مدت همکاری (ماه)', type: 'number', required: true, placeholder: '3' },
      { key: 'details', label: 'توضیحات سفارش', type: 'textarea', required: false },
    ],
    docs: [
      { key: 'loginInfo', label: 'اطلاعات ورود یا دسترسی ادمین', required: false, hint: 'فقط از طریق دایرکت امن ارسال شود' },
      { key: 'brandAssets', label: 'لوگو و فایل‌های گرافیکی', required: false },
    ],
  },
  {
    id: 'ps-ct-video', group: 'content', icon: 'Video', title: 'تولید محتوای تصویری و ویدیویی',
    desc: 'طراحی پوستر، بنر، موشن‌گرافیک و ساخت ریلز و تیزرهای کوتاه',
    features: ['طراحی گرافیک', 'موشن‌گرافیک', 'ریلز و تیزر ویدیویی'],
    basePrice: 3000000, unit: 'بسته ۵ طرح',
    fields: [...PROJECT_CONTACT_FIELDS,
      { key: 'visualType', label: 'نوع خروجی', type: 'select', required: true, options: ['پوستر/بنر', 'موشن‌گرافیک', 'ریلز اینستاگرام', 'تیزر تبلیغاتی'] },
      { key: 'itemsCount', label: 'تعداد اقلام', type: 'number', required: true, placeholder: '5' },
      { key: 'sizeFormat', label: 'قطع / فرمت خروجی', type: 'text', required: false, placeholder: 'مثلاً ۱۰۸۰×۱۹۲۰ عمودی' },
      { key: 'deadline', label: 'مهلت تحویل مورد نظر', type: 'date', required: false },
    ],
    docs: [
      { key: 'brief', label: 'بریف / ایده‌ها', required: true },
      { key: 'brandAssets', label: 'لوگو و تصاویر خام', required: false },
      { key: 'samples', label: 'نمونه کار مورد پسند', required: false },
    ],
  },
  {
    id: 'ps-ct-seo', group: 'content', icon: 'Search', title: 'سئو و بهینه‌سازی',
    desc: 'بهبود رتبه سایت در گوگل از طریق سئوی داخلی، لینک‌سازی و تحقیق کلمات کلیدی',
    features: ['تحقیق کلمات کلیدی', 'سئوی داخلی و تکنیکال', 'لینک‌سازی استاندارد'],
    basePrice: 8000000, unit: 'پروژه',
    fields: [...PROJECT_CONTACT_FIELDS,
      { key: 'siteUrl', label: 'آدرس سایت', type: 'text', required: true, placeholder: 'https://example.ir' },
      { key: 'seoType', label: 'نوع خدمات سئو', type: 'select', required: true, options: ['تحقیق کلمات کلیدی', 'سئوی داخلی', 'سئوی تکنیکال', 'لینک‌سازی', 'بسته کامل'] },
      { key: 'goals', label: 'اهداف و کلمات کلیدی اصلی', type: 'textarea', required: true },
      { key: 'deadline', label: 'مهلت تحویل مورد نظر', type: 'date', required: false },
    ],
    docs: [
      { key: 'accessInfo', label: 'دسترسی Search Console / Analytics', required: false },
      { key: 'audit', label: 'گزارش سئوی قبلی (در صورت وجود)', required: false },
    ],
  },
];

export function getProjectService(id?: string): ProjectService | undefined {
  return PROJECT_SERVICES.find(s => s.id === id);
}

// Human-readable labels for the wizard field keys (used by the project-card
// summary and the admin order-details modal).
export const PROJECT_FIELD_LABELS: Record<string, string> = {
  fullName: 'مشتری / برند', phone: 'موبایل', email: 'ایمیل', industry: 'حوزه فعالیت',
  productCount: 'تعداد محصولات', pagesCount: 'تعداد صفحات', appType: 'نوع اپلیکیشن',
  platforms: 'پلتفرم هدف', botType: 'نوع ربات', platformTarget: 'پلتفرم',
  contentType: 'نوع محتوا', articlesCount: 'تعداد مقالات', visualType: 'نوع خروجی',
  itemsCount: 'تعداد اقلام', seoType: 'خدمات سئو', package: 'پکیج', duration: 'مدت همکاری',
  siteUrl: 'آدرس سایت', domainName: 'دامنه', deadline: 'مهلت تحویل', budget: 'بودجه',
  profession: 'حوزه کاری', siteType: 'نوع سایت', backendNeeded: 'پنل مدیریت', paymentNeeded: 'درگاه پرداخت',
  channelLink: 'کانال/گروه', crmConnect: 'اتصال به CRM', platform: 'پلتفرم', accountLink: 'آیدی/لینک پیج',
  topics: 'موضوعات', keywords: 'کلمات کلیدی', sizeFormat: 'قطع/فرمت', goals: 'اهداف سئو',
  quantity: 'تعداد / حجم کار', details: 'توضیحات سفارش', fileNote: 'فایل یا لینک منبع', colorMode: 'نوع چاپ',
  paperSize: 'قطع کاغذ', sides: 'رو و برگشتی', nationalId: 'کد ملی', phoneNumber: 'شماره تماس',
  slidesCount: 'تعداد اسلاید', urgency: 'نوع انجام',
};

// Field keys that represent a quantity multiplier in the project-order wizard
// (the order total = base price × this number).
export const PROJECT_QTY_KEYS = ['productCount', 'articlesCount', 'itemsCount', 'duration'];

export interface OrderItem {
  productId?: string;
  name?: string;
  price?: number;
  quantity?: number;
  total?: number;
  image?: string;
  [key: string]: any;
}

export type OrderStatus = 'new' | 'processing' | 'ready' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  trackingCode: string;
  customerId: string;
  customerName: string;
  type: 'service' | 'media' | 'product' | 'webdesign';
  channel: string;
  status: OrderStatus;
  priority: 'normal' | 'urgent' | 'vip';
  items: OrderItem[];
  total: number;
  paid: number;
  remaining: number;
  employeeId?: string;
  createdAt: string;
  dueDate?: string;
  description?: string;
  // Timeline of status changes – kept in sync with the public order-tracking page
  statusHistory?: { status: OrderStatus; date: string }[];
  // Marks that stock has already been deducted for this order (prevents double deduction)
  stockDeducted?: boolean;
  // Marks that a receipt (رسید) invoice has already been issued for this order
  receiptInvoiceId?: string;
  // ---- Online service-order wizard fields (خدمات کافی‌نت + پروژه‌ها) ----
  serviceId?: string; // the Service this order was created from
  projectServiceId?: string; // the ProjectService (طراحی سایت / تولید محتوا) this order was created from
  formData?: Record<string, string>; // step 1: customer-entered details
  documents?: { key: string; label: string; name: string; size: number; dataUrl: string }[]; // step 2: uploaded docs
  paymentMethod?: 'online' | 'wallet';
  gatewayRef?: string; // bank/gateway reference id for online payments
  documentStatus?: 'pending' | 'approved' | 'rejected'; // admin review of uploads
  projectId?: string; // admin project created from this order (kept in sync)
  contentProjectId?: string; // admin «تیم تولید محتوا» task created from this order (kept in sync)
}

// Shared Persian labels for order statuses (used by admin orders + public tracking)
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'جدید',
  processing: 'در حال انجام',
  ready: 'آماده تحویل',
  delivered: 'تحویل شد',
  cancelled: 'لغو شده',
};

// ---------------------------------------------------------------------------
// Service-order wizard helpers. Every item of the internet-cafe services page
// is orderable through a 3-step flow (details → documents → payment), so each
// service gets a set of form fields and document slots. Services can define
// their own `fields`/`docs`; otherwise defaults are derived from the service
// category/name so nothing is left unorderable.
// ---------------------------------------------------------------------------
const CONTACT_FIELDS: ServiceFormField[] = [
  { key: 'fullName', label: 'نام و نام خانوادگی', type: 'text', required: true, placeholder: 'مثلاً علی رضایی' },
  { key: 'nationalId', label: 'کد ملی', type: 'text', required: true, placeholder: '۱۰ رقم بدون خط تیره' },
  { key: 'phone', label: 'شماره موبایل', type: 'tel', required: true, placeholder: '09xxxxxxxxx' },
];

export function getServiceFormFields(service: Service): ServiceFormField[] {
  if (service.fields && service.fields.length > 0) return service.fields;
  const cat = service.category || '';
  const name = service.name || '';
  const qtyField: ServiceFormField = {
    key: 'quantity',
    label: `تعداد / حجم کار (${service.unit})`,
    type: 'number',
    required: true,
    placeholder: '1',
  };
  const descField: ServiceFormField = {
    key: 'details', label: 'توضیحات سفارش', type: 'textarea', required: false,
    placeholder: 'هر نکته‌ای که برای انجام این خدمت لازم است بنویسید...',
  };
  const fileField: ServiceFormField = {
    key: 'fileNote', label: 'آدرس فایل یا لینک منبع (اختیاری)', type: 'text', required: false,
    placeholder: 'مثلاً لینک گوگل درایو یا توضیح محل فایل',
  };

  switch (cat) {
    case 'پرینت':
    case 'کپی':
      return [...CONTACT_FIELDS, qtyField,
        { key: 'colorMode', label: 'نوع چاپ', type: 'select', required: true, options: ['سیاه و سفید', 'رنگی'] },
        { key: 'paperSize', label: 'قطع کاغذ', type: 'select', required: true, options: ['A4', 'A3', 'A5'] },
        { key: 'sides', label: 'رو و برگشتی', type: 'select', required: true, options: ['یک رو', 'دو رو'] },
        fileField, descField];
    case 'اسکن':
      return [...CONTACT_FIELDS, qtyField,
        { key: 'scanQuality', label: 'کیفیت اسکن', type: 'select', required: true, options: ['۳۰۰ DPI', '۶۰۰ DPI', '۱۲۰۰ DPI'] },
        { key: 'outputFormat', label: 'خروجی', type: 'select', required: true, options: ['PDF', 'JPG', 'هم PDF و هم JPG'] },
        descField];
    case 'تایپ':
      return [...CONTACT_FIELDS, qtyField,
        { key: 'language', label: 'زبان متن', type: 'select', required: true, options: ['فارسی', 'انگلیسی', 'فارسی و انگلیسی'] },
        fileField, descField];
    case 'ترجمه':
      return [...CONTACT_FIELDS, qtyField,
        { key: 'sourceLang', label: 'زبان مبدأ', type: 'select', required: true, options: ['فارسی', 'انگلیسی', 'عربی', 'دیگر'] },
        { key: 'targetLang', label: 'زبان مقصد', type: 'select', required: true, options: ['فارسی', 'انگلیسی', 'عربی', 'دیگر'] },
        { key: 'certified', label: 'رسمی با مهر دادگستری؟', type: 'select', required: true, options: ['خیر', 'بله'] },
        fileField, descField];
    case 'ثبت‌نام':
      return [...CONTACT_FIELDS,
        { key: 'portal', label: 'سامانه / سایت مربوطه', type: 'text', required: true, placeholder: 'مثلاً سامانه سنج، ثنا، دولت من' },
        { key: 'codeTracking', label: 'کد رهگیری یا شماره داوطلبی (در صورت وجود)', type: 'text', required: false },
        { key: 'loginInfo', label: 'نام کاربری / رمز ورود سامانه (در صورت نیاز)', type: 'text', required: false },
        descField];
    case 'رزومه':
      return [...CONTACT_FIELDS,
        { key: 'resumeType', label: 'نوع خدمت', type: 'select', required: true, options: ['طراحی رزومه جدید', 'ویرایش رزومه موجود'] },
        { key: 'jobField', label: 'حوزه شغلی مورد نظر', type: 'text', required: true, placeholder: 'مثلاً برنامه‌نویسی، حسابداری' },
        { key: 'languageOut', label: 'زبان رزومه', type: 'select', required: true, options: ['فارسی', 'انگلیسی', 'هر دو'] },
        fileField, descField];
    case 'نصب':
      return [...CONTACT_FIELDS,
        { key: 'osVersion', label: 'ویندوز / سیستم عامل', type: 'select', required: true, options: ['Windows 10', 'Windows 11', 'Linux', 'فرقی نمی‌کند'] },
        { key: 'softwareName', label: 'نام نرم‌افزار(ها)', type: 'text', required: false, placeholder: 'مثلاً Office، Adobe، آنتی‌ویروس' },
        { key: 'deviceModel', label: 'مدل دستگاه (لپ‌تاپ/کیس)', type: 'text', required: false },
        descField];
    case 'لمینت':
    case 'صحافی':
      return [...CONTACT_FIELDS, qtyField,
        { key: 'size', label: 'قطع سند', type: 'select', required: true, options: ['A4', 'A3', 'تخصصی'] },
        { key: 'finish', label: 'نوع جلد / پرداخت', type: 'select', required: false, options: ['معمولی', 'جلد گالینگور', 'فلزی / چسب گرم'] },
        descField];
    case 'ارائه':
      return [...CONTACT_FIELDS,
        { key: 'slidesCount', label: 'تعداد اسلاید', type: 'number', required: true, placeholder: '15' },
        { key: 'topic', label: 'موضوع ارائه', type: 'text', required: true },
        fileField, descField];
    case 'تبدیل':
      return [...CONTACT_FIELDS, qtyField,
        { key: 'fromFormat', label: 'فرمت مبدأ', type: 'text', required: true, placeholder: 'مثلاً PDF' },
        { key: 'toFormat', label: 'فرمت مقصد', type: 'text', required: true, placeholder: 'مثلاً Word' },
        fileField, descField];
    case 'نظام وظیفه':
      return [...CONTACT_FIELDS,
        { key: 'serviceStatus', label: 'وضعیت نظام وظیفه', type: 'select', required: true, options: ['معافیت', 'پایان خدمت', 'در حال خدمت', 'هیچ‌کدام'] },
        { key: 'requestType', label: 'نوع درخواست', type: 'select', required: true, options: ['تعیین تکلیف', 'درخواست معافیت', 'امریه', 'پیگیری '] },
        descField];
    case 'قوه قضاییه':
      return [...CONTACT_FIELDS,
        { key: 'caseCode', label: 'کد پرونده / بایگانی (اختیاری)', type: 'text', required: false },
        { key: 'requestType', label: 'نوع درخواست', type: 'select', required: true, options: ['ثبت‌نام و احراز هویت ثنا', 'دریافت ابلاغیه', 'گواهی عدم سوءپیشینه', 'دیگر'] },
        descField];
    case 'مالیاتی':
      return [...CONTACT_FIELDS,
        { key: 'economicCode', label: 'کد اقتصادی (اختیاری)', type: 'text', required: false },
        { key: 'taxType', label: 'نوع خدمت مالیاتی', type: 'select', required: true, options: ['تشکیل پرونده', 'ارسال اظهارنامه', 'ارزش افزوده', 'مشاوره'] },
        { key: 'fiscalYear', label: 'سال مالی', type: 'text', required: false, placeholder: 'مثلاً ۱۴۰۳' },
        descField];
    case 'بیمه':
      return [...CONTACT_FIELDS,
        { key: 'insuranceType', label: 'نوع بیمه', type: 'select', required: true, options: ['شخص ثالث', 'بدنه', 'عمر و زندگی', 'مسافرتی', 'آتش‌سوزی'] },
        { key: 'insuredItem', label: 'موضوع بیمه (خودرو/ملک/...)', type: 'text', required: false },
        { key: 'plateOrDoc', label: 'شماره پلاک یا سند', type: 'text', required: false },
        { key: 'startDate', label: 'تاریخ شروع پوشش', type: 'date', required: false },
        descField];
    case 'شارژ':
      return [...CONTACT_FIELDS,
        { key: 'operator', label: 'اپراتور', type: 'select', required: true, options: ['همراه اول', 'ایرانسل', 'رایتل'] },
        { key: 'phoneNumber', label: 'شماره سیم‌کارت', type: 'tel', required: true, placeholder: '09xxxxxxxxx' },
        { key: 'packageName', label: 'نوع شارژ / بسته', type: 'text', required: true, placeholder: 'مثلاً بسته ۱۰ گیگ یک‌ماهه' },
        descField];
    case 'پلیس +۱۰':
      return [...CONTACT_FIELDS,
        { key: 'policeService', label: 'نوع خدمت', type: 'select', required: true, options: ['گذرنامه', 'گواهینامه', 'کارت پایان خدمت', 'کارت ملی', 'دیگر'] },
        { key: 'appointmentDate', label: 'تاریخ نوبت (در صورت وجود)', type: 'date', required: false },
        descField];
    case 'مالی':
      return [...CONTACT_FIELDS,
        { key: 'financeType', label: 'نوع خدمت', type: 'select', required: true, options: ['سهام عدالت', 'استعلام بدهی', 'پرداخت اقساط', 'دیگر'] },
        { key: 'trackingNumber', label: 'شماره پیگیری / کد ملی مرتبط', type: 'text', required: false },
        descField];
    case 'بانکی':
      return [...CONTACT_FIELDS,
        { key: 'bankName', label: 'نام بانک', type: 'text', required: true, placeholder: 'مثلاً ملت، ملی، پاسارگاد' },
        { key: 'accountType', label: 'نوع حساب / خدمت', type: 'select', required: true, options: ['افتتاح حساب', 'وام', 'رمز پویا / همراه بانک', 'دیگر'] },
        descField];
    case 'حقوقی':
      return [...CONTACT_FIELDS,
        { key: 'legalType', label: 'نوع خدمت حقوقی', type: 'select', required: true, options: ['تنظیم قرارداد', 'وکالت‌نامه', 'گواهی حصر وراثت', 'شکایت کیفری', 'دیگر'] },
        { key: 'parties', label: 'طرفین معامله / دعوا', type: 'text', required: false },
        descField];
    case 'قبوض':
      return [...CONTACT_FIELDS,
        { key: 'billType', label: 'نوع قبض', type: 'select', required: true, options: ['آب', 'برق', 'گاز', 'تلفن ثابت', 'موبایل'] },
        { key: 'billId', label: 'شناسه قبض', type: 'text', required: true },
        { key: 'paymentId', label: 'شناسه پرداخت', type: 'text', required: false },
        descField];
    case 'مشاوره':
      return [...CONTACT_FIELDS,
        { key: 'consultTopic', label: 'موضوع مشاوره', type: 'text', required: true, placeholder: 'مثلاً انتخاب رشته کنکور ۱۴۰۴' },
        { key: 'preferredTime', label: 'زمان ترجیحی گفتگو', type: 'text', required: false },
        descField];
    case 'مخابرات':
      return [...CONTACT_FIELDS,
        { key: 'telecomOperator', label: 'اپراتور', type: 'select', required: true, options: ['آسیاتک', 'مخابرات (TPP)', 'همراه اول', 'ایرانسل', 'رایتل', 'شاتل'] },
        { key: 'serviceType', label: 'نوع سرویس', type: 'select', required: true, options: ['ADSL', 'VDSL', 'فیبر نوری (FTTH)', 'سیم‌کارت دائمی', 'ایمیل سازمانی', 'دیگر'] },
        { key: 'phoneNumber', label: 'شماره تلفن ثابت (برای سرویس اینترنت)', type: 'tel', required: false, placeholder: '0xx-------' },
        { key: 'address', label: 'آدرس کامل نصب', type: 'textarea', required: true },
        descField];
    case 'طراحی':
      return [...CONTACT_FIELDS,
        { key: 'projectType', label: 'نوع پروژه', type: 'select', required: true, options: ['سایت شرکتی', 'فروشگاهی', 'اپلیکیشن موبایل', 'ربات تلگرام', 'ربات غیرتلگرامی', 'دیگر'] },
        { key: 'domainName', label: 'دامنه (در صورت وجود)', type: 'text', required: false },
        { key: 'features', label: 'امکانات مورد نیاز', type: 'textarea', required: true },
        descField];
    default:
      // Unknown categories still get a complete, working order form.
      if (/ثبت.?نام|سامانه/.test(name)) return [...CONTACT_FIELDS, { key: 'portal', label: 'سامانه مربوطه', type: 'text', required: true }, descField];
      return [...CONTACT_FIELDS, qtyField, fileField, descField];
  }
}

export function getServiceDocFields(service: Service): ServiceDocField[] {
  if (service.docs && service.docs.length > 0) return service.docs;
  const cat = service.category || '';
  const idCards: ServiceDocField[] = [
    { key: 'nidFront', label: 'تصویر روی کارت ملی', required: true, hint: 'JPG یا PNG، حداکثر ۵ مگابایت' },
    { key: 'nidBack', label: 'تصویر پشت کارت ملی', required: true, hint: 'JPG یا PNG، حداکثر ۵ مگابایت' },
  ];
  switch (cat) {
    case 'پرینت':
    case 'کپی':
    case 'اسکن':
    case 'تایپ':
    case 'تبدیل':
    case 'ارائه':
    case 'لمینت':
    case 'صحافی':
    case 'نصب':
    case 'اداری':
      return [{ key: 'sourceFile', label: 'فایل اصلی (Word / PDF / عکس)', required: true, hint: 'فرمت‌های مجاز: docx, pdf, jpg, png' }];
    case 'ترجمه':
      return [{ key: 'sourceDoc', label: 'فایل یا تصویر متن قابل ترجمه', required: true }, { key: 'nidPhoto', label: 'تصویر کارت ملی (برای ترجمه رسمی)', required: false }];
    case 'ثبت‌نام':
      return [...idCards, { key: 'extraDoc', label: 'مدارک خاص سامانه (در صورت نیاز)', required: false }];
    case 'رزومه':
      return [{ key: 'oldResume', label: 'رزومه قبلی یا سوابق کاری', required: false }, { key: 'degree', label: 'تصویر مدرک تحصیلی', required: false }, { key: 'photo', label: 'عکس پرسنلی', required: false }];
    case 'نظام وظیفه':
      return [...idCards, { key: 'serviceCard', label: 'کارت پایان خدمت / معافیت', required: false }];
    case 'قوه قضاییه':
      return [...idCards];
    case 'مالیاتی':
      return [...idCards, { key: 'bizLicense', label: 'آگهی تأسیس / پروانه کسب', required: false }, { key: 'bankStmt', label: 'پرینت حساب بانکی', required: false }];
    case 'بیمه':
      return [...idCards, { key: 'vehicleDoc', label: 'تصویر سند / کارت خودرو (برای بیمه خودرو)', required: false }, { key: 'deed', label: 'تصویر سند ملک (برای بیمه آتش‌سوزی)', required: false }];
    case 'پلیس +۱۰':
      return [...idCards, { key: 'oldDocs', label: 'مدارک مرتبط (گواهینامه/گذرنامه قبلی)', required: false }, { key: 'photo', label: 'عکس ۴×۳', required: false }];
    case 'بانکی':
    case 'مالی':
      return [...idCards, { key: 'paySlip', label: 'فیش حقوقی / گواهی اشتغال به کار', required: false }];
    case 'حقوقی':
      return [...idCards, { key: 'contractDraft', label: 'پیش‌نویس یا اطلاعات طرفین', required: false }, { key: 'proof', label: 'مدارک مثبته', required: false }];
    case 'مخابرات':
      return [...idCards, { key: 'billPhoto', label: 'تصویر آخرین قبض تلفن ثابت', required: false }, { key: 'addressProof', label: 'مدیرک احراز آدرس', required: false }];
    case 'طراحی':
      return [{ key: 'brief', label: 'بریف / نمونه مورد نظر', required: false }, { key: 'brandAssets', label: 'لوگو و تصاویر برند', required: false }];
    case 'قبوض':
    case 'شارژ':
    case 'مشاوره':
      return [{ key: 'billImage', label: 'تصویر قبض / اطلاعات سرویس', required: false }];
    default:
      return idCards;
  }
}

// Urgency surcharge used by both the public wizard and the admin pricing view
export const SERVICE_URGENCY_MULTIPLIER = 1.5; // ۵۰٪ اضافه برای خدمات فوری

export interface NewsItem {
  id: string;
  title: string;
  image: string;
  caption: string;
  content: string;
  date: string;
  active: boolean;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string;
  type: string;
  technologies: string[];
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
}

export interface Project {
  id: string;
  title: string;
  clientName: string;
  type: string;
  stage: string;
  domain?: string;
  host?: string;
  deadline: string;
  totalCost: number;
  paidAmount: number;
  progress: number;
  description: string;
  // Content-production orders are managed in the «تیم تولید محتوا» section and
  // must never appear in the admin Projects board (طراحی سایت). Legacy records
  // saved before this rule may still exist in localStorage; the helpers below
  // detect them so they can be filtered out everywhere.
  hiddenFromProjects?: boolean;
}

// True when a project record actually belongs to a content-production order
// (either flagged explicitly or recognised from legacy data by its type/title).
export function isContentOrderProject(p: Project): boolean {
  if (p.hiddenFromProjects) return true;
  if (p.type === 'تولید محتوا') return true;
  const ps = getProjectService((p.description || '').match(/سفارش آنلاین «([^»]+)»/)?.[1]);
  return ps?.group === 'content';
}

// The visible list of the admin Projects board (web-design projects only).
export function visibleProjects(list: Project[]): Project[] {
  return list.filter(p => !isContentOrderProject(p));
}

export interface Note {
  id: string;
  title: string;
  customerName: string;
  customerPhone: string;
  task: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'done';
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
  tags: string[];
  content: string;
}

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  approved: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  products: string[];
  balance: number;
  notes?: string;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  role: 'admin' | 'seller' | 'operator' | 'designer' | 'accountant';
  salary: number;
  startDate: string;
  active: boolean;
  commission: number;
}

export interface Campaign {
  id: string;
  title: string;
  code: string;
  discount: number;
  type: 'percent' | 'fixed';
  minPurchase: number;
  maxUses: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface SmsLog {
  id: string;
  phone: string;
  message: string;
  date: string;
  status: 'sent' | 'failed' | 'pending';
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  details: string;
  date: string;
  ip?: string;
  module?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

// ---------------------------------------------------------------------------
// Support ticketing (بخش تیکت و پشتیبانی)
// A ticket is a threaded conversation between a customer and the support team.
// Statuses are intentionally limited to four values so both the public profile
// page and the admin workspace share one simple workflow:
//   open → in_progress → resolved, plus `closed` for tickets that were
//   terminated without a resolution (spam / duplicate).
// ---------------------------------------------------------------------------
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketCategory = 'general' | 'order' | 'technical' | 'billing' | 'complaint' | 'other';

export interface TicketMessage {
  id: string;
  sender: 'customer' | 'support';
  // Name shown on the bubble — the staff member's name when replying as support
  author: string;
  text: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  code: string; // human-readable tracking code, e.g. TCK-1403125
  customerId: string;
  customerName: string;
  customerPhone: string;
  subject: string;
  description: string; // opening message (also kept as the first thread entry)
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  orderId?: string; // optional link to an existing order
  messages: TicketMessage[];
  assignedTo?: string; // staff member handling the ticket
  rating?: number; // 1..5 satisfaction score given by the customer after resolution
  ratedAt?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'باز',
  in_progress: 'در حال رسیدگی',
  resolved: 'حل شده',
  closed: 'بسته شده',
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'کم',
  normal: 'عادی',
  high: 'زیاد',
  urgent: 'فوری',
};

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  general: 'عمومی',
  order: 'سفارش و خدمات',
  technical: 'مشکل فنی',
  billing: 'مالی و پرداخت',
  complaint: 'شکایت',
  other: 'سایر',
};

// SLA deadlines per priority (used by the admin board to flag overdue tickets)

// ---------------------------------------------------------------------------
// Identity resolution for customer-owned data (تیکت‌ها، سفارش‌ها، امتیازها)
// ---------------------------------------------------------------------------
// Tickets/orders/invoices/loyalty transactions are keyed by the *user id*, but
// older builds generated a brand-new id (`'u' + Date.now()`) on every login
// while also keeping duplicate accounts with the same phone number. That made
// tickets "disappear" after logout/refresh: the new session id no longer
// matched the `customerId` stored on the old rows.
//
// To make ownership robust we resolve a customer identity through BOTH their
// id and their phone number:
//   - `identityIdsOf(user)` collects the canonical account id plus every
//     alternate id seen for the same phone (duplicate accounts, the live
//     session id, and ids already attached to the customer's own records),
//   - `isTicketOwner(...)` / `isOrderOwner(...)` treat all of those as the
//     same person.
// A one-time startup migration additionally merges duplicate accounts and
// re-points every customer-keyed collection to the canonical id, so historical
// data becomes visible again instead of staying orphaned.
export function identityIdsOf(user: Pick<User, 'id' | 'phone'>, allUsers: User[]): string[] {
  const ids = new Set<string>([user.id]);
  if (user.phone) {
    for (const u of allUsers) {
      if (u.role === 'customer' && u.phone === user.phone) ids.add(u.id);
    }
  }
  return [...ids];
}

// Ownership check for support tickets (tolerates legacy orphaned ids).
export function isTicketOwner(t: Pick<SupportTicket, 'customerId' | 'customerPhone'>, user: Pick<User, 'id' | 'phone'>, allUsers: User[]): boolean {
  if (t.customerId === user.id) return true;
  if (user.phone && t.customerPhone && t.customerPhone === user.phone) return true;
  return identityIdsOf(user, allUsers).includes(t.customerId);
}

// Ownership check for orders (orders have no phone snapshot, so identity ids
// are used).
export function isOrderOwner(o: Pick<Order, 'customerId'>, user: Pick<User, 'id' | 'phone'>, allUsers: User[]): boolean {
  if (o.customerId === user.id) return true;
  return identityIdsOf(user, allUsers).includes(o.customerId);
}

// Re-point every customer-keyed collection from an old (orphaned) id to the
// canonical one. Runs inside the one-time merge migration below.
function repointOwnedData(oldId: string, newId: string) {
  const migrate = (key: string, apply: (list: any[]) => any[]) => {
    try {
      const v = localStorage.getItem(key);
      if (!v) return;
      const list = JSON.parse(v);
      if (Array.isArray(list)) localStorage.setItem(key, JSON.stringify(apply(list)));
    } catch { /* ignore malformed collections */ }
  };
  migrate('hamyar_tickets', (l) => l.map(x => x && x.customerId === oldId ? { ...x, customerId: newId } : x));
  migrate('hamyar_orders', (l) => l.map(x => x && x.customerId === oldId ? { ...x, customerId: newId } : x));
  migrate('hamyar_loyalty_tx', (l) => l.map(x => x && x.userId === oldId ? { ...x, userId: newId } : x));
  migrate('hamyar_invoices', (l) => l.map(x => x && (x as any).customerId === oldId ? { ...x, customerId: newId } : x));
}

// One-time startup migration that heals orphaned customer data:
//  1. merges duplicate customer accounts sharing the same phone into a single
//     canonical account (the oldest record wins),
//  2. re-points tickets/orders/loyalty/invoices from every dropped id,
//  3. adopts the surviving id for the stored session so logout → refresh →
//     login keeps showing the very same tickets.
// Afterwards the result is cached under CUSTOMER_IDENTITY_KEY so later loads
// never depend on the fragile localStorage write-ordering again.
const IDENTITY_MIGRATION_KEY = 'hamyar_identity_migration_v1';
const CUSTOMER_IDENTITY_KEY = 'hamyar_customer_identity';

interface IdentityReport { users: User[]; sessionId?: string }

function runIdentityMigration(): IdentityReport {
  const report: IdentityReport = { users: [] };
  try {
    const rawUsers = localStorage.getItem('hamyar_users');
    const users: User[] = rawUsers ? JSON.parse(rawUsers) : [];
    const byId = new Map<string, User>(users.map(u => [u.id, u]));

    // The live customer session (dedicated key first, legacy snapshot second).
    let session: { id: string; name?: string; phone?: string } | null = null;
    try {
      const s = localStorage.getItem(CUSTOMER_SESSION_KEY);
      if (s) session = JSON.parse(s);
    } catch { /* fall through to the legacy snapshot */ }
    if (!session) {
      try {
        const legacyRaw = localStorage.getItem('hamyar_user');
        if (legacyRaw) {
          const legacy: User = JSON.parse(legacyRaw);
          if (legacy && legacy.role === 'customer' && legacy.phone) session = legacy;
        }
      } catch { /* ignore */ }
    }

    // Group customers by phone (accounts without a phone stay separate).
    const groups = new Map<string, User[]>();
    for (const u of users) {
      if (u.role !== 'customer' || !u.phone) continue;
      const g = groups.get(u.phone) || [];
      g.push(u);
      groups.set(u.phone, g);
    }
    // Include the session id even when its account row is missing, so the
    // orphaned tickets created under it get merged into the canonical group.
    if (session && session.phone && session.id && !byId.has(session.id)) {
      const g = groups.get(session.phone) || [];
      g.push({ ...(session as User), role: 'customer' });
      groups.set(session.phone, g);
    }

    for (const [, group] of groups) {
      if (group.length < 2) continue;
      group.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      const canonical = group[0];
      const rest = group.slice(1);
      for (const dup of rest) {
        // Merge any profile fields the canonical record is missing.
        for (const k of ['inviteCode', 'invitedBy', 'birthDate', 'avatar'] as const) {
          if (!canonical[k] && dup[k]) (canonical as any)[k] = dup[k];
        }
        canonical.loyaltyPoints = (canonical.loyaltyPoints || 0) + (dup.loyaltyPoints || 0);
        canonical.totalEarnedPoints = (canonical.totalEarnedPoints ?? canonical.loyaltyPoints ?? 0)
          + (dup.totalEarnedPoints ?? dup.loyaltyPoints ?? 0);
        canonical.invitedCount = Math.max(canonical.invitedCount || 0, dup.invitedCount || 0);
        canonical.favorites = [...new Set([...(canonical.favorites || []), ...(dup.favorites || [])])];
        canonical.selectedMedia = [...new Set([...(canonical.selectedMedia || []), ...(dup.selectedMedia || [])])];
        canonical.walletBalance = (canonical.walletBalance || 0) + (dup.walletBalance || 0);
        if (!canonical.username && dup.username) canonical.username = dup.username;
        if (!canonical.name && dup.name) canonical.name = dup.name;
        repointOwnedData(dup.id, canonical.id);
        byId.delete(dup.id);
      }
      byId.set(canonical.id, canonical);
      if (session && group.some(g => g.id === session!.id)) session = { ...session, id: canonical.id };
    }

    // If the session still has no account row at all, heal it by creating a
    // proper account under its (stable) id so nothing stays ownerless.
    if (session && session.id && session.phone && !byId.has(session.id)) {
      byId.set(session.id, {
        id: session.id, username: session.phone, password: '', role: 'customer',
        name: session.name || '', phone: session.phone, loyaltyPoints: 0, totalEarnedPoints: 0,
        level: 'normal', favorites: [], selectedMedia: [], createdAt: new Date().toISOString(),
      });
    }

    const healed = [...byId.values()];
    localStorage.setItem('hamyar_users', JSON.stringify(healed));
    if (session && session.id && session.phone) {
      localStorage.setItem(CUSTOMER_IDENTITY_KEY, JSON.stringify({ id: session.id, phone: session.phone }));
    }
    localStorage.setItem(IDENTITY_MIGRATION_KEY, new Date().toISOString());
    report.users = healed;
    report.sessionId = session?.id;
  } catch { /* storage unavailable — keep whatever state exists */ }
  return report;
}

// Read the identity cache written by the migration above (if present).
function readCachedIdentity(): { id: string; phone: string } | null {
  try {
    const raw = localStorage.getItem(CUSTOMER_IDENTITY_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p && p.id && p.phone ? p : null;
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// Session keys. Tickets and orders are keyed by the user id, so the login
// session must be stable across reloads AND logins with the same phone — a
// fresh `u + Date.now()` id per visit used to orphan every previously created
// ticket (customer saw an empty list after logout/refresh).
// ---------------------------------------------------------------------------
const CUSTOMER_SESSION_KEY = 'hamyar_customer_session';
export interface CustomerSession { id: string; name: string; phone: string }

// One-time migration for sessions created before ids were persisted in the
// users list: adopt the matching account's id so old tickets/orders stay
// reachable. Returns null when nothing was stored under the legacy key.
function migrateLegacyCustomerSession(users: User[]): CustomerSession | null {
  try {
    const raw = localStorage.getItem('hamyar_user');
    if (!raw) return null;
    const legacy: User = JSON.parse(raw);
    if (!legacy || legacy.role !== 'customer' || !legacy.phone) return null;
    const match = users.find(u => u.id === legacy.id && u.role === 'customer')
      || users.find(u => u.phone === legacy.phone && u.role === 'customer');
    const session: CustomerSession = {
      id: match ? match.id : legacy.id,
      name: legacy.name || '',
      phone: legacy.phone,
    };
    localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session));
    // The legacy key is consumed; drop it so future reloads read from the
    // authoritative session + users list only.
    localStorage.removeItem('hamyar_user');
    return session;
  } catch {
    return null;
  }
}

export const TICKET_SLA_HOURS: Record<TicketPriority, number> = {
  low: 72,
  normal: 24,
  high: 8,
  urgent: 2,
};

export interface InvoiceItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId?: string; // لینک به سفارشی که این فاکتور/رسید برای آن صادر شده
  type: 'service' | 'product' | 'webdesign' | 'combined' | 'media';
  date: string;
  dueDate?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerNationalId?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  discountType: 'percent' | 'fixed';
  discountAmount: number;
  tax: number;
  taxAmount: number;
  total: number;
  note?: string;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  createdAt: string;
}

export interface KeyResult {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
}

export interface OKR {
  id: string;
  title: string;
  description: string;
  type: 'organizational' | 'employee';
  assignedTo?: string; // employee ID
  keyResults: KeyResult[];
  startDate: string;
  endDate: string;
  quarter: string; // Q1, Q2, Q3, Q4
  year: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface KPI {
  id: string;
  title: string;
  description: string;
  category: 'sales' | 'marketing' | 'customer' | 'operations' | 'financial' | 'digital';
  type: 'organizational' | 'employee';
  assignedTo?: string; // employee ID
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Affiliate {
  id: string;
  name: string;
  phone: string;
  email?: string;
  referralCode: string;
  commissionRate: number; // درصد پورسانت
  walletBalance: number; // موجودی کیف پول
  totalEarnings: number; // کل درآمد
  totalWithdrawn: number; // کل برداشت شده
  totalSpent: number; // کل خرج شده در خدمات
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  lastActivity?: string;
  notes?: string;
}

export interface AffiliateOrder {
  id: string;
  affiliateId: string;
  orderId: string;
  customerName: string;
  orderType: 'webdesign' | 'bot' | 'app' | 'product' | 'content' | 'service' | 'media';
  orderAmount: number;
  commissionAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
}

export interface AffiliateTransaction {
  id: string;
  affiliateId: string;
  type: 'commission' | 'withdrawal' | 'expense';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: string;
  completedAt?: string;
}

export interface Persona {
  id: string;
  name: string;
  avatar: string; // emoji or image URL
  tagline: string; // شعار کوتاه
  demographics: {
    ageRange: string; // مثال: 25-35
    gender: 'male' | 'female' | 'mixed';
    location: string;
    education: string;
    occupation: string;
    incomeLevel: 'low' | 'medium' | 'high' | 'very-high';
  };
  psychographics: {
    personality: string[]; // ویژگی‌های شخصیتی
    values: string[]; // ارزش‌ها
    interests: string[]; // علایق
    lifestyle: string; // سبک زندگی
  };
  behavior: {
    buyingHabits: string; // عادات خرید
    preferredChannels: string[]; // کانال‌های ترجیحی
    decisionFactors: string[]; // عوامل تصمیم‌گیری
    painPoints: string[]; // نقاط درد
    goals: string[]; // اهداف
  };
  services: {
    primaryServices: string[]; // خدمات اصلی مورد استفاده
    frequency: 'daily' | 'weekly' | 'monthly' | 'occasionally';
    avgSpending: number; // میانگین هزینه
    preferredPayment: string; // روش پرداخت ترجیحی
  };
  scenario: {
    typicalDay: string; // یک روز معمولی
    challenges: string[]; // چالش‌ها
    solutions: string[]; // راه‌حل‌های ما
    touchpoints: string[]; // نقاط تماس
  };
  quote: string; // نقل قول نمونه
  notes: string; // یادداشت‌های اضافی
  createdAt: string;
  updatedAt: string;
}

export interface DigitalMarketingData {
  // Financial Metrics
  gmv: number;
  nmv: number;
  grossProfit: number;
  profit: number;
  cashFlow: number;
  
  // Traffic Metrics
  totalImpressions: number;
  sessions: number;
  engagementRate: number;
  users: number;
  sessionsPerUser: number;
  
  // Sales Metrics
  transactions: number;
  totalProductsSold: number;
  returnRate: number;
  outOfStockRate: number;
  avgLossPerReturn: number;
  onTimeDeliveryRate: number;
  avgDeliveryTime: number;
  avgSupplyTime: number;
  purchaseRate: number;
  aov: number;
  aop: number;
  avgProductPrice: number;
  avgPackagingCost: number;
  avgClicksPerVisit: number;
  
  // Call Metrics
  totalCalls: number;
  callsPerSession: number;
  callToCustomerRate: number;
  clickOnCallRate: number;
  phoneOrdersRate: number;
  trackingCallsRate: number;
  avgCallsPerUser: number;
  costPerCall: number;
  salesPerCall: number;
  profitPerCall: number;
  missedCallsRate: number;
  
  // Chat Metrics
  chatSessionsInitiated: number;
  chatPerSession: number;
  
  // Page Metrics
  pagesPerSession: number;
  totalPageviews: number;
  uniquePageviews: number;
  homepageViewsRate: number;
  productPageviews: number;
  productPageviewsRate: number;
  blogPageviews: number;
  blogPageviewsRate: number;
  categoryPageviewsRate: number;
  topProductViewsRate: number;
  error404Rate: number;
  
  // Time Metrics
  avgSessionDuration: number;
  totalSessionTime: number;
  avgEngagementTime: number;
  avgTimeOnPage: number;
  productVsBlogDuration: number;
  videoVsNonVideoDuration: number;
  
  // Engagement Metrics
  bounceRate: number;
  deepSessionsRate: number;
  longSessionsRate: number;
  
  // Registration Metrics
  registrationToPurchaseRate: number;
  profileCompletionRate: number;
  registrationCompletionRate: number;
  googleVsEmailRate: number;
  
  // Cart Metrics
  addToCartToPurchaseRate: number;
  cartCompletionRate: number;
  cartAbandonmentRate: number;
  
  // Advertising Metrics
  cpc: number;
  cpv: number;
  rpv: number;
  rpl: number;
  cpl: number;
  organicVsPaidRate: number;
  directRate: number;
  directBrandedRate: number;
  organicRate: number;
  googleFirstTimeRate: number;
  
  // SEO Metrics
  googleImpressions: number;
  googleImageClickRate: number;
  productOrganicRate: number;
  avgCtr: number;
  indexedPages: number;
  internalLinks: number;
  backlinkDomains: number;
  domainAuthority: number;
  spamScore: number;
  topGoogleKeywords: number;
  blogToShopVisits: number;
  
  // Growth Metrics
  sessionGrowthRate: number;
  organicGrowthRate: number;
  internalSearchRate: number;
  noResultSearchRate: number;
  
  // Email Metrics
  subscriberGrowthRate: number;
  openRate: number;
  emailCtr: number;
  
  // ROI Metrics
  roi: number;
  roas: number;
  
  // Retention Metrics
  avgSessionsPerUser: number;
  avgDaysBetweenSessions: number;
  singlePageViewsRate: number;
  avgTimeToPurchase: number;
  assistedPathPosition: number;
  firstVisitPurchaseRate: number;
  newVisitorPurchaseRate: number;
  assistedConversionsRate: number;
  returningVsNewRate: number;
  returningValueVsNew: number;
  
  // Demographics
  mobileVsDesktopRate: number;
  maleVsFemaleRate: number;
  avgUserAge: number;
  
  // Social Engagement
  productComments: number;
  avgCommentsPerUser: number;
  avgScrollDepth: number;
  scroll80Rate: number;
  day1RetentionRate: number;
  weeklyVsMonthlyRetention: number;
  
  // Customer Metrics
  cac: number;
  clv: number;
  clvToCac: number;
  retentionRate: number;
  churnRate: number;
  loyalCustomerRate: number;
  purchaseFrequency: number;
  avgTimeBetweenPurchases: number;
  
  // Top Customers
  largestCartItems: number;
  topCustomerOrders: number;
  topCustomerAmount: number;
  b2bVsB2cRate: number;
  
  // Market Metrics
  marketShare: number;
  cheaperCompetitorsRate: number;
  
  // UX Metrics
  deadClicks: number;
  quickBacks: number;
  trustSymbolClickRate: number;
  wishlistClicks: number;
  
  // Content Metrics
  wordsGenerated: number;
  imagesAdded: number;
  infographicsCreated: number;
  videosAdded: number;
  productsAdded: number;
  blogPosts: number;
  productVsBlogWordsRate: number;
  reports: number;
  oldContentUpdates: number;
  
  // Referral Metrics
  referralTraffic: number;
  exitRate: number;
  avgBlogPageValue: number;
  blogVsTotalPageValue: number;
  blogUsersRate: number;
  blogToShopRate: number;
  productImageClickRate: number;
  productVideoClickRate: number;
  
  // Ratings
  avgProductRating: number;
  avgBlogRating: number;
  
  // Brand Metrics
  brandAwareness: number;
  topOfMind: number;
  nps: number;
  satisfactionRate: number;
  womRate: number;
  
  // Usability
  designScore: number;
  findabilityScore: number;
  readabilityScore: number;
  trustScore: number;
  supportScore: number;
  
  // Operations
  suppliers: number;
  personnel: number;
  positions: number;
  dailyWorkHours: number;
  revenuePerHour: number;
  avgHourlyWage: number;
  
  // Performance
  avgPageLoadTime: number;
  fcp: number;
  lcp: number;
  
  // Social Media
  socialTraffic: number;
  socialIconClicks: number;
  ugcContent: number;
  totalFollowers: number;
  followers: number;
  avgLikes: number;
  avgComments: number;
  accountReach: number;
  videoReach: number;
  postReach: number;
  storyReach: number;
  topPostReach: number;
  topStoryReach: number;
  topVideoReach: number;
  profileVisits: number;
  socialImpressions: number;
  contentInteractions: number;
  postInteractions: number;
  storyInteractions: number;
  videoInteractions: number;
  
  lastUpdated: string;
}

export interface ContentProject {
  id: string;
  title: string;
  type: 'video' | 'photo' | 'article' | 'social' | 'ad';
  scenario: string;
  equipment: string[];
  contentPlan: string;
  assignedTo: string[];
  startDate: string;
  deadline: string;
  publishDate?: string;
  publishPlatform?: string[];
  status: 'planning' | 'in-progress' | 'review' | 'completed' | 'published';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes: string;
  tags: string[];
  relatedProducts: string[];
  relatedCampaigns: string[];
  budget: number;
  actualCost: number;
  qualityScore: number;
  qualityChecklist: { item: string; checked: boolean }[];
  approvalStage: 'draft' | 'content-manager' | 'ceo' | 'client' | 'approved';
  versions: { version: number; date: string; notes: string; data: any }[];
  createdAt: string;
  // Set automatically when the task is created from an online content order
  sourceOrderId?: string;
  sourceTrackingCode?: string;
  customerName?: string;
}

export interface ContentComment {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  text: string;
  mentions: string[];
  resolved: boolean;
  createdAt: string;
}

export interface ContentAsset {
  id: string;
  projectId: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ContentTemplate {
  id: string;
  name: string;
  type: 'video' | 'photo' | 'article' | 'social' | 'ad';
  scenario: string;
  equipment: string[];
  contentPlan: string;
  qualityChecklist: string[];
  createdAt: string;
}

export interface ContentIdea {
  id: string;
  title: string;
  description: string;
  type: string;
  votes: number;
  votedBy: string[];
  status: 'new' | 'accepted' | 'rejected' | 'converted';
  convertedToProjectId?: string;
  createdBy: string;
  createdAt: string;
}

export interface BrandBook {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fonts: string[];
  tone: string;
  logoUrl: string;
  guidelines: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isDefault: boolean;
  createdAt: string;
}

export interface SystemUser {
  id: string;
  username: string;
  password: string;
  name: string;
  email?: string;
  phone?: string;
  roleId: string;
  active: boolean;
  lastLogin?: string;
  createdAt: string;
}

// Maps an admin panel route to the permission ids that grant access to it.
// Used both by the sidebar (to hide restricted items) and by the router
// (to block direct URL access), so the restrictions defined in the RBAC
// section are actually enforced for every staff account. An empty list
// means the page is available to all logged-in admins.
export const ADMIN_PAGE_PERMISSIONS: Record<string, string[]> = {
  '/admin': [], // dashboard – visible to every logged-in admin
  '/admin/analytics': ['perm34'],
  '/admin/digital-marketing': ['perm34'],
  '/admin/affiliates': ['perm36', 'perm37', 'perm38', 'perm39', 'perm40'],
  '/admin/personas': ['perm3', 'perm4'],
  '/admin/orders': ['perm1', 'perm2'],
  '/admin/notes': ['perm1', 'perm2'],
  '/admin/customers': ['perm3', 'perm4'],
  '/admin/invites': ['perm29'],
  '/admin/products': ['perm5', 'perm6'],
  '/admin/media': ['perm7', 'perm8'],
  '/admin/services': ['perm9', 'perm10'],
  '/admin/projects': ['perm11', 'perm12'],
  '/admin/finance': ['perm13', 'perm14'],
  '/admin/invoices': ['perm13', 'perm14'],
  '/admin/employees': ['perm15', 'perm16'],
  '/admin/okr-kpi': ['perm15', 'perm16', 'perm34'],
  '/admin/suppliers': ['perm17', 'perm18'],
  '/admin/campaigns': ['perm19', 'perm20'],
  '/admin/sms': ['perm21', 'perm22'],
  '/admin/reviews': ['perm23', 'perm24'],
  '/admin/tickets': ['perm41', 'perm42'],
  '/admin/content-team': ['perm27', 'perm28'],
  '/admin/rbac': ['perm35'],
  '/admin/training': [], // training – available to all staff accounts
  '/admin/audit': ['perm32'],
  '/admin/backup': ['perm33'],
  '/admin/settings': ['perm30', 'perm31'],
};

interface AppContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  currentUser: User | null;
  login: (phone: string, name: string, invitedBy?: string) => void;
  adminLogin: (username: string, password: string) => boolean;
  logout: () => void;
  products: Product[];
  setProducts: (p: Product[]) => void;
  mediaItems: MediaItem[];
  setMediaItems: (m: MediaItem[]) => void;
  services: Service[];
  setServices: (s: Service[]) => void;
  orders: Order[];
  setOrders: (o: Order[]) => void;
  // Central, consistent way to change an order status. It keeps the public
  // tracking page in sync, deducts warehouse stock and issues a receipt on delivery.
  updateOrder: (id: string, patch: Partial<Order>) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  // Creates a paid service order from the public ordering wizard and keeps
  // every related admin section (orders, invoices/finance, SMS, audit log) in sync.
  createServiceOrder: (input: {
    service: Service;
    quantity: number;
    urgent: boolean;
    formData: Record<string, string>;
    documents: NonNullable<Order['documents']>;
    paymentMethod: 'online' | 'wallet';
    gatewayRef?: string;
  }) => { ok: boolean; error?: string; order?: Order };
  // Same wizard for the «طراحی سایت» و «تولید محتوا» catalogue items. In addition
  // to orders/invoices/SMS/audit it creates a linked project in admin Projects.
  createProjectOrder: (input: {
    projectService: ProjectService;
    quantity: number;
    urgent: boolean;
    formData: Record<string, string>;
    documents: NonNullable<Order['documents']>;
    paymentMethod: 'online' | 'wallet';
    gatewayRef?: string;
  }) => { ok: boolean; error?: string; order?: Order };
  news: NewsItem[];
  setNews: (n: NewsItem[]) => void;
  portfolio: PortfolioItem[];
  setPortfolio: (p: PortfolioItem[]) => void;
  expenses: Expense[];
  setExpenses: (e: Expense[]) => void;
  projects: Project[];
  setProjects: (p: Project[]) => void;
  users: User[];
  setUsers: (u: User[]) => void;
  addToFavorites: (mediaId: string) => void;
  selectMedia: (mediaId: string) => void;
  addToCart: (productId: string, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartItems: CartItem[];
  updateAvatar: (avatarUrl: string) => void;
  updateCustomerProfile: (patch: Partial<Pick<User, 'name' | 'phone' | 'birthDate'>>) => void;
  chargeWallet: (amount: number) => void;
  deductWallet: (amount: number) => boolean;
  aboutContent: AboutContent;
  setAboutContent: (a: AboutContent) => void;
  notes: Note[];
  setNotes: (n: Note[]) => void;
  reviews: Review[];
  setReviews: (r: Review[]) => void;
  suppliers: Supplier[];
  setSuppliers: (s: Supplier[]) => void;
  employees: Employee[];
  setEmployees: (e: Employee[]) => void;
  campaigns: Campaign[];
  setCampaigns: (c: Campaign[]) => void;
  smsLogs: SmsLog[];
  setSmsLogs: (s: SmsLog[]) => void;
  auditLogs: AuditLog[];
  setAuditLogs: (a: AuditLog[]) => void;
  faqs: FaqItem[];
  setFaqs: (f: FaqItem[]) => void;
  // ---- Support tickets (تیکت و پشتیبانی) ----
  tickets: SupportTicket[];
  setTickets: (t: SupportTicket[]) => void;
  // Customer side: open a new ticket thread, returns the generated tracking code
  createTicket: (input: { subject: string; description: string; category: TicketCategory; priority: TicketPriority; orderId?: string }) => { ok: boolean; error?: string; ticket?: SupportTicket };
  // Customer side: append a follow-up message to their own ticket
  replyTicket: (ticketId: string, text: string) => void;
  // Customer side: reopen a resolved/closed ticket with a new message
  reopenTicket: (ticketId: string, text: string) => void;
  // Customer side: rate the support quality after the ticket was resolved
  rateTicket: (ticketId: string, rating: number) => void;
  // Admin side: reply as the support team (also flips `open` → `in_progress`)
  adminReplyTicket: (ticketId: string, text: string) => void;
  // Admin side: change status / priority / assignee in one patch
  updateTicket: (id: string, patch: Partial<Pick<SupportTicket, 'status' | 'priority' | 'assignedTo'>>) => void;
  invoices: Invoice[];
  setInvoices: (i: Invoice[]) => void;
  // ---- Customer club / gamification (managed from admin «کدهای دعوت») ----
  loyaltyTx: LoyaltyTransaction[];
  gamificationConfig: GamificationConfig;
  setGamificationConfig: (c: GamificationConfig) => void;
  // Wipe every hard-coded point balance/transaction and restart the club from zero.
  resetLoyaltyData: () => void;
  // Award points to any user (admin manual credit, event bonuses…). Never negative.
  awardLoyaltyPoints: (userId: string, points: number, reason: string, opts?: { category?: LoyaltyCategory; autoLevelUp?: boolean }) => void;
  // Remove points from a user's spendable balance (admin correction).
  deductLoyaltyPointsForAdmin: (userId: string, points: number, reason: string) => boolean;
  // Customer club bonus for submitting a review.
  awardReviewPoints: () => void;
  // Redeem a reward for a user — debits the spendable balance and logs the transaction.
  redeemLoyaltyReward: (userId: string, rewardId: string) => { ok: boolean; error?: string };
  // Manually set a user's tier from the admin panel.
  setUserLevel: (userId: string, level: User['level']) => void;
  // Badges earned by a user, evaluated live against the admin badge definitions.
  getEarnedBadges: (user: User) => { def: GamificationBadgeDef; earned: boolean; progress: number }[];
  contentProjects: ContentProject[];
  setContentProjects: (p: ContentProject[]) => void;
  contentComments: ContentComment[];
  setContentComments: (c: ContentComment[]) => void;
  contentAssets: ContentAsset[];
  setContentAssets: (a: ContentAsset[]) => void;
  contentTemplates: ContentTemplate[];
  setContentTemplates: (t: ContentTemplate[]) => void;
  contentIdeas: ContentIdea[];
  setContentIdeas: (i: ContentIdea[]) => void;
  brandBook: BrandBook;
  setBrandBook: (b: BrandBook) => void;
  permissions: Permission[];
  setPermissions: (p: Permission[]) => void;
  roles: Role[];
  setRoles: (r: Role[]) => void;
  systemUsers: SystemUser[];
  setSystemUsers: (u: SystemUser[]) => void;
  // The SystemUser record that the current admin session was created from
  currentAdminId?: string;
  // Permissions of the logged-in admin (all permissions when undefined / super admin)
  userPermissions?: string[];
  hasPermission: (permId: string) => boolean;
  // Route-level access check used by the admin sidebar and router guards
  canAccessPage: (permIds?: string[]) => boolean;
  // Creates a staff account in the RBAC section and keeps it usable for login
  createStaffUser: (data: { username: string; password: string; name: string; roleId: string; email?: string; phone?: string }) => { ok: boolean; error?: string };
  okrs: OKR[];
  setOkrs: (o: OKR[]) => void;
  kpis: KPI[];
  setKpis: (k: KPI[]) => void;
  digitalMarketingData: DigitalMarketingData;
  setDigitalMarketingData: (d: DigitalMarketingData) => void;
  affiliates: Affiliate[];
  setAffiliates: (a: Affiliate[]) => void;
  affiliateOrders: AffiliateOrder[];
  setAffiliateOrders: (o: AffiliateOrder[]) => void;
  affiliateTransactions: AffiliateTransaction[];
  setAffiliateTransactions: (t: AffiliateTransaction[]) => void;
  personas: Persona[];
  setPersonas: (p: Persona[]) => void;
  // ---- Admin notifications (سیستم اعلان پنل مدیریت) ----
  // Every notification has its own type and each type renders with its own color.
  notifications: AdminNotification[];
  setNotifications: (n: AdminNotification[]) => void;
  unreadNotificationsCount: number;
  // Push a colored notification into the bell / list (deduped by `key`).
  pushNotification: (input: { type: NotificationType; title: string; message: string; link?: string; priority?: NotificationPriority; key?: string }) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  clearReadNotifications: () => void;
}

// ---------------------------------------------------------------------------
// Admin panel notification system (سیستم اعلان پنل مدیریت)
// Every notification carries a `type`, and each type has its OWN dedicated
// color (badge background + text color + dot). The mapping below is the single
// source of truth used by the bell dropdown, the /admin/notifications page and
// the dashboard widget, so colors stay consistent everywhere in the panel.
// ---------------------------------------------------------------------------
export type NotificationType = 'order' | 'ticket' | 'payment' | 'review' | 'stock' | 'user' | 'system' | 'note';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface AdminNotification {
  id: string;
  type: NotificationType;      // decides the notification's own color
  priority: NotificationPriority;
  title: string;
  message: string;
  link?: string;               // in-app route the notification points to
  read: boolean;
  createdAt: string;
}

export const NOTIFICATION_TYPE_META: Record<NotificationType, {
  label: string;
  color: string;   // hex color – used for the colored dot
  badge: string;   // full tailwind classes (light + dark) – the type's own color
}> = {
  order:    { label: 'سفارش جدید',       color: '#2563eb', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  ticket:   { label: 'تیکت پشتیبانی',    color: '#d946ef', badge: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300' },
  payment:  { label: 'پرداخت و مالی',    color: '#16a34a', badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  review:   { label: 'نظر مشتری',        color: '#ca8a04', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  stock:    { label: 'موجودی انبار',     color: '#dc2626', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  user:     { label: 'کاربر جدید',       color: '#ea580c', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  system:   { label: 'سیستمی',           color: '#0891b2', badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
  note:     { label: 'یادداشت کاری',     color: '#7c3aed', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
};

export const NOTIFICATION_PRIORITY_META: Record<NotificationPriority, { label: string; badge: string }> = {
  low:    { label: 'کم',    badge: 'bg-gray-100 text-gray-600 dark:bg-slate-700/60 dark:text-slate-300' },
  normal: { label: 'عادی',  badge: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300' },
  high:   { label: 'مهم',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  urgent: { label: 'فوری',  badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

export interface SocialMedia {
  id: string;
  name: string;
  url: string;
  icon: string;
  handle: string;
}

export interface AboutContent {
  description: string;
  licenseImage: string;
  trustImages: string[];
  trustVideo: string;
  mission: string;
  vision: string;
  logo: string;
  socialMedia: SocialMedia[];
}

const defaultAbout: AboutContent = {
  description: 'کافی نت همیار با بیش از سال‌ها تجربه در ارائه خدمات دیجیتال، مفتخر است که بهترین خدمات را در زمینه‌های کافی نت، کپی مدیا، فروش محصولات دیجیتال و طراحی وب‌سایت ارائه دهد. ما با تیمی متخصص و مجرب، همواره در تلاشیم تا نیازهای دیجیتال شما را به بهترین شکل ممکن برآورده سازیم.',
  licenseImage: '',
  trustImages: [],
  trustVideo: '',
  mission: 'ارائه خدمات دیجیتال با کیفیت بالا و قیمت مناسب برای تمامی مشتریان',
  vision: 'تبدیل شدن به مرجع اصلی خدمات دیجیتال در منطقه',
  logo: '',
  socialMedia: [
    { id: 'sm1', name: 'ایتا', url: 'https://eitaa.com/@hamyar_service1', icon: '', handle: '@hamyar_service1' },
    { id: 'sm2', name: 'روبیکا', url: 'https://rubika.ir/hamyar_service1', icon: '', handle: '@hamyar_service1' },
    { id: 'sm3', name: 'بله', url: 'https://ble.ir/hamyar_service1', icon: '', handle: '@hamyar_service1' },
    { id: 'sm4', name: 'تلگرام', url: 'https://t.me/hamyar_service1', icon: '', handle: '@hamyar_service1' },
    { id: 'sm5', name: 'اینستاگرام', url: 'https://instagram.com/hamyar_service1', icon: '', handle: '@hamyar_service1' },
  ]
};

const initialProducts: Product[] = [
  { id: 'p1', name: 'فلش مموری ۳۲ گیگابایت', brand: 'Samsung', category: 'flash', price: 250000, originalPrice: 300000, stock: 45, image: 'https://image.qwenlm.ai/generated-images/7fc006a3-8c36-4ae3-860f-97820566db79/_result.png', description: 'فلش مموری سامسونگ ۳۲ گیگابایت USB 3.0' },
  { id: 'p2', name: 'فلش مموری ۶۴ گیگابایت', brand: 'Kingston', category: 'flash', price: 380000, stock: 30, image: 'https://image.qwenlm.ai/generated-images/7fc006a3-8c36-4ae3-860f-97820566db79/_result.png', description: 'فلش مموری کینگستون ۶۴ گیگابایت' },
  { id: 'p3', name: 'فلش مموری ۱۲۸ گیگابایت', brand: 'SanDisk', category: 'flash', price: 650000, originalPrice: 720000, stock: 20, image: 'https://image.qwenlm.ai/generated-images/7fc006a3-8c36-4ae3-860f-97820566db79/_result.png', description: 'فلش مموری سندیسک ۱۲۸ گیگابایت USB 3.1' },
  { id: 'p4', name: 'هارد اکسترنال ۱ ترابایت', brand: 'WD', category: 'hard', price: 3200000, stock: 15, image: 'https://image.qwenlm.ai/generated-images/060413c7-f31e-4aea-9840-7038a06e5c62/_result.png', description: 'هارد اکسترنال وسترن دیجیتال ۱ ترابایت' },
  { id: 'p5', name: 'هارد اکسترنال ۲ ترابایت', brand: 'Seagate', category: 'hard', price: 4800000, originalPrice: 5200000, stock: 10, image: 'https://image.qwenlm.ai/generated-images/060413c7-f31e-4aea-9840-7038a06e5c62/_result.png', description: 'هارد اکسترنال سیگیت ۲ ترابایت' },
  { id: 'p6', name: 'کابل USB تایپ سی', brand: 'Baseus', category: 'cable', price: 85000, stock: 100, image: '/images/products/cable1.jpg', description: 'کابل شارژ تایپ سی باسئوس ۱ متری' },
  { id: 'p7', name: 'کابل HDMI ۲ متری', brand: 'Green', category: 'cable', price: 120000, stock: 60, image: '/images/products/cable2.jpg', description: 'کابل HDMI نسخه ۲.۱ گرین' },
  { id: 'p8', name: 'کابل AUX ۱.۵ متری', brand: 'McDodo', category: 'cable', price: 65000, stock: 80, image: '/images/products/cable3.jpg', description: 'کابل AUX مک دودو با کیفیت بالا' },
  { id: 'p9', name: 'شارژر دیواری ۲۵ وات', brand: 'Samsung', category: 'charger', price: 450000, originalPrice: 520000, stock: 25, image: 'https://image.qwenlm.ai/generated-images/99f37013-fa3d-4a99-8f0e-4d246d01dbae/_result.png', description: 'شارژر سریع سامسونگ ۲۵ وات' },
  { id: 'p10', name: 'شارژر فست شارژ ۳۳ وات', brand: 'Xiaomi', category: 'charger', price: 380000, stock: 35, image: '/images/products/charger2.jpg', description: 'شارژر فست شارژ شیائومی ۳۳ وات' },
  { id: 'p11', name: 'پاوربانک ۱۰۰۰۰ میلی‌آمپر', brand: 'Anker', category: 'charger', price: 890000, stock: 18, image: '/images/products/charger3.jpg', description: 'پاوربانک انکر ۱۰۰۰۰ میلی‌آمپر ساعت' },
  { id: 'p12', name: 'دوربین مداربسته تحت شبکه', brand: 'Dahua', category: 'cctv', price: 2800000, stock: 8, image: 'https://image.qwenlm.ai/generated-images/a6f663cb-add1-449e-8288-4cb67b7578be/_result.png', description: 'دوربین مداربسته ۲ مگاپیکسل داهوا' },
  { id: 'p13', name: 'دوربین مداربسته ۴ مگاپیکسل', brand: 'Hikvision', category: 'cctv', price: 3500000, originalPrice: 3900000, stock: 6, image: '/images/products/cctv2.jpg', description: 'دوربین مداربسته هایک‌ویژن ۴ مگاپیکسل' },
  { id: 'p14', name: 'دستگاه DVR ۸ کانال', brand: 'Dahua', category: 'cctv', price: 4200000, stock: 5, image: '/images/products/cctv3.jpg', description: 'دستگاه ضبط ۸ کانال داهوا' },
  { id: 'p15', name: 'دستگاه کارتخوان سیار', brand: 'PAX', category: 'pos', price: 8500000, stock: 3, image: '/images/products/pos1.jpg', description: 'دستگاه پوز سیار PAX با اتصال WiFi' },
  { id: 'p16', name: 'دستگاه کارتخوان ثابت', brand: 'Verifone', category: 'pos', price: 6500000, stock: 4, image: '/images/products/pos2.jpg', description: 'دستگاه پوز ثابت وریفون' },
  { id: 'p17', name: 'موس بی‌سیم', brand: 'Logitech', category: 'accessories', price: 350000, stock: 22, image: '/images/products/mouse1.jpg', description: 'موس بی‌سیم لاجیتک' },
  { id: 'p18', name: 'کیبورد سیم‌دار', brand: 'Green', category: 'accessories', price: 280000, stock: 30, image: '/images/products/keyboard1.jpg', description: 'کیبورد سیم‌دار گرین' },
  { id: 'p19', name: 'هاب USB ۴ پورت', brand: 'Baseus', category: 'accessories', price: 195000, stock: 40, image: '/images/products/hub1.jpg', description: 'هاب USB ۳.۰ باسئوس ۴ پورت' },
  { id: 'p20', name: 'رم ریدر چندکاره', brand: 'Kingston', category: 'accessories', price: 145000, stock: 50, image: '/images/products/reader1.jpg', description: 'رم ریدر کینگستون چندکاره' },
  { id: 'p21', name: 'اس اس دی ۲۴۰ گیگابایت', brand: 'Samsung', category: 'storage', price: 1800000, stock: 12, image: '/images/products/ssd1.jpg', description: 'حافظه SSD سامسونگ ۲۴۰ گیگابایت' },
  { id: 'p22', name: 'اس اس دی ۴۸۰ گیگابایت', brand: 'WD', category: 'storage', price: 2900000, originalPrice: 3200000, stock: 8, image: '/images/products/ssd2.jpg', description: 'حافظه SSD وسترن دیجیتال ۴۸۰ گیگابایت' },
  { id: 'p23', name: 'رم DDR4 ۸ گیگابایت', brand: 'Corsair', category: 'storage', price: 1200000, stock: 15, image: '/images/products/ram1.jpg', description: 'رم ۸ گیگابایت DDR4 کورسیر' },
  { id: 'p24', name: 'هدفون بلوتوثی', brand: 'JBL', category: 'audio', price: 1500000, stock: 14, image: 'https://image.qwenlm.ai/generated-images/c9058f54-8f08-42e9-a6d9-490454530453/_result.png', description: 'هدفون بلوتوثی JBL' },
  { id: 'p25', name: 'اسپیکر بلوتوثی', brand: 'Xiaomi', category: 'audio', price: 680000, stock: 20, image: '/images/products/speaker1.jpg', description: 'اسپیکر بلوتوثی قابل حمل شیائومی' },
  { id: 'p26', name: 'وبکم HD', brand: 'Logitech', category: 'accessories', price: 950000, stock: 10, image: '/images/products/webcam1.jpg', description: 'وبکم لاجیتک Full HD' },
  { id: 'p27', name: 'محافظ صفحه نمایش', brand: 'Generic', category: 'accessories', price: 45000, stock: 200, image: '/images/products/screen1.jpg', description: 'محافظ صفحه نمایش لپ‌تاپ ۱۵.۶ اینچ' },
  { id: 'p28', name: 'تبدیل USB به Type-C', brand: 'Baseus', category: 'cable', price: 55000, stock: 90, image: '/images/products/adapter1.jpg', description: 'تبدیل USB به Type-C باسئوس' },
  { id: 'p29', name: 'فلش مموری OTG', brand: 'SanDisk', category: 'flash', price: 420000, stock: 25, image: '/images/products/flash4.jpg', description: 'فلش مموری OTG سندیسک دوگانه' },
  { id: 'p30', name: 'کابل لایتنینگ', brand: 'Apple', category: 'cable', price: 180000, stock: 45, image: '/images/products/cable4.jpg', description: 'کابل لایتنینگ اورجینال اپل ۱ متری' },
  { id: 'p31', name: 'استند لپ‌تاپ', brand: 'Baseus', category: 'accessories', price: 320000, stock: 16, image: 'https://image.qwenlm.ai/generated-images/34eb17df-2c41-474c-9326-5fad86c9b505/_result.png', description: 'استند آلومینیومی لپ‌تاپ باسئوس' },
  { id: 'p32', name: 'چراغ مطالعه LED', brand: 'Xiaomi', category: 'accessories', price: 450000, stock: 12, image: 'https://image.qwenlm.ai/generated-images/34eb17df-2c41-474c-9326-5fad86c9b505/_result.png', description: 'چراغ مطالعه LED شیائومی با تنظیم نور' },
  { id: 'p33', name: 'اسپیکر بلوتوثی قابل حمل', brand: 'JBL', category: 'audio', price: 1200000, originalPrice: 1400000, stock: 18, image: 'https://image.qwenlm.ai/generated-images/241decc8-b315-4c8d-8cb6-1ed07bd02ef4/_result.png', description: 'اسپیکر بلوتوثی JBL قابل حمل با کیفیت صدای عالی' },
  { id: 'p34', name: 'دستگاه DVR ۸ کانال', brand: 'Dahua', category: 'cctv', price: 4200000, stock: 7, image: 'https://image.qwenlm.ai/generated-images/2cea3915-eb18-4369-8905-d9e3321c0087/_result.png', description: 'دستگاه ضبط ۸ کانال داهوا با کیفیت Full HD' },
  { id: 'p35', name: 'دستگاه کارتخوان سیار', brand: 'PAX', category: 'pos', price: 8500000, stock: 4, image: 'https://image.qwenlm.ai/generated-images/fdb618d2-8785-4a8d-8d3a-6c56588a6aa4/_result.png', description: 'دستگاه پوز سیار PAX با اتصال WiFi و سیم‌کارت' },
  { id: 'p36', name: 'کیبورد مکانیکال گیمینگ', brand: 'Razer', category: 'accessories', price: 2800000, originalPrice: 3200000, stock: 10, image: 'https://image.qwenlm.ai/generated-images/34eb17df-2c41-474c-9326-5fad86c9b505/_result.png', description: 'کیبورد مکانیکال ریزر با نورپردازی RGB' },
  { id: 'p37', name: 'موس گیمینگ بی‌سیم', brand: 'Logitech', category: 'accessories', price: 1800000, stock: 15, image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400', description: 'موس گیمینگ لاجیتک با دقت بالا' },
  { id: 'p38', name: 'هاب USB ۷ پورت', brand: 'Anker', category: 'accessories', price: 450000, stock: 25, image: 'https://images.unsplash.com/photo-1625842268584-8f32a6f4b4cb?w=400', description: 'هاب USB ۳.۰ انکر ۷ پورت با شارژر' },
  { id: 'p39', name: 'کابل شبکه Cat6', brand: 'D-Link', category: 'cable', price: 35000, stock: 200, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', description: 'کابل شبکه Cat6 دیلینک ۳ متری' },
  { id: 'p40', name: 'تبدیل HDMI به VGA', brand: 'Green', category: 'cable', price: 95000, stock: 40, image: 'https://images.unsplash.com/photo-1588508065123-287b3a0b7909?w=400', description: 'تبدیل HDMI به VGA گرین با کیفیت بالا' },
  { id: 'p41', name: 'فلش مموری ۲۵۶ گیگابایت', brand: 'SanDisk', category: 'flash', price: 1200000, originalPrice: 1400000, stock: 12, image: 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400', description: 'فلش مموری سندیسک ۲۵۶ گیگابایت USB 3.1' },
  { id: 'p42', name: 'هارد SSD ۱ ترابایت', brand: 'Samsung', category: 'storage', price: 4500000, stock: 8, image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400', description: 'حافظه SSD سامسونگ ۱ ترابایت NVMe' },
  { id: 'p43', name: 'رم DDR4 ۱۶ گیگابایت', brand: 'Corsair', category: 'storage', price: 2400000, originalPrice: 2800000, stock: 10, image: 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=400', description: 'رم ۱۶ گیگابایت DDR4 کورسیر RGB' },
  { id: 'p44', name: 'هدفون گیمینگ', brand: 'HyperX', category: 'audio', price: 2200000, stock: 12, image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400', description: 'هدفون گیمینگ هایپراکس با میکروفون' },
  { id: 'p45', name: 'وبکم ۴K', brand: 'Logitech', category: 'accessories', price: 3500000, stock: 6, image: 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=400', description: 'وبکم لاجیتک ۴K با autofocus' },
  { id: 'p46', name: 'پد موس گیمینگ', brand: 'SteelSeries', category: 'accessories', price: 280000, stock: 30, image: 'https://images.unsplash.com/photo-161575921A906-a3a1a1a1a1a1?w=400', description: 'پد موس بزرگ استیل‌سریز گیمینگ' },
  { id: 'p47', name: 'شارژر وایرلس', brand: 'Samsung', category: 'charger', price: 650000, originalPrice: 750000, stock: 20, image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f08?w=400', description: 'شارژر بی‌سیم سریع سامسونگ ۱۵ وات' },
  { id: 'p48', name: 'کابل Type-C به Type-C', brand: 'Anker', category: 'cable', price: 120000, stock: 80, image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400', description: 'کابل تایپ سی به تایپ سی انکر ۱ متری' },
  { id: 'p49', name: 'دوربین اکشن', brand: 'GoPro', category: 'accessories', price: 12000000, stock: 3, image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400', description: 'دوربین اکشن گوپرو HERO 11' },
  { id: 'p50', name: 'تریپاد دوربین', brand: 'Manfrotto', category: 'accessories', price: 1800000, stock: 8, image: 'https://images.unsplash.com/photo-1606986628253-49a2b4a7a1a1?w=400', description: 'تریپاد حرفه‌ای مانفراتو' },
  { id: 'p51', name: 'فیلتر لنز UV', brand: 'Hoya', category: 'accessories', price: 450000, stock: 15, image: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=400', description: 'فیلتر UV هویا برای لنز دوربین' },
  { id: 'p52', name: 'کارت حافظه microSD ۱۲۸GB', brand: 'SanDisk', category: 'storage', price: 380000, stock: 35, image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400', description: 'کارت حافظه میکرو SD سندیسک ۱۲۸ گیگابایت' },
  { id: 'p53', name: 'هاب Type-C چندکاره', brand: 'Baseus', category: 'accessories', price: 680000, originalPrice: 780000, stock: 18, image: 'https://images.unsplash.com/photo-1625842268584-8f32a6f4b4cb?w=400', description: 'هاب تایپ سی باسئوس با HDMI و USB' },
  { id: 'p54', name: 'اسپیکر کامپیوتر', brand: 'Logitech', category: 'audio', price: 850000, stock: 14, image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400', description: 'اسپیکر رومیزی لاجیتک ۲.۰' },
  { id: 'p55', name: 'میکروفون USB', brand: 'Blue', category: 'audio', price: 3200000, stock: 7, image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400', description: 'میکروفون USB بلو یتدیگی برای استریم' },
  { id: 'p56', name: 'کیبورد بی‌سیم', brand: 'Logitech', category: 'accessories', price: 1500000, stock: 12, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400', description: 'کیبورد بی‌سیم لاجیتک با تاچ‌پد' },
  { id: 'p57', name: 'محافظ برق', brand: 'APC', category: 'accessories', price: 950000, stock: 10, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', description: 'محافظ برق APC ۶ خروجی' },
  { id: 'p58', name: 'کابل AUX ۳ متری', brand: 'McDodo', category: 'cable', price: 85000, stock: 60, image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400', description: 'کابل AUX مک دودو ۳ متری با کیفیت بالا' },
  { id: 'p59', name: 'پاوربانک ۲۰۰۰۰ میلی‌آمپر', brand: 'Anker', category: 'charger', price: 1600000, originalPrice: 1800000, stock: 15, image: 'https://images.unsplash.com/photo-1609592424808-d9f3f66f3a1a1?w=400', description: 'پاوربانک انکر ۲۰۰۰۰ میلی‌آمپر با فست شارژ' },
  { id: 'p60', name: 'هارد SSD اکسترنال ۵۰۰GB', brand: 'Samsung', category: 'storage', price: 3800000, stock: 9, image: 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400', description: 'هارد SSD اکسترنال سامسونگ ۵۰۰ گیگابایت' },
  { id: 'p61', name: 'دوربین تحت شبکه PTZ', brand: 'Hikvision', category: 'cctv', price: 5500000, stock: 5, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', description: 'دوربین مداربسته PTZ هایک‌ویژن با زوم ۲۵ برابر' },
  { id: 'p62', name: 'دستگاه کارتخوان ثابت', brand: 'Verifone', category: 'pos', price: 6500000, stock: 4, image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400', description: 'دستگاه پوز ثابت وریفون با چاپگر' },
];

const initialMedia: MediaItem[] = [
  { id: 'm1', title: 'Oppenheimer', year: 2023, genre: ['درام', 'تاریخی'], type: 'movie', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '12GB', rating: 8.9, image: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Oppenheimer_2023_film_poster.jpg', description: 'داستان زندگی جی. رابرت اوپنهایمر و نقش او در ساخت بمب اتمی', director: 'Christopher Nolan', country: 'آمریکا', imdb: 8.9 },
  { id: 'm2', title: 'The Shawshank Redemption', year: 1994, genre: ['درام'], type: 'movie', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '8GB', rating: 9.3, image: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/The_Shawshank_Redemption_Poster.jpg', description: 'داستان امید و رستگاری در زندان', director: 'Frank Darabont', country: 'آمریکا', imdb: 9.3 },
  { id: 'm3', title: 'Inception', year: 2010, genre: ['اکشن', 'علمی‌تخیلی'], type: 'movie', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '18GB', rating: 8.8, image: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Inception_2010_Theatrical_Poster.jpg', description: 'دزدی اسرار از طریق ورود به رویا', director: 'Christopher Nolan', country: 'آمریکا', imdb: 8.8 },
  { id: 'm4', title: 'Breaking Bad', year: 2008, genre: ['درام', 'جنایی'], type: 'series', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '120GB', rating: 9.5, image: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Breaking_Bad_title_card.png', description: 'معلم شیمی که به تولید مواد مخدر روی می‌آورد', imdb: 9.5 },
  { id: 'm5', title: 'Game of Thrones', year: 2011, genre: ['فانتزی', 'درام'], type: 'series', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '250GB', rating: 9.2, image: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Game_of_Thrones_Logo.svg', description: 'نبرد خاندان‌های بزرگ بر سر تاج و تخت', imdb: 9.2 },
  { id: 'm6', title: 'Spider-Man: Across the Spider-Verse', year: 2023, genre: ['انیمیشن', 'اکشن'], type: 'animation', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '15GB', rating: 8.7, image: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Spider-Man_Across_the_Spider-Verse_poster.jpg', description: 'ادامه ماجراجویی‌های مرد عنکبوتی در جهان‌های موازی', imdb: 8.7 },
  { id: 'm7', title: 'Attack on Titan', year: 2013, genre: ['اکشن', 'فانتزی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '80GB', rating: 9.0, image: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Attack_on_Titan_logo.png', description: 'انسان‌ها در نبرد با تایتان‌ها برای بقا', imdb: 9.0 },
  { id: 'm8', title: 'Death Note', year: 2006, genre: ['جنایی', 'فراطبیعی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '45GB', rating: 9.0, image: 'https://upload.wikimedia.org/wikipedia/commons/3/39/Death_Note_logo.png', description: 'دانش‌آموزی که با دفترچه مرگ، عدالت را اجرا می‌کند', imdb: 9.0 },
  { id: 'm9', title: 'Interstellar', year: 2014, genre: ['علمی‌تخیلی', 'درام'], type: 'movie', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '20GB', rating: 8.6, image: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Interstellar_film_poster.jpg', description: 'سفر به فضا برای نجات بشریت', director: 'Christopher Nolan', country: 'آمریکا', imdb: 8.6 },
  { id: 'm10', title: 'The Dark Knight', year: 2008, genre: ['اکشن', 'جنایی'], type: 'movie', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '16GB', rating: 9.0, image: 'https://upload.wikimedia.org/wikipedia/commons/8/83/The_Dark_Knight_%282008%29_theatrical_poster.jpg', description: 'بتمن در نبرد با جوکر', director: 'Christopher Nolan', country: 'آمریکا', imdb: 9.0 },
  { id: 'm11', title: 'Stranger Things', year: 2016, genre: ['علمی‌تخیلی', 'ترسناک'], type: 'series', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '180GB', rating: 8.7, image: 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Stranger_Things_logo.png', description: 'ماجراهای کودکان در شهری با اسرار فراطبیعی', imdb: 8.7 },
  { id: 'm12', title: 'Your Name', year: 2016, genre: ['انیمیشن', 'عاشقانه'], type: 'animation', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '8GB', rating: 8.4, image: 'https://upload.wikimedia.org/wikipedia/commons/2/27/Your_Name_poster.jpg', description: 'داستان دو نوجوان که به طرز مرموزی جایشان عوض می‌شود', imdb: 8.4 },
  { id: 'm13', title: 'Demon Slayer', year: 2019, genre: ['اکشن', 'فانتزی'], type: 'anime', quality: '4K', language: 'ژاپنی', subtitle: 'فارسی', volume: '60GB', rating: 8.7, image: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Demon_Slayer_Kimetsu_no_Yaiba_anime_logo.png', description: 'جنگجو جوان در نبرد با شیاطین', imdb: 8.7 },
  { id: 'm14', title: 'The Matrix', year: 1999, genre: ['اکشن', 'علمی‌تخیلی'], type: 'movie', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '10GB', rating: 8.7, image: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/The_Matrix_%281999%29_theatrical_release_poster.jpg', description: 'واقعیت مجازی و نبرد برای آزادی', imdb: 8.7 },
  { id: 'm15', title: 'One Piece', year: 1999, genre: ['ماجراجویی', 'کمدی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '200GB', rating: 8.9, image: 'https://upload.wikimedia.org/wikipedia/commons/0/09/One_Piece_Logo.png', description: 'ماجراجویی دزدان دریایی در جستجوی گنج', imdb: 8.9 },
  { id: 'm16', title: 'Coco', year: 2017, genre: ['انیمیشن', 'خانوادگی'], type: 'animation', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '9GB', rating: 8.4, image: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Coco_2017_poster.jpg', description: 'سفر پسری به سرزمین مردگان', imdb: 8.4 },
  { id: 'm17', title: 'Jujutsu Kaisen', year: 2020, genre: ['اکشن', 'فراطبیعی'], type: 'anime', quality: '4K', language: 'ژاپنی', subtitle: 'فارسی', volume: '50GB', rating: 8.6, image: 'https://upload.wikimedia.org/wikipedia/commons/1/1f/Jujutsu_Kaisen_logo.png', description: 'نبرد با نفرین‌ها و ارواح شیطانی', imdb: 8.6 },
  { id: 'm18', title: 'The Lion King', year: 2019, genre: ['انیمیشن', 'خانوادگی'], type: 'animation', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '11GB', rating: 6.9, image: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/The_Lion_King_2019_poster.jpg', description: 'داستان شیر جوانی که باید پادشاه شود', imdb: 6.9 },
  { id: 'm19', title: 'Money Heist', year: 2017, genre: ['اکشن', 'جنایی'], type: 'series', quality: 'BluRay', language: 'اسپانیایی', subtitle: 'فارسی', volume: '90GB', rating: 8.2, image: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Money_Heist_logo.png', description: 'سرقت بزرگ از ضرابخانه سلطنتی اسپانیا', imdb: 8.2 },
  { id: 'm20', title: 'Naruto Shippuden', year: 2007, genre: ['اکشن', 'ماجراجویی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '180GB', rating: 8.7, image: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Naruto_Shippuuden_logo.png', description: 'ادامه ماجراجویی نینجای جوان', imdb: 8.7 },
  { id: 'm21', title: 'Dune: Part Two', year: 2024, genre: ['علمی‌تخیلی', 'ماجراجویی'], type: 'movie', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '22GB', rating: 8.5, image: 'https://image.qwenlm.ai/generated-images/21475036-63df-412d-bc73-7925aee2e6ad/_result.png', description: 'ادامه حماسه پل آتریدز در سیاره آراکیس', director: 'Denis Villeneuve', country: 'آمریکا', imdb: 8.5 },
  { id: 'm22', title: 'The Godfather', year: 1972, genre: ['جنایی', 'درام'], type: 'movie', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '9GB', rating: 9.2, image: 'https://upload.wikimedia.org/wikipedia/commons/1/18/The_Godfather_1972_poster.jpg', description: 'داستان خانواده مافیایی کورلئونه', director: 'Francis Ford Coppola', country: 'آمریکا', imdb: 9.2 },
  { id: 'm23', title: 'Pulp Fiction', year: 1994, genre: ['جنایی', 'درام'], type: 'movie', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '8GB', rating: 8.9, image: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Pulp_Fiction_%281994%29_theatrical_poster.jpg', description: 'داستان‌های متقاطع از زندگی جنایتکاران', director: 'Quentin Tarantino', country: 'آمریکا', imdb: 8.9 },
  { id: 'm24', title: 'Fight Club', year: 1999, genre: ['درام'], type: 'movie', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '9GB', rating: 8.8, image: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Fight_Club_%281999_film%29_poster.jpg', description: 'مردی که باشگاه مشت‌زنی ایجاد می‌کند', director: 'David Fincher', country: 'آمریکا', imdb: 8.8 },
  { id: 'm25', title: 'Forrest Gump', year: 1994, genre: ['درام', 'عاشقانه'], type: 'movie', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '10GB', rating: 8.8, image: 'https://image.qwenlm.ai/generated-images/6f011290-22da-4dbd-be33-08b0148c39b0/_result.png', description: 'داستان مردی ساده‌دل که در رویدادهای تاریخی شرکت می‌کند', director: 'Robert Zemeckis', country: 'آمریکا', imdb: 8.8 },
  { id: 'm26', title: 'The Lord of the Rings', year: 2001, genre: ['فانتزی', 'ماجراجویی'], type: 'movie', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '25GB', rating: 8.8, image: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/The_Lord_of_the_Rings_-_The_Fellowship_of_the_Ring_%282001%29_theatrical_poster.jpg', description: 'سفر فرودو برای نابودی حلقه', director: 'Peter Jackson', country: 'نیوزیلند', imdb: 8.8 },
  { id: 'm27', title: 'The Avengers', year: 2012, genre: ['اکشن', 'علمی‌تخیلی'], type: 'movie', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '14GB', rating: 8.0, image: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/The_Avengers_%282012_film%29_poster.jpg', description: 'تیم انتقام‌جویان در نبرد با لوکی', director: 'Joss Whedon', country: 'آمریکا', imdb: 8.0 },
  { id: 'm28', title: 'Joker', year: 2019, genre: ['درام', 'جنایی'], type: 'movie', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '12GB', rating: 8.4, image: 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Joker_2019_poster.jpg', description: 'داستان تبدیل شدن آرتور فلک به جوکر', director: 'Todd Phillips', country: 'آمریکا', imdb: 8.4 },
  { id: 'm29', title: 'Parasite', year: 2019, genre: ['درام', 'کمدی'], type: 'movie', quality: 'BluRay', language: 'کره‌ای', subtitle: 'فارسی', volume: '10GB', rating: 8.5, image: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Parasite_%282019_film%29_poster.png', description: 'داستان دو خانواده از طبقات مختلف', director: 'Bong Joon-ho', country: 'کره جنوبی', imdb: 8.5 },
  { id: 'm30', title: 'Whiplash', year: 2014, genre: ['درام', 'موسیقی'], type: 'movie', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '7GB', rating: 8.5, image: 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Whiplash_2014_poster.jpg', description: 'داستان یک درامر جوان و استاد سختگیرش', director: 'Damien Chazelle', country: 'آمریکا', imdb: 8.5 },
  { id: 'm31', title: 'Breaking Bad', year: 2008, genre: ['درام', 'جنایی'], type: 'series', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '150GB', rating: 9.5, image: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Breaking_Bad_title_card.png', description: 'معلم شیمی که به تولید مواد مخدر روی می‌آورد', imdb: 9.5 },
  { id: 'm32', title: 'The Office', year: 2005, genre: ['کمدی'], type: 'series', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '120GB', rating: 9.0, image: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/The_Office_US_logo.png', description: 'کمدی موقعیت در یک دفتر کار', imdb: 9.0 },
  { id: 'm33', title: 'Friends', year: 1994, genre: ['کمدی', 'عاشقانه'], type: 'series', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '140GB', rating: 8.9, image: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Friends_logo.png', description: 'داستان شش دوست در نیویورک', imdb: 8.9 },
  { id: 'm34', title: 'The Witcher', year: 2019, genre: ['فانتزی', 'اکشن'], type: 'series', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '100GB', rating: 8.2, image: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/The_Witcher_logo.png', description: 'ماجراهای یک شکارچی هیولا', imdb: 8.2 },
  { id: 'm35', title: 'Peaky Blinders', year: 2013, genre: ['جنایی', 'درام'], type: 'series', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '90GB', rating: 8.8, image: 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Peaky_Blinders_logo.png', description: 'داستان یک خانواده گنگستر در بیرمنگام', imdb: 8.8 },
  { id: 'm36', title: 'Spirited Away', year: 2001, genre: ['انیمیشن', 'فانتزی'], type: 'animation', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '7GB', rating: 8.6, image: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Spirited_Away_poster.jpg', description: 'سفر دختری به سرزمین ارواح', director: 'Hayao Miyazaki', country: 'ژاپن', imdb: 8.6 },
  { id: 'm37', title: 'Toy Story', year: 1995, genre: ['انیمیشن', 'خانوادگی'], type: 'animation', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '5GB', rating: 8.3, image: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Toy_Story_%281995%29_theatrical_poster.jpg', description: 'ماجراجویی اسباب‌بازی‌ها', director: 'John Lasseter', country: 'آمریکا', imdb: 8.3 },
  { id: 'm38', title: 'Frozen', year: 2013, genre: ['انیمیشن', 'خانوادگی'], type: 'animation', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '8GB', rating: 7.4, image: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Frozen_%282013_film%29_poster.jpg', description: 'داستان دو خواهر با قدرت‌های جادویی', imdb: 7.4 },
  { id: 'm39', title: 'Zootopia', year: 2016, genre: ['انیمیشن', 'کمدی'], type: 'animation', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '7GB', rating: 8.0, image: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Zootopia_poster.jpg', description: 'ماجراجویی یک خرگوش پلیس در شهری از حیوانات', imdb: 8.0 },
  { id: 'm40', title: 'Fullmetal Alchemist', year: 2003, genre: ['اکشن', 'فانتزی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '70GB', rating: 8.5, image: 'https://image.qwenlm.ai/generated-images/1fc6fd82-0b3d-4ba2-976c-9ff066376c33/_result.png', description: 'دو برادر در جستجوی سنگ جادو', imdb: 8.5 },
  { id: 'm41', title: 'Dragon Ball Z', year: 1989, genre: ['اکشن', 'ماجراجویی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '150GB', rating: 8.8, image: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Dragon_Ball_Z_logo.png', description: 'ماجراهای گوکو و دوستانش', imdb: 8.8 },
  { id: 'm42', title: 'Bleach', year: 2004, genre: ['اکشن', 'فراطبیعی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '140GB', rating: 8.2, image: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Bleach_logo.png', description: 'دانش‌آموزی که قدرت شینیگامی به دست می‌آورد', imdb: 8.2 },
  { id: 'm43', title: 'My Hero Academia', year: 2016, genre: ['اکشن', 'فانتزی'], type: 'anime', quality: '4K', language: 'ژاپنی', subtitle: 'فارسی', volume: '60GB', rating: 8.4, image: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/My_Hero_Academia_logo.png', description: 'پسری بدون قدرت در دنیایی از ابرقهرمانان', imdb: 8.4 },
  { id: 'm44', title: 'One Punch Man', year: 2015, genre: ['اکشن', 'کمدی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '40GB', rating: 8.7, image: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/One_Punch_Man_logo.png', description: 'قهرمانی که با یک مشت دشمنان را شکست می‌دهد', imdb: 8.7 },
  { id: 'm45', title: 'Tokyo Ghoul', year: 2014, genre: ['اکشن', 'ترسناک'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '45GB', rating: 7.8, image: 'https://upload.wikimedia.org/wikipedia/commons/7/74/Tokyo_Ghoul_logo.png', description: 'دانشجویی که به نیمه غول تبدیل می‌شود', imdb: 7.8 },
  { id: 'm46', title: 'Sword Art Online', year: 2012, genre: ['اکشن', 'علمی‌تخیلی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '50GB', rating: 7.5, image: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Sword_Art_Online_logo.png', description: 'بازیکنانی که در یک بازی آنلاین گیر افتاده‌اند', imdb: 7.5 },
  { id: 'm47', title: 'Hunter x Hunter', year: 2011, genre: ['اکشن', 'ماجراجویی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '130GB', rating: 9.0, image: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Hunter_x_Hunter_logo.png', description: 'ماجراجویی یک شکارچی جوان', imdb: 9.0 },
  { id: 'm48', title: 'Steins;Gate', year: 2011, genre: ['علمی‌تخیلی', 'درام'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '35GB', rating: 9.1, image: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Steins_Gate_logo.png', description: 'داستان سفر در زمان و پیامدهای آن', imdb: 9.1 },
  { id: 'm49', title: 'Code Geass', year: 2006, genre: ['اکشن', 'علمی‌تخیلی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '55GB', rating: 8.7, image: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Code_Geass_logo.png', description: 'پسری با قدرت کنترل ذهن در نبرد علیه امپراتوری', imdb: 8.7 },
  { id: 'm50', title: 'Cowboy Bebop', year: 1998, genre: ['اکشن', 'علمی‌تخیلی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '40GB', rating: 8.9, image: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Cowboy_Bebop_logo.png', description: 'ماجراهای شکارچیان جایزه‌بگیر در فضا', imdb: 8.9 },
];

const initialServices: Service[] = [
  { id: 's1', name: 'پرینت سیاه و سفید A4', category: 'پرینت', basePrice: 2000, unit: 'برگ', description: 'پرینت سیاه و سفید روی کاغذ A4', active: true },
  { id: 's2', name: 'پرینت رنگی A4', category: 'پرینت', basePrice: 5000, unit: 'برگ', description: 'پرینت رنگی با کیفیت بالا', active: true },
  { id: 's3', name: 'پرینت عکس ۱۰×۱۵', category: 'پرینت', basePrice: 8000, unit: 'عدد', description: 'چاپ عکس در ابعاد ۱۰ در ۱۵', active: true },
  { id: 's4', name: 'اسکن سند', category: 'اسکن', basePrice: 5000, unit: 'برگ', description: 'اسکن با کیفیت ۳۰۰ DPI', active: true },
  { id: 's5', name: 'اسکن عکس', category: 'اسکن', basePrice: 10000, unit: 'عدد', description: 'اسکن عکس با کیفیت بالا', active: true },
  { id: 's6', name: 'تایپ فارسی', category: 'تایپ', basePrice: 15000, unit: 'صفحه', description: 'تایپ متن فارسی در Word', active: true },
  { id: 's7', name: 'تایپ انگلیسی', category: 'تایپ', basePrice: 20000, unit: 'صفحه', description: 'تایپ متن انگلیسی', active: true },
  { id: 's8', name: 'ترجمه فارسی به انگلیسی', category: 'ترجمه', basePrice: 50000, unit: 'صفحه', description: 'ترجمه تخصصی فارسی به انگلیسی', active: true },
  { id: 's9', name: 'ترجمه انگلیسی به فارسی', category: 'ترجمه', basePrice: 45000, unit: 'صفحه', description: 'ترجمه تخصصی انگلیسی به فارسی', active: true },
  { id: 's10', name: 'ثبت‌نام اینترنتی', category: 'ثبت‌نام', basePrice: 30000, unit: 'مورد', description: 'ثبت‌نام در سایت‌های دولتی و دانشگاهی', active: true },
  { id: 's11', name: 'طراحی رزومه', category: 'رزومه', basePrice: 80000, unit: 'مورد', description: 'طراحی رزومه حرفه‌ای', active: true },
  { id: 's12', name: 'ویرایش رزومه', category: 'رزومه', basePrice: 40000, unit: 'مورد', description: 'ویرایش و بهینه‌سازی رزومه', active: true },
  { id: 's13', name: 'کپی فایل روی فلش', category: 'کپی', basePrice: 10000, unit: 'فایل', description: 'کپی فایل‌ها روی فلش مموری', active: true },
  { id: 's14', name: 'نصب ویندوز', category: 'نصب', basePrice: 100000, unit: 'مورد', description: 'نصب ویندوز ۱۰ یا ۱۱', active: true },
  { id: 's15', name: 'نصب نرم‌افزار', category: 'نصب', basePrice: 30000, unit: 'نرم‌افزار', description: 'نصب نرم‌افزارهای کاربردی', active: true },
  { id: 's16', name: 'فتوکپی', category: 'کپی', basePrice: 3000, unit: 'برگ', description: 'فتوکپی اسناد و مدارک', active: true },
  { id: 's17', name: 'لمینت A4', category: 'لمینت', basePrice: 15000, unit: 'برگ', description: 'لمینت کردن اسناد A4', active: true },
  { id: 's18', name: 'صحافی', category: 'صحافی', basePrice: 25000, unit: 'مورد', description: 'صحافی پایان‌نامه و جزوه', active: true },
  { id: 's19', name: 'ساخت پاورپوینت', category: 'ارائه', basePrice: 60000, unit: 'اسلاید', description: 'طراحی اسلاید حرفه‌ای', active: true },
  { id: 's20', name: 'تبدیل فرمت فایل', category: 'تبدیل', basePrice: 10000, unit: 'فایل', description: 'تبدیل فرمت فایل‌های مختلف', active: true },
  { id: 's21', name: 'ثبت‌نام آزمون سراسری', category: 'ثبت‌نام', basePrice: 50000, unit: 'مورد', description: 'ثبت‌نام آنلاین در آزمون‌های سراسری، ارشد و دکتری', active: true },
  { id: 's22', name: 'خدمات نظام وظیفه', category: 'نظام وظیفه', basePrice: 35000, unit: 'مورد', description: 'ثبت درخواست، تعیین وضعیت و پیگیری امور نظام وظیفه', active: true },
  { id: 's23', name: 'ثبت‌نام کنکور', category: 'ثبت‌نام', basePrice: 60000, unit: 'مورد', description: 'ثبت‌نام و ویرایش اطلاعات کنکور سراسری', active: true },
  { id: 's24', name: 'خدمات ثنا (قوه قضاییه)', category: 'قوه قضاییه', basePrice: 45000, unit: 'مورد', description: 'ثبت‌نام و احراز هویت در سامانه ثنا', active: true },
  { id: 's25', name: 'پرینت و اسکن اسناد', category: 'پرینت', basePrice: 5000, unit: 'برگ', description: 'پرینت رنگی و سیاه‌وسفید، اسکن با کیفیت بالا', active: true },
  { id: 's26', name: 'ترجمه رسمی', category: 'ترجمه', basePrice: 150000, unit: 'صفحه', description: 'ترجمه رسمی اسناد با مهر مترجم', active: true },
  { id: 's27', name: 'امور مالیاتی', category: 'مالیاتی', basePrice: 80000, unit: 'مورد', description: 'تشکیل پرونده مالیاتی، ارسال اظهارنامه و پیگیری', active: true },
  { id: 's28', name: 'بیمه شخص ثالث', category: 'بیمه', basePrice: 40000, unit: 'مورد', description: 'صدور و تمدید بیمه‌نامه شخص ثالث خودرو', active: true },
  { id: 's29', name: 'شارژ و بسته اینترنت', category: 'شارژ', basePrice: 10000, unit: 'مورد', description: 'خرید شارژ و بسته اینترنت تمامی اپراتورها', active: true },
  { id: 's30', name: 'پلیس +۱۰', category: 'پلیس +۱۰', basePrice: 55000, unit: 'مورد', description: 'خدمات گذرنامه، گواهینامه و کارت پایان خدمت', active: true },
  { id: 's31', name: 'تایپ و صفحه‌آرایی', category: 'تایپ', basePrice: 10000, unit: 'صفحه', description: 'تایپ حرفه‌ای متون، پایان‌نامه و صفحه‌آرایی', active: true },
  { id: 's32', name: 'سهام عدالت', category: 'مالی', basePrice: 25000, unit: 'مورد', description: 'مشاهده، فروش و مدیریت سهام عدالت', active: true },
  { id: 's33', name: 'افتتاح حساب بانکی', category: 'بانکی', basePrice: 30000, unit: 'مورد', description: 'افتتاح حساب آنلاین در بانک‌های مختلف', active: true },
  { id: 's34', name: 'بیمه عمر و زندگی', category: 'بیمه', basePrice: 50000, unit: 'مورد', description: 'صدور بیمه‌نامه عمر و زندگی', active: true },
  { id: 's35', name: 'ترجمه غیررسمی', category: 'ترجمه', basePrice: 50000, unit: 'صفحه', description: 'ترجمه متون و اسناد غیررسمی', active: true },
  { id: 's36', name: 'گواهی عدم سوءپیشینه', category: 'قوه قضاییه', basePrice: 60000, unit: 'مورد', description: 'دریافت گواهی عدم سوءپیشینه کیفری', active: true },
  { id: 's37', name: 'تنظیم قرارداد', category: 'حقوقی', basePrice: 100000, unit: 'مورد', description: 'تنظیم و نگارش انواع قراردادها', active: true },
  { id: 's38', name: 'پرداخت قبوض', category: 'قبوض', basePrice: 5000, unit: 'قبض', description: 'پرداخت قبض آب، برق، گاز و تلفن', active: true },
  { id: 's39', name: 'اظهارنامه مالیاتی', category: 'مالیاتی', basePrice: 150000, unit: 'مورد', description: 'تنظیم و ارسال اظهارنامه مالیاتی', active: true },
  { id: 's40', name: 'ثبت نام کارت سوخت', category: 'ثبت‌نام', basePrice: 40000, unit: 'مورد', description: 'درخواست صدور کارت سوخت المثنی', active: true },
  { id: 's41', name: 'انتخاب رشته کنکور', category: 'مشاوره', basePrice: 80000, unit: 'مورد', description: 'مشاوره و انتخاب رشته دانشگاه', active: true },
  { id: 's42', name: 'بیمه مسافرتی', category: 'بیمه', basePrice: 35000, unit: 'مورد', description: 'صدور بیمه‌نامه مسافرتی خارجی', active: true },
  { id: 's43', name: 'وکالت‌نامه رسمی', category: 'حقوقی', basePrice: 120000, unit: 'مورد', description: 'تنظیم و ثبت وکالت‌نامه رسمی', active: true },
  { id: 's44', name: 'سیم‌کارت دائمی', category: 'مخابرات', basePrice: 45000, unit: 'مورد', description: 'خرید و انتقال سیم‌کارت دائمی', active: true },
  { id: 's45', name: 'طراحی سایت', category: 'طراحی', basePrice: 500000, unit: 'پروژه', description: 'طراحی و راه‌اندازی وب‌سایت', active: true },
  { id: 's46', name: 'صحافی و شیرازه', category: 'صحافی', basePrice: 20000, unit: 'مورد', description: 'صحافی پایان‌نامه، کتاب و اسناد', active: true },
  { id: 's47', name: 'ثبت نام یارانه', category: 'ثبت‌نام', basePrice: 20000, unit: 'مورد', description: 'ثبت‌نام و ویرایش اطلاعات یارانه', active: true },
  { id: 's48', name: 'وام بانکی', category: 'بانکی', basePrice: 70000, unit: 'مورد', description: 'درخواست و پیگیری وام بانکی', active: true },
  { id: 's49', name: 'بیمه آتش‌سوزی', category: 'بیمه', basePrice: 40000, unit: 'مورد', description: 'صدور بیمه‌نامه آتش‌سوزی منزل و محل کار', active: true },
  { id: 's50', name: 'ترجمه فوری', category: 'ترجمه', basePrice: 200000, unit: 'صفحه', description: 'ترجمه فوری اسناد و متون', active: true },
  { id: 's51', name: 'گواهی حصر وراثت', category: 'حقوقی', basePrice: 90000, unit: 'مورد', description: 'دریافت گواهی حصر وراثت', active: true },
  { id: 's52', name: 'فرم‌های اداری', category: 'اداری', basePrice: 15000, unit: 'فرم', description: 'تکمیل انواع فرم‌های اداری و دولتی', active: true },
  { id: 's53', name: 'قبض موبایل', category: 'قبوض', basePrice: 3000, unit: 'قبض', description: 'پرداخت قبض سیم‌کارت دائمی', active: true },
  { id: 's54', name: 'مالیات بر ارزش افزوده', category: 'مالیاتی', basePrice: 120000, unit: 'مورد', description: 'تنظیم و ارسال اظهارنامه ارزش افزوده', active: true },
  { id: 's55', name: 'ثبت نام حج', category: 'ثبت‌نام', basePrice: 50000, unit: 'مورد', description: 'ثبت‌نام کاروان‌های حج و زیارت', active: true },
  { id: 's56', name: 'ثبت نام مدرسه', category: 'ثبت‌نام', basePrice: 25000, unit: 'مورد', description: 'ثبت‌نام آنلاین مدارس', active: true },
  { id: 's57', name: 'بیمه بدنه خودرو', category: 'بیمه', basePrice: 45000, unit: 'مورد', description: 'صدور بیمه‌نامه بدنه خودرو', active: true },
  { id: 's58', name: 'شکایت کیفری', category: 'حقوقی', basePrice: 150000, unit: 'مورد', description: 'تنظیم و ثبت شکایت کیفری', active: true },
  { id: 's59', name: 'اینترنت ADSL', category: 'مخابرات', basePrice: 35000, unit: 'مورد', description: 'درخواست و راه‌اندازی اینترنت ADSL', active: true },
  { id: 's60', name: 'ساخت ایمیل سازمانی', category: 'مخابرات', basePrice: 60000, unit: 'ایمیل', description: 'ایجاد ایمیل حرفه‌ای با دامنه اختصاصی', active: true },
  { id: 's61', name: 'ثبت‌نام سرویس اینترنت آسیاتک', category: 'مخابرات', basePrice: 50000, unit: 'مورد', description: 'ثبت‌نام، فعال‌سازی و انتقال سرویس ADSL/VDSL/فیبر نوری آسیاتک', active: true },
];

const initialNews: NewsItem[] = [
  { id: 'n1', title: 'تخفیف ویژه خدمات پرینت در هفته آینده', image: 'https://image.qwenlm.ai/generated-images/ede366be-a6af-45f7-8274-ac1743efffc0/_result.png', caption: 'به مناسبت آغاز سال تحصیلی جدید', content: 'کافی نت همیار به مناسبت آغاز سال تحصیلی جدید، تخفیف ۲۰ درصدی بر روی تمامی خدمات پرینت ارائه می‌دهد. این تخفیف از تاریخ ۱ مهر تا ۷ مهر اعمال خواهد شد.', date: '1403/07/01', active: true },
  { id: 'n2', title: 'اضافه شدن خدمات جدید ترجمه تخصصی', image: 'https://image.qwenlm.ai/generated-images/8648f349-9c19-4b40-92a3-de6ca40c1788/_result.png', caption: 'ترجمه متون تخصصی', content: 'خدمات ترجمه تخصصی در حوزه‌های حقوقی، پزشکی و فنی به مجموعه خدمات کافی نت همیار اضافه شد.', date: '1403/06/15', active: true },
  { id: 'n3', title: 'جشنواره فروش محصولات دیجیتال', image: 'https://image.qwenlm.ai/generated-images/3965d39e-6efc-4ac9-a8f7-4bfe21f41498/_result.png', caption: 'تخفیف‌های ویژه', content: 'جشنواره فروش محصولات دیجیتال با تخفیف‌های ویژه تا ۳۰ درصد. فلش مموری، هارد اکسترنال و لوازم جانبی.', date: '1403/06/01', active: true },
  { id: 'n4', title: 'راه‌اندازی خدمات بیمه آنلاین', image: 'https://image.qwenlm.ai/generated-images/0d2bd864-b264-4214-960f-2d0445cc2564/_result.png', caption: 'صدور انواع بیمه‌نامه', content: 'خدمات صدور بیمه‌نامه شخص ثالث، بدنه، عمر و مسافرتی به صورت آنلاین در کافی نت همیار راه‌اندازی شد. شما می‌توانید بدون مراجعه حضوری، بیمه‌نامه خود را دریافت کنید.', date: '1403/07/10', active: true },
  { id: 'n5', title: 'خدمات جدید ثبت‌نام کنکور ۱۴۰۴', image: 'https://image.qwenlm.ai/generated-images/f5d75da2-b091-46a2-b492-82c1384eb38b/_result.png', caption: 'ثبت‌نام کنکور سراسری', content: 'ثبت‌نام کنکور سراسری ۱۴۰۴ آغاز شد. کافی نت همیار با تیم مجرب خود، خدمات ثبت‌نام، ویرایش اطلاعات و انتخاب رشته را با بهترین کیفیت ارائه می‌دهد.', date: '1403/07/15', active: true },
  { id: 'n6', title: 'تخفیف ویژه طراحی سایت', image: 'https://image.qwenlm.ai/generated-images/a5fbf7ed-6e13-4c6d-b26f-0ea4e4aad486/_result.png', caption: 'طراحی سایت با ۲۰٪ تخفیف', content: 'به مناسبت پایان سال، کافی نت همیار تخفیف ۲۰ درصدی بر روی تمامی خدمات طراحی سایت ارائه می‌دهد. این فرصت را از دست ندهید!', date: '1403/07/20', active: true },
  { id: 'n7', title: 'اضافه شدن خدمات مالیاتی', image: 'https://image.qwenlm.ai/generated-images/a8ff0cc2-f5fb-46c8-b6a2-d9f9df21479c/_result.png', caption: 'امور مالیاتی و اظهارنامه', content: 'خدمات تشکیل پرونده مالیاتی، تنظیم و ارسال اظهارنامه و پیگیری امور مالیاتی به مجموعه خدمات کافی نت همیار اضافه شد.', date: '1403/07/25', active: true },
  { id: 'n8', title: 'جشنواره پایان سال محصولات', image: 'https://image.qwenlm.ai/generated-images/dcb65c22-070f-4dcf-9d16-fd2c708cca52/_result.png', caption: 'تخفیف‌های ویژه پایان سال', content: 'جشنواره پایان سال با تخفیف‌های ویژه تا ۴۰ درصد بر روی تمامی محصولات دیجیتال. فلش مموری، هارد، شارژر و لوازم جانبی با بهترین قیمت.', date: '1403/08/01', active: true },
];

const initialPortfolio: PortfolioItem[] = [
  { id: 'pf1', title: 'فروشگاه آنلاین دیجیکالا نمونه', description: 'طراحی فروشگاه اینترنتی با امکانات کامل شامل سبد خرید، پرداخت آنلاین و پنل مدیریت', image: 'https://image.qwenlm.ai/generated-images/426c6503-cf69-4a4a-b147-6e8a955299c2/_result.png', link: 'https://example.com', type: 'فروشگاهی', technologies: ['React', 'Node.js', 'MongoDB'] },
  { id: 'pf2', title: 'سایت شرکتی بازرگانی', description: 'طراحی سایت شرکتی با بخش معرفی خدمات، نمونه‌کارها و فرم تماس', image: 'https://image.qwenlm.ai/generated-images/1e8a34d4-89f4-4c92-a5d2-c699f73c6be3/_result.png', link: 'https://example.com', type: 'شرکتی', technologies: ['Next.js', 'Tailwind CSS'] },
  { id: 'pf3', title: 'سایت رستوران', description: 'طراحی سایت رستوران با منوی آنلاین و سیستم رزرو میز', image: 'https://image.qwenlm.ai/generated-images/6b0b64c2-d847-4446-bddd-975118ecdc99/_result.png', link: 'https://example.com', type: 'شخصی', technologies: ['WordPress', 'PHP'] },
  { id: 'pf4', title: 'پلتفرم آموزش آنلاین', description: 'طراحی سایت آموزش آنلاین با سیستم ویدئو، آزمون و گواهینامه', image: 'https://image.qwenlm.ai/generated-images/821f9d55-71eb-4f81-888e-e498e92d5f6d/_result.png', link: 'https://example.com', type: 'فروشگاهی', technologies: ['React', 'Django', 'PostgreSQL'] },
  { id: 'pf5', title: 'سایت املاک', description: 'طراحی سایت املاک با جستجوی پیشرفته و نمایش نقشه', image: 'https://image.qwenlm.ai/generated-images/d8b4badf-955c-4dee-8a50-8e1da4baed91/_result.png', link: 'https://example.com', type: 'شرکتی', technologies: ['Vue.js', 'Laravel', 'MySQL'] },
  { id: 'pf6', title: 'اپلیکیشن مدیریت پروژه', description: 'طراحی داشبورد مدیریت پروژه با امکانات تسک، تقویم و گزارش', image: 'https://image.qwenlm.ai/generated-images/426c6503-cf69-4a4a-b147-6e8a955299c2/_result.png', link: 'https://example.com', type: 'شرکتی', technologies: ['React', 'Express', 'MongoDB'] },
  { id: 'pf7', title: 'سایت پزشکی', description: 'طراحی سایت کلینیک پزشکی با سیستم نوبت‌دهی آنلاین', image: 'https://image.qwenlm.ai/generated-images/1e8a34d4-89f4-4c92-a5d2-c699f73c6be3/_result.png', link: 'https://example.com', type: 'شخصی', technologies: ['Next.js', 'Node.js', 'PostgreSQL'] },
  { id: 'pf8', title: 'فروشگاه لباس', description: 'طراحی فروشگاه آنلاین لباس با فیلتر پیشرفته و سبد خرید', image: 'https://image.qwenlm.ai/generated-images/6b0b64c2-d847-4446-bddd-975118ecdc99/_result.png', link: 'https://example.com', type: 'فروشگاهی', technologies: ['React', 'Shopify', 'Tailwind CSS'] },
];

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('hamyar_dark');
    return saved === 'true';
  });
  // Customer sessions are restored from a dedicated key + the authoritative
  // users list (see CustomerSession above). Admin sessions keep using the
  // legacy 'hamyar_user' snapshot because they embed RBAC permissions that
  // only exist in the session object.
  //
  // All customer-session bootstrapping happens inside a single lazy state
  // initializer: the one-time identity migration runs FIRST (merging duplicate
  // accounts and re-pointing orphaned tickets/orders), then the healed users
  // list and session are read. Doing the work in one place removes the old
  // write-ordering race between the `currentUser` and `users` initializers
  // that used to make tickets disappear after logout/refresh.
  const initialCustomerSessionRef = { current: null as User | null };
  const bootstrapCustomerState = () => {
    let healedUsers: User[] | null = null;
    try {
      if (!localStorage.getItem(IDENTITY_MIGRATION_KEY)) {
        const report = runIdentityMigration();
        if (report.users.length) healedUsers = report.users;
      }
    } catch { /* storage unavailable — continue with the raw lists */ }

    const loadUsers = (): User[] => {
      if (healedUsers) return healedUsers;
      try {
        const saved = localStorage.getItem('hamyar_users');
        return saved ? (JSON.parse(saved) as User[]) : [];
      } catch { return []; }
    };

    const stripLegacySessionPoints = (u: User | null): User | null => {
      // Strip legacy hard-coded points from the live session as well (one-time).
      if (!u || localStorage.getItem(GAMIFICATION_RESET_KEY)) return u;
      if (u.role !== 'customer') return u;
      if (!(u.loyaltyPoints || 0) && !(u.totalEarnedPoints || 0) && !u.loginStreak && !u.lastLoginStreakDate) return u;
      return { ...u, loyaltyPoints: 0, totalEarnedPoints: 0, loginStreak: undefined, lastLoginStreakDate: undefined, level: 'normal' };
    };

    const restoreCustomerSession = (): User | null => {
      try {
        const all = loadUsers();
        // Preferred identity: written by the migration above / login flow.
        // It survives even when the session snapshot itself got lost.
        const identity = readCachedIdentity();
        let s: CustomerSession | null = null;
        const raw = localStorage.getItem(CUSTOMER_SESSION_KEY);
        if (raw) {
          const parsedS: CustomerSession = JSON.parse(raw);
          if (parsedS && parsedS.id && parsedS.phone) s = parsedS;
        }
        if (!s && identity) {
          const acc = all.find(u => u.id === identity.id && u.role === 'customer');
          s = { id: identity.id, phone: identity.phone, name: acc?.name || '' };
        }
        if (!s) return null;
        // Canonicalise the session id against the healed users list first:
        // prefer the exact account, then the oldest account with the same
        // phone, then the identity cache. This guarantees the restored
        // session always owns the (re-pointed) tickets of that customer.
        const account =
          all.find(u => u.id === s!.id && u.role === 'customer') ||
          (s.phone ? all.filter(u => u.role === 'customer' && u.phone === s!.phone)
            .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))[0] : undefined) ||
          (identity ? all.find(u => u.id === identity.id && u.role === 'customer') : undefined);
        const canonicalId = account?.id || (identity && identity.phone === s.phone ? identity.id : s.id);
        if (account) {
          const restored = { ...account, id: canonicalId, name: s.name || account.name };
          initialCustomerSessionRef.current = restored;
          return restored;
        }
        const rebuilt: User = {
          id: canonicalId, username: s.phone, password: '', role: 'customer',
          name: s.name, phone: s.phone, loyaltyPoints: 0, totalEarnedPoints: 0,
          level: 'normal', favorites: [], selectedMedia: [], createdAt: new Date().toISOString(),
        };
        initialCustomerSessionRef.current = rebuilt;
        return rebuilt;
      } catch { return null; }
    };

    let session: User | null = restoreCustomerSession();
    if (!session) {
      const saved = localStorage.getItem('hamyar_user');
      const parsed: User | null = saved ? JSON.parse(saved) : null;
      // Legacy migration: previous builds saved the whole session under
      // 'hamyar_user' and generated a brand-new id on every login, which
      // orphaned tickets after logout/refresh. Adopt the stable session now.
      if (parsed && parsed.role === 'customer') {
        try {
          const migrated = migrateLegacyCustomerSession(loadUsers());
          if (migrated) {
            session = stripLegacySessionPoints({ ...parsed, id: migrated.id, name: migrated.name || parsed.name });
            // Remember the legacy id so `login` keeps using it instead of
            // generating a fresh one for the same person.
            initialCustomerSessionRef.current = session;
          }
        } catch { /* fall through to the plain parsed session */ }
      }
      if (!session) session = stripLegacySessionPoints(parsed);
    } else {
      session = stripLegacySessionPoints(session);
    }

    // ---- Build the users list the provider starts with ----
    let parsed = loadUsers();
    // The live customer session must exist in the users list, otherwise the
    // admin «مشتریان» section never shows the account (and a later write to
    // the list would silently drop the session).
    if (session && session.role === 'customer' && !parsed.some(u => u.id === session!.id)) {
      parsed = [...parsed, { ...session }];
    }
    // One-time cleanup of the old hard-coded loyalty balances (see stripLegacyLoyalty).
    const finalUsers = localStorage.getItem(GAMIFICATION_RESET_KEY) ? parsed : stripLegacyLoyalty(parsed);
    return { session, users: finalUsers };
  };
  const initialCustomerStateRef = { current: null as null | ReturnType<typeof bootstrapCustomerState> };
  const getInitialCustomerState = () => {
    if (!initialCustomerStateRef.current) {
      initialCustomerStateRef.current = bootstrapCustomerState();
    }
    return initialCustomerStateRef.current;
  };

  const [currentUser, setCurrentUser] = useState<User | null>(() => getInitialCustomerState().session);
  // Cart is stored separately in localStorage so it persists across reloads
  // and cannot be overwritten by stale user data (fixes duplicate/leftover carts).
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('hamyar_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('hamyar_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem('hamyar_media');
    return saved ? JSON.parse(saved) : initialMedia;
  });
  const [services, setServices] = useState<Service[]>(() => {
    try {
      const saved = localStorage.getItem('hamyar_services');
      return saved ? JSON.parse(saved) : initialServices;
    } catch {
      return initialServices;
    }
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('hamyar_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [news, setNews] = useState<NewsItem[]>(() => {
    const saved = localStorage.getItem('hamyar_news');
    return saved ? JSON.parse(saved) : initialNews;
  });
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(() => {
    const saved = localStorage.getItem('hamyar_portfolio');
    return saved ? JSON.parse(saved) : initialPortfolio;
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('hamyar_expenses');
    return saved ? JSON.parse(saved) : [];
  });
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('hamyar_projects');
    // Migration: content-production orders must never appear in the admin
    // Projects board, so any legacy record created before this rule is flagged
    // as hidden here (it stays available for the order ⇄ project sync).
    const list: Project[] = saved ? JSON.parse(saved) : [];
    return list.map(p => (isContentOrderProject(p) && !p.hiddenFromProjects ? { ...p, hiddenFromProjects: true } : p));
  });
  const [users, setUsers] = useState<User[]>(() => getInitialCustomerState().users);
  // Staff accounts created in the RBAC section are stored as admin users here so
  // they share the same customer/admin data model (orders, logs, profile, ...).
  const staffAdmins: User[] = users.filter(u => u.role === 'admin');
  const [aboutContent, setAboutContent] = useState<AboutContent>(() => {
    const saved = localStorage.getItem('hamyar_about');
    return saved ? JSON.parse(saved) : defaultAbout;
  });
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('hamyar_notes');
    return saved ? JSON.parse(saved) : [];
  });
  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('hamyar_reviews');
    return saved ? JSON.parse(saved) : [
      { id: 'r1', productId: 'p1', customerName: 'علی محمدی', rating: 5, comment: 'محصول بسیار با کیفیت و قیمت مناسب', date: '1403/07/15', approved: true },
      { id: 'r2', productId: 'p1', customerName: 'مریم احمدی', rating: 4, comment: 'کیفیت خوب، ارسال سریع', date: '1403/07/10', approved: true },
      { id: 'r3', productId: 'p4', customerName: 'رضا کریمی', rating: 5, comment: 'هارد بسیار با کیفیت و قابل اعتماد', date: '1403/07/05', approved: true },
    ];
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('hamyar_suppliers');
    return saved ? JSON.parse(saved) : [
      { id: 'sup1', name: 'شرکت سامسونگ ایران', phone: '02188776655', email: 'info@samsung.ir', address: 'تهران، خیابان ولیعصر', products: ['فلش مموری', 'شارژر'], balance: 0 },
      { id: 'sup2', name: 'نمایندگی وسترن دیجیتال', phone: '02144556677', products: ['هارد', 'SSD'], balance: 500000 },
      { id: 'sup3', name: 'پخش لوازم جانبی پارسیان', phone: '09121234567', products: ['کابل', 'شارژر', 'لوازم جانبی'], balance: 0 },
    ];
  });
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('hamyar_employees');
    return saved ? JSON.parse(saved) : [
      { id: 'emp1', name: 'محمد رضایی', phone: '09121111111', role: 'seller', salary: 8000000, startDate: '1402/01/01', active: true, commission: 5 },
      { id: 'emp2', name: 'زهرا محمدی', phone: '09122222222', role: 'operator', salary: 7000000, startDate: '1402/03/15', active: true, commission: 3 },
      { id: 'emp3', name: 'امیر حسینی', phone: '09123333333', role: 'designer', salary: 12000000, startDate: '1402/05/01', active: true, commission: 10 },
    ];
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = localStorage.getItem('hamyar_campaigns');
    return saved ? JSON.parse(saved) : [
      { id: 'c1', title: 'تخفیف آغاز سال تحصیلی', code: 'SCHOOL1403', discount: 20, type: 'percent', minPurchase: 100000, maxUses: 100, usedCount: 15, startDate: '1403/07/01', endDate: '1403/07/31', active: true },
      { id: 'c2', title: 'تخفیف ویژه پایان سال', code: 'ENDYEAR', discount: 50000, type: 'fixed', minPurchase: 500000, maxUses: 50, usedCount: 8, startDate: '1403/12/01', endDate: '1403/12/29', active: true },
    ];
  });
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>(() => {
    const saved = localStorage.getItem('hamyar_sms');
    return saved ? JSON.parse(saved) : [];
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('hamyar_audit');
    return saved ? JSON.parse(saved) : [
      { id: 'a1', user: 'admin', action: 'ورود به سیستم', details: 'ورود موفق', date: new Date().toISOString(), ip: '192.168.1.1', module: 'سیستم' },
      { id: 'a2', user: 'admin', action: 'ایجاد', details: 'ایجاد محصول جدید: فلش مموری 64GB', date: new Date(Date.now() - 3600000).toISOString(), ip: '192.168.1.1', module: 'محصولات' },
      { id: 'a3', user: 'admin', action: 'ویرایش', details: 'ویرایش قیمت محصول: هارد اکسترنال 1TB', date: new Date(Date.now() - 7200000).toISOString(), ip: '192.168.1.1', module: 'محصولات' },
      { id: 'a4', user: 'admin', action: 'ایجاد', details: 'ثبت سفارش جدید: HMY-ABC123', date: new Date(Date.now() - 10800000).toISOString(), ip: '192.168.1.1', module: 'سفارشات' },
      { id: 'a5', user: 'admin', action: 'تغییر وضعیت', details: 'تغییر وضعیت سفارش HMY-ABC123 به در حال انجام', date: new Date(Date.now() - 14400000).toISOString(), ip: '192.168.1.1', module: 'سفارشات' },
      { id: 'a6', user: 'admin', action: 'ایجاد', details: 'ثبت مشتری جدید: علی محمدی', date: new Date(Date.now() - 18000000).toISOString(), ip: '192.168.1.1', module: 'مشتریان' },
      { id: 'a7', user: 'admin', action: 'ایجاد', details: 'افزودن عنوان جدید: Oppenheimer', date: new Date(Date.now() - 21600000).toISOString(), ip: '192.168.1.1', module: 'مدیا' },
      { id: 'a8', user: 'admin', action: 'ایجاد', details: 'ثبت هزینه جدید: اجاره ماهانه', date: new Date(Date.now() - 25200000).toISOString(), ip: '192.168.1.1', module: 'مالی' },
      { id: 'a9', user: 'admin', action: 'ایجاد', details: 'صدور فاکتور: INV-240001', date: new Date(Date.now() - 28800000).toISOString(), ip: '192.168.1.1', module: 'فاکتورها' },
      { id: 'a10', user: 'admin', action: 'تایید', details: 'تایید نظر مشتری: مریم احمدی', date: new Date(Date.now() - 32400000).toISOString(), ip: '192.168.1.1', module: 'نظرات' },
      { id: 'a11', user: 'admin', action: 'ارسال', details: 'ارسال پیامک انبوه به 50 مشتری', date: new Date(Date.now() - 36000000).toISOString(), ip: '192.168.1.1', module: 'پیامک' },
      { id: 'a12', user: 'admin', action: 'ایجاد', details: 'ایجاد پروژه جدید: طراحی سایت شرکتی', date: new Date(Date.now() - 39600000).toISOString(), ip: '192.168.1.1', module: 'پروژه‌ها' },
      { id: 'a13', user: 'admin', action: 'ایجاد', details: 'ایجاد کمپین تخفیف: SCHOOL1403', date: new Date(Date.now() - 43200000).toISOString(), ip: '192.168.1.1', module: 'کمپین‌ها' },
      { id: 'a14', user: 'admin', action: 'ایجاد', details: 'ثبت کارمند جدید: محمد رضایی', date: new Date(Date.now() - 46800000).toISOString(), ip: '192.168.1.1', module: 'کارمندان' },
      { id: 'a15', user: 'admin', action: 'ایجاد', details: 'ثبت تأمین‌کننده جدید: شرکت سامسونگ', date: new Date(Date.now() - 50400000).toISOString(), ip: '192.168.1.1', module: 'تأمین‌کنندگان' },
      { id: 'a16', user: 'admin', action: 'ایجاد', details: 'ایجاد پروژه محتوایی: ویدئو معرفی محصول', date: new Date(Date.now() - 54000000).toISOString(), ip: '192.168.1.1', module: 'تیم محتوا' },
      { id: 'a17', user: 'admin', action: 'ایجاد', details: 'ایجاد نقش جدید: مدیر فروش', date: new Date(Date.now() - 57600000).toISOString(), ip: '192.168.1.1', module: 'RBAC' },
      { id: 'a18', user: 'admin', action: 'ویرایش', details: 'ویرایش تنظیمات سایت', date: new Date(Date.now() - 61200000).toISOString(), ip: '192.168.1.1', module: 'تنظیمات' },
      { id: 'a19', user: 'admin', action: 'بکاپ', details: 'ایجاد بکاپ کامل سیستم', date: new Date(Date.now() - 64800000).toISOString(), ip: '192.168.1.1', module: 'سیستم' },
      { id: 'a20', user: 'admin', action: 'حذف', details: 'حذف محصول: کابل USB قدیمی', date: new Date(Date.now() - 68400000).toISOString(), ip: '192.168.1.1', module: 'محصولات' },
    ];
  });
  const [faqs, setFaqs] = useState<FaqItem[]>(() => {
    const saved = localStorage.getItem('hamyar_faqs');
    return saved ? JSON.parse(saved) : [
      { id: 'f1', question: 'ساعات کاری کافی نت همیار چگونه است؟', answer: 'ما شنبه تا پنج‌شنبه از ساعت ۹ صبح تا ۹ شب و جمعه‌ها از ۱۰ صبح تا ۲ بعدازظهر در خدمت شما هستیم.', category: 'عمومی' },
      { id: 'f2', question: 'آیا امکان ارسال محصولات وجود دارد؟', answer: 'بله، برای سفارش‌های بالای ۵۰۰ هزار تومان ارسال رایگان است. برای سایر سفارش‌ها هزینه ارسال بر عهده مشتری است.', category: 'فروشگاه' },
      { id: 'f3', question: 'چگونه می‌توانم سفارش خود را پیگیری کنم؟', answer: 'با استفاده از کد رهگیری که هنگام ثبت سفارش دریافت کرده‌اید، می‌توانید از بخش پیگیری سفارش وضعیت سفارش خود را مشاهده کنید.', category: 'سفارش' },
      { id: 'f4', question: 'آیا محصولات گارانتی دارند؟', answer: 'بله، تمامی محصولات دیجیتال دارای گارانتی اصالت و سلامت فیزیکی هستند. محصولات خاص مانند دوربین مداربسته و دستگاه پوز دارای گارانتی شرکتی می‌باشند.', category: 'فروشگاه' },
      { id: 'f5', question: 'زمان انجام خدمات کافی نت چقدر است؟', answer: 'بسته به نوع خدمت متفاوت است. خدمات ساده مانند پرینت و کپی در همان لحظه انجام می‌شوند. خدمات پیچیده‌تر مانند ترجمه و طراحی سایت زمان بیشتری نیاز دارند.', category: 'خدمات' },
      { id: 'f6', question: 'آیا امکان پرداخت اقساطی وجود دارد؟', answer: 'برای خریدهای بالای ۲ میلیون تومان امکان پرداخت اقساطی با چک صیادی وجود دارد. برای اطلاعات بیشتر با ما تماس بگیرید.', category: 'فروشگاه' },
    ];
  });
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('hamyar_invoices');
    return saved ? JSON.parse(saved) : [];
  });
  // ---- Support tickets state (persisted like the other collections) ----
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem('hamyar_tickets');
    return saved ? JSON.parse(saved) : [];
  });
  // ---- Customer club / gamification state ----
  const [loyaltyTx, setLoyaltyTx] = useState<LoyaltyTransaction[]>(() => {
    const saved = localStorage.getItem('hamyar_loyalty_tx');
    return saved ? JSON.parse(saved) : [];
  });
  const [gamificationConfig, setGamificationConfigState] = useState<GamificationConfig>(() => {
    const saved = localStorage.getItem('hamyar_gamification');
    if (!saved) return DEFAULT_GAMIFICATION_CONFIG;
    try {
      const parsed = JSON.parse(saved);
      // Merge so newly added keys (badges/rewards/tiers) get defaults for old saves.
      return { ...DEFAULT_GAMIFICATION_CONFIG, ...parsed };
    } catch {
      return DEFAULT_GAMIFICATION_CONFIG;
    }
  });
  const [contentProjects, setContentProjects] = useState<ContentProject[]>(() => {
    const saved = localStorage.getItem('hamyar_content_projects');
    return saved ? JSON.parse(saved) : [];
  });
  const [contentComments, setContentComments] = useState<ContentComment[]>(() => {
    const saved = localStorage.getItem('hamyar_content_comments');
    return saved ? JSON.parse(saved) : [];
  });
  const [contentAssets, setContentAssets] = useState<ContentAsset[]>(() => {
    const saved = localStorage.getItem('hamyar_content_assets');
    return saved ? JSON.parse(saved) : [];
  });
  const [contentTemplates, setContentTemplates] = useState<ContentTemplate[]>(() => {
    const saved = localStorage.getItem('hamyar_content_templates');
    return saved ? JSON.parse(saved) : [
      { id: 't1', name: 'معرفی محصول', type: 'video', scenario: 'معرفی کوتاه محصول با نمایش ویژگی‌ها', equipment: ['دوربین', 'نور', 'میکروفون'], contentPlan: '1. معرفی 2. ویژگی‌ها 3. قیمت 4. دعوت به خرید', qualityChecklist: ['کیفیت تصویر', 'صدای واضح', 'رعایت برند بوک'], createdAt: new Date().toISOString() },
      { id: 't2', name: 'استوری اینستاگرام', type: 'social', scenario: 'استوری کوتاه و جذاب', equipment: ['موبایل'], contentPlan: '1. هوک 2. محتوا 3. CTA', qualityChecklist: ['ابعاد صحیح', 'متن خوانا', 'کال تو اکشن'], createdAt: new Date().toISOString() },
      { id: 't3', name: 'مقاله آموزشی', type: 'article', scenario: 'آموزش استفاده از محصول', equipment: [], contentPlan: '1. مقدمه 2. مراحل 3. نکات 4. نتیجه', qualityChecklist: ['صحت اطلاعات', 'لحن برند', 'سئو'], createdAt: new Date().toISOString() },
    ];
  });
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>(() => {
    const saved = localStorage.getItem('hamyar_content_ideas');
    return saved ? JSON.parse(saved) : [];
  });
  const [brandBook, setBrandBook] = useState<BrandBook>(() => {
    const saved = localStorage.getItem('hamyar_brand_book');
    return saved ? JSON.parse(saved) : {
      primaryColor: '#2563eb',
      secondaryColor: '#7c3aed',
      accentColor: '#f59e0b',
      fonts: ['Vazirmatn', 'IRANSans'],
      tone: 'حرفه‌ای، دوستانه، قابل اعتماد',
      logoUrl: '',
      guidelines: 'در تمام محتواها از رنگ‌های آبی و بنفش به عنوان رنگ‌های اصلی استفاده شود. لحن برند باید حرفه‌ای اما دوستانه باشد.'
    };
  });

  const [permissions, setPermissions] = useState<Permission[]>(() => {
    const saved = localStorage.getItem('hamyar_permissions');
    return saved ? JSON.parse(saved) : [
      { id: 'perm1', name: 'مشاهده سفارشات', description: 'مشاهده لیست سفارشات', module: 'سفارشات' },
      { id: 'perm2', name: 'مدیریت سفارشات', description: 'ایجاد، ویرایش و حذف سفارشات', module: 'سفارشات' },
      { id: 'perm3', name: 'مشاهده مشتریان', description: 'مشاهده لیست مشتریان', module: 'مشتریان' },
      { id: 'perm4', name: 'مدیریت مشتریان', description: 'ایجاد، ویرایش و حذف مشتریان', module: 'مشتریان' },
      { id: 'perm5', name: 'مشاهده محصولات', description: 'مشاهده لیست محصولات', module: 'محصولات' },
      { id: 'perm6', name: 'مدیریت محصولات', description: 'ایجاد، ویرایش و حذف محصولات', module: 'محصولات' },
      { id: 'perm7', name: 'مشاهده مدیا', description: 'مشاهده لیست فیلم و سریال', module: 'مدیا' },
      { id: 'perm8', name: 'مدیریت مدیا', description: 'ایجاد، ویرایش و حذف مدیا', module: 'مدیا' },
      { id: 'perm9', name: 'مشاهده خدمات', description: 'مشاهده لیست خدمات', module: 'خدمات' },
      { id: 'perm10', name: 'مدیریت خدمات', description: 'ایجاد، ویرایش و حذف خدمات', module: 'خدمات' },
      { id: 'perm11', name: 'مشاهده پروژه‌ها', description: 'مشاهده لیست پروژه‌ها', module: 'پروژه‌ها' },
      { id: 'perm12', name: 'مدیریت پروژه‌ها', description: 'ایجاد، ویرایش و حذف پروژه‌ها', module: 'پروژه‌ها' },
      { id: 'perm13', name: 'مشاهده مالی', description: 'مشاهده گزارشات مالی', module: 'مالی' },
      { id: 'perm14', name: 'مدیریت مالی', description: 'ثبت درآمد و هزینه', module: 'مالی' },
      { id: 'perm15', name: 'مشاهده کارمندان', description: 'مشاهده لیست کارمندان', module: 'کارمندان' },
      { id: 'perm16', name: 'مدیریت کارمندان', description: 'ایجاد، ویرایش و حذف کارمندان', module: 'کارمندان' },
      { id: 'perm17', name: 'مشاهده تامین‌کنندگان', description: 'مشاهده لیست تامین‌کنندگان', module: 'تامین‌کنندگان' },
      { id: 'perm18', name: 'مدیریت تامین‌کنندگان', description: 'ایجاد، ویرایش و حذف تامین‌کنندگان', module: 'تامین‌کنندگان' },
      { id: 'perm19', name: 'مشاهده کمپین‌ها', description: 'مشاهده لیست کمپین‌ها', module: 'کمپین‌ها' },
      { id: 'perm20', name: 'مدیریت کمپین‌ها', description: 'ایجاد، ویرایش و حذف کمپین‌ها', module: 'کمپین‌ها' },
      { id: 'perm21', name: 'مشاهده پیامک', description: 'مشاهده پنل پیامک', module: 'پیامک' },
      { id: 'perm22', name: 'ارسال پیامک', description: 'ارسال پیامک انبوه', module: 'پیامک' },
      { id: 'perm23', name: 'مشاهده نظرات', description: 'مشاهده نظرات کاربران', module: 'نظرات' },
      { id: 'perm24', name: 'مدیریت نظرات', description: 'تایید و حذف نظرات', module: 'نظرات' },
      { id: 'perm25', name: 'مشاهده FAQ', description: 'مشاهده سوالات متداول', module: 'FAQ' },
      { id: 'perm26', name: 'مدیریت FAQ', description: 'ایجاد، ویرایش و حذف FAQ', module: 'FAQ' },
      { id: 'perm27', name: 'مشاهده تیم محتوا', description: 'مشاهده پروژه‌های تولید محتوا', module: 'تیم محتوا' },
      { id: 'perm28', name: 'مدیریت تیم محتوا', description: 'ایجاد، ویرایش و حذف پروژه‌های محتوا', module: 'تیم محتوا' },
      { id: 'perm29', name: 'مشاهده دعوت‌ها', description: 'مشاهده کدهای دعوت', module: 'دعوت‌ها' },
      { id: 'perm30', name: 'مشاهده تنظیمات', description: 'مشاهده تنظیمات سایت', module: 'تنظیمات' },
      { id: 'perm31', name: 'مدیریت تنظیمات', description: 'ویرایش تنظیمات سایت', module: 'تنظیمات' },
      { id: 'perm32', name: 'مشاهده لاگ فعالیت', description: 'مشاهده لاگ فعالیت‌ها', module: 'لاگ' },
      { id: 'perm33', name: 'پشتیبان‌گیری', description: 'ایجاد و بازیابی بکاپ', module: 'بکاپ' },
      { id: 'perm34', name: 'مشاهده تحلیل', description: 'مشاهده داشبورد تحلیلی', module: 'تحلیل' },
      { id: 'perm35', name: 'مدیریت نقش‌ها', description: 'ایجاد و ویرایش نقش‌ها و دسترسی‌ها', module: 'RBAC' },
      { id: 'perm36', name: 'مشاهده همکاران', description: 'مشاهده لیست همکاران', module: 'همکاران' },
      { id: 'perm37', name: 'مدیریت همکاران', description: 'ایجاد، ویرایش و حذف همکاران', module: 'همکاران' },
      { id: 'perm38', name: 'مشاهده سفارشات همکار', description: 'مشاهده سفارشات ارجاعی همکاران', module: 'همکاران' },
      { id: 'perm39', name: 'مدیریت کیف پول', description: 'مدیریت تراکنش‌های کیف پول همکاران', module: 'همکاران' },
      { id: 'perm40', name: 'گزارش‌های همکاران', description: 'مشاهده گزارش‌های عملکرد همکاران', module: 'همکاران' },
      { id: 'perm41', name: 'مشاهده تیکت‌ها', description: 'مشاهده تیکت‌های پشتیبانی مشتریان', module: 'پشتیبانی' },
      { id: 'perm42', name: 'مدیریت تیکت‌ها', description: 'پاسخ‌دهی، تغییر وضعیت و اولویت تیکت‌ها', module: 'پشتیبانی' },
    ];
  });

  const [roles, setRoles] = useState<Role[]>(() => {
    const saved = localStorage.getItem('hamyar_roles');
    return saved ? JSON.parse(saved) : [
      {
        id: 'role1',
        name: 'مدیر کل',
        description: 'دسترسی کامل به تمام بخش‌ها',
        permissions: permissions.map(p => p.id),
        isDefault: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'role2',
        name: 'مدیر فروش',
        description: 'دسترسی به سفارشات، محصولات، مشتریان و گزارشات فروش',
        permissions: ['perm1', 'perm2', 'perm3', 'perm4', 'perm5', 'perm6', 'perm13', 'perm34'],
        isDefault: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'role3',
        name: 'اپراتور خدمات',
        description: 'دسترسی به سفارشات و خدمات کافی‌نت',
        permissions: ['perm1', 'perm2', 'perm9', 'perm10'],
        isDefault: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'role4',
        name: 'مدیر محتوا',
        description: 'دسترسی به مدیا، تیم محتوا و نظرات',
        permissions: ['perm7', 'perm8', 'perm23', 'perm24', 'perm27', 'perm28'],
        isDefault: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'role5',
        name: 'حسابدار',
        description: 'دسترسی به بخش مالی و گزارشات',
        permissions: ['perm13', 'perm14', 'perm34'],
        isDefault: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'role6',
        name: 'همکار',
        description: 'دسترسی به پنل همکاران و مشاهده پورسانت‌ها',
        permissions: ['perm36', 'perm38'],
        isDefault: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'role7',
        name: 'کارشناس پشتیبانی',
        description: 'پاسخ‌دهی و رسیدگی به تیکت‌های مشتریان',
        permissions: ['perm41', 'perm42', 'perm1', 'perm21'],
        isDefault: false,
        createdAt: new Date().toISOString()
      },
    ];
  });

  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() => {
    const saved = localStorage.getItem('hamyar_system_users');
    return saved ? JSON.parse(saved) : [
      {
        id: 'sysuser1',
        username: 'admin',
        password: 'admin123',
        name: 'مدیر سیستم',
        email: 'admin@hamyar.ir',
        phone: '09913911880',
        roleId: 'role1',
        active: true,
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [okrs, setOkrs] = useState<OKR[]>(() => {
    const saved = localStorage.getItem('hamyar_okrs');
    return saved ? JSON.parse(saved) : [];
  });

  const [kpis, setKpis] = useState<KPI[]>(() => {
    const saved = localStorage.getItem('hamyar_kpis');
    return saved ? JSON.parse(saved) : [];
  });

  const [affiliates, setAffiliates] = useState<Affiliate[]>(() => {
    const saved = localStorage.getItem('hamyar_affiliates');
    return saved ? JSON.parse(saved) : [];
  });

  const [affiliateOrders, setAffiliateOrders] = useState<AffiliateOrder[]>(() => {
    const saved = localStorage.getItem('hamyar_affiliate_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [affiliateTransactions, setAffiliateTransactions] = useState<AffiliateTransaction[]>(() => {
    const saved = localStorage.getItem('hamyar_affiliate_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [personas, setPersonas] = useState<Persona[]>(() => {
    const saved = localStorage.getItem('hamyar_personas');
    if (saved) {
      return JSON.parse(saved);
    }
    // پرسوناهای پیش‌فرض
    return [
      {
        id: 'persona1',
        name: 'دانشجوی فعال',
        avatar: '🎓',
        tagline: 'دنبال خدمات سریع و ارزان برای پروژه‌های دانشگاهی',
        demographics: {
          ageRange: '18-25',
          gender: 'mixed',
          location: 'شهرهای بزرگ',
          education: 'دانشجو',
          occupation: 'دانشجو',
          incomeLevel: 'low'
        },
        psychographics: {
          personality: ['کنجکاو', 'صرفه‌جو', 'تکنولوژی‌دوست'],
          values: ['سرعت', 'قیمت مناسب', 'کیفیت'],
          interests: ['تکنولوژی', 'فیلم', 'بازی'],
          lifestyle: 'پرجنب‌وجوش و دیجیتال'
        },
        behavior: {
          buyingHabits: 'مقایسه قیمت قبل از خرید',
          preferredChannels: ['اینستاگرام', 'تلگرام'],
          decisionFactors: ['قیمت', 'سرعت انجام', 'نظرات دیگران'],
          painPoints: ['بودجه محدود', 'کمبود وقت', 'پیچیدگی خدمات'],
          goals: ['انجام پروژه‌های دانشگاهی', 'یادگیری مهارت‌های جدید']
        },
        services: {
          primaryServices: ['پرینت و اسکن', 'تایپ', 'کپی فیلم'],
          frequency: 'weekly',
          avgSpending: 50000,
          preferredPayment: 'کارت به کارت'
        },
        scenario: {
          typicalDay: 'صبح دانشگاه، عصر پروژه‌های درسی، شب فیلم و سریال',
          challenges: ['بودجه محدود', 'مهلت‌های فشرده', 'نیاز به خدمات سریع'],
          solutions: ['قیمت‌های دانشجویی', 'انجام فوری', 'بسته‌های ویژه'],
          touchpoints: ['اینستاگرام', 'سایت', 'مراجعه حضوری']
        },
        quote: 'من به دنبال خدماتی هستم که سریع و ارزان باشه',
        notes: 'این گروه هدف اصلی ما برای خدمات پرینت و تایپ هستند',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'persona2',
        name: 'کارمند حرفه‌ای',
        avatar: '💼',
        tagline: 'نیازمند خدمات با کیفیت برای کار و زندگی شخصی',
        demographics: {
          ageRange: '25-40',
          gender: 'mixed',
          location: 'تهران و کلان‌شهرها',
          education: 'لیسانس و بالاتر',
          occupation: 'کارمند',
          incomeLevel: 'medium'
        },
        psychographics: {
          personality: ['منظم', 'کیفیت‌محور', 'مشتری‌مدار'],
          values: ['کیفیت', 'اعتماد', 'راحتی'],
          interests: ['تکنولوژی', 'سرمایه‌گذاری', 'سفر'],
          lifestyle: 'متعادل و حرفه‌ای'
        },
        behavior: {
          buyingHabits: 'تحقیق قبل از خرید',
          preferredChannels: ['وب‌سایت', 'واتساپ'],
          decisionFactors: ['کیفیت', 'اعتبار', 'پشتیبانی'],
          painPoints: ['کمبود وقت', 'نیاز به خدمات حرفه‌ای', 'پیچیدگی فرآیندها'],
          goals: ['ارتقای شغلی', 'مدیریت بهتر زندگی', 'یادگیری']
        },
        services: {
          primaryServices: ['ترجمه رسمی', 'طراحی سایت', 'خدمات اداری'],
          frequency: 'monthly',
          avgSpending: 200000,
          preferredPayment: 'کارت بانکی'
        },
        scenario: {
          typicalDay: 'صبح کار، ناهار با همکاران، عصر ورزش یا مطالعه',
          challenges: ['مدیریت زمان', 'نیاز به خدمات حرفه‌ای', 'بودجه متوسط'],
          solutions: ['خدمات آنلاین', 'بسته‌های ویژه', 'مشاوره رایگان'],
          touchpoints: ['وب‌سایت', 'ایمیل', 'مراجعه حضوری']
        },
        quote: 'من به دنبال خدماتی هستم که حرفه‌ای و قابل اعتماد باشه',
        notes: 'این گروه برای خدمات ترجمه و طراحی سایت مناسب هستند',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'persona3',
        name: 'صاحب کسب‌وکار',
        avatar: '🏢',
        tagline: 'نیازمند خدمات دیجیتال برای رشد کسب‌وکار',
        demographics: {
          ageRange: '30-50',
          gender: 'mixed',
          location: 'سراسر ایران',
          education: 'لیسانس و بالاتر',
          occupation: 'کارآفرین',
          incomeLevel: 'high'
        },
        psychographics: {
          personality: ['ریسک‌پذیر', 'خلاق', 'نتیجه‌محور'],
          values: ['رشد', 'نوآوری', 'سودآوری'],
          interests: ['کسب‌وکار', 'تکنولوژی', 'بازاریابی'],
          lifestyle: 'پرجنب‌وجوش و هدفمند'
        },
        behavior: {
          buyingHabits: 'سرمایه‌گذاری در خدمات با کیفیت',
          preferredChannels: ['لینکدین', 'وب‌سایت'],
          decisionFactors: ['ROI', 'کیفیت', 'پشتیبانی'],
          painPoints: ['رقابت شدید', 'نیاز به حضور آنلاین', 'مدیریت زمان'],
          goals: ['رشد کسب‌وکار', 'افزایش فروش', 'برندسازی']
        },
        services: {
          primaryServices: ['طراحی سایت', 'تولید محتوا', 'دیجیتال مارکتینگ'],
          frequency: 'monthly',
          avgSpending: 2000000,
          preferredPayment: 'حواله بانکی'
        },
        scenario: {
          typicalDay: 'صبح جلسات، ظهر ناهار کاری، عصر برنامه‌ریزی',
          challenges: ['رقابت', 'بودجه بازاریابی', 'نیاز به نتایج سریع'],
          solutions: ['پکیج‌های جامع', 'مشاوره تخصصی', 'گزارش‌های منظم'],
          touchpoints: ['لینکدین', 'وب‌سایت', 'تماس تلفنی']
        },
        quote: 'من به دنبال خدماتی هستم که کسب‌وکارم را متحول کند',
        notes: 'این گروه برای خدمات طراحی سایت و دیجیتال مارکتینگ مناسب هستند',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  });

  const [digitalMarketingData, setDigitalMarketingData] = useState<DigitalMarketingData>(() => {
    const saved = localStorage.getItem('hamyar_digital_marketing');
    if (saved) {
      return JSON.parse(saved);
    }
    // مقادیر پیش‌فرض نمونه
    return {
      gmv: 0, nmv: 0, grossProfit: 0, profit: 0, cashFlow: 0,
      totalImpressions: 0, sessions: 0, engagementRate: 0, users: 0, sessionsPerUser: 0,
      transactions: 0, totalProductsSold: 0, returnRate: 0, outOfStockRate: 0, avgLossPerReturn: 0,
      onTimeDeliveryRate: 0, avgDeliveryTime: 0, avgSupplyTime: 0, purchaseRate: 0, aov: 0,
      aop: 0, avgProductPrice: 0, avgPackagingCost: 0, avgClicksPerVisit: 0,
      totalCalls: 0, callsPerSession: 0, callToCustomerRate: 0, clickOnCallRate: 0,
      phoneOrdersRate: 0, trackingCallsRate: 0, avgCallsPerUser: 0, costPerCall: 0,
      salesPerCall: 0, profitPerCall: 0, missedCallsRate: 0,
      chatSessionsInitiated: 0, chatPerSession: 0,
      pagesPerSession: 0, totalPageviews: 0, uniquePageviews: 0, homepageViewsRate: 0,
      productPageviews: 0, productPageviewsRate: 0, blogPageviews: 0, blogPageviewsRate: 0,
      categoryPageviewsRate: 0, topProductViewsRate: 0, error404Rate: 0,
      avgSessionDuration: 0, totalSessionTime: 0, avgEngagementTime: 0, avgTimeOnPage: 0,
      productVsBlogDuration: 0, videoVsNonVideoDuration: 0,
      bounceRate: 0, deepSessionsRate: 0, longSessionsRate: 0,
      registrationToPurchaseRate: 0, profileCompletionRate: 0, registrationCompletionRate: 0, googleVsEmailRate: 0,
      addToCartToPurchaseRate: 0, cartCompletionRate: 0, cartAbandonmentRate: 0,
      cpc: 0, cpv: 0, rpv: 0, rpl: 0, cpl: 0, organicVsPaidRate: 0, directRate: 0,
      directBrandedRate: 0, organicRate: 0, googleFirstTimeRate: 0,
      googleImpressions: 0, googleImageClickRate: 0, productOrganicRate: 0, avgCtr: 0,
      indexedPages: 0, internalLinks: 0, backlinkDomains: 0, domainAuthority: 0, spamScore: 0,
      topGoogleKeywords: 0, blogToShopVisits: 0,
      sessionGrowthRate: 0, organicGrowthRate: 0, internalSearchRate: 0, noResultSearchRate: 0,
      subscriberGrowthRate: 0, openRate: 0, emailCtr: 0,
      roi: 0, roas: 0,
      avgSessionsPerUser: 0, avgDaysBetweenSessions: 0, singlePageViewsRate: 0, avgTimeToPurchase: 0,
      assistedPathPosition: 0, firstVisitPurchaseRate: 0, newVisitorPurchaseRate: 0,
      assistedConversionsRate: 0, returningVsNewRate: 0, returningValueVsNew: 0,
      mobileVsDesktopRate: 0, maleVsFemaleRate: 0, avgUserAge: 0,
      productComments: 0, avgCommentsPerUser: 0, avgScrollDepth: 0, scroll80Rate: 0,
      day1RetentionRate: 0, weeklyVsMonthlyRetention: 0,
      cac: 0, clv: 0, clvToCac: 0, retentionRate: 0, churnRate: 0, loyalCustomerRate: 0,
      purchaseFrequency: 0, avgTimeBetweenPurchases: 0,
      largestCartItems: 0, topCustomerOrders: 0, topCustomerAmount: 0, b2bVsB2cRate: 0,
      marketShare: 0, cheaperCompetitorsRate: 0,
      deadClicks: 0, quickBacks: 0, trustSymbolClickRate: 0, wishlistClicks: 0,
      wordsGenerated: 0, imagesAdded: 0, infographicsCreated: 0, videosAdded: 0,
      productsAdded: 0, blogPosts: 0, productVsBlogWordsRate: 0, reports: 0, oldContentUpdates: 0,
      referralTraffic: 0, exitRate: 0, avgBlogPageValue: 0, blogVsTotalPageValue: 0,
      blogUsersRate: 0, blogToShopRate: 0, productImageClickRate: 0, productVideoClickRate: 0,
      avgProductRating: 0, avgBlogRating: 0,
      brandAwareness: 0, topOfMind: 0, nps: 0, satisfactionRate: 0, womRate: 0,
      designScore: 0, findabilityScore: 0, readabilityScore: 0, trustScore: 0, supportScore: 0,
      suppliers: 0, personnel: 0, positions: 0, dailyWorkHours: 0, revenuePerHour: 0, avgHourlyWage: 0,
      avgPageLoadTime: 0, fcp: 0, lcp: 0,
      socialTraffic: 0, socialIconClicks: 0, ugcContent: 0, totalFollowers: 0, followers: 0,
      avgLikes: 0, avgComments: 0, accountReach: 0, videoReach: 0, postReach: 0, storyReach: 0,
      topPostReach: 0, topStoryReach: 0, topVideoReach: 0, profileVisits: 0, socialImpressions: 0,
      contentInteractions: 0, postInteractions: 0, storyInteractions: 0, videoInteractions: 0,
      lastUpdated: new Date().toISOString()
    };
  });

  useEffect(() => {
    localStorage.setItem('hamyar_dark', String(darkMode));
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    // Customers persist through the dedicated session key (id + name + phone);
    // their full profile always comes from the users list on the next load.
    // Admin sessions keep embedding RBAC permissions, so they stay in the
    // legacy snapshot. null clears both.
    if (!currentUser) {
      localStorage.removeItem('hamyar_user');
      localStorage.removeItem(CUSTOMER_SESSION_KEY);
      return;
    }
    if (currentUser.role === 'customer') {
      const s: CustomerSession = { id: currentUser.id, name: currentUser.name, phone: currentUser.phone };
      localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(s));
      localStorage.removeItem('hamyar_user');
    } else {
      localStorage.setItem('hamyar_user', JSON.stringify(currentUser));
      localStorage.removeItem(CUSTOMER_SESSION_KEY);
    }
  }, [currentUser]);
  useEffect(() => { localStorage.setItem('hamyar_cart', JSON.stringify(cartItems)); }, [cartItems]);
  useEffect(() => { localStorage.setItem('hamyar_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('hamyar_media', JSON.stringify(mediaItems)); }, [mediaItems]);
  useEffect(() => { localStorage.setItem('hamyar_services', JSON.stringify(services)); }, [services]);
  useEffect(() => { localStorage.setItem('hamyar_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('hamyar_news', JSON.stringify(news)); }, [news]);
  useEffect(() => { localStorage.setItem('hamyar_portfolio', JSON.stringify(portfolio)); }, [portfolio]);
  useEffect(() => { localStorage.setItem('hamyar_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('hamyar_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('hamyar_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('hamyar_reviews', JSON.stringify(reviews)); }, [reviews]);
  useEffect(() => { localStorage.setItem('hamyar_suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('hamyar_employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('hamyar_campaigns', JSON.stringify(campaigns)); }, [campaigns]);
  useEffect(() => { localStorage.setItem('hamyar_sms', JSON.stringify(smsLogs)); }, [smsLogs]);
  useEffect(() => { localStorage.setItem('hamyar_audit', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem('hamyar_faqs', JSON.stringify(faqs)); }, [faqs]);
  useEffect(() => { localStorage.setItem('hamyar_tickets', JSON.stringify(tickets)); }, [tickets]);
  useEffect(() => { localStorage.setItem('hamyar_invoices', JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem('hamyar_content_projects', JSON.stringify(contentProjects)); }, [contentProjects]);
  useEffect(() => { localStorage.setItem('hamyar_content_comments', JSON.stringify(contentComments)); }, [contentComments]);
  useEffect(() => { localStorage.setItem('hamyar_content_assets', JSON.stringify(contentAssets)); }, [contentAssets]);
  useEffect(() => { localStorage.setItem('hamyar_content_templates', JSON.stringify(contentTemplates)); }, [contentTemplates]);
  useEffect(() => { localStorage.setItem('hamyar_content_ideas', JSON.stringify(contentIdeas)); }, [contentIdeas]);
  useEffect(() => { localStorage.setItem('hamyar_brand_book', JSON.stringify(brandBook)); }, [brandBook]);
  useEffect(() => { localStorage.setItem('hamyar_permissions', JSON.stringify(permissions)); }, [permissions]);
  useEffect(() => { localStorage.setItem('hamyar_roles', JSON.stringify(roles)); }, [roles]);
  useEffect(() => { localStorage.setItem('hamyar_system_users', JSON.stringify(systemUsers)); }, [systemUsers]);
  useEffect(() => { localStorage.setItem('hamyar_okrs', JSON.stringify(okrs)); }, [okrs]);
  useEffect(() => { localStorage.setItem('hamyar_kpis', JSON.stringify(kpis)); }, [kpis]);
  useEffect(() => { localStorage.setItem('hamyar_affiliates', JSON.stringify(affiliates)); }, [affiliates]);
  useEffect(() => { localStorage.setItem('hamyar_affiliate_orders', JSON.stringify(affiliateOrders)); }, [affiliateOrders]);
  useEffect(() => { localStorage.setItem('hamyar_affiliate_transactions', JSON.stringify(affiliateTransactions)); }, [affiliateTransactions]);
  useEffect(() => { localStorage.setItem('hamyar_personas', JSON.stringify(personas)); }, [personas]);
  useEffect(() => { localStorage.setItem('hamyar_digital_marketing', JSON.stringify(digitalMarketingData)); }, [digitalMarketingData]);
  useEffect(() => { localStorage.setItem('hamyar_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('hamyar_loyalty_tx', JSON.stringify(loyaltyTx)); }, [loyaltyTx]);
  useEffect(() => { localStorage.setItem('hamyar_gamification', JSON.stringify(gamificationConfig)); }, [gamificationConfig]);
  // Consistency guard: an inviter's `invitedCount` must always equal the number of
  // customers whose `invitedBy` points to them. This fixes legacy records created
  // by the old bug (invite counter / bonus attached to the wrong user), so the
  // «دعوت‌ها» column in the admin Invites section is always accurate.
  useEffect(() => {
    if (!users.some(u => u.invitedBy)) return;
    const actual = new Map<string, number>();
    users.forEach(u => {
      if (u.invitedBy) actual.set(u.invitedBy, (actual.get(u.invitedBy) || 0) + 1);
    });
    const needsFix = users.some(u => (u.invitedCount || 0) !== (actual.get(u.id) || 0));
    if (!needsFix) return;
    setUsers(users.map(u => {
      const n = actual.get(u.id) || 0;
      return (u.invitedCount || 0) === n ? u : { ...u, invitedCount: n };
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);
  useEffect(() => { localStorage.setItem('hamyar_about', JSON.stringify(aboutContent)); }, [aboutContent]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // ---------------------------------------------------------------------------
  // Order status <-> public tracking page & warehouse stock synchronization
  // ---------------------------------------------------------------------------
  // Refs so the update functions always read the latest state (no stale closures)
  const ordersRef = useRef(orders);
  useEffect(() => { ordersRef.current = orders; }, [orders]);
  const invoicesRef = useRef(invoices);
  useEffect(() => { invoicesRef.current = invoices; }, [invoices]);
  // Refs for the admin login flow – they always hold the latest state so a staff
  // account created moments ago can log in immediately (no stale closure).
  const systemUsersRef = useRef(systemUsers);
  useEffect(() => { systemUsersRef.current = systemUsers; }, [systemUsers]);
  const rolesRef = useRef(roles);
  useEffect(() => { rolesRef.current = roles; }, [roles]);
  const permissionsRef = useRef(permissions);
  useEffect(() => { permissionsRef.current = permissions; }, [permissions]);
  const usersRef = useRef(users);
  useEffect(() => { usersRef.current = users; }, [users]);
  const currentUserRef = useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // Safety net: the logged-in customer must always exist in the users list —
  // otherwise the admin «مشتریان» section cannot show them and any write to
  // the list would drop their account. Covers legacy data where the session
  // lived only in 'hamyar_user' and login generated a fresh id every visit.
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'customer') return;
    if (users.some(u => u.id === currentUser.id)) return;
    setUsers(prev => prev.some(u => u.id === currentUser.id)
      ? prev
      : [...prev, { ...currentUser }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.role, users.length]);

  // Whenever the RBAC data changes, refresh the live admin session so that:
  // - a staff account whose role/permissions were just edited gets them applied
  //   immediately (without needing to log out and back in),
  // - an inactive or deleted staff account loses its admin access right away.
  useEffect(() => {
    const cu = currentUserRef.current;
    if (!cu || cu.role !== 'admin' || !cu.currentAdminId) return;
    const su = systemUsers.find(s => s.id === cu.currentAdminId);
    if (!su) {
      // The staff record was removed – drop the elevated session but keep the user logged in
      setCurrentUser({ ...cu, role: 'customer', currentAdminId: undefined, roleId: undefined, permissions: undefined });
      setUserPermissions(undefined);
      return;
    }
    if (!su.active) {
      // Account deactivated by the admin – kick the active session out of the panel
      setCurrentUser({ ...cu, role: 'customer', permissions: undefined });
      setUserPermissions(undefined);
      return;
    }
    const role = roles.find(r => r.id === su.roleId);
    const perms = su.username === 'admin' ? permissions.map(p => p.id) : role?.permissions;
    setUserPermissions(perms);
    setCurrentUser(prev => prev && prev.id === cu.id
      ? { ...prev, name: su.name || su.username, username: su.username, password: su.password, phone: su.phone || '', roleId: su.roleId, permissions: perms }
      : prev);
  }, [systemUsers, roles, permissions]);

  // Sum of quantities locked (deducted) by delivered orders, per product.
  const totalDeductedQuantities = (allOrders: Order[]): Record<string, number> => {
    const map: Record<string, number> = {};
    allOrders.forEach(o => {
      if (o.status === 'delivered' && Array.isArray(o.items)) {
        o.items.forEach((it: any) => {
          const pid = it?.productId;
          const qty = Number(it?.quantity) || 0;
          if (pid && qty > 0) map[pid] = (map[pid] || 0) + qty;
        });
      }
    });
    return map;
  };

  // Keep warehouse stock in sync when the set of delivered orders changes
  // (e.g. an order is moved out of "delivered" through a direct setOrders call).
  const syncStockWithDeliveredOrders = (prevOrders: Order[], nextOrders: Order[]) => {
    const prevMap = totalDeductedQuantities(prevOrders);
    const nextMap = totalDeductedQuantities(nextOrders);
    const affected = new Set([...Object.keys(prevMap), ...Object.keys(nextMap)]);
    if (affected.size === 0) return;
    setProducts(prev => prev.map(p => {
      if (!affected.has(p.id)) return p;
      const delta = (prevMap[p.id] || 0) - (nextMap[p.id] || 0); // positive => restore stock
      const next = Math.max(0, p.stock + delta);
      return next === p.stock ? p : { ...p, stock: next };
    }));
  };

  const pushSmsLog = (phone: string, message: string) => {
    setSmsLogs(prev => [{
      id: 'sms' + Date.now() + Math.random().toString(36).slice(2, 6),
      phone,
      message,
      date: new Date().toISOString(),
      status: 'sent' as const,
    }, ...prev]);
  };

  const pushAuditLog = (action: string, details: string, module: string) => {
    setAuditLogs(prev => [logActivity(currentUser?.name || 'مدیر سیستم', action, details, module), ...prev]);
  };

  // ---------------------------------------------------------------------------
  // Admin notification system (سیستم اعلان پنل مدیریت).
  // Notifications are persisted like the other collections and every type has
  // its own dedicated color (see NOTIFICATION_TYPE_META). Business events all
  // over the panel (new orders, tickets, payments, low stock, new customers…)
  // push their colored notification through `pushNotification`.
  // ---------------------------------------------------------------------------
  const [notifications, setNotifications] = useState<AdminNotification[]>(() => {
    try {
      const saved = localStorage.getItem('hamyar_notifications');
      return saved ? (JSON.parse(saved) as AdminNotification[]) : [];
    } catch { return []; }
  });
  useEffect(() => { localStorage.setItem('hamyar_notifications', JSON.stringify(notifications)); }, [notifications]);

  const notificationsRef = useRef(notifications);
  useEffect(() => { notificationsRef.current = notifications; }, [notifications]);

  const pushNotification: AppContextType['pushNotification'] = ({ type, title, message, link, priority = 'normal', key }) => {
    // Dedupe: the same event key is only announced once per session of data
    if (key && notificationsRef.current.some(n => (n as AdminNotification & { dedupeKey?: string }).dedupeKey === key)) return;
    const now = new Date().toISOString();
    const n: AdminNotification & { dedupeKey?: string } = {
      id: 'ntf' + Date.now() + Math.random().toString(36).slice(2, 6),
      type,
      priority,
      title,
      message,
      link,
      read: false,
      createdAt: now,
      dedupeKey: key,
    };
    setNotifications(prev => [n, ...prev].slice(0, 200)); // keep the last 200
  };

  const markNotificationRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const markAllNotificationsRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const deleteNotification = (id: string) =>
    setNotifications(prev => prev.filter(n => n.id !== id));

  const clearReadNotifications = () =>
    setNotifications(prev => prev.filter(n => !n.read));

  const unreadNotificationsCount = notifications.reduce((c, n) => c + (n.read ? 0 : 1), 0);

  // ---- Automatic notifications from business events ------------------------
  // کمبود موجودی انبار: هر محصولی که به زیر آستانه هشدار (alertThreshold،
  // پیش‌فرض ۱۰) برسد یک اعلان با رنگ قرمز مخصوص خودش ایجاد می‌کند.
  useEffect(() => {
    products.forEach(p => {
      const threshold = p.alertThreshold ?? 10;
      if (p.stock <= threshold) {
        pushNotification({
          type: 'stock',
          title: 'هشدار موجودی انبار',
          message: `موجودی «${p.name}» به ${p.stock.toLocaleString('fa-IR')} عدد رسید (آستانه هشدار: ${threshold.toLocaleString('fa-IR')}).`,
          link: '/admin/products',
          priority: p.stock === 0 ? 'urgent' : 'high',
          key: `stock-${p.id}-${p.stock}`,
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  // نظر جدید مشتری: هر نظری که هنوز تایید نشده یک اعلان با رنگ زرد مخصوص
  // خودش برای بخش «نظرات» پنل ایجاد می‌کند.
  useEffect(() => {
    reviews.filter(r => !r.approved).forEach(r => {
      const pname = products.find(p => p.id === r.productId)?.name || 'محصول';
      pushNotification({
        type: 'review',
        title: 'نظر جدید در انتظار تایید',
        message: `${r.customerName} نظری ${r.rating} ستاره برای «${pname}» ثبت کرد.`,
        link: '/admin/reviews',
        priority: 'low',
        key: 'review-' + r.id,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviews]);

  // یادداشت کاری: هر یادداشت جدید یک اعلان با رنگ بنفش (violet) مخصوص خودش.
  useEffect(() => {
    notes.forEach(nt => {
      pushNotification({
        type: 'note',
        title: 'یادداشت کاری جدید',
        message: `یادداشت «${nt.title || nt.task}»${nt.customerName ? ` برای مشتری «${nt.customerName}»` : ''} ایجاد شد.`,
        link: '/admin/notes',
        priority: nt.priority === 'urgent' ? 'urgent' : nt.priority === 'high' ? 'high' : 'normal',
        key: 'note-' + nt.id,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  // Bootstrap: on the very first run (empty storage) seed one sample per type
  // so the admin immediately sees that each notification renders with its own
  // color. These seeds are marked with a special dedupe key and disappear once
  // the admin deletes them (they are never re-added while others remain).
  useEffect(() => {
    if (notificationsRef.current.length > 0) return;
    try {
      if (localStorage.getItem('hamyar_notifications')) return;
    } catch { /* ignore */ }
    const now = Date.now();
    const seed: { type: NotificationType; title: string; message: string; link?: string; priority: NotificationPriority; agoMin: number }[] = [
      { type: 'order',   title: 'سفارش جدید ثبت شد',        message: 'سفارش HMY-8F2K1 با وضعیت «جدید» در انتظار بررسی است.', link: '/admin/orders', priority: 'high', agoMin: 12 },
      { type: 'ticket',  title: 'تیکت پشتیبانی فوری',       message: 'مشتری «علی رضایی» تیکت فوری «مشکل در پرداخت» باز کرد.', link: '/admin/tickets', priority: 'urgent', agoMin: 25 },
      { type: 'payment', title: 'پرداخت آنلاین موفق',       message: 'مبلغ ۲٬۵۰۰٬۰۰۰ تومان از طریق درگاه پرداخت شد و رسید صادر گردید.', link: '/admin/invoices', priority: 'normal', agoMin: 47 },
      { type: 'review',  title: 'نظر جدید در انتظار تایید', message: 'یک نظر ۵ ستاره برای محصول «روتر TP-Link» ثبت شد.', link: '/admin/reviews', priority: 'low', agoMin: 95 },
      { type: 'stock',   title: 'هشدار موجودی انبار',       message: 'موجودی «ماوس گیمینگ Razer» به زیر ۱۰ عدد رسید.', link: '/admin/products', priority: 'high', agoMin: 130 },
      { type: 'user',    title: 'کاربر جدید عضو شد',        message: 'مشتری جدید با شماره ۰۹۱۲۳۴۵۶۷۸۹ از طریق کد دعوت ثبت‌نام کرد.', link: '/admin/customers', priority: 'normal', agoMin: 190 },
      { type: 'system',  title: 'پشتیبان‌گیری خودکار انجام شد', message: 'نسخه پشتیبان پایگاه داده با موفقیت ذخیره شد.', link: '/admin/backup', priority: 'low', agoMin: 260 },
      { type: 'note',    title: 'یادداشت کاری جدید',        message: 'یادداشت «تماس با تأمین‌کننده کابل شبکه» با اولویت بالا ایجاد شد.', link: '/admin/notes', priority: 'normal', agoMin: 320 },
    ];
    const seeded: (AdminNotification & { dedupeKey?: string })[] = seed.map((s, i) => ({
      id: 'ntfseed' + i,
      type: s.type,
      priority: s.priority,
      title: s.title,
      message: s.message,
      link: s.link,
      read: false,
      createdAt: new Date(now - s.agoMin * 60000).toISOString(),
      dedupeKey: 'seed-' + s.type,
    }));
    setNotifications(seeded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Support ticket workflow. Customers open threads from their profile page;
  // the staff answers them from the admin «تیکت و پشتیبانی» board. Every admin
  // action is mirrored into the SMS log and the audit log so the ticketing
  // section stays consistent with the rest of the panel.
  // ---------------------------------------------------------------------------
  const ticketsRef = useRef(tickets);
  useEffect(() => { ticketsRef.current = tickets; }, [tickets]);

  const newTicketCode = (): string => {
    // Sequential-per-day code like the order tracking codes, e.g. TCK-4821
    const n = ticketsRef.current.length + 1;
    return 'TCK-' + String(1000 + n) + Math.floor(Math.random() * 90 + 10);
  };

  const createTicket: AppContextType['createTicket'] = (input) => {
    if (!currentUser) return { ok: false, error: 'برای ثبت تیکت باید وارد حساب خود شوید.' };
    const subject = input.subject.trim();
    const description = input.description.trim();
    if (!subject || !description) return { ok: false, error: 'موضوع و شرح مشکل را کامل وارد کنید.' };
    const now = new Date().toISOString();
    const ticket: SupportTicket = {
      id: 'tck' + Date.now() + Math.random().toString(36).slice(2, 6),
      code: newTicketCode(),
      customerId: currentUser.id,
      customerName: currentUser.name,
      customerPhone: currentUser.phone,
      subject,
      description,
      category: input.category,
      priority: input.priority,
      status: 'open',
      orderId: input.orderId,
      messages: [{ id: 'tm' + Date.now(), sender: 'customer', author: currentUser.name, text: description, createdAt: now }],
      createdAt: now,
      updatedAt: now,
    };
    setTickets(prev => [ticket, ...prev]);
    track('ticket_created', { category: ticket.category, priority: ticket.priority });
    // رنگ مخصوص خود اعلان: تیکت‌ها با پالت سرخابی (fuchsia) نمایش داده می‌شوند
    pushNotification({
      type: 'ticket',
      title: `تیکت جدید: ${ticket.subject}`,
      message: `${ticket.customerName} تیکت «${ticket.subject}» (${TICKET_CATEGORY_LABELS[ticket.category]}) با اولویت ${TICKET_PRIORITY_LABELS[ticket.priority]} باز کرد.`,
      link: '/admin/tickets',
      priority: ticket.priority === 'urgent' ? 'urgent' : ticket.priority === 'high' ? 'high' : 'normal',
      key: 'ticket-' + ticket.id,
    });
    return { ok: true, ticket };
  };

  // Shared helper for the customer-side replies (new message + reopen flow).
  // Ownership is resolved through `isTicketOwner` (id OR phone OR any alternate
  // id of the same customer) so follow-up messages never get silently dropped
  // when a legacy session id differs from the one stored on the ticket.
  const customerTicketReply = (ticketId: string, text: string, reopen: boolean) => {
    const body = text.trim();
    if (!body || !currentUser) return;
    const now = new Date().toISOString();
    const me = currentUser;
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId || !isTicketOwner(t, me, usersRef.current)) return t;
      const reopening = reopen && (t.status === 'resolved' || t.status === 'closed');
      return {
        ...t,
        // Adopt the canonical owner id so future lookups match directly.
        customerId: me.id,
        status: reopening ? 'open' : t.status,
        closedAt: reopening ? undefined : t.closedAt,
        messages: [...t.messages, { id: 'tm' + Date.now() + Math.random().toString(36).slice(2, 5), sender: 'customer', author: me.name, text: body, createdAt: now }],
        updatedAt: now,
      };
    }));
  };

  const replyTicket = (ticketId: string, text: string) => customerTicketReply(ticketId, text, false);
  const reopenTicket = (ticketId: string, text: string) => customerTicketReply(ticketId, text, true);

  const rateTicket = (ticketId: string, rating: number) => {
    if (!rating || rating < 1 || rating > 5) return;
    const now = new Date().toISOString();
    const me = currentUser;
    setTickets(prev => prev.map(t => (me && t.id === ticketId && isTicketOwner(t, me, usersRef.current)) ? { ...t, rating, ratedAt: now, updatedAt: now } : t));
    track('ticket_rated', { rating });
  };

  const adminReplyTicket = (ticketId: string, text: string) => {
    const body = text.trim();
    if (!body) return;
    const now = new Date().toISOString();
    const author = currentUser?.name || 'تیم پشتیبانی';
    let target: SupportTicket | undefined;
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      target = t;
      return {
        ...t,
        // First staff answer automatically moves the ticket into "in progress"
        status: t.status === 'open' ? 'in_progress' : t.status,
        assignedTo: t.assignedTo || author,
        messages: [...t.messages, { id: 'tm' + Date.now() + Math.random().toString(36).slice(2, 5), sender: 'support', author, text: body, createdAt: now }],
        updatedAt: now,
      };
    }));
    // Persist synchronously as well. The React effect that mirrors `tickets`
    // into localStorage only runs while the app stays open — without this
    // immediate write, an answer posted by the admin and followed by a quick
    // page refresh could be lost before it ever hit storage, and the customer
    // would never see the reply.
    try {
      if (target) localStorage.setItem('hamyar_tickets', JSON.stringify([target, ...ticketsRef.current.filter(x => x.id !== target!.id)]));
    } catch { /* storage unavailable — the state effect will retry */ }
    // Notify the customer through the same SMS pipeline used by the order flows
    setTimeout(() => {
      if (target) {
        if (target.customerPhone) pushSmsLog(target.customerPhone, `پاسخ تیکت «${target.subject}» (${target.code}) ثبت شد. برای مشاهده به پنل کاربری خود مراجعه کنید.`);
        pushAuditLog('پاسخ تیکت', `پاسخ به تیکت ${target.code} – ${target.subject}`, 'پشتیبانی');
      }
    }, 0);
  };

  const updateTicket: AppContextType['updateTicket'] = (id, patch) => {
    const now = new Date().toISOString();
    let target: SupportTicket | undefined;
    setTickets(prev => prev.map(t => {
      if (t.id !== id) return t;
      target = t;
      const next: SupportTicket = { ...t, ...patch, updatedAt: now };
      if (patch.status === 'resolved' || patch.status === 'closed') next.closedAt = now;
      if (patch.status === 'open' || patch.status === 'in_progress') next.closedAt = undefined;
      return next;
    }));
    setTimeout(() => {
      if (target && patch.status && patch.status !== target.status) {
        pushAuditLog('تغییر وضعیت تیکت', `تیکت ${target.code}: ${TICKET_STATUS_LABELS[target.status]} ← ${TICKET_STATUS_LABELS[patch.status]}`, 'پشتیبانی');
      }
    }, 0);
  };

  // ---------------------------------------------------------------------------
  // Customer club / gamification engine (defined before the order flows so they
  // can award purchase points; all reads go through refs to avoid stale state)
  // ---------------------------------------------------------------------------
  const loyaltyTxRef = useRef(loyaltyTx);
  useEffect(() => { loyaltyTxRef.current = loyaltyTx; }, [loyaltyTx]);
  const configRef = useRef(gamificationConfig);
  useEffect(() => { configRef.current = gamificationConfig; }, [gamificationConfig]);

  const setGamificationConfig = (c: GamificationConfig) => setGamificationConfigState(c);

  // Wipe every hard-coded / legacy point balance and transaction, then restart the
  // club from zero. From now on all points come exclusively from the settings in
  // the admin «کدهای دعوت» section.
  const resetLoyaltyData = () => {
    localStorage.setItem(GAMIFICATION_RESET_KEY, new Date().toISOString());
    setUsers(usersRef.current.map(u => u.role === 'customer' ? {
      ...u,
      loyaltyPoints: 0,
      totalEarnedPoints: 0,
      lastLoginStreakDate: undefined,
      loginStreak: undefined,
      level: 'normal' as const,
    } : u));
    setLoyaltyTx([]);
    // Also zero the logged-in customer's live session copy (it re-syncs to storage).
    if (currentUser && currentUser.role === 'customer') {
      setCurrentUser({ ...currentUser, loyaltyPoints: 0, totalEarnedPoints: 0, loginStreak: undefined, lastLoginStreakDate: undefined, level: 'normal' });
    }
    pushAuditLog('پاکسازی امتیازها', 'تمام امتیازهای هاردکور/قدیمی باشگاه مشتریان حذف و از صفر شروع شد', 'دعوت‌ها');
  };

  // Evaluate a user's badges live against the (admin-editable) badge definitions.
  const getEarnedBadges = (user: User) => {
    const cfg = configRef.current;
    const ordersCount = ordersRef.current.filter(o => o.customerId === user.id && o.status !== 'cancelled').length;
    const reviewsCount = reviews.filter(r => r.customerName === user.name).length;
    const metrics: Record<GamificationBadgeDef['metric'], number> = {
      invitedCount: user.invitedCount || 0,
      totalEarnedPoints: user.totalEarnedPoints ?? user.loyaltyPoints ?? 0,
      ordersCount,
      reviewsCount,
      loginStreak: user.loginStreak || 0,
    };
    return cfg.badges.map(def => {
      const value = metrics[def.metric] ?? 0;
      const threshold = Math.max(1, def.threshold || 1);
      return { def, earned: value >= threshold, progress: Math.min(100, Math.round((value / threshold) * 100)) };
    });
  };

  const pushLoyaltyTx = (tx: Omit<LoyaltyTransaction, 'id' | 'createdAt'>) => {
    setLoyaltyTx(prev => [{
      ...tx,
      id: 'ltx' + Date.now() + Math.random().toString(36).slice(2, 6),
      createdAt: new Date().toISOString(),
    }, ...prev].slice(0, 2000));
  };

  // Award points to any user. Updates both the spendable balance (`loyaltyPoints`)
  // and lifetime earnings (`totalEarnedPoints`), then auto-promotes the tier unless
  // disabled. Always works from usersRef so it never clobbers concurrent updates.
  const awardLoyaltyPoints = (userId: string, points: number, reason: string, opts?: { category?: LoyaltyCategory; autoLevelUp?: boolean }) => {
    if (!Number.isFinite(points) || points <= 0) return;
    const cfg = configRef.current;
    const base = usersRef.current;
    const target = base.find(u => u.id === userId);
    if (!target) return;
    const nextPoints = (target.loyaltyPoints || 0) + points;
    const nextTotal = (target.totalEarnedPoints ?? target.loyaltyPoints ?? 0) + points;
    const level = opts?.autoLevelUp === false
      ? target.level
      : computeLevelFromPoints(nextTotal, cfg.tiers);
    setUsers(base.map(u => u.id === userId ? { ...u, loyaltyPoints: nextPoints, totalEarnedPoints: nextTotal, level } : u));
    pushLoyaltyTx({ userId, points, reason, category: opts?.category || 'manual', byAdmin: currentUser?.role === 'admin' });
  };

  // Admin manual debit: reduce a user's spendable balance only (lifetime earned
  // stays intact so tiers are not silently demoted by a correction).
  const deductLoyaltyPointsForAdmin = (userId: string, points: number, reason: string) => {
    if (!Number.isFinite(points) || points <= 0) return false;
    const base = usersRef.current;
    const target = base.find(u => u.id === userId);
    if (!target || (target.loyaltyPoints || 0) < points) return false;
    setUsers(base.map(u => u.id === userId ? { ...u, loyaltyPoints: (u.loyaltyPoints || 0) - points } : u));
    pushLoyaltyTx({ userId, points: -points, reason, category: 'manual', byAdmin: true });
    return true;
  };

  const setUserLevel = (userId: string, level: User['level']) => {
    const u = usersRef.current.find(x => x.id === userId);
    setUsers(usersRef.current.map(x => x.id === userId ? { ...x, level } : x));
    if (u) pushAuditLog('تغییر سطح باشگاه مشتریان', `سطح «${u.name}» به «${level}» تغییر کرد`, 'دعوت‌ها');
  };

  // Redeem a reward catalog item for a user (used by admin panel & customer club).
  const redeemLoyaltyReward = (userId: string, rewardId: string): { ok: boolean; error?: string } => {
    const cfg = configRef.current;
    const reward = cfg.rewards.find(r => r.id === rewardId);
    if (!reward) return { ok: false, error: 'پاداش یافت نشد' };
    if (!reward.enabled) return { ok: false, error: 'این پاداش غیرفعال است' };
    const target = usersRef.current.find(u => u.id === userId);
    if (!target) return { ok: false, error: 'کاربر یافت نشد' };
    if ((target.loyaltyPoints || 0) < reward.cost) return { ok: false, error: 'امتیاز کافی نیست' };
    setUsers(usersRef.current.map(u => u.id === userId ? { ...u, loyaltyPoints: (u.loyaltyPoints || 0) - reward.cost } : u));
    pushLoyaltyTx({ userId, points: -reward.cost, reason: `ثبت‌نام پاداش: ${reward.title}`, category: 'redeem' });
    pushAuditLog('خرج امتیاز باشگاه', `${target.name} پاداش «${reward.title}» (${reward.cost} امتیاز) را فعال کرد`, 'دعوت‌ها');
    return { ok: true };
  };

  // Purchase-based earning: called when an order becomes delivered/paid.
  const awardPurchasePoints = (orderUserId: string | undefined, amount: number, trackingCode: string) => {
    if (!orderUserId || amount <= 0) return;
    const cfg = configRef.current;
    if (!cfg.enabled || cfg.pointsPerToman <= 0) return;
    const target = usersRef.current.find(u => u.id === orderUserId);
    if (!target || target.role !== 'customer') return;
    const tier = cfg.tiers.find(t => t.level === target.level) || cfg.tiers[0];
    const raw = Math.floor(amount / cfg.pointsPerToman) * (tier?.multiplier || 1);
    const pts = Math.max(1, Math.round(raw));
    awardLoyaltyPoints(orderUserId, pts, `امتیاز خرید سفارش ${trackingCode} (${tier?.label || 'عادی'} ×${tier?.multiplier || 1})`, { category: 'purchase' });
  };

  // Customer club: bonus for submitting a review (called from ProductDetail).
  const awardReviewPoints = () => {
    if (!currentUser || currentUser.role !== 'customer') return;
    const cfg = configRef.current;
    if (!cfg.enabled || cfg.reviewBonus <= 0) return;
    awardLoyaltyPoints(currentUser.id, cfg.reviewBonus, 'ثبت نظر درباره محصول/خدمت', { category: 'review' });
  };

  // Daily-login streak bonus: credited at most once per calendar day per user.
  // Also evaluates the other passive gamification rewards on every login:
  //  - profile completion one-time bonus (name + username set)
  //  - birthday bonus (once per Gregorian year, if today is the user's birthday)
  const applyLoginStreak = (user: User): User => {
    const cfg = configRef.current;
    if (!cfg.enabled || user.role !== 'customer') return user;
    let updated: User = user;

    // --- profile completion one-time bonus ---
    if (cfg.profileCompletionBonus > 0 && !updated.lastProfileBonusDate) {
      const profileComplete = !!updated.name?.trim() && !!updated.username?.trim();
      if (profileComplete) {
        const total = (updated.totalEarnedPoints ?? updated.loyaltyPoints ?? 0) + cfg.profileCompletionBonus;
        updated = {
          ...updated,
          lastProfileBonusDate: new Date().toISOString(),
          loyaltyPoints: (updated.loyaltyPoints || 0) + cfg.profileCompletionBonus,
          totalEarnedPoints: total,
          level: computeLevelFromPoints(total, cfg.tiers),
        };
        pushLoyaltyTx({ userId: updated.id, points: cfg.profileCompletionBonus, reason: 'پاداش تکمیل پروفایل 👤', category: 'profile' });
      }
    }

    // --- birthday bonus (once per year) ---
    if (cfg.birthdayBonus > 0 && updated.birthDate) {
      const bd = new Date(updated.birthDate);
      const now = new Date();
      const isBirthday = bd.getMonth() === now.getMonth() && bd.getDate() === now.getDate();
      const thisYearJan1 = `${now.getFullYear()}-01-01`;
      if (isBirthday && !(updated.lastBirthdayBonusDate && updated.lastBirthdayBonusDate >= thisYearJan1)) {
        const vip = updated.level === 'vip';
        const pts = vip ? cfg.birthdayBonus * 2 : cfg.birthdayBonus; // VIP perk: double birthday gift
        const total = (updated.totalEarnedPoints ?? updated.loyaltyPoints ?? 0) + pts;
        updated = {
          ...updated,
          lastBirthdayBonusDate: now.toISOString(),
          loyaltyPoints: (updated.loyaltyPoints || 0) + pts,
          totalEarnedPoints: total,
          level: computeLevelFromPoints(total, cfg.tiers),
        };
        pushLoyaltyTx({ userId: updated.id, points: pts, reason: `هدیه تولد 🎁${vip ? ' (VIP دوچندان)' : ''}`, category: 'birthday' });
      }
    }

    if (!cfg.dailyLoginBonus || cfg.dailyLoginBonus <= 0) return updated;
    const today = new Date().toISOString().slice(0, 10);
    if (updated.lastLoginStreakDate === today) return updated;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const streak = updated.lastLoginStreakDate === yesterday ? (updated.loginStreak || 0) + 1 : 1;
    const cappedDay = Math.min(streak, cfg.streakMaxDays || 7);
    const bonus = Math.round(cfg.dailyLoginBonus * cappedDay * (cfg.streakDayMultiplier || 1));
    const nextTotal = (updated.totalEarnedPoints ?? updated.loyaltyPoints ?? 0) + bonus;
    updated = {
      ...updated,
      loginStreak: streak,
      lastLoginStreakDate: today,
      loyaltyPoints: (updated.loyaltyPoints || 0) + bonus,
      totalEarnedPoints: nextTotal,
      level: computeLevelFromPoints(nextTotal, cfg.tiers),
    };
    setUsers(usersRef.current.map(u => u.id === updated.id ? updated : u));
    pushLoyaltyTx({ userId: updated.id, points: bonus, reason: `ورود روزانه — روز ${streak} از استریک 🔥`, category: 'login_streak' });
    return updated;
  };

  // Issue a receipt (رسید) invoice when an order is delivered
  const issueDeliveryReceipt = (order: Order) => {
    if (order.receiptInvoiceId && invoicesRef.current.some(inv => inv.id === order.receiptInvoiceId)) return;
    const now = new Date();
    const invoice: Invoice = {
      id: 'inv' + Date.now() + Math.random().toString(36).slice(2, 6),
      invoiceNumber: 'RCPT-' + now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + order.trackingCode.replace(/[^A-Za-z0-9]/g, ''),
      orderId: order.id,
      type: order.type === 'product' ? 'product' : order.type === 'media' ? 'media' : order.type === 'webdesign' ? 'webdesign' : 'service',
      date: now.toISOString(),
      customerName: order.customerName,
      items: (order.items && order.items.length > 0)
        ? order.items.map((it: any) => ({
            name: it.name || 'محصول',
            quantity: Number(it.quantity) || 1,
            unit: 'عدد',
            price: Number(it.price) || 0,
          }))
        : [{ name: order.description || 'خدمات ارائه‌شده', quantity: 1, unit: 'خدمت', price: order.total }],
      subtotal: order.total,
      discount: 0,
      discountType: 'fixed',
      discountAmount: 0,
      tax: 0,
      taxAmount: 0,
      total: order.total,
      note: `رسید تحویل سفارش ${order.trackingCode}`,
      status: order.remaining <= 0 ? 'paid' : 'issued',
      createdAt: now.toISOString(),
    };
    setInvoices(prev => [invoice, ...prev]);
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, receiptInvoiceId: invoice.id } : o));
    pushAuditLog('صدور رسید', `رسید «${invoice.invoiceNumber}» برای سفارش ${order.trackingCode} صادر شد`, 'فاکتورها');
    // اعلان مالی – رنگ سبز مخصوص خود
    pushNotification({ type: 'payment', title: 'رسید تحویل صادر شد', message: `رسید «${invoice.invoiceNumber}» برای سفارش ${order.trackingCode} به مبلغ ${order.total.toLocaleString('fa-IR')} تومان صادر شد.`, link: '/admin/invoices', priority: 'normal', key: 'rcpt-' + invoice.id });
  };

  // Apply product-order stock deduction at delivery time (single source of truth)
  const applyProductStockAtDelivery = (order: Order, delivered: boolean) => {
    if (order.type !== 'product') return;
    const lines = (order.items || []).filter((it: any) => it?.productId);
    if (lines.length === 0) return;
    setProducts(prev => prev.map(p => {
      const line = lines.find((it: any) => it.productId === p.id);
      if (!line) return p;
      const qty = Math.max(0, Number(line.quantity) || 0);
      const next = delivered ? Math.max(0, p.stock - qty) : p.stock + qty;
      return next === p.stock ? p : { ...p, stock: next };
    }));
  };

  // Central patch function – keeps orders/stock/invoices/logs consistent
  const updateOrder = (id: string, patch: Partial<Order>) => {
    const prevList = ordersRef.current;
    const target = prevList.find(o => o.id === id);
    if (!target) return;
    const nextList = prevList.map(o => o.id === id ? { ...o, ...patch } : o);
    setOrders(nextList);
    syncStockWithDeliveredOrders(prevList, nextList);
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    const order = ordersRef.current.find(o => o.id === id);
    if (!order || order.status === status) return;

    const wasDelivered = order.status === 'delivered';
    const isDelivered = status === 'delivered';
    const history = [...(order.statusHistory || [{ status: order.status, date: order.createdAt }]), { status, date: new Date().toISOString() }];

    setOrders(ordersRef.current.map(o => o.id === id ? { ...o, status, statusHistory: history } : o));

    // Notify the customer via SMS log so the public tracking info stays in sync
    const customer = users.find(u => u.id === order.customerId);
    if (customer?.phone) {
      pushSmsLog(customer.phone, `وضعیت سفارش ${order.trackingCode} به «${ORDER_STATUS_LABELS[status as OrderStatus] || status}» تغییر کرد.`);
    }
    pushAuditLog('تغییر وضعیت سفارش', `سفارش ${order.trackingCode} از «${ORDER_STATUS_LABELS[order.status] || order.status}» به «${ORDER_STATUS_LABELS[status as OrderStatus] || status}» تغییر یافت`, 'سفارشات');

    if (isDelivered && !wasDelivered) {
      // Stock deduction is handled by the effect below (single source of truth)
      issueDeliveryReceipt(order);
      // Customer club: award purchase points once the order is completed
      awardPurchasePoints(order.customerId, order.paid || order.total, order.trackingCode);
    }
  };

  // ---------------------------------------------------------------------------
  // Online service-order wizard (public side). Creates a fully-paid service
  // order and keeps every related admin section in sync with its order code:
  //   • Orders (kanban/list) receive the order with its details + documents
  //   • Invoices receive an immediate payment receipt (status: paid)
  //   • Finance income (sum of order.paid) reflects the payment automatically
  //   • The customer gets an SMS with the tracking code
  //   • The audit log records the payment method and gateway reference
  // ---------------------------------------------------------------------------
  const createServiceOrder: AppContextType['createServiceOrder'] = ({
    service, quantity, urgent, formData, documents, paymentMethod, gatewayRef,
  }) => {
    if (!currentUser) return { ok: false, error: 'برای ثبت سفارش ابتدا وارد حساب کاربری خود شوید' };
    const qty = Math.max(1, Number(quantity) || 1);
    const unitPrice = urgent ? Math.round(service.basePrice * SERVICE_URGENCY_MULTIPLIER) : service.basePrice;
    const total = unitPrice * qty;

    let paidAmount = 0;
    if (paymentMethod === 'wallet') {
      const balance = currentUser.walletBalance || 0;
      if (balance < total) return { ok: false, error: 'موجودی کیف پول شما کافی نیست. لطفاً کیف پول را شارژ کنید یا پرداخت آنلاین را انتخاب نمایید.' };
      // Deduct from the authoritative users list (and the live session) at once
      const updatedUsers = usersRef.current.map(u =>
        u.id === currentUser.id ? { ...u, walletBalance: (u.walletBalance || 0) - total } : u);
      setUsers(updatedUsers);
      setCurrentUser(cu => cu ? { ...cu, walletBalance: (cu.walletBalance || 0) - total } : cu);
      paidAmount = total;
    } else {
      // Online gateway flow – in this demo the gateway callback confirms payment
      paidAmount = total;
    }

    const now = new Date();
    const orderId = 'o' + Date.now();
    const trackingCode = 'HMY-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const order: Order = {
      id: orderId,
      trackingCode,
      customerId: currentUser.id,
      customerName: formData.fullName || currentUser.name,
      type: 'service',
      channel: 'وب‌سایت',
      status: 'new',
      priority: urgent ? 'urgent' : 'normal',
      items: [{ name: service.name, price: unitPrice, quantity: qty, total, image: '' }],
      total,
      paid: paidAmount,
      remaining: total - paidAmount,
      createdAt: now.toISOString(),
      description: `سفارش آنلاین خدمت «${service.name}» (${qty} ${service.unit})${urgent ? ' – فوری' : ''}`,
      statusHistory: [{ status: 'new' as OrderStatus, date: now.toISOString() }],
      serviceId: service.id,
      formData,
      documents,
      paymentMethod,
      gatewayRef,
      documentStatus: 'pending',
    };
    setOrders([...ordersRef.current, order]);

    // Payment receipt invoice linked to the order id (visible in admin invoices)
    const invoice: Invoice = {
      id: 'inv' + Date.now() + Math.random().toString(36).slice(2, 6),
      invoiceNumber: 'PAY-' + now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + trackingCode.replace(/[^A-Za-z0-9]/g, ''),
      orderId,
      type: 'service',
      date: now.toISOString(),
      customerName: order.customerName,
      customerPhone: formData.phone || currentUser.phone,
      items: [{ name: service.name, quantity: qty, unit: service.unit, price: unitPrice }],
      subtotal: total,
      discount: 0,
      discountType: 'fixed',
      discountAmount: 0,
      tax: 0,
      taxAmount: 0,
      total,
      note: `رسید پرداخت آنلاین سفارش ${trackingCode} – روش پرداخت: ${paymentMethod === 'wallet' ? 'کیف پول' : 'درگاه اینترنتی'}${gatewayRef ? ` (کد پیگیری بانک: ${gatewayRef})` : ''}`,
      status: 'paid',
      createdAt: now.toISOString(),
    };
    setInvoices(prev => [{ ...invoice }, ...prev]);
    setOrders(cur => cur.map(o => o.id === orderId ? { ...o, receiptInvoiceId: invoice.id } : o));

    pushSmsLog(currentUser.phone || formData.phone || '', `سفارش «${service.name}» با کد رهگیری ${trackingCode} ثبت و پرداخت شد. مجموع: ${total.toLocaleString('fa-IR')} تومان.`);
    pushAuditLog('ثبت سفارش آنلاین خدمات', `سفارش ${trackingCode} برای خدمت «${service.name}» به مبلغ ${total.toLocaleString('fa-IR')} تومان از طریق ${paymentMethod === 'wallet' ? 'کیف پول' : 'درگاه اینترنتی'} پرداخت شد${gatewayRef ? ` (رفرنس ${gatewayRef})` : ''}`, 'سفارشات');
    // هر نوع اعلان رنگ مخصوص خود را دارد: سفارش = آبی، پرداخت = سبز
    pushNotification({ type: 'order', title: 'سفارش جدید', message: `سفارش «${service.name}» با کد ${trackingCode} و مبلغ ${total.toLocaleString('fa-IR')} تومان ثبت شد.`, link: '/admin/orders', priority: urgent ? 'urgent' : 'high', key: 'order-' + orderId });
    pushNotification({ type: 'payment', title: 'پرداخت آنلاین موفق', message: `مبلغ ${total.toLocaleString('fa-IR')} تومان بابت سفارش ${trackingCode} از طریق ${paymentMethod === 'wallet' ? 'کیف پول' : 'درگاه اینترنتی'} پرداخت شد.`, link: '/admin/invoices', priority: 'normal', key: 'pay-' + orderId });

    return { ok: true, order };
  };

  // ---------------------------------------------------------------------------
  // Same wizard for the items of the «طراحی سایت» and «تولید محتوا» pages.
  // After the customer completes the extra-information form, uploads the docs
  // from disk and pays through the gateway or the wallet, a tracking code is
  // generated and every admin section that references this code stays in sync:
  //   • Orders (طراحی سایت / تولید محتوا) with details + documents
  //   • A linked project in admin Projects (stage/payment/progress sync)
  //   • Payment-receipt invoice in Invoices + income in Finance
  //   • SMS to the customer and an entry in the audit log
  // ---------------------------------------------------------------------------
  const createProjectOrder: AppContextType['createProjectOrder'] = ({
    projectService, quantity, urgent, formData, documents, paymentMethod, gatewayRef,
  }) => {
    if (!currentUser) return { ok: false, error: 'برای ثبت سفارش ابتدا وارد حساب کاربری خود شوید' };
    const qty = Math.max(1, Number(quantity) || 1);
    const unitPrice = urgent ? Math.round(projectService.basePrice * SERVICE_URGENCY_MULTIPLIER) : projectService.basePrice;
    const total = unitPrice * qty;

    let paidAmount = 0;
    if (paymentMethod === 'wallet') {
      const balance = currentUser.walletBalance || 0;
      if (balance < total) return { ok: false, error: 'موجودی کیف پول شما کافی نیست. لطفاً کیف پول را شارژ کنید یا پرداخت آنلاین را انتخاب نمایید.' };
      const updatedUsers = usersRef.current.map(u =>
        u.id === currentUser.id ? { ...u, walletBalance: (u.walletBalance || 0) - total } : u);
      setUsers(updatedUsers);
      setCurrentUser(cu => cu ? { ...cu, walletBalance: (cu.walletBalance || 0) - total } : cu);
      paidAmount = total;
    } else {
      // Online gateway flow – in this demo the gateway callback confirms payment
      paidAmount = total;
    }

    const now = new Date();
    const orderId = 'o' + Date.now();
    const trackingCode = 'HMY-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const groupLabel = projectService.group === 'webdesign' ? 'طراحی سایت' : 'تولید محتوا';
    const order: Order = {
      id: orderId,
      trackingCode,
      customerId: currentUser.id,
      customerName: formData.fullName || currentUser.name,
      type: projectService.group === 'webdesign' ? 'webdesign' : 'service',
      channel: 'وب‌سایت',
      status: 'new',
      priority: urgent ? 'urgent' : 'normal',
      items: [{ name: projectService.title, price: unitPrice, quantity: qty, total, image: '' }],
      total,
      paid: paidAmount,
      remaining: total - paidAmount,
      createdAt: now.toISOString(),
      description: `سفارش آنلاین «${projectService.title}» (${groupLabel}) – ${qty} ${projectService.unit}${urgent ? ' – فوری' : ''}`,
      statusHistory: [{ status: 'new' as OrderStatus, date: now.toISOString() }],
      projectServiceId: projectService.id,
      formData,
      documents,
      paymentMethod,
      gatewayRef,
      documentStatus: 'pending',
    };

    // Linked project in the admin Projects board (kept in sync via projectId).
    // Content-production orders are NOT created here – they belong to the
    // «تیم تولید محتوا» section only and must not show up in بخش پروژه‌ها.
    const projectId = 'pr' + Date.now();
    const domainOrLink = formData.domainName || formData.siteUrl || formData.accountLink || '';
    const newProject: Project = {
      id: projectId,
      title: `${projectService.title} – ${order.customerName}`,
      clientName: order.customerName,
      type: groupLabel,
      stage: 'پیش‌پرداخت',
      domain: domainOrLink || undefined,
      deadline: formData.deadline || '',
      totalCost: total,
      paidAmount: paidAmount,
      progress: 5,
      description: `خودکار از سفارش ${trackingCode}. جزئیات: ${Object.entries(formData).filter(([k]) => !['fullName', 'phone', 'email'].includes(k)).map(([k, v]) => `${PROJECT_FIELD_LABELS[k] || k}: ${v}`).join(' | ')}`,
    };
    if (projectService.group === 'content') newProject.hiddenFromProjects = true;
    order.projectId = projectId;

    // ---- Sync with the admin «تیم تولید محتوا» section ----
    // Every paid online content order automatically becomes a production task
    // in the content team pipeline, carrying the customer's details (formData),
    // deadline and budget, and is linked back to the order via trackingCode.
    if (projectService.group === 'content') {
      const contentTaskId = 'cp' + Date.now();
      const docSummary = documents.length > 0
        ? `\n\nمدارک دریافتی از مشتری:\n- ${documents.map(d => d.label).join('\n- ')}`
        : '\n\nهنوز مدرکی بارگذاری نشده است.';
      const newContentTask: ContentProject = {
        id: contentTaskId,
        title: `${projectService.title} – سفارش ${trackingCode}`,
        type: CONTENT_SERVICE_TYPE_MAP[projectService.id] || 'article',
        scenario: `سفارش آنلاین «${projectService.title}» از سمت مشتری ${order.customerName}${urgent ? ' (فوری)' : ''}.\n\nاطلاعات تکمیلی مشتری:\n${Object.entries(formData).map(([k, v]) => `- ${PROJECT_FIELD_LABELS[k] || k}: ${v}`).join('\n')}${docSummary}`,
        equipment: [],
        contentPlan: `تحویل خروجی طبق بریف مشتری و مدارک بارگذاری‌شده در سفارش ${trackingCode}.`,
        assignedTo: [],
        startDate: now.toISOString().split('T')[0],
        deadline: formData.deadline || '',
        status: 'planning',
        priority: urgent ? 'urgent' : 'medium',
        notes: `این تسک به‌صورت خودکار از سفارش آنلاین ${trackingCode} ایجاد شده و با آن همگام است.`,
        tags: ['سفارش آنلاین', groupLabel],
        relatedProducts: [],
        relatedCampaigns: [],
        budget: total,
        actualCost: 0,
        qualityScore: 0,
        qualityChecklist: [],
        approvalStage: 'draft',
        versions: [],
        createdAt: now.toISOString(),
        sourceOrderId: orderId,
        sourceTrackingCode: trackingCode,
        customerName: order.customerName,
      };
      order.contentProjectId = contentTaskId;
      setContentProjects([newContentTask, ...contentProjects]);
    }

    setOrders([...ordersRef.current, order]);
    setProjects([...projects, newProject]);

    // Payment receipt invoice linked to the order id (visible in admin invoices)
    const invoice: Invoice = {
      id: 'inv' + Date.now() + Math.random().toString(36).slice(2, 6),
      invoiceNumber: 'PAY-' + now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + trackingCode.replace(/[^A-Za-z0-9]/g, ''),
      orderId,
      type: projectService.group === 'webdesign' ? 'webdesign' : 'service',
      date: now.toISOString(),
      customerName: order.customerName,
      customerPhone: formData.phone || currentUser.phone,
      items: [{ name: projectService.title, quantity: qty, unit: projectService.unit, price: unitPrice }],
      subtotal: total,
      discount: 0,
      discountType: 'fixed',
      discountAmount: 0,
      tax: 0,
      taxAmount: 0,
      total,
      note: `رسید پرداخت آنلاین سفارش ${trackingCode} (${groupLabel}) – روش پرداخت: ${paymentMethod === 'wallet' ? 'کیف پول' : 'درگاه اینترنتی'}${gatewayRef ? ` (کد پیگیری بانک: ${gatewayRef})` : ''}`,
      status: 'paid',
      createdAt: now.toISOString(),
    };
    setInvoices(prev => [{ ...invoice }, ...prev]);
    setOrders(cur => cur.map(o => o.id === orderId ? { ...o, receiptInvoiceId: invoice.id } : o));

    pushSmsLog(currentUser.phone || formData.phone || '', `سفارش «${projectService.title}» (${groupLabel}) با کد رهگیری ${trackingCode} ثبت و پرداخت شد. مجموع: ${total.toLocaleString('fa-IR')} تومان. پروژه مربوطه در پنل مدیریت ایجاد شد.`);
    pushAuditLog('ثبت سفارش آنلاین پروژه', `سفارش ${trackingCode} برای «${projectService.title}» (${groupLabel}) به مبلغ ${total.toLocaleString('fa-IR')} تومان از طریق ${paymentMethod === 'wallet' ? 'کیف پول' : 'درگاه اینترنتی'} پرداخت شد${gatewayRef ? ` (رفرنس ${gatewayRef})` : ''} و پروژه مرتبط آن در بخش پروژه‌ها ایجاد گردید${projectService.group === 'content' ? '؛ همچنین تسک تولید محتوای آن در بخش «تیم تولید محتوا» ایجاد شد' : ''}`, 'سفارشات');
    // هر نوع اعلان رنگ مخصوص خود را دارد: سفارش = آبی، پرداخت = سبز
    pushNotification({ type: 'order', title: 'سفارش جدید', message: `سفارش «${projectService.title}» (${groupLabel}) با کد ${trackingCode} و مبلغ ${total.toLocaleString('fa-IR')} تومان ثبت شد.`, link: '/admin/orders', priority: urgent ? 'urgent' : 'high', key: 'order-' + orderId });
    pushNotification({ type: 'payment', title: 'پرداخت آنلاین موفق', message: `مبلغ ${total.toLocaleString('fa-IR')} تومان بابت سفارش ${trackingCode} از طریق ${paymentMethod === 'wallet' ? 'کیف پول' : 'درگاه اینترنتی'} پرداخت شد.`, link: '/admin/invoices', priority: 'normal', key: 'pay-' + orderId });

    return { ok: true, order };
  };

  // ---- Sync order status with the admin «تیم تولید محتوا» task ----
  const prevOrdersForContentSync = useRef<Order[]>(orders);
  useEffect(() => {
    const prev = prevOrdersForContentSync.current;
    prevOrdersForContentSync.current = orders;

    const changed = orders.filter(o => {
      const old = prev.find(p => p.id === o.id);
      return old && (old.status !== o.status || old.documentStatus !== o.documentStatus);
    });
    const linked = changed.filter(o => o.contentProjectId);
    if (linked.length === 0) return;

    // Order status -> content team pipeline stage
    const nextStatus: Record<OrderStatus, ContentProject['status']> = {
      new: 'planning', processing: 'in-progress', ready: 'review', delivered: 'published', cancelled: 'completed',
    };
    setContentProjects(cur => cur.map(cp => {
      const o = linked.find(x => x.contentProjectId === cp.id);
      if (!o) return cp;
      if (o.status === 'cancelled') {
        return { ...cp, status: 'completed' as const, notes: `${cp.notes}\n⛔ سفارش مرجع ${o.trackingCode} لغو شد.` };
      }
      const oldO = prev.find(p => p.id === o.id);
      const docsNote = o.documentStatus === 'rejected' && oldO?.documentStatus !== 'rejected'
        ? `\n⚠️ مدارک سفارش ${o.trackingCode} توسط مدیر رد شد؛ مشتری باید مدارک را دوباره بارگذاری کند.`
        : o.documentStatus === 'approved' && oldO?.documentStatus !== 'approved'
          ? `\n✅ مدارک سفارش ${o.trackingCode} تأیید شد؛ تولید را آغاز کنید.`
          : '';
      return {
        ...cp,
        status: nextStatus[o.status],
        budget: o.total,
        deadline: o.formData?.deadline || cp.deadline,
        notes: cp.notes + docsNote,
      };
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  // Reverse direction: when the content team publishes a linked task, the source
  // order automatically moves to «تحویل شده» in the Orders section.
  const prevContentForOrderSync = useRef<ContentProject[]>(contentProjects);
  useEffect(() => {
    const prev = prevContentForOrderSync.current;
    prevContentForOrderSync.current = contentProjects;

    const published = contentProjects.filter(cp => {
      const old = prev.find(p => p.id === cp.id);
      return old && old.status !== 'published' && cp.status === 'published' && cp.sourceOrderId;
    });
    if (published.length === 0) return;
    published.forEach(cp => {
      const o = ordersRef.current.find(x => x.id === cp.sourceOrderId);
      if (o && o.status !== 'delivered') updateOrderStatus(o.id, 'delivered');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentProjects]);

  // Keep the admin Projects board synchronized with its source order:
  // when the order status changes, the linked project's stage/progress moves;
  // when the project stage reaches تحویل/تسویه, the order becomes delivered.
  const prevOrdersForProjectSync = useRef<Order[]>(orders);
  useEffect(() => {
    const prev = prevOrdersForProjectSync.current;
    prevOrdersForProjectSync.current = orders;

    const changed = orders.filter(o => {
      const old = prev.find(p => p.id === o.id);
      return old && old.status !== o.status;
    });
    const linked = changed.filter(o => o.projectId);
    if (linked.length === 0) return;

    const nextStage: Record<OrderStatus, string> = {
      new: 'قرارداد', processing: 'طراحی', ready: 'تایید', delivered: 'تحویل', cancelled: 'قرارداد',
    };
    const nextProgress: Record<OrderStatus, number> = {
      new: 15, processing: 50, ready: 85, delivered: 100, cancelled: 15,
    };
    setProjects(cur => cur.map(p => {
      const o = linked.find(x => x.projectId === p.id);
      if (!o) return p;
      if (o.status === 'cancelled') return { ...p, stage: 'مشاوره', progress: 0 };
      return {
        ...p,
        stage: nextStage[o.status],
        progress: Math.max(p.progress, nextProgress[o.status]),
        paidAmount: o.paid,
        totalCost: o.total,
      };
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  // Reverse direction of the sync: if an admin moves a linked project on the
  // Projects board, the source order status follows it immediately.
  const prevProjectsForOrderSync = useRef<Project[]>(projects);
  useEffect(() => {
    const prev = prevProjectsForOrderSync.current;
    prevProjectsForOrderSync.current = projects;

    const changed = projects.filter(p => {
      const old = prev.find(x => x.id === p.id);
      return old && old.stage !== p.stage;
    });
    if (changed.length === 0) return;

    const toStatus: Record<string, OrderStatus> = {
      'مشاوره': 'new', 'قرارداد': 'new', 'پیش‌پرداخت': 'new',
      'طراحی': 'processing', 'تایید': 'ready', 'راه‌اندازی': 'ready',
      'تحویل': 'delivered', 'تسویه': 'delivered',
    };
    changed.forEach(p => {
      const o = ordersRef.current.find(x => x.projectId === p.id);
      const target = toStatus[p.stage];
      if (!o || !target || o.status === target) return;
      updateOrderStatus(o.id, target);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  // Safety net: whenever the orders list changes (e.g. kanban drag & drop or
  // direct edits through setOrders), keep warehouse stock and receipts in sync.
  const prevOrdersRef = useRef<Order[]>(orders);
  useEffect(() => {
    const prev = prevOrdersRef.current;
    prevOrdersRef.current = orders;

    orders.forEach(o => {
      const old = prev.find(p => p.id === o.id);
      const becameDelivered = o.status === 'delivered' && (!old || old.status !== 'delivered');
      const stoppedBeingDelivered = old?.status === 'delivered' && o.status !== 'delivered';

      if (becameDelivered && !o.stockDeducted) {
        applyProductStockAtDelivery(o, true);
        setOrders(cur => cur.map(x => x.id === o.id ? { ...x, stockDeducted: true } : x));
        pushAuditLog('کسر موجودی انبار', `با تحویل سفارش ${o.trackingCode}، موجودی محصولات فروخته‌شده از انبار کسر شد`, 'محصولات');
      }
      if (stoppedBeingDelivered && o.stockDeducted) {
        applyProductStockAtDelivery(o, false);
        setOrders(cur => cur.map(x => x.id === o.id ? { ...x, stockDeducted: false } : x));
        pushAuditLog('بازگشت موجودی انبار', `وضعیت سفارش ${o.trackingCode} از «تحویل شد» خارج شد و موجودی به انبار بازگشت`, 'محصولات');
      }
      if (becameDelivered && !o.receiptInvoiceId) {
        issueDeliveryReceipt(o);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  const login = (phone: string, name: string, invitedBy?: string) => {
    // Always work from the latest users list so reward updates made right before
    // login (e.g. the inviter's bonus in Auth.tsx) are not overwritten.
    const cfg = configRef.current;
    const baseUsers = usersRef.current;
    let user = baseUsers.find(u => u.phone === phone);
    if (!user) {
      // Keep the id stable across logins: reuse the current session id when it
      // is not already taken by another account, otherwise fall back to the
      // legacy snapshot id / cached identity (pre-fix sessions) and finally a
      // fresh id. A brand new id per visit used to orphan every previously
      // created ticket.
      const cu = currentUserRef.current;
      const legacyId = initialCustomerSessionRef.current?.id;
      const identity = readCachedIdentity();
      const free = (id?: string) => !!id && !baseUsers.some(u => u.id === id);
      const reusedId =
        cu && cu.role === 'customer' && cu.phone === phone && free(cu.id) ? cu.id :
        free(legacyId) && (!cu || cu.role !== 'customer' || cu.phone === phone) ? legacyId :
        identity && identity.phone === phone && free(identity.id) ? identity.id : undefined;
      user = {
        id: reusedId || 'u' + Date.now(),
        username: phone,
        password: '',
        role: 'customer',
        name,
        phone,
        inviteCode: 'INV' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        invitedBy,
        invitedCount: 0,
        loyaltyPoints: 0,
        totalEarnedPoints: 0,
        level: 'normal',
        favorites: [],
        selectedMedia: [],
        createdAt: new Date().toISOString()
      };
      setUsers([...baseUsers, user]);
      // اعلان کاربر جدید – رنگ نارنجی مخصوص خود
      if (user.role === 'customer') {
        pushNotification({
          type: 'user',
          title: 'کاربر جدید عضو شد',
          message: `مشتری جدید «${user.name}» با شماره ${user.phone}${invitedBy ? ' از طریق کد دعوت' : ''} ثبت‌نام کرد.`,
          link: '/admin/customers',
          priority: 'normal',
          key: 'user-' + user.id,
        });
      }
      // Welcome bonus for a newly invited user — amount comes from the admin
      // gamification settings (config-driven, no hard-coded values).
      if (invitedBy && cfg.enabled && cfg.invitedUserBonus > 0) {
        awardLoyaltyPoints(user.id, cfg.invitedUserBonus, 'امتیاز خوش‌آمدگویی (کاربر دعوت‌شده)', { category: 'invite' });
        user = usersRef.current.find(u => u.id === user!.id) || user;
      }
    } else {
      // Existing customer signing in with an invite code for the first time:
      // record the referral and grant the rewards instead of silently ignoring it.
      const inviter = baseUsers.find(u => u.id === invitedBy);
      if (inviter && !user.invitedBy && user.role === 'customer') {
        const updatedUser: User = { ...user, invitedBy };
        const nextUsers = baseUsers.map(u => {
          if (u.id === inviter.id) {
            return { ...u, invitedCount: (u.invitedCount || 0) + 1 };
          }
          if (u.id === user!.id) return updatedUser;
          return u;
        });
        setUsers(nextUsers);
        // Keep the local reference in sync with the latest saved record so the
        // streak logic below never writes a stale copy over the new referral data.
        user = usersRef.current.find(u => u.id === user!.id) || updatedUser;
        // Inviter bonus — amount comes from the admin gamification settings.
        if (cfg.enabled && cfg.inviteBonus > 0) {
          awardLoyaltyPoints(inviter.id, cfg.inviteBonus, `پاداش دعوت دوست با کد ${inviter.inviteCode || ''}`, { category: 'invite' });
        }
      }
    }
    // Cache the resolved identity so a later logout → refresh → login (or even
    // a lost session snapshot) still resolves to this exact account id — the
    // tickets/orders created under it can never become invisible again.
    if (user.role === 'customer' && user.phone) {
      try {
        localStorage.setItem(CUSTOMER_IDENTITY_KEY, JSON.stringify({ id: user.id, phone: user.phone }));
      } catch { /* storage unavailable */ }
    }
    // Daily-login streak bonus (at most once per calendar day).
    setCurrentUser(applyLoginStreak(user));
  };

  // Permissions granted to the logged-in admin through its RBAC role.
  // `undefined` means "full access" (super admin / legacy sessions).
  const [userPermissions, setUserPermissions] = useState<string[] | undefined>(() => {
    try {
      const saved = localStorage.getItem('hamyar_user');
      if (!saved) return undefined;
      const u: User = JSON.parse(saved);
      if (u.role !== 'admin' || !u.currentAdminId) return undefined;
      const su = (JSON.parse(localStorage.getItem('hamyar_system_users') || '[]') as SystemUser[])
        .find(s => s.id === u.currentAdminId);
      if (!su) return undefined;
      const sr = JSON.parse(localStorage.getItem('hamyar_roles') || '[]') as Role[];
      return sr.find(r => r.id === su.roleId)?.permissions;
    } catch {
      return undefined;
    }
  });

  const hasPermission = (permId: string): boolean => {
    if (currentUser?.role !== 'admin') return false;
    // Super admin (and legacy sessions without a linked staff record) can see everything
    if (!currentUser.currentAdminId) return true;
    if (userPermissions === undefined) return true;
    return userPermissions.includes(permId);
  };

  // A page is reachable only if the logged-in admin has at least one of its
  // permissions. `undefined` means "no permission required" (e.g. the dashboard).
  const canAccessPage = (permIds?: string[]): boolean => {
    if (currentUser?.role !== 'admin') return false;
    if (!permIds || permIds.length === 0) return true;
    // Super admin (and legacy sessions without a linked staff record) can see everything
    if (!currentUser.currentAdminId) return true;
    if (userPermissions === undefined) return true;
    return permIds.some(p => userPermissions.includes(p));
  };

  // Build the session object for a staff account and make sure it also exists in
  // the users list (so orders, audit logs and the profile page keep working).
  const establishAdminSession = (su: SystemUser, roleName: string, perms?: string[]) => {
    const id = 'admin_' + su.id;
    const existing = usersRef.current.find(u => u.id === id);
    const sessionUser: User = {
      id,
      username: su.username,
      password: su.password,
      role: 'admin',
      name: su.name || su.username,
      phone: su.phone || '',
      loyaltyPoints: existing?.loyaltyPoints ?? 0,
      level: existing?.level ?? 'vip',
      favorites: existing?.favorites ?? [],
      selectedMedia: existing?.selectedMedia ?? [],
      currentAdminId: su.id,
      roleId: su.roleId,
      permissions: perms,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    setUsers([...usersRef.current.filter(u => u.id !== id), sessionUser]);
    setCurrentUser(sessionUser);
    setUserPermissions(perms);
    // Remember when this account last signed in
    setSystemUsers(systemUsersRef.current.map(s => s.id === su.id ? { ...s, lastLogin: new Date().toISOString() } : s));
    setAuditLogs(prev => [{
      ...logActivity(sessionUser.name, 'ورود', `ورود به پنل مدیریت با نقش «${roleName}»`, 'RBAC'),
      user: sessionUser.name,
    }, ...prev]);
  };

  const adminLogin = (username: string, password: string): boolean => {
    const uname = (username || '').trim();
    const pass = password || '';
    if (!uname || !pass) return false;

    // Built-in super admin (kept for backward compatibility). If its staff record
    // was edited in the RBAC section, the custom password set there also works.
    if (uname === 'admin') {
      const su = systemUsersRef.current.find(s => s.username.trim() === 'admin');
      if (su && su.active && pass === su.password) {
        establishAdminSession(su, 'مدیر کل', permissionsRef.current.map(p => p.id));
        return true;
      }
      if (pass === 'admin123') {
        if (su && !su.active) return false; // deactivated through the RBAC section
        const sessionUser: User = {
          id: 'admin',
          username: 'admin',
          password: 'admin123',
          role: 'admin',
          name: su?.name || 'مدیر سیستم',
          phone: su?.phone || '09913911880',
          loyaltyPoints: 0,
          level: 'vip',
          favorites: [],
          selectedMedia: [],
          createdAt: new Date().toISOString(),
        };
        setCurrentUser(sessionUser);
        setUserPermissions(undefined);
        return true;
      }
      return false;
    }

    // Any staff account created in the "کنترل دسترسی (RBAC)" section can log in too.
    // Username matching is case-insensitive so accounts saved with different casing
    // still work, and the role restrictions are attached to the session.
    const su = systemUsersRef.current.find(s => s.username.trim().toLowerCase() === uname.toLowerCase());
    if (!su) return false;
    if (!su.active) return false;
    if ((su.password || '') !== pass) return false;

    const role = rolesRef.current.find(r => r.id === su.roleId);
    establishAdminSession(su, role?.name || 'نامشخص', role?.permissions);
    return true;
  };

  // Create a staff account from the RBAC page. The account is registered both as a
  // SystemUser (for login) and as an admin User record (for the rest of the app),
  // so it can sign in through the admin login form right away.
  const createStaffUser = (data: { username: string; password: string; name: string; roleId: string; email?: string; phone?: string }) => {
    const uname = (data.username || '').trim();
    if (!uname) return { ok: false, error: 'نام کاربری را وارد کنید' };
    if (!(data.password || '')) return { ok: false, error: 'رمز عبور را وارد کنید' };
    if (!data.roleId) return { ok: false, error: 'یک نقش را انتخاب کنید' };
    if (systemUsersRef.current.some(s => s.username.trim().toLowerCase() === uname.toLowerCase())) {
      return { ok: false, error: 'این نام کاربری قبلاً ثبت شده است' };
    }

    const now = new Date().toISOString();
    const su: SystemUser = {
      id: 'sysuser' + Date.now(),
      username: uname,
      password: data.password,
      name: (data.name || '').trim() || uname,
      email: data.email,
      phone: data.phone,
      roleId: data.roleId,
      active: true,
      createdAt: now,
    };
    const nextSystemUsers = [...systemUsersRef.current, su];
    setSystemUsers(nextSystemUsers);
    systemUsersRef.current = nextSystemUsers;

    // Mirror the account into the users list as an admin user
    const uid = 'admin_' + su.id;
    const role = rolesRef.current.find(r => r.id === su.roleId);
    const adminUser: User = {
      id: uid,
      username: su.username,
      password: su.password,
      role: 'admin',
      name: su.name,
      phone: su.phone || '',
      loyaltyPoints: 0,
      level: 'vip',
      favorites: [],
      selectedMedia: [],
      currentAdminId: su.id,
      roleId: su.roleId,
      permissions: role?.permissions,
      createdAt: now,
    };
    const nextUsers = [...usersRef.current.filter(u => u.id !== uid), adminUser];
    setUsers(nextUsers);
    usersRef.current = nextUsers;

    pushAuditLog('ایجاد', `کاربر سیستم «${su.username}» با نقش «${role?.name || 'نامشخص'}» ایجاد شد`, 'RBAC');
    return { ok: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setUserPermissions(undefined);
    // Remove the cart on logout so no leftover/duplicate cart remains
    setCartItems([]);
  };

  const addToFavorites = (mediaId: string) => {
    if (!currentUser) return;
    const favs = currentUser.favorites.includes(mediaId)
      ? currentUser.favorites.filter(f => f !== mediaId)
      : [...currentUser.favorites, mediaId];
    const updated = { ...currentUser, favorites: favs };
    setCurrentUser(updated);
    setUsers(users.map(u => u.id === updated.id ? updated : u));
  };

  const selectMedia = (mediaId: string) => {
    if (!currentUser) return;
    const selected = currentUser.selectedMedia.includes(mediaId)
      ? currentUser.selectedMedia.filter(s => s !== mediaId)
      : [...currentUser.selectedMedia, mediaId];
    const updated = { ...currentUser, selectedMedia: selected };
    setCurrentUser(updated);
    setUsers(users.map(u => u.id === updated.id ? updated : u));
  };

  const addToCart = (productId: string, quantity: number = 1) => {
    if (!currentUser) return;
    const existing = cartItems.find(item => item.productId === productId);
    const updatedCart = existing
      ? cartItems.map(item => item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item)
      : [...cartItems, { productId, quantity }];
    setCartItems(updatedCart);
  };

  const removeFromCart = (productId: string) => {
    if (!currentUser) return;
    setCartItems(cartItems.filter(item => item.productId !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (!currentUser) return;
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(cartItems.map(item => item.productId === productId ? { ...item, quantity } : item));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const updateAvatar = (avatarUrl: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, avatar: avatarUrl };
    setCurrentUser(updated);
    setUsers(users.map(u => u.id === updated.id ? updated : u));
  };

  // Customer club: lets the user edit basic profile fields (birthDate feeds the birthday bonus).
  const updateCustomerProfile = (patch: Partial<Pick<User, 'name' | 'phone' | 'birthDate'>>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...patch };
    setCurrentUser(updated);
    setUsers(usersRef.current.map(u => u.id === updated.id ? updated : u));
  };

  const chargeWallet = (amount: number) => {
    if (!currentUser) return;
    const currentBalance = currentUser.walletBalance || 0;
    const updated = { ...currentUser, walletBalance: currentBalance + amount };
    setCurrentUser(updated);
    setUsers(users.map(u => u.id === updated.id ? updated : u));
  };

  const deductWallet = (amount: number): boolean => {
    if (!currentUser) return false;
    const currentBalance = currentUser.walletBalance || 0;
    if (currentBalance < amount) return false;
    const updated = { ...currentUser, walletBalance: currentBalance - amount };
    setCurrentUser(updated);
    setUsers(users.map(u => u.id === updated.id ? updated : u));
    return true;
  };

  return (
    <AppContext.Provider value={{
      darkMode, toggleDarkMode, currentUser, login, adminLogin, logout,
      products, setProducts, mediaItems, setMediaItems, services, setServices,
      orders, setOrders, updateOrder, updateOrderStatus, createServiceOrder, createProjectOrder, news, setNews, portfolio, setPortfolio,
      expenses, setExpenses, projects, setProjects, users, setUsers,
      addToFavorites, selectMedia, addToCart, removeFromCart, updateCartQuantity, clearCart, cartItems, updateAvatar, updateCustomerProfile, chargeWallet, deductWallet, aboutContent, setAboutContent,
      notes, setNotes,
      reviews, setReviews,
      suppliers, setSuppliers,
      employees, setEmployees,
      campaigns, setCampaigns,
      smsLogs, setSmsLogs,
      auditLogs, setAuditLogs,
      faqs, setFaqs,
      invoices, setInvoices,
      loyaltyTx, gamificationConfig, setGamificationConfig, resetLoyaltyData,
      awardLoyaltyPoints, deductLoyaltyPointsForAdmin, awardReviewPoints,
      redeemLoyaltyReward, setUserLevel, getEarnedBadges,
      contentProjects, setContentProjects,
      contentComments, setContentComments,
      contentAssets, setContentAssets,
      contentTemplates, setContentTemplates,
      contentIdeas, setContentIdeas,
      brandBook, setBrandBook,
      permissions, setPermissions,
      roles, setRoles,
      systemUsers, setSystemUsers,
      currentAdminId: currentUser?.currentAdminId,
      userPermissions, hasPermission, canAccessPage, createStaffUser,
      okrs, setOkrs,
      kpis, setKpis,
      digitalMarketingData, setDigitalMarketingData,
      affiliates, setAffiliates,
      affiliateOrders, setAffiliateOrders,
      affiliateTransactions, setAffiliateTransactions,
      personas, setPersonas,
      tickets, setTickets, createTicket, replyTicket, reopenTicket, rateTicket, adminReplyTicket, updateTicket,
      notifications, setNotifications, unreadNotificationsCount, pushNotification,
      markNotificationRead, markAllNotificationsRead, deleteNotification, clearReadNotifications
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
