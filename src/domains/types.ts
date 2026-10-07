/**
 * فاز ۲.۳ — لایهٔ نوع‌های دامنه.
 *
 * فقط اعلان‌های TypeScript؛ هیچ کدی در زمان اجرا تولید نمی‌کند. از store.tsx
 * جدا شده تا آن فایل از حالت «همه‌چیز در یک جا» خارج شود. برای سازگاری،
 * store.tsx این نام‌ها را دوباره صادر می‌کند.
 */

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
