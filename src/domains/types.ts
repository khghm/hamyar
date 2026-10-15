/**
 * فاز ۲.۳ — لایهٔ نوع‌های دامنه.
 *
 * فقط اعلان‌های TypeScript؛ هیچ کدی در زمان اجرا تولید نمی‌کند. از store.tsx
 * جدا شده تا آن فایل از حالت «همه‌چیز در یک جا» خارج شود. برای سازگاری،
 * store.tsx این نام‌ها را دوباره صادر می‌کند.
 */
import { normalizeHex, badgeStyle } from '../utils/color';

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'admin' | 'customer';
  name: string;
  phone: string;
  email?: string;
  supabaseUserId?: string;
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
  price?: number;
}

export interface ServiceFormField {
  key: string;
  label: string;
  type: 'text' | 'tel' | 'number' | 'email' | 'date' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: string[]; // used when type === 'select'
}

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
  documents?: { key: string; label: string; name: string; size: number; dataUrl?: string; storage_path?: string }[]; // step 2: uploaded docs
  paymentMethod?: 'online' | 'wallet';
  gatewayRef?: string; // bank/gateway reference id for online payments
  documentStatus?: 'pending' | 'approved' | 'rejected'; // admin review of uploads
  projectId?: string; // admin project created from this order (kept in sync)
  contentProjectId?: string; // admin «تیم تولید محتوا» task created from this order (kept in sync)
}

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
  /** The order that produced this project. Kept in sync with `orders.project_id`
   *  (web-design) and `orders.content_project_id` (content) so the Projects board
   *  and the Orders board stay linked after a cold start / refresh. */
  sourceOrderId?: string;
  // Content-production orders are managed in the «تیم تولید محتوا» section and
  // must never appear in the admin Projects board (طراحی سایت). Legacy records
  // saved before this rule may still exist in localStorage; the helpers below
  // detect them so they can be filtered out everywhere.
  hiddenFromProjects?: boolean;
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

export interface CustomerSession { id: string; name: string; phone: string }

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

export type NotificationType = string; // built-ins + custom ids managed via settings

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
  userId?: string | null;         // owner; null = broadcast visible to every admin
  recipientIds?: string[];     // audience restriction (system broadcasts); undefined = everyone
  dedupeKey?: string;          // stable event id; stops the same event announcing twice
}

export interface NotificationTypeDef {
  id: string;                  // stable key stored on every notification ('order', 'ticket', …)
  label: string;               // Persian display name
  color: string;               // hex – the type's OWN dedicated color
  icon: string;                // emoji shown next to the type
  enabled: boolean;            // when false, automatic events of this type are muted
  builtin: boolean;            // wired to automatic business events
  deletable: boolean;          // built-in types can be disabled but not removed
  eventLabel?: string;         // which automatic events feed this type (settings hint)
  sectionPath?: string;        // site section (admin panel or public page) this
                               // type belongs to – also used as the default
                               // destination link of its notifications
}

export interface NotificationSettings {
  enabled: boolean;                 // master switch for the whole notification system
  maxItems: number;                 // how many recent notifications are kept
  showPopups: boolean;              // temporary toast previews for new notifications
  popupSeconds: number;             // toast lifetime in seconds
  soundEnabled: boolean;            // audible ping on new notifications
  defaultPriority: NotificationPriority;
  types: NotificationTypeDef[];     // the admin-managed type/color registry
}

export type NotificationSectionScope = 'admin' | 'public';

export interface NotificationSectionDef {
  path: string;               // in-app route used as the notification's destination
  label: string;              // Persian section name (sidebar / nav label)
  scope: NotificationSectionScope;
}

export interface ResolvedNotificationMeta {
  id: string;
  label: string;
  icon: string;
  color: string;
  enabled: boolean;
  builtin: boolean;
  deletable: boolean;
  eventLabel?: string;
  sectionPath?: string;   // site section this type is bound to (settings registry)
  sectionLabel?: string;  // Persian name of that section ('' when not bound)
  sectionScope?: NotificationSectionScope; // 'admin' panel or 'public' site page
  badgeStyle: { backgroundColor: string; color: string };
}

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

// ---------------------------------------------------------------------------
// فاز A — ثابت‌ها و توابع دامنه‌ای (single source of truth).
//
// همهٔ این اشیاء قبلاً در store.tsx بودند و حالا اینجا جمع شده‌اند تا
// store.tsx فقط یک facade باشد. نام‌ها و ساختار به همین صورت نگه داشته
// شده‌اند تا ارجاعات موجود در کد بدون تغییر کار کنند.
// ---------------------------------------------------------------------------
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

const PROJECT_CONTACT_FIELDS: ServiceFormField[] = [

  { key: 'fullName', label: 'نام و نام خانوادگی / نام برند', type: 'text', required: true, placeholder: 'مثلاً علی رضایی' },

  { key: 'phone', label: 'شماره موبایل', type: 'tel', required: true, placeholder: '09xxxxxxxxx' },

  { key: 'email', label: 'ایمیل کاری (اختیاری)', type: 'email', required: false },

];

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

export const PROJECT_QTY_KEYS = ['productCount', 'articlesCount', 'itemsCount', 'duration'];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {

  new: 'جدید',

  processing: 'در حال انجام',

  ready: 'آماده تحویل',

  delivered: 'تحویل شد',

  cancelled: 'لغو شده',

};

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

export const SERVICE_URGENCY_MULTIPLIER = 1.5; // ۵۰٪ اضافه برای خدمات فوری

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

export const TICKET_SLA_HOURS: Record<TicketPriority, number> = {
  low: 72,
  normal: 24,
  high: 8,
  urgent: 2,
};

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

export const NOTIFICATION_SECTION_SCOPE_LABEL: Record<NotificationSectionScope, string> = {

  admin: 'پنل مدیریت',

  public: 'بخش عمومی سایت',

};



// General (customer-facing) pages of the site — mirrors the public routes of App.tsx.

const PUBLIC_NOTIFICATION_SECTIONS: NotificationSectionDef[] = [

  { path: '/',                    label: 'صفحه اصلی',            scope: 'public' },

  { path: '/services',            label: 'خدمات',                scope: 'public' },

  { path: '/store',               label: 'فروشگاه',              scope: 'public' },

  { path: '/media',               label: 'کالکشن مدیا',          scope: 'public' },

  { path: '/webdesign',           label: 'طراحی سایت',           scope: 'public' },

  { path: '/content',             label: 'تولید محتوا',          scope: 'public' },

  { path: '/asiatech',            label: 'آسیاتک',               scope: 'public' },

  { path: '/news',                label: 'اخبار و مقالات',       scope: 'public' },

  { path: '/about',               label: 'درباره ما',            scope: 'public' },

  { path: '/contact',             label: 'تماس با ما',           scope: 'public' },

  { path: '/faq',                 label: 'سوالات متداول',        scope: 'public' },

  { path: '/track',               label: 'پیگیری سفارش',         scope: 'public' },

  { path: '/cart',                label: 'سبد خرید',             scope: 'public' },

  { path: '/profile',             label: 'حساب کاربری مشتری',    scope: 'public' },

  { path: '/auth',                label: 'ورود / ثبت‌نام',       scope: 'public' },

];



// Panels of the admin dashboard — mirrors the sidebar routes of AdminLayout / App.tsx.

const ADMIN_NOTIFICATION_SECTIONS: NotificationSectionDef[] = [

  { path: '/admin',                 label: 'داشبورد',                 scope: 'admin' },

  { path: '/admin/analytics',       label: 'تحلیل و گزارش',           scope: 'admin' },

  { path: '/admin/digital-marketing', label: 'دیجیتال مارکتینگ',      scope: 'admin' },

  { path: '/admin/affiliates',      label: 'همکاران',                 scope: 'admin' },

  { path: '/admin/personas',        label: 'پرسونای مخاطب',           scope: 'admin' },

  { path: '/admin/orders',          label: 'سفارش‌ها',                 scope: 'admin' },

  { path: '/admin/notes',           label: 'یادداشت‌ها',               scope: 'admin' },

  { path: '/admin/customers',       label: 'مشتریان',                 scope: 'admin' },

  { path: '/admin/invites',         label: 'کدهای دعوت',              scope: 'admin' },

  { path: '/admin/products',        label: 'محصولات',                 scope: 'admin' },

  { path: '/admin/media',           label: 'کالکشن مدیا',             scope: 'admin' },

  { path: '/admin/services',        label: 'خدمات',                   scope: 'admin' },

  { path: '/admin/projects',        label: 'پروژه‌ها',                scope: 'admin' },

  { path: '/admin/finance',         label: 'حسابداری',                scope: 'admin' },

  { path: '/admin/invoices',        label: 'فاکتورها',                scope: 'admin' },

  { path: '/admin/employees',       label: 'کارمندان',                scope: 'admin' },

  { path: '/admin/okr-kpi',         label: 'OKR و KPI',               scope: 'admin' },

  { path: '/admin/suppliers',       label: 'تأمین‌کنندگان',           scope: 'admin' },

  { path: '/admin/campaigns',       label: 'کمپین تخفیف',             scope: 'admin' },

  { path: '/admin/sms',             label: 'پیامک انبوه',             scope: 'admin' },

  { path: '/admin/reviews',         label: 'نظرات',                   scope: 'admin' },

  { path: '/admin/tickets',         label: 'تیکت و پشتیبانی',         scope: 'admin' },

  { path: '/admin/notifications',   label: 'اعلان‌ها',                scope: 'admin' },

  { path: '/admin/content-team',    label: 'تیم تولید محتوا',         scope: 'admin' },

  { path: '/admin/rbac',            label: 'کنترل دسترسی (RBAC)',     scope: 'admin' },

  { path: '/admin/training',        label: 'آموزش ادمین',             scope: 'admin' },

  { path: '/admin/audit',           label: 'لاگ فعالیت',              scope: 'admin' },

  { path: '/admin/backup',          label: 'پشتیبان‌گیری',            scope: 'admin' },

  { path: '/admin/settings',        label: 'تنظیمات',                 scope: 'admin' },

];



// Public sections first, then admin ones — grouped in <select> elements via

// NOTIFICATION_SECTIONS_BY_SCOPE below.

export const NOTIFICATION_SECTIONS: NotificationSectionDef[] = [

  ...PUBLIC_NOTIFICATION_SECTIONS,

  ...ADMIN_NOTIFICATION_SECTIONS,

];



export const NOTIFICATION_SECTIONS_BY_SCOPE: Record<NotificationSectionScope, NotificationSectionDef[]> = {

  public: PUBLIC_NOTIFICATION_SECTIONS,

  admin: ADMIN_NOTIFICATION_SECTIONS,

};



export function findNotificationSection(path?: string): NotificationSectionDef | undefined {

  return path ? NOTIFICATION_SECTIONS.find(s => s.path === path) : undefined;

}



// Built-in types keep their original hard-coded destinations (the automatic

// business events still pass an explicit `link` when pushing).

export const DEFAULT_NOTIFICATION_TYPES: NotificationTypeDef[] = [

  { id: 'order',   label: 'سفارش جدید',    color: '#2563eb', icon: '🛒', enabled: true,  builtin: true,  deletable: false, eventLabel: 'ثبت سفارش خدمات و پروژه‌ها', sectionPath: '/admin/orders' },

  { id: 'ticket',  label: 'تیکت پشتیبانی', color: '#d946ef', icon: '🎫', enabled: true,  builtin: true,  deletable: false, eventLabel: 'باز شدن تیکت جدید توسط مشتری', sectionPath: '/admin/tickets' },

  { id: 'payment', label: 'پرداخت و مالی', color: '#16a34a', icon: '💳', enabled: true,  builtin: true,  deletable: false, eventLabel: 'پرداخت آنلاین موفق و صدور رسید', sectionPath: '/admin/invoices' },

  { id: 'review',  label: 'نظر مشتری',     color: '#ca8a04', icon: '⭐', enabled: true,  builtin: true,  deletable: false, eventLabel: 'ثبت نظر جدید در انتظار تایید', sectionPath: '/admin/reviews' },

  { id: 'stock',   label: 'موجودی انبار',  color: '#dc2626', icon: '📦', enabled: true,  builtin: true,  deletable: false, eventLabel: 'رسیدن موجودی محصول به آستانه هشدار', sectionPath: '/admin/products' },

  { id: 'user',    label: 'کاربر جدید',    color: '#ea580c', icon: '👤', enabled: true,  builtin: true,  deletable: false, eventLabel: 'عضویت مشتری جدید', sectionPath: '/admin/customers' },

  { id: 'system',  label: 'سیستمی',        color: '#0891b2', icon: '⚙️', enabled: true,  builtin: true,  deletable: false, eventLabel: 'پشتیبان‌گیری خودکار و اطلاع‌رسانی دستی مدیر', sectionPath: '/admin/backup' },

  { id: 'note',    label: 'یادداشت کاری',  color: '#7c3aed', icon: '📝', enabled: true,  builtin: true,  deletable: false, eventLabel: 'ایجاد یادداشت کاری جدید', sectionPath: '/admin/notes' },

];



export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {

  enabled: true,

  maxItems: 200,

  showPopups: true,

  popupSeconds: 6,

  soundEnabled: false,

  defaultPriority: 'normal',

  types: DEFAULT_NOTIFICATION_TYPES,

};



export const NOTIFICATION_PRIORITY_META: Record<NotificationPriority, { label: string; badge: string }> = {

  low:    { label: 'کم',    badge: 'bg-gray-100 text-gray-600 dark:bg-slate-700/60 dark:text-slate-300' },

  normal: { label: 'عادی',  badge: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300' },

  high:   { label: 'مهم',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },

  urgent: { label: 'فوری',  badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },

};



// Resolved presentation of a notification type (label + color + derived badge

// colors). Returned by `getNotificationMeta` from the store so every consumer

// renders the admin-configured colors instead of hard-coded ones. `badgeStyle`

// is the inline style pair (bg + text) computed from the type's own hex and

// the current theme — consumers apply it via `style={meta.badgeStyle}`.

export function resolveNotificationMeta(

  type: NotificationType,

  types: NotificationTypeDef[],

  darkMode: boolean,

): ResolvedNotificationMeta {

  const def = types.find(t => t.id === type);

  const color = normalizeHex(def?.color || '#64748b');

  const section = findNotificationSection(def?.sectionPath);

  return {

    id: def?.id ?? type,

    label: def?.label ?? 'اعلان',

    icon: def?.icon ?? '🔔',

    color,

    enabled: def ? def.enabled : true,

    builtin: def?.builtin ?? false,

    deletable: def?.deletable ?? true,

    eventLabel: def?.eventLabel,

    sectionPath: def?.sectionPath,

    sectionLabel: section?.label ?? '',

    sectionScope: section?.scope,
    badgeStyle: badgeStyle(color, darkMode),
  };
}

