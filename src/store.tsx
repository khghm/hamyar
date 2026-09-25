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
  { id: 'p31', name: 'استند لپ‌تاپ', brand: 'Baseus', category: 'accessories', price: 320000, stock: 16, image: '/images/products/stand1.jpg', description: 'استند آلومینیومی لپ‌تاپ باسئوس' },
  { id: 'p32', name: 'چراغ مطالعه LED', brand: 'Xiaomi', category: 'accessories', price: 450000, stock: 12, image: '/images/products/lamp1.jpg', description: 'چراغ مطالعه LED شیائومی با تنظیم نور' },
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
];

const initialNews: NewsItem[] = [
  { id: 'n1', title: 'تخفیف ویژه خدمات پرینت در هفته آینده', image: '', caption: 'به مناسبت آغاز سال تحصیلی جدید', content: 'کافی نت همیار به مناسبت آغاز سال تحصیلی جدید، تخفیف ۲۰ درصدی بر روی تمامی خدمات پرینت ارائه می‌دهد. این تخفیف از تاریخ ۱ مهر تا ۷ مهر اعمال خواهد شد.', date: '1403/07/01', active: true },
  { id: 'n2', title: 'اضافه شدن خدمات جدید ترجمه تخصصی', image: '', caption: 'ترجمه متون تخصصی', content: 'خدمات ترجمه تخصصی در حوزه‌های حقوقی، پزشکی و فنی به مجموعه خدمات کافی نت همیار اضافه شد.', date: '1403/06/15', active: true },
  { id: 'n3', title: 'جشنواره فروش محصولات دیجیتال', image: '', caption: 'تخفیف‌های ویژه', content: 'جشنواره فروش محصولات دیجیتال با تخفیف‌های ویژه تا ۳۰ درصد. فلش مموری، هارد اکسترنال و لوازم جانبی.', date: '1403/06/01', active: true },
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
