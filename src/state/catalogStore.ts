import { create } from 'zustand';
import { persist, type StateStorage } from 'zustand/middleware';
import type {
  Product,
  MediaItem,
  Service,
  NewsItem,
  PortfolioItem,
  AboutContent,
  SocialMedia,
  Project,
} from '../domains/types';
import { fetchProducts, syncProducts, productMapper } from '../api/products';
import { fetchMediaItems, syncMediaItems, mediaMapper } from '../api/media';
import {
  fetchServices, syncPortfolio, syncServices, syncNews, fetchPortfolio, fetchNews,
  serviceMapper, newsMapper, portfolioMapper,
} from '../api/services';
import { fetchProjects, syncProjects, projectMapper } from '../domains/projects/api';
import { fetchAboutContent, saveAboutContent } from '../api/settings';
import { onSyncError, type SyncErrorReport } from '../api/sync';
import { useNotificationStore } from './notificationStore';
import { subscribeCollectionRealtime, onTabVisible, debounce } from '../lib/realtime';

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
  ],
};

const initialProducts: Product[] = [
  { id: 'p1', name: 'فلش مموری ۳۲ گیگابایت', brand: 'Samsung', category: 'flash', price: 250000, originalPrice: 300000, stock: 45, image: '', description: 'فلش مموری سامسونگ ۳۲ گیگابایت USB 3.0' },
  { id: 'p2', name: 'فلش مموری ۶۴ گیگابایت', brand: 'Kingston', category: 'flash', price: 380000, stock: 30, image: '', description: 'فلش مموری کینگستون ۶۴ گیگابایت' },
  { id: 'p3', name: 'فلش مموری ۱۲۸ گیگابایت', brand: 'SanDisk', category: 'flash', price: 650000, originalPrice: 720000, stock: 20, image: '', description: 'فلش مموری سندیسک ۱۲۸ گیگابایت USB 3.1' },
  { id: 'p4', name: 'هارد اکسترنال ۱ ترابایت', brand: 'WD', category: 'hard', price: 3200000, stock: 15, image: '', description: 'هارد اکسترنال وسترن دیجیتال ۱ ترابایت' },
  { id: 'p5', name: 'هارد اکسترنال ۲ ترابایت', brand: 'Seagate', category: 'hard', price: 4800000, originalPrice: 5200000, stock: 10, image: '', description: 'هارد اکسترنال سیگیت ۲ ترابایت' },
  { id: 'p6', name: 'کابل USB تایپ سی', brand: 'Baseus', category: 'cable', price: 85000, stock: 100, image: '', description: 'کابل شارژ تایپ سی باسئوس ۱ متری' },
  { id: 'p7', name: 'کابل HDMI ۲ متری', brand: 'Green', category: 'cable', price: 120000, stock: 60, image: '', description: 'کابل HDMI نسخه ۲.۱ گرین' },
  { id: 'p8', name: 'کابل AUX ۱.۵ متری', brand: 'McDodo', category: 'cable', price: 65000, stock: 80, image: '', description: 'کابل AUX مک دودو با کیفیت بالا' },
  { id: 'p9', name: 'شارژر دیواری ۲۵ وات', brand: 'Samsung', category: 'charger', price: 450000, originalPrice: 520000, stock: 25, image: '', description: 'شارژر سریع سامسونگ ۲۵ وات' },
  { id: 'p10', name: 'شارژر فست شارژ ۳۳ وات', brand: 'Xiaomi', category: 'charger', price: 380000, stock: 35, image: '', description: 'شارژر فست شارژ شیائومی ۳۳ وات' },
  { id: 'p11', name: 'پاوربانک ۱۰۰۰۰ میلی‌آمپر', brand: 'Anker', category: 'charger', price: 890000, stock: 18, image: '', description: 'پاوربانک انکر ۱۰۰۰۰ میلی‌آمپر ساعت' },
  { id: 'p12', name: 'دوربین مداربسته تحت شبکه', brand: 'Dahua', category: 'cctv', price: 2800000, stock: 8, image: '', description: 'دوربین مداربسته ۲ مگاپیکسل داهوا' },
  { id: 'p13', name: 'دوربین مداربسته ۴ مگاپیکسل', brand: 'Hikvision', category: 'cctv', price: 3500000, originalPrice: 3900000, stock: 6, image: '', description: 'دوربین مداربسته هایک‌ویژن ۴ مگاپیکسل' },
  { id: 'p14', name: 'دستگاه DVR ۸ کانال', brand: 'Dahua', category: 'cctv', price: 4200000, stock: 5, image: '', description: 'دستگاه ضبط ۸ کانال داهوا' },
  { id: 'p15', name: 'دستگاه کارتخوان سیار', brand: 'PAX', category: 'pos', price: 8500000, stock: 3, image: '', description: 'دستگاه پوز سیار PAX با اتصال WiFi' },
  { id: 'p16', name: 'دستگاه کارتخوان ثابت', brand: 'Verifone', category: 'pos', price: 6500000, stock: 4, image: '', description: 'دستگاه پوز ثابت وریفون' },
  { id: 'p17', name: 'موس بی‌سیم', brand: 'Logitech', category: 'accessories', price: 350000, stock: 22, image: '', description: 'موس بی‌سیم لاجیتک' },
  { id: 'p18', name: 'کیبورد سیم‌دار', brand: 'Green', category: 'accessories', price: 280000, stock: 30, image: '', description: 'کیبورد سیم‌دار گرین' },
  { id: 'p19', name: 'هاب USB ۴ پورت', brand: 'Baseus', category: 'accessories', price: 195000, stock: 40, image: '', description: 'هاب USB ۳.۰ باسئوس ۴ پورت' },
  { id: 'p20', name: 'رم ریدر چندکاره', brand: 'Kingston', category: 'accessories', price: 145000, stock: 50, image: '', description: 'رم ریدر کینگستون چندکاره' },
  { id: 'p21', name: 'اس اس دی ۲۴۰ گیگابایت', brand: 'Samsung', category: 'storage', price: 1800000, stock: 12, image: '', description: 'حافظه SSD سامسونگ ۲۴۰ گیگابایت' },
  { id: 'p22', name: 'اس اس دی ۴۸۰ گیگابایت', brand: 'WD', category: 'storage', price: 2900000, originalPrice: 3200000, stock: 8, image: '', description: 'حافظه SSD وسترن دیجیتال ۴۸۰ گیگابایت' },
  { id: 'p23', name: 'رم DDR4 ۸ گیگابایت', brand: 'Corsair', category: 'storage', price: 1200000, stock: 15, image: '', description: 'رم ۸ گیگابایت DDR4 کورسیر' },
  { id: 'p24', name: 'هدفون بلوتوثی', brand: 'JBL', category: 'audio', price: 1500000, stock: 14, image: '', description: 'هدفون بلوتوثی JBL' },
  { id: 'p25', name: 'اسپیکر بلوتوثی', brand: 'Xiaomi', category: 'audio', price: 680000, stock: 20, image: '', description: 'اسپیکر بلوتوثی قابل حمل شیائومی' },
  { id: 'p26', name: 'وبکم HD', brand: 'Logitech', category: 'accessories', price: 950000, stock: 10, image: '', description: 'وبکم لاجیتک Full HD' },
  { id: 'p27', name: 'محافظ صفحه نمایش', brand: 'Generic', category: 'accessories', price: 45000, stock: 200, image: '', description: 'محافظ صفحه نمایش لپ‌تاپ ۱۵.۶ اینچ' },
  { id: 'p28', name: 'تبدیل USB به Type-C', brand: 'Baseus', category: 'cable', price: 55000, stock: 90, image: '', description: 'تبدیل USB به Type-C باسئوس' },
  { id: 'p29', name: 'فلش مموری OTG', brand: 'SanDisk', category: 'flash', price: 420000, stock: 25, image: '', description: 'فلش مموری OTG سندیسک دوگانه' },
  { id: 'p30', name: 'کابل لایتنینگ', brand: 'Apple', category: 'cable', price: 180000, stock: 45, image: '', description: 'کابل لایتنینگ اورجینال اپل ۱ متری' },
  { id: 'p31', name: 'استند لپ‌تاپ', brand: 'Baseus', category: 'accessories', price: 320000, stock: 16, image: '', description: 'استند آلومینیومی لپ‌تاپ باسئوس' },
  { id: 'p32', name: 'چراغ مطالعه LED', brand: 'Xiaomi', category: 'accessories', price: 450000, stock: 12, image: '', description: 'چراغ مطالعه LED شیائومی با تنظیم نور' },
  { id: 'p33', name: 'اسپیکر بلوتوثی قابل حمل', brand: 'JBL', category: 'audio', price: 1200000, originalPrice: 1400000, stock: 18, image: '', description: 'اسپیکر بلوتوثی JBL قابل حمل با کیفیت صدای عالی' },
  { id: 'p34', name: 'دستگاه DVR ۸ کانال', brand: 'Dahua', category: 'cctv', price: 4200000, stock: 7, image: '', description: 'دستگاه ضبط ۸ کانال داهوا با کیفیت Full HD' },
  { id: 'p35', name: 'دستگاه کارتخوان سیار', brand: 'PAX', category: 'pos', price: 8500000, stock: 4, image: '', description: 'دستگاه پوز سیار PAX با اتصال WiFi و سیم‌کارت' },
  { id: 'p36', name: 'کیبورد مکانیکال گیمینگ', brand: 'Razer', category: 'accessories', price: 2800000, originalPrice: 3200000, stock: 10, image: '', description: 'کیبورد مکانیکال ریزر با نورپردازی RGB' },
  { id: 'p37', name: 'موس گیمینگ بی‌سیم', brand: 'Logitech', category: 'accessories', price: 1800000, stock: 15, image: '', description: 'موس گیمینگ لاجیتک با دقت بالا' },
  { id: 'p38', name: 'هاب USB ۷ پورت', brand: 'Anker', category: 'accessories', price: 450000, stock: 25, image: '', description: 'هاب USB ۳.۰ انکر ۷ پورت با شارژر' },
  { id: 'p39', name: 'کابل شبکه Cat6', brand: 'D-Link', category: 'cable', price: 35000, stock: 200, image: '', description: 'کابل شبکه Cat6 دیلینک ۳ متری' },
  { id: 'p40', name: 'تبدیل HDMI به VGA', brand: 'Green', category: 'cable', price: 95000, stock: 40, image: '', description: 'تبدیل HDMI به VGA گرین با کیفیت بالا' },
  { id: 'p41', name: 'فلش مموری ۲۵۶ گیگابایت', brand: 'SanDisk', category: 'flash', price: 1200000, originalPrice: 1400000, stock: 12, image: '', description: 'فلش مموری سندیسک ۲۵۶ گیگابایت USB 3.1' },
  { id: 'p42', name: 'هارد SSD ۱ ترابایت', brand: 'Samsung', category: 'storage', price: 4500000, stock: 8, image: '', description: 'حافظه SSD سامسونگ ۱ ترابایت NVMe' },
  { id: 'p43', name: 'رم DDR4 ۱۶ گیگابایت', brand: 'Corsair', category: 'storage', price: 2400000, originalPrice: 2800000, stock: 10, image: '', description: 'رم ۱۶ گیگابایت DDR4 کورسیر RGB' },
  { id: 'p44', name: 'هدفون گیمینگ', brand: 'HyperX', category: 'audio', price: 2200000, stock: 12, image: '', description: 'هدفون گیمینگ هایپراکس با میکروفون' },
  { id: 'p45', name: 'وبکم ۴K', brand: 'Logitech', category: 'accessories', price: 3500000, stock: 6, image: '', description: 'وبکم لاجیتک ۴K با autofocus' },
  { id: 'p46', name: 'پد موس گیمینگ', brand: 'SteelSeries', category: 'accessories', price: 280000, stock: 30, image: '', description: 'پد موس بزرگ استیل‌سریز گیمینگ' },
  { id: 'p47', name: 'شارژر وایرلس', brand: 'Samsung', category: 'charger', price: 650000, originalPrice: 750000, stock: 20, image: '', description: 'شارژر بی‌سیم سریع سامسونگ ۱۵ وات' },
  { id: 'p48', name: 'کابل Type-C به Type-C', brand: 'Anker', category: 'cable', price: 120000, stock: 80, image: '', description: 'کابل تایپ سی به تایپ سی انکر ۱ متری' },
  { id: 'p49', name: 'دوربین اکشن', brand: 'GoPro', category: 'accessories', price: 12000000, stock: 3, image: '', description: 'دوربین اکشن گوپرو HERO 11' },
  { id: 'p50', name: 'تریپاد دوربین', brand: 'Manfrotto', category: 'accessories', price: 1800000, stock: 8, image: '', description: 'تریپاد حرفه‌ای مانفراتو' },
  { id: 'p51', name: 'فیلتر لنز UV', brand: 'Hoya', category: 'accessories', price: 450000, stock: 15, image: '', description: 'فیلتر UV هویا برای لنز دوربین' },
  { id: 'p52', name: 'کارت حافظه microSD ۱۲۸GB', brand: 'SanDisk', category: 'storage', price: 380000, stock: 35, image: '', description: 'کارت حافظه میکرو SD سندیسک ۱۲۸ گیگابایت' },
  { id: 'p53', name: 'هاب Type-C چندکاره', brand: 'Baseus', category: 'accessories', price: 680000, originalPrice: 780000, stock: 18, image: '', description: 'هاب تایپ سی باسئوس با HDMI و USB' },
  { id: 'p54', name: 'اسپیکر کامپیوتر', brand: 'Logitech', category: 'audio', price: 850000, stock: 14, image: '', description: 'اسپیکر رومیزی لاجیتک ۲.۰' },
  { id: 'p55', name: 'میکروفون USB', brand: 'Blue', category: 'audio', price: 3200000, stock: 7, image: '', description: 'میکروفون USB بلو یتدیگی برای استریم' },
  { id: 'p56', name: 'کیبورد بی‌سیم', brand: 'Logitech', category: 'accessories', price: 1500000, stock: 12, image: '', description: 'کیبورد بی‌سیم لاجیتک با تاچ‌پد' },
  { id: 'p57', name: 'محافظ برق', brand: 'APC', category: 'accessories', price: 950000, stock: 10, image: '', description: 'محافظ برق APC ۶ خروجی' },
  { id: 'p58', name: 'کابل AUX ۳ متری', brand: 'McDodo', category: 'cable', price: 85000, stock: 60, image: '', description: 'کابل AUX مک دودو ۳ متری با کیفیت بالا' },
  { id: 'p59', name: 'پاوربانک ۲۰۰۰۰ میلی‌آمپر', brand: 'Anker', category: 'charger', price: 1600000, originalPrice: 1800000, stock: 15, image: '', description: 'پاوربانک انکر ۲۰۰۰۰ میلی‌آمپر با فست شارژ' },
  { id: 'p60', name: 'هارد SSD اکسترنال ۵۰۰GB', brand: 'Samsung', category: 'storage', price: 3800000, stock: 9, image: '', description: 'هارد SSD اکسترنال سامسونگ ۵۰۰ گیگابایت' },
  { id: 'p61', name: 'دوربین تحت شبکه PTZ', brand: 'Hikvision', category: 'cctv', price: 5500000, stock: 5, image: '', description: 'دوربین مداربسته PTZ هایک‌ویژن با زوم ۲۵ برابر' },
  { id: 'p62', name: 'دستگاه کارتخوان ثابت', brand: 'Verifone', category: 'pos', price: 6500000, stock: 4, image: '', description: 'دستگاه پوز ثابت وریفون با چاپگر' },
];

const initialMedia: MediaItem[] = [
  { id: 'm1', title: 'Oppenheimer', year: 2023, genre: ['درام', 'تاریخی'], type: 'movie', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '12GB', rating: 8.9, image: '', description: 'داستان زندگی جی. رابرت اوپنهایمر و نقش او در ساخت بمب اتمی', director: 'Christopher Nolan', country: 'آمریکا', imdb: 8.9 },
  { id: 'm2', title: 'The Shawshank Redemption', year: 1994, genre: ['درام'], type: 'movie', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '8GB', rating: 9.3, image: '', description: 'داستان امید و رستگاری در زندان', director: 'Frank Darabont', country: 'آمریکا', imdb: 9.3 },
  { id: 'm3', title: 'Inception', year: 2010, genre: ['اکشن', 'علمی‌تخیلی'], type: 'movie', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '18GB', rating: 8.8, image: '', description: 'دزدی اسرار از طریق ورود به رویا', director: 'Christopher Nolan', country: 'آمریکا', imdb: 8.8 },
  { id: 'm4', title: 'Breaking Bad', year: 2008, genre: ['درام', 'جنایی'], type: 'series', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '120GB', rating: 9.5, image: '', description: 'معلم شیمی که به تولید مواد مخدر روی می‌آورد', imdb: 9.5 },
  { id: 'm5', title: 'Game of Thrones', year: 2011, genre: ['فانتزی', 'درام'], type: 'series', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '250GB', rating: 9.2, image: '', description: 'نبرد خاندان‌های بزرگ بر سر تاج و تخت', imdb: 9.2 },
  { id: 'm6', title: 'Spider-Man: Across the Spider-Verse', year: 2023, genre: ['انیمیشن', 'اکشن'], type: 'animation', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '15GB', rating: 8.7, image: '', description: 'ادامه ماجراجویی‌های مرد عنکبوتی در جهان‌های موازی', imdb: 8.7 },
  { id: 'm7', title: 'Attack on Titan', year: 2013, genre: ['اکشن', 'فانتزی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '80GB', rating: 9.0, image: '', description: 'انسان‌ها در نبرد با تایتان‌ها برای بقا', imdb: 9.0 },
  { id: 'm8', title: 'Death Note', year: 2006, genre: ['جنایی', 'فراطبیعی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '45GB', rating: 9.0, image: '', description: 'دانش‌آموزی که با دفترچه مرگ، عدالت را اجرا می‌کند', imdb: 9.0 },
  { id: 'm9', title: 'Interstellar', year: 2014, genre: ['علمی‌تخیلی', 'درام'], type: 'movie', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '20GB', rating: 8.6, image: '', description: 'سفر به فضا برای نجات بشریت', director: 'Christopher Nolan', country: 'آمریکا', imdb: 8.6 },
  { id: 'm10', title: 'The Dark Knight', year: 2008, genre: ['اکشن', 'جنایی'], type: 'movie', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '16GB', rating: 9.0, image: '', description: 'بتمن در نبرد با جوکر', director: 'Christopher Nolan', country: 'آمریکا', imdb: 9.0 },
  { id: 'm11', title: 'Stranger Things', year: 2016, genre: ['علمی‌تخیلی', 'ترسناک'], type: 'series', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '180GB', rating: 8.7, image: '', description: 'ماجراهای کودکان در شهری با اسرار فراطبیعی', imdb: 8.7 },
  { id: 'm12', title: 'Your Name', year: 2016, genre: ['انیمیشن', 'عاشقانه'], type: 'animation', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '8GB', rating: 8.4, image: '', description: 'داستان دو نوجوان که به طرز مرموزی جایشان عوض می‌شود', imdb: 8.4 },
  { id: 'm13', title: 'Demon Slayer', year: 2019, genre: ['اکشن', 'فانتزی'], type: 'anime', quality: '4K', language: 'ژاپنی', subtitle: 'فارسی', volume: '60GB', rating: 8.7, image: '', description: 'جنگجو جوان در نبرد با شیاطین', imdb: 8.7 },
  { id: 'm14', title: 'The Matrix', year: 1999, genre: ['اکشن', 'علمی‌تخیلی'], type: 'movie', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '10GB', rating: 8.7, image: '', description: 'واقعیت مجازی و نبرد برای آزادی', imdb: 8.7 },
  { id: 'm15', title: 'One Piece', year: 1999, genre: ['ماجراجویی', 'کمدی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '200GB', rating: 8.9, image: '', description: 'ماجراجویی دزدان دریایی در جستجوی گنج', imdb: 8.9 },
  { id: 'm16', title: 'Coco', year: 2017, genre: ['انیمیشن', 'خانوادگی'], type: 'animation', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '9GB', rating: 8.4, image: '', description: 'سفر پسری به سرزمین مردگان', imdb: 8.4 },
  { id: 'm17', title: 'Jujutsu Kaisen', year: 2020, genre: ['اکشن', 'فراطبیعی'], type: 'anime', quality: '4K', language: 'ژاپنی', subtitle: 'فارسی', volume: '50GB', rating: 8.6, image: '', description: 'نبرد با نفرین‌ها و ارواح شیطانی', imdb: 8.6 },
  { id: 'm18', title: 'The Lion King', year: 2019, genre: ['انیمیشن', 'خانوادگی'], type: 'animation', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '11GB', rating: 6.9, image: '', description: 'داستان شیر جوانی که باید پادشاه شود', imdb: 6.9 },
  { id: 'm19', title: 'Money Heist', year: 2017, genre: ['اکشن', 'جنایی'], type: 'series', quality: 'BluRay', language: 'اسپانیایی', subtitle: 'فارسی', volume: '90GB', rating: 8.2, image: '', description: 'سرقت بزرگ از ضرابخانه سلطنتی اسپانیا', imdb: 8.2 },
  { id: 'm20', title: 'Naruto Shippuden', year: 2007, genre: ['اکشن', 'ماجراجویی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '180GB', rating: 8.7, image: '', description: 'ادامه ماجراجویی نینجای جوان', imdb: 8.7 },
  { id: 'm21', title: 'Dune: Part Two', year: 2024, genre: ['علمی‌تخیلی', 'ماجراجویی'], type: 'movie', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '22GB', rating: 8.5, image: '', description: 'ادامه حماسه پل آتریدز در سیاره آراکیس', director: 'Denis Villeneuve', country: 'آمریکا', imdb: 8.5 },
  { id: 'm22', title: 'The Godfather', year: 1972, genre: ['جنایی', 'درام'], type: 'movie', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '9GB', rating: 9.2, image: '', description: 'داستان خانواده مافیایی کورلئونه', director: 'Francis Ford Coppola', country: 'آمریکا', imdb: 9.2 },
  { id: 'm23', title: 'Pulp Fiction', year: 1994, genre: ['جنایی', 'درام'], type: 'movie', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '8GB', rating: 8.9, image: '', description: 'داستان‌های متقاطع از زندگی جنایتکاران', director: 'Quentin Tarantino', country: 'آمریکا', imdb: 8.9 },
  { id: 'm24', title: 'Fight Club', year: 1999, genre: ['درام'], type: 'movie', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '9GB', rating: 8.8, image: '', description: 'مردی که باشگاه مشت‌زنی ایجاد می‌کند', director: 'David Fincher', country: 'آمریکا', imdb: 8.8 },
  { id: 'm25', title: 'Forrest Gump', year: 1994, genre: ['درام', 'عاشقانه'], type: 'movie', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '10GB', rating: 8.8, image: '', description: 'داستان مردی ساده‌دل که در رویدادهای تاریخی شرکت می‌کند', director: 'Robert Zemeckis', country: 'آمریکا', imdb: 8.8 },
  { id: 'm26', title: 'The Lord of the Rings', year: 2001, genre: ['فانتزی', 'ماجراجویی'], type: 'movie', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '25GB', rating: 8.8, image: '', description: 'سفر فرودو برای نابودی حلقه', director: 'Peter Jackson', country: 'نیوزیلند', imdb: 8.8 },
  { id: 'm27', title: 'The Avengers', year: 2012, genre: ['اکشن', 'علمی‌تخیلی'], type: 'movie', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '14GB', rating: 8.0, image: '', description: 'تیم انتقام‌جویان در نبرد با لوکی', director: 'Joss Whedon', country: 'آمریکا', imdb: 8.0 },
  { id: 'm28', title: 'Joker', year: 2019, genre: ['درام', 'جنایی'], type: 'movie', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '12GB', rating: 8.4, image: '', description: 'داستان تبدیل شدن آرتور فلک به جوکر', director: 'Todd Phillips', country: 'آمریکا', imdb: 8.4 },
  { id: 'm29', title: 'Parasite', year: 2019, genre: ['درام', 'کمدی'], type: 'movie', quality: 'BluRay', language: 'کره‌ای', subtitle: 'فارسی', volume: '10GB', rating: 8.5, image: '', description: 'داستان دو خانواده از طبقات مختلف', director: 'Bong Joon-ho', country: 'کره جنوبی', imdb: 8.5 },
  { id: 'm30', title: 'Whiplash', year: 2014, genre: ['درام', 'موسیقی'], type: 'movie', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '7GB', rating: 8.5, image: '', description: 'داستان یک درامر جوان و استاد سختگیرش', director: 'Damien Chazelle', country: 'آمریکا', imdb: 8.5 },
  { id: 'm31', title: 'Breaking Bad', year: 2008, genre: ['درام', 'جنایی'], type: 'series', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '150GB', rating: 9.5, image: '', description: 'معلم شیمی که به تولید مواد مخدر روی می‌آورد', imdb: 9.5 },
  { id: 'm32', title: 'The Office', year: 2005, genre: ['کمدی'], type: 'series', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '120GB', rating: 9.0, image: '', description: 'کمدی موقعیت در یک دفتر کار', imdb: 9.0 },
  { id: 'm33', title: 'Friends', year: 1994, genre: ['کمدی', 'عاشقانه'], type: 'series', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '140GB', rating: 8.9, image: '', description: 'داستان شش دوست در نیویورک', imdb: 8.9 },
  { id: 'm34', title: 'The Witcher', year: 2019, genre: ['فانتزی', 'اکشن'], type: 'series', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '100GB', rating: 8.2, image: '', description: 'ماجراهای یک شکارچی هیولا', imdb: 8.2 },
  { id: 'm35', title: 'Peaky Blinders', year: 2013, genre: ['جنایی', 'درام'], type: 'series', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '90GB', rating: 8.8, image: '', description: 'داستان یک خانواده گنگستر در بیرمنگام', imdb: 8.8 },
  { id: 'm36', title: 'Spirited Away', year: 2001, genre: ['انیمیشن', 'فانتزی'], type: 'animation', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '7GB', rating: 8.6, image: '', description: 'سفر دختری به سرزمین ارواح', director: 'Hayao Miyazaki', country: 'ژاپن', imdb: 8.6 },
  { id: 'm37', title: 'Toy Story', year: 1995, genre: ['انیمیشن', 'خانوادگی'], type: 'animation', quality: 'BluRay', language: 'انگلیسی', subtitle: 'فارسی', volume: '5GB', rating: 8.3, image: '', description: 'ماجراجویی اسباب‌بازی‌ها', director: 'John Lasseter', country: 'آمریکا', imdb: 8.3 },
  { id: 'm38', title: 'Frozen', year: 2013, genre: ['انیمیشن', 'خانوادگی'], type: 'animation', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '8GB', rating: 7.4, image: '', description: 'داستان دو خواهر با قدرت‌های جادویی', imdb: 7.4 },
  { id: 'm39', title: 'Zootopia', year: 2016, genre: ['انیمیشن', 'کمدی'], type: 'animation', quality: '4K', language: 'انگلیسی', subtitle: 'فارسی', volume: '7GB', rating: 8.0, image: '', description: 'ماجراجویی یک خرگوش پلیس در شهری از حیوانات', imdb: 8.0 },
  { id: 'm40', title: 'Fullmetal Alchemist', year: 2003, genre: ['اکشن', 'فانتزی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '70GB', rating: 8.5, image: '', description: 'دو برادر در جستجوی سنگ جادو', imdb: 8.5 },
  { id: 'm41', title: 'Dragon Ball Z', year: 1989, genre: ['اکشن', 'ماجراجویی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '150GB', rating: 8.8, image: '', description: 'ماجراجهای گوکو و دوستانش', imdb: 8.8 },
  { id: 'm42', title: 'Bleach', year: 2004, genre: ['اکشن', 'فراطبیعی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '140GB', rating: 8.2, image: '', description: 'دانش‌آموزی که قدرت شینیگامی به دست می‌آورد', imdb: 8.2 },
  { id: 'm43', title: 'My Hero Academia', year: 2016, genre: ['اکشن', 'فانتزی'], type: 'anime', quality: '4K', language: 'ژاپنی', subtitle: 'فارسی', volume: '60GB', rating: 8.4, image: '', description: 'پسری بدون قدرت در دنیایی از ابرقهرمانان', imdb: 8.4 },
  { id: 'm44', title: 'One Punch Man', year: 2015, genre: ['اکشن', 'کمدی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '40GB', rating: 8.7, image: '', description: 'قهرمانی که با یک مشت دشمنان را شکست می‌دهد', imdb: 8.7 },
  { id: 'm45', title: 'Tokyo Ghoul', year: 2014, genre: ['اکشن', 'ترسناک'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '45GB', rating: 7.8, image: '', description: 'دانشجویی که به نیمه غول تبدیل می‌شود', imdb: 7.8 },
  { id: 'm46', title: 'Sword Art Online', year: 2012, genre: ['اکشن', 'علمی‌تخیلی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '50GB', rating: 7.5, image: '', description: 'بازیکنانی که در یک بازی آنلاین گیر افتاده‌اند', imdb: 7.5 },
  { id: 'm47', title: 'Hunter x Hunter', year: 2011, genre: ['اکشن', 'ماجراجویی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '130GB', rating: 9.0, image: '', description: 'ماجراجویی یک شکارچی جوان', imdb: 9.0 },
  { id: 'm48', title: 'Steins;Gate', year: 2011, genre: ['علمی‌تخیلی', 'درام'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '35GB', rating: 9.1, image: '', description: 'داستان سفر در زمان و پیامدهای آن', imdb: 9.1 },
  { id: 'm49', title: 'Code Geass', year: 2006, genre: ['اکشن', 'علمی‌تخیلی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '55GB', rating: 8.7, image: '', description: 'پسری با قدرت کنترل ذهن در نبرد علیه امپراتوری', imdb: 8.7 },
  { id: 'm50', title: 'Cowboy Bebop', year: 1998, genre: ['اکشن', 'علمی‌تخیلی'], type: 'anime', quality: 'BluRay', language: 'ژاپنی', subtitle: 'فارسی', volume: '40GB', rating: 8.9, image: '', description: 'ماجراجویان شکارچیان جایزه‌گیر در فضا', imdb: 8.9 },
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
  { id: 'n1', title: 'تخفیف ویژه خدمات پرینت در هفته آینده', image: '', caption: 'به مناسبت آغاز سال تحصیلی جدید', content: 'کافی نت همیار به مناسبت آغاز سال تحصیلی جدید، تخفیف ۲۰ درصدی بر روی تمامی خدمات پرینت ارائه می‌دهد. این تخفیف از تاریخ ۱ مهر تا ۷ مهر اعمال خواهد شد.', date: '1403/07/01', active: true },
  { id: 'n2', title: 'اضافه شدن خدمات جدید ترجمه تخصصی', image: '', caption: 'ترجمه متون تخصصی', content: 'خدمات ترجمه تخصصی در حوزه‌های حقوقی، پزشکی و فنی به مجموعه خدمات کافی نت همیار اضافه شد.', date: '1403/06/15', active: true },
  { id: 'n3', title: 'جشنواره فروش محصولات دیجیتال', image: '', caption: 'تخفیف‌های ویژه', content: 'جشنواره فروش محصولات دیجیتال با تخفیف‌های ویژه تا ۳۰ درصد. فلش مموری، هارد اکسترنال و لوازم جانبی.', date: '1403/06/01', active: true },
  { id: 'n4', title: 'راه‌اندازی خدمات بیمه آنلاین', image: '', caption: 'صدور انواع بیمه‌نامه', content: 'خدمات صدور بیمه‌نامه شخص ثالث، بدنه، عمر و مسافرتی به صورت آنلاین در کافی نت همیار راه‌اندازی شد. شما می‌توانید بدون مراجعه حضوری، بیمه‌نامه خود را دریافت کنید.', date: '1403/07/10', active: true },
  { id: 'n5', title: 'خدمات جدید ثبت‌نام کنکور ۱۴۰۴', image: '', caption: 'ثبت‌نام کنکور سراسری', content: 'ثبت‌نام کنکور سراسری ۱۴۰۴ آغاز شد. کافی نت همیار با تیم مجرب خود، خدمات ثبت‌نام، ویرایش اطلاعات و انتخاب رشته را با بهترین کیفیت ارائه می‌دهد.', date: '1403/07/15', active: true },
  { id: 'n6', title: 'تخفیف ویژه طراحی سایت', image: '', caption: 'طراحی سایت با ۲۰٪ تخفیف', content: 'به مناسبت پایان سال، کافی نت همیار تخفیف ۲۰ درصدی بر روی تمامی خدمات طراحی سایت ارائه می‌دهد. این فرصت را از دست ندهید!', date: '1403/07/20', active: true },
  { id: 'n7', title: 'اضافه شدن خدمات مالیاتی', image: '', caption: 'امور مالیاتی و اظهارنامه', content: 'خدمات تشکیل پرونده مالیاتی، تنظیم و ارسال اظهارنامه و پیگیری امور مالیاتی به مجموعه خدمات کافی نت همیار اضافه شد.', date: '1403/07/25', active: true },
  { id: 'n8', title: 'جشنواره پایان سال محصولات', image: '', caption: 'تخفیف‌های ویژه پایان سال', content: 'جشنواره پایان سال با تخفیف‌های ویژه تا ۴۰ درصد بر روی تمامی محصولات دیجیتال. فلش مموری، هارد، شارژر و لوازم جانبی با بهترین قیمت.', date: '1403/08/01', active: true },
];

const initialPortfolio: PortfolioItem[] = [
  { id: 'pf1', title: 'فروشگاه آنلاین دیجیکالا نمونه', description: 'طراحی فروشگاه اینترنتی با امکانات کامل شامل سبد خرید، پرداخت آنلاین و پنل مدیریت', image: '', link: 'https://example.com', type: 'فروشگاهی', technologies: ['React', 'Node.js', 'MongoDB'] },
  { id: 'pf2', title: 'سایت شرکتی بازرگانی', description: 'طراحی سایت شرکتی با بخش معرفی خدمات، نمونه‌کارها و فرم تماس', image: '', link: 'https://example.com', type: 'شرکتی', technologies: ['Next.js', 'Tailwind CSS'] },
  { id: 'pf3', title: 'سایت رستوران', description: 'طراحی سایت رستوران با منوی آنلاین و سیستم رزرو میز', image: '', link: 'https://example.com', type: 'شخصی', technologies: ['WordPress', 'PHP'] },
  { id: 'pf4', title: 'پلتفرم آموزش آنلاین', description: 'طراحی سایت آموزش آنلاین با سیستم ویدئو، آزمون و گواهینامه', image: '', link: 'https://example.com', type: 'فروشگاهی', technologies: ['React', 'Django', 'PostgreSQL'] },
  { id: 'pf5', title: 'سایت املاک', description: 'طراحی سایت املاک با جستجوی پیشرفته و نمایش نقشه', image: '', link: 'https://example.com', type: 'شرکتی', technologies: ['Vue.js', 'Laravel', 'MySQL'] },
  { id: 'pf6', title: 'اپلیکیشن مدیریت پروژه', description: 'طراحی داشبورد مدیریت پروژه با امکانات تسک، تقویم و گزارش', image: '', link: 'https://example.com', type: 'شرکتی', technologies: ['React', 'Express', 'MongoDB'] },
  { id: 'pf7', title: 'سایت پزشکی', description: 'طراحی سایت کلینیک پزشکی با سیستم نوبت‌دهی آنلاین', image: '', link: 'https://example.com', type: 'شخصی', technologies: ['Next.js', 'Node.js', 'PostgreSQL'] },
  { id: 'pf8', title: 'فروشگاه لباس', description: 'طراحی فروشگاه آنلاین لباس با فیلتر پیشرفته و سبد خرید', image: '', link: 'https://example.com', type: 'فروشگاهی', technologies: ['React', 'Shopify', 'Tailwind CSS'] },
];

const KEY_MAP = {
  products: 'hamyar_products',
  mediaItems: 'hamyar_media',
  services: 'hamyar_services',
  news: 'hamyar_news',
  portfolio: 'hamyar_portfolio',
  aboutContent: 'hamyar_about',
  projects: 'hamyar_projects',
} as const;

const catalogStorage: StateStorage = {
  getItem: (name) => {
    const state: Record<string, unknown> = {};
    try {
      const savedProducts = localStorage.getItem(KEY_MAP.products);
      if (savedProducts) state.products = JSON.parse(savedProducts);
    } catch { /* ignore */ }
    try {
      const savedMedia = localStorage.getItem(KEY_MAP.mediaItems);
      if (savedMedia) state.mediaItems = JSON.parse(savedMedia);
    } catch { /* ignore */ }
    try {
      const savedServices = localStorage.getItem(KEY_MAP.services);
      if (savedServices) state.services = JSON.parse(savedServices);
    } catch { /* ignore */ }
    try {
      const savedNews = localStorage.getItem(KEY_MAP.news);
      if (savedNews) state.news = JSON.parse(savedNews);
    } catch { /* ignore */ }
    try {
      const savedPortfolio = localStorage.getItem(KEY_MAP.portfolio);
      if (savedPortfolio) state.portfolio = JSON.parse(savedPortfolio);
    } catch { /* ignore */ }
    try {
      const savedAbout = localStorage.getItem(KEY_MAP.aboutContent);
      if (savedAbout) state.aboutContent = JSON.parse(savedAbout);
    } catch { /* ignore */ }
    try {
      const savedProjects = localStorage.getItem(KEY_MAP.projects);
      if (savedProjects) state.projects = JSON.parse(savedProjects);
    } catch { /* ignore */ }
    return JSON.stringify(state);
  },
  setItem: (name, value) => {
    try {
      const state = JSON.parse(value);
      if (state.products !== undefined) {
        localStorage.setItem(KEY_MAP.products, JSON.stringify(state.products));
      }
      if (state.mediaItems !== undefined) {
        localStorage.setItem(KEY_MAP.mediaItems, JSON.stringify(state.mediaItems));
      }
      if (state.services !== undefined) {
        localStorage.setItem(KEY_MAP.services, JSON.stringify(state.services));
      }
      if (state.news !== undefined) {
        localStorage.setItem(KEY_MAP.news, JSON.stringify(state.news));
      }
      if (state.portfolio !== undefined) {
        localStorage.setItem(KEY_MAP.portfolio, JSON.stringify(state.portfolio));
      }
      if (state.aboutContent !== undefined) {
        localStorage.setItem(KEY_MAP.aboutContent, JSON.stringify(state.aboutContent));
      }
      if (state.projects !== undefined) {
        localStorage.setItem(KEY_MAP.projects, JSON.stringify(state.projects));
      }
    } catch { /* ignore */ }
  },
  removeItem: (name) => {
    localStorage.removeItem(KEY_MAP.products);
    localStorage.removeItem(KEY_MAP.mediaItems);
    localStorage.removeItem(KEY_MAP.services);
    localStorage.removeItem(KEY_MAP.news);
    localStorage.removeItem(KEY_MAP.portfolio);
    localStorage.removeItem(KEY_MAP.aboutContent);
    localStorage.removeItem(KEY_MAP.projects);
  },
};

interface CatalogState {
  products: Product[];
  mediaItems: MediaItem[];
  services: Service[];
  news: NewsItem[];
  portfolio: PortfolioItem[];
  aboutContent: AboutContent;
  projects: Project[];
  hydrated: boolean;
  hydrate: () => Promise<void>;

  setProducts: (products: Product[]) => void;
  setMediaItems: (media: MediaItem[]) => void;
  setServices: (services: Service[]) => void;
  setNews: (news: NewsItem[]) => void;
  setPortfolio: (portfolio: PortfolioItem[]) => void;
  setAboutContent: (about: AboutContent) => void;
  setProjects: (p: Project[]) => void;

  addProduct: (product: Product) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addMedia: (media: MediaItem) => void;
  updateMedia: (id: string, patch: Partial<MediaItem>) => void;
  deleteMedia: (id: string) => void;

  addService: (service: Service) => void;
  updateService: (id: string, patch: Partial<Service>) => void;
  deleteService: (id: string) => void;

  addNews: (item: NewsItem) => void;
  updateNews: (id: string, patch: Partial<NewsItem>) => void;
  deleteNews: (id: string) => void;

  addPortfolio: (item: PortfolioItem) => void;
  updatePortfolio: (id: string, patch: Partial<PortfolioItem>) => void;
  deletePortfolio: (id: string) => void;

  updateAbout: (patch: Partial<AboutContent>) => void;

  startRealtime: () => void;
  stopRealtime: () => void;
  refresh: () => Promise<void>;
}

let catalogRealtimeUnsubs: Array<() => void> = [];
let catalogVisibilityUnsub: (() => void) | null = null;

const debouncedCatalogRefresh = debounce(() => {
  const store = useCatalogStore.getState();
  if (store.hydrated) store.hydrate();
}, 500);

/**
 * نوشتن «درباره ما» در `about_content`. هر تغییر فیلد (متن، لوگو، جواز، شبکهٔ
 * اجتماعی، ویدئو) از `setAboutContent` می‌آید؛ بدون debounce هر کاراکتر یک
 * درخواست می‌ساخت. با ۶۰۰ms تاخیر، کل تایپ‌کردن یک ردیف نوشتن می‌شود و
 * آپلودِ تصویر هم بلافاصله بعد از پایانِ ویرایش ذخیره می‌شود.
 */
const debouncedSaveAbout = debounce((value: AboutContent) => {
  saveAboutContent(value).then((r) => {
    if (!r.ok) console.error('[catalogStore] saveAboutContent failed:', r.error);
  });
}, 600);

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set, get): CatalogState => ({
      products: initialProducts,
      mediaItems: initialMedia,
      services: initialServices,
      news: initialNews,
      portfolio: initialPortfolio,
      aboutContent: defaultAbout,
      projects: [],
      hydrated: false,

      hydrate: async () => {
        if (get().hydrated) return;
        const reportSyncError = (report: SyncErrorReport) => {
          try {
            useNotificationStore.getState().pushSystemError?.(
              `همگام‌سازی ${report.table} ناموفق بود`,
              report.message + (report.keys.length ? `: ${report.keys.join(', ')}` : '')
            );
          } catch { /* notification store not ready */ }
        };
        const unsubSync = onSyncError(reportSyncError);
        try {
          const [cloudProducts, cloudMedia, cloudServices, cloudNews, cloudPortfolio, cloudProjects, cloudAbout] =
            await Promise.all([
              fetchProducts().catch(() => null),
              fetchMediaItems().catch(() => null),
              fetchServices().catch(() => null),
              fetchNews().catch(() => null),
              fetchPortfolio().catch(() => null),
              fetchProjects().catch(() => null),
              fetchAboutContent<AboutContent>().catch(() => null),
            ]);
          const curr = get();
          set({
            products: cloudProducts && cloudProducts.length ? cloudProducts : curr.products,
            mediaItems: cloudMedia && cloudMedia.length ? cloudMedia : curr.mediaItems,
            services: cloudServices && cloudServices.length ? cloudServices : curr.services,
            news: cloudNews && cloudNews.length ? cloudNews : curr.news,
            portfolio: cloudPortfolio && cloudPortfolio.length ? cloudPortfolio : curr.portfolio,
            projects: cloudProjects && cloudProjects.length ? cloudProjects : curr.projects,
            // سرور مرجع «درباره ما» است؛ مقادیر ابری روی نسخهٔ محلی merge می‌شوند
            // تا فیلدهای جاافتاده (مثلاً آپلودهای نیمه‌کارهٔ همین مرورگر) حفظ شوند.
            aboutContent: cloudAbout ? { ...curr.aboutContent, ...cloudAbout } : curr.aboutContent,
            hydrated: true,
          });
        } catch (e) {
          console.warn('[catalog] hydrate failed:', e);
        }
        void unsubSync;
      },

      setProducts: (products) => {
        const prev = get().products;
        set({ products });
        if (get().hydrated) {
          syncProducts(products, prev).then((r) => { if (!r.ok) console.error('[catalogStore] syncProducts failed:', r.error, r.rejected); });
        }
      },
      setMediaItems: (mediaItems) => {
        const prev = get().mediaItems;
        set({ mediaItems });
        if (get().hydrated) {
          syncMediaItems(mediaItems, prev).then((r) => { if (!r.ok) console.error('[catalogStore] syncMediaItems failed:', r.error, r.rejected); });
        }
      },
      setServices: (services) => {
        const prev = get().services;
        set({ services });
        if (get().hydrated) {
          syncServices(services, prev).then((r) => { if (!r.ok) console.error('[catalogStore] syncServices failed:', r.error, r.rejected); });
        }
      },
      setNews: (news) => {
        const prev = get().news;
        set({ news });
        if (get().hydrated) {
          syncNews(news, prev).then((r) => { if (!r.ok) console.error('[catalogStore] syncNews failed:', r.error, r.rejected); });
        }
      },
      setPortfolio: (portfolio) => {
        const prev = get().portfolio;
        set({ portfolio });
        if (get().hydrated) {
          syncPortfolio(portfolio, prev).then((r) => { if (!r.ok) console.error('[catalogStore] syncPortfolio failed:', r.error, r.rejected); });
        }
      },
      setAboutContent: (aboutContent) => {
        set({ aboutContent });
        // پیش از تکمیل hydration ممکن است مقدار محلی ناقص باشد؛ ننویس تا
        // دادهٔ ابری با پیش‌فرض محلی بازنویسی نشود.
        if (get().hydrated) debouncedSaveAbout(aboutContent);
      },
      setProjects: (projects) => {
        const prev = get().projects;
        set({ projects });
        if (get().hydrated) {
          syncProjects(projects, prev).then((r) => { if (!r.ok) console.error('[catalogStore] syncProjects failed:', r.error, r.rejected); });
        }
      },

      addProduct: (product) => {
        const prev = get().products;
        const next = [...prev, product];
        set({ products: next });
        if (get().hydrated) {
          syncProducts(next, prev).then((r) => { if (!r.ok) console.error('[catalogStore] syncProducts failed:', r.error, r.rejected); });
        }
      },
      updateProduct: (id, patch) => {
        const prev = get().products;
        const next = prev.map((p) => p.id === id ? { ...p, ...patch } : p);
        set({ products: next });
        if (get().hydrated) {
          syncProducts(next, prev).then((r) => { if (!r.ok) console.error('[catalogStore] syncProducts failed:', r.error, r.rejected); });
        }
      },
      deleteProduct: (id) => {
        const prev = get().products;
        const next = prev.filter((p) => p.id !== id);
        set({ products: next });
        if (get().hydrated) {
          syncProducts(next, prev).then((r) => { if (!r.ok) console.error('[catalogStore] syncProducts failed:', r.error, r.rejected); });
        }
      },

      addMedia: (media) => {
        const prev = get().mediaItems;
        const next = [...prev, media];
        set({ mediaItems: next });
        if (get().hydrated) {
          syncMediaItems(next, prev).then((r) => { if (!r.ok) console.error('[catalogStore] syncMediaItems failed:', r.error, r.rejected); });
        }
      },
      updateMedia: (id, patch) => {
        const prev = get().mediaItems;
        const next = prev.map((m) => m.id === id ? { ...m, ...patch } : m);
        set({ mediaItems: next });
        if (get().hydrated) {
          syncMediaItems(next, prev).then((r) => { if (!r.ok) console.error('[catalogStore] syncMediaItems failed:', r.error, r.rejected); });
        }
      },
      deleteMedia: (id) => {
        const prev = get().mediaItems;
        const next = prev.filter((m) => m.id !== id);
        set({ mediaItems: next });
        if (get().hydrated) {
          syncMediaItems(next, prev).then((r) => { if (!r.ok) console.error('[catalogStore] syncMediaItems failed:', r.error, r.rejected); });
        }
      },

      addService: (service) => {
        const prev = get().services;
        const next = [...prev, service];
        set({ services: next });
        if (get().hydrated) {
          syncServices(next, prev).then((r) => { if (!r.ok) console.error('[catalogStore] syncServices failed:', r.error, r.rejected); });
        }
      },
      updateService: (id, patch) => {
        const prev = get().services;
        const next = prev.map((s) => s.id === id ? { ...s, ...patch } : s);
        set({ services: next });
        if (get().hydrated) {
          syncServices(next, prev).then((r) => { if (!r.ok) console.error('[catalogStore] syncServices failed:', r.error, r.rejected); });
        }
      },
      deleteService: (id) => {
        const prev = get().services;
        const next = prev.filter((s) => s.id !== id);
        set({ services: next });
        if (get().hydrated) {
          syncServices(next, prev).then((r) => { if (!r.ok) console.error('[catalogStore] syncServices failed:', r.error, r.rejected); });
        }
      },

      addNews: (item) => {
        const prev = get().news;
        const next = [...prev, item];
        set({ news: next });
        if (get().hydrated) {
          syncNews(next, prev).then((r) => { if (!r.ok) console.error('[catalogStore] syncNews failed:', r.error, r.rejected); });
        }
      },
      updateNews: (id, patch) => {
        const prev = get().news;
        const next = prev.map((n) => n.id === id ? { ...n, ...patch } : n);
        set({ news: next });
        if (get().hydrated) {
          syncNews(next, prev).then((r) => { if (!r.ok) console.error('[catalogStore] syncNews failed:', r.error, r.rejected); });
        }
      },
      deleteNews: (id) => {
        const prev = get().news;
        const next = prev.filter((n) => n.id !== id);
        set({ news: next });
        if (get().hydrated) {
          syncNews(next, prev).then((r) => { if (!r.ok) console.error('[catalogStore] syncNews failed:', r.error, r.rejected); });
        }
      },

      addPortfolio: (item) => {
        const prev = get().portfolio;
        const next = [...prev, item];
        set({ portfolio: next });
        if (get().hydrated) {
          syncPortfolio(next, prev).then((r) => { if (!r.ok) console.error('[catalogStore] syncPortfolio failed:', r.error, r.rejected); });
        }
      },
      updatePortfolio: (id, patch) => {
        const prev = get().portfolio;
        const next = prev.map((p) => p.id === id ? { ...p, ...patch } : p);
        set({ portfolio: next });
        if (get().hydrated) {
          syncPortfolio(next, prev).then((r) => { if (!r.ok) console.error('[catalogStore] syncPortfolio failed:', r.error, r.rejected); });
        }
      },
      deletePortfolio: (id) => {
        const prev = get().portfolio;
        const next = prev.filter((p) => p.id !== id);
        set({ portfolio: next });
        if (get().hydrated) {
          syncPortfolio(next, prev).then((r) => { if (!r.ok) console.error('[catalogStore] syncPortfolio failed:', r.error, r.rejected); });
        }
      },

      updateAbout: (patch) =>
        set((state) => ({
          aboutContent: { ...state.aboutContent, ...patch },
        })),

      startRealtime: () => {
        if (catalogRealtimeUnsubs.length > 0) return;

        catalogRealtimeUnsubs.push(
          subscribeCollectionRealtime(
            productMapper,
            () => get().products,
            (next) => set({ products: next }),
            debouncedCatalogRefresh,
          ),
          subscribeCollectionRealtime(
            mediaMapper,
            () => get().mediaItems,
            (next) => set({ mediaItems: next }),
            debouncedCatalogRefresh,
          ),
          subscribeCollectionRealtime(
            serviceMapper,
            () => get().services,
            (next) => set({ services: next }),
            debouncedCatalogRefresh,
          ),
          subscribeCollectionRealtime(
            newsMapper,
            () => get().news,
            (next) => set({ news: next }),
            debouncedCatalogRefresh,
          ),
          subscribeCollectionRealtime(
            portfolioMapper,
            () => get().portfolio,
            (next) => set({ portfolio: next }),
            debouncedCatalogRefresh,
          ),
          subscribeCollectionRealtime(
            projectMapper,
            () => get().projects,
            (next) => set({ projects: next }),
            debouncedCatalogRefresh,
          ),
        );

        catalogVisibilityUnsub = onTabVisible(() => {
          debouncedCatalogRefresh();
        });
      },

      stopRealtime: () => {
        for (const unsub of catalogRealtimeUnsubs) {
          try { unsub(); } catch { /* ignore */ }
        }
        catalogRealtimeUnsubs = [];
        if (catalogVisibilityUnsub) {
          catalogVisibilityUnsub();
          catalogVisibilityUnsub = null;
        }
      },

      refresh: async () => {
        const reportSyncError = (report: SyncErrorReport) => {
          try {
            useNotificationStore.getState().pushSystemError?.(
              `همگام‌سازی ${report.table} ناموفق بود`,
              report.message + (report.keys.length ? `: ${report.keys.join(', ')}` : '')
            );
          } catch { /* notification store not ready */ }
        };
        const unsubSync = onSyncError(reportSyncError);
        try {
          const [cloudProducts, cloudMedia, cloudServices, cloudNews, cloudPortfolio, cloudProjects, cloudAbout] =
            await Promise.all([
              fetchProducts().catch(() => null),
              fetchMediaItems().catch(() => null),
              fetchServices().catch(() => null),
              fetchNews().catch(() => null),
              fetchPortfolio().catch(() => null),
              fetchProjects().catch(() => null),
              fetchAboutContent<AboutContent>().catch(() => null),
            ]);
          set({
            products: cloudProducts && cloudProducts.length ? cloudProducts : get().products,
            mediaItems: cloudMedia && cloudMedia.length ? cloudMedia : get().mediaItems,
            services: cloudServices && cloudServices.length ? cloudServices : get().services,
            news: cloudNews && cloudNews.length ? cloudNews : get().news,
            portfolio: cloudPortfolio && cloudPortfolio.length ? cloudPortfolio : get().portfolio,
            projects: cloudProjects && cloudProjects.length ? cloudProjects : get().projects,
            aboutContent: cloudAbout ? { ...get().aboutContent, ...cloudAbout } : get().aboutContent,
          });
        } catch (e) {
          console.warn('[catalog] refresh failed:', e);
        }
        void unsubSync;
      },
    }),
    {
      name: 'hamyar_catalog',
      storage: catalogStorage as any,
      partialize: (state: any) => ({
        products: state.products,
        mediaItems: state.mediaItems,
        services: state.services,
        news: state.news,
        portfolio: state.portfolio,
        aboutContent: state.aboutContent,
        projects: state.projects,
      }) as any,
    },
  ),
);
