import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'customer';
  name: string;
  phone: string;
  inviteCode?: string;
  loyaltyPoints: number;
  level: 'normal' | 'silver' | 'gold' | 'vip';
  favorites: string[];
  selectedMedia: string[];
  createdAt: string;
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

export interface Service {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  unit: string;
  description: string;
  active: boolean;
}

export interface Order {
  id: string;
  trackingCode: string;
  customerId: string;
  customerName: string;
  type: 'service' | 'media' | 'product' | 'webdesign';
  channel: string;
  status: 'new' | 'processing' | 'ready' | 'delivered' | 'cancelled';
  priority: 'normal' | 'urgent' | 'vip';
  items: any[];
  total: number;
  paid: number;
  remaining: number;
  employeeId?: string;
  createdAt: string;
  dueDate?: string;
  description?: string;
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

interface AppContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  currentUser: User | null;
  login: (phone: string, name: string) => void;
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
  aboutContent: AboutContent;
  setAboutContent: (a: AboutContent) => void;
  notes: Note[];
  setNotes: (n: Note[]) => void;
}

export interface AboutContent {
  description: string;
  licenseImage: string;
  trustImages: string[];
  trustVideo: string;
  mission: string;
  vision: string;
}

const defaultAbout: AboutContent = {
  description: 'کافی نت همیار با بیش از سال‌ها تجربه در ارائه خدمات دیجیتال، مفتخر است که بهترین خدمات را در زمینه‌های کافی نت، کپی مدیا، فروش محصولات دیجیتال و طراحی وب‌سایت ارائه دهد. ما با تیمی متخصص و مجرب، همواره در تلاشیم تا نیازهای دیجیتال شما را به بهترین شکل ممکن برآورده سازیم.',
  licenseImage: '',
  trustImages: [],
  trustVideo: '',
  mission: 'ارائه خدمات دیجیتال با کیفیت بالا و قیمت مناسب برای تمامی مشتریان',
  vision: 'تبدیل شدن به مرجع اصلی خدمات دیجیتال در منطقه'
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
];

const initialNews: NewsItem[] = [
  { id: 'n1', title: 'تخفیف ویژه خدمات پرینت در هفته آینده', image: 'https://image.qwenlm.ai/generated-images/ede366be-a6af-45f7-8274-ac1743efffc0/_result.png', caption: 'به مناسبت آغاز سال تحصیلی جدید', content: 'کافی نت همیار به مناسبت آغاز سال تحصیلی جدید، تخفیف ۲۰ درصدی بر روی تمامی خدمات پرینت ارائه می‌دهد. این تخفیف از تاریخ ۱ مهر تا ۷ مهر اعمال خواهد شد.', date: '1403/07/01', active: true },
  { id: 'n2', title: 'اضافه شدن خدمات جدید ترجمه تخصصی', image: 'https://image.qwenlm.ai/generated-images/8648f349-9c19-4b40-92a3-de6ca40c1788/_result.png', caption: 'ترجمه متون تخصصی', content: 'خدمات ترجمه تخصصی در حوزه‌های حقوقی، پزشکی و فنی به مجموعه خدمات کافی نت همیار اضافه شد.', date: '1403/06/15', active: true },
  { id: 'n3', title: 'جشنواره فروش محصولات دیجیتال', image: 'https://image.qwenlm.ai/generated-images/3965d39e-6efc-4ac9-a8f7-4bfe21f41498/_result.png', caption: 'تخفیف‌های ویژه', content: 'جشنواره فروش محصولات دیجیتال با تخفیف‌های ویژه تا ۳۰ درصد. فلش مموری، هارد اکسترنال و لوازم جانبی.', date: '1403/06/01', active: true },
];

const initialPortfolio: PortfolioItem[] = [
  { id: 'pf1', title: 'فروشگاه آنلاین دیجیکالا نمونه', description: 'طراحی فروشگاه اینترنتی با امکانات کامل شامل سبد خرید، پرداخت آنلاین و پنل مدیریت', image: '', link: 'https://example.com', type: 'فروشگاهی', technologies: ['React', 'Node.js', 'MongoDB'] },
  { id: 'pf2', title: 'سایت شرکتی بازرگانی', description: 'طراحی سایت شرکتی با بخش معرفی خدمات، نمونه‌کارها و فرم تماس', image: '', link: 'https://example.com', type: 'شرکتی', technologies: ['Next.js', 'Tailwind CSS'] },
  { id: 'pf3', title: 'سایت رستوران', description: 'طراحی سایت رستوران با منوی آنلاین و سیستم رزرو میز', image: '', link: 'https://example.com', type: 'شخصی', technologies: ['WordPress', 'PHP'] },
];

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('hamyar_dark');
    return saved === 'true';
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('hamyar_user');
    return saved ? JSON.parse(saved) : null;
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
    const saved = localStorage.getItem('hamyar_services');
    return saved ? JSON.parse(saved) : initialServices;
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
    return saved ? JSON.parse(saved) : [];
  });
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('hamyar_users');
    return saved ? JSON.parse(saved) : [];
  });
  const [aboutContent, setAboutContent] = useState<AboutContent>(() => {
    const saved = localStorage.getItem('hamyar_about');
    return saved ? JSON.parse(saved) : defaultAbout;
  });
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('hamyar_notes');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('hamyar_dark', String(darkMode));
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => { localStorage.setItem('hamyar_user', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('hamyar_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('hamyar_media', JSON.stringify(mediaItems)); }, [mediaItems]);
  useEffect(() => { localStorage.setItem('hamyar_services', JSON.stringify(services)); }, [services]);
  useEffect(() => { localStorage.setItem('hamyar_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('hamyar_news', JSON.stringify(news)); }, [news]);
  useEffect(() => { localStorage.setItem('hamyar_portfolio', JSON.stringify(portfolio)); }, [portfolio]);
  useEffect(() => { localStorage.setItem('hamyar_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('hamyar_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('hamyar_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('hamyar_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('hamyar_about', JSON.stringify(aboutContent)); }, [aboutContent]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const login = (phone: string, name: string) => {
    let user = users.find(u => u.phone === phone);
    if (!user) {
      user = {
        id: 'u' + Date.now(),
        username: phone,
        password: '',
        role: 'customer',
        name,
        phone,
        inviteCode: 'INV' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        loyaltyPoints: 0,
        level: 'normal',
        favorites: [],
        selectedMedia: [],
        createdAt: new Date().toISOString()
      };
      setUsers([...users, user]);
    }
    setCurrentUser(user);
  };

  const adminLogin = (username: string, password: string): boolean => {
    if (username === 'admin' && password === 'admin123') {
      setCurrentUser({
        id: 'admin',
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        name: 'مدیر سیستم',
        phone: '09913911880',
        loyaltyPoints: 0,
        level: 'vip',
        favorites: [],
        selectedMedia: [],
        createdAt: new Date().toISOString()
      });
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

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

  return (
    <AppContext.Provider value={{
      darkMode, toggleDarkMode, currentUser, login, adminLogin, logout,
      products, setProducts, mediaItems, setMediaItems, services, setServices,
      orders, setOrders, news, setNews, portfolio, setPortfolio,
      expenses, setExpenses, projects, setProjects, users, setUsers,
      addToFavorites, selectMedia, aboutContent, setAboutContent,
      notes, setNotes
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
