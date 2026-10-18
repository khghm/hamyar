import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp, ADMIN_PAGE_PERMISSIONS } from './store';
import PublicLayout from './components/PublicLayout';
import AdminLayout from './components/AdminLayout';
import { FullPageLoader } from './components/FullPageLoader';
import { lazyRoute } from './utils/lazyRoute';
import SupportChat from './components/SupportChat';
import { usePageTracking, useBehaviorTracking } from './utils/analytics';

// ---------------------------------------------------------------------------
// Route level code splitting.
//
// هر صفحه فقط وقتی دانلود می‌شود که کاربر واقعاً به آن مسیر رفته باشد. قبلاً هر
// ۴۹ صفحه در یک chunk ۲.۱ مگابایتی بودند؛ روی اتصال ناپایدار همان یک دانلود
// می‌توانست با ERR_CONNECTION_RESET قطع شود و کل سایت سفید بماند. با این کار
// chunk اولیه کوچک می‌شود و شکستِ یک صفحه بقیهٔ سایت را زمین نمی‌زند.
//
// `lazyRoute` به‌جای `lazy` خام استفاده شده تا خطای دانلود یک بار با reload
// ترمیم شود.
// ---------------------------------------------------------------------------
const Home = lazyRoute(() => import('./pages/Home'));
const Services = lazyRoute(() => import('./pages/Services'));
const ServiceOrder = lazyRoute(() => import('./pages/ServiceOrder'));
const MediaCatalog = lazyRoute(() => import('./pages/MediaCatalog'));
const Store = lazyRoute(() => import('./pages/Store'));
const WebDesign = lazyRoute(() => import('./pages/WebDesign'));
const ContentMarketing = lazyRoute(() => import('./pages/ContentMarketing'));
const Asiatech = lazyRoute(() => import('./pages/Asiatech'));
const About = lazyRoute(() => import('./pages/About'));
const Contact = lazyRoute(() => import('./pages/Contact'));
const News = lazyRoute(() => import('./pages/News'));
const Auth = lazyRoute(() => import('./pages/Auth'));
const Profile = lazyRoute(() => import('./pages/Profile'));
const ProductDetail = lazyRoute(() => import('./pages/ProductDetail'));
const MediaDetail = lazyRoute(() => import('./pages/MediaDetail'));
const ProjectServiceDetail = lazyRoute(() => import('./pages/ProjectServiceDetail'));
const NewsDetail = lazyRoute(() => import('./pages/NewsDetail'));
const TrackOrder = lazyRoute(() => import('./pages/TrackOrder'));
const FAQ = lazyRoute(() => import('./pages/FAQ'));
const Cart = lazyRoute(() => import('./pages/Cart'));
const PaymentCallback = lazyRoute(() => import('./pages/PaymentCallback'));

const AdminDashboard = lazyRoute(() => import('./pages/admin/Dashboard'));
const AdminOrders = lazyRoute(() => import('./pages/admin/Orders'));
const AdminCustomers = lazyRoute(() => import('./pages/admin/Customers'));
const AdminProducts = lazyRoute(() => import('./pages/admin/Products'));
const AdminMedia = lazyRoute(() => import('./pages/admin/Media'));
const AdminServices = lazyRoute(() => import('./pages/admin/Services'));
const AdminProjects = lazyRoute(() => import('./pages/admin/Projects'));
const AdminFinance = lazyRoute(() => import('./pages/admin/Finance'));
const AdminSettings = lazyRoute(() => import('./pages/admin/Settings'));
const AdminNotes = lazyRoute(() => import('./pages/admin/Notes'));
const AdminAnalytics = lazyRoute(() => import('./pages/admin/Analytics'));
const AdminSuppliers = lazyRoute(() => import('./pages/admin/Suppliers'));
const AdminInvites = lazyRoute(() => import('./pages/admin/Invites'));
const AdminContentTeam = lazyRoute(() => import('./pages/admin/ContentTeam'));
const AdminRBAC = lazyRoute(() => import('./pages/admin/RBAC'));
const AdminTraining = lazyRoute(() => import('./pages/admin/Training'));
const AdminInvoices = lazyRoute(() => import('./pages/admin/Invoices'));
const AdminOKRKPI = lazyRoute(() => import('./pages/admin/OKRKPI'));
const AdminDigitalMarketing = lazyRoute(() => import('./pages/admin/DigitalMarketing'));
const AdminAffiliates = lazyRoute(() => import('./pages/admin/Affiliates'));
const AdminPersonas = lazyRoute(() => import('./pages/admin/Personas'));
const AdminTickets = lazyRoute(() => import('./pages/admin/Tickets'));
const AdminNotifications = lazyRoute(() => import('./pages/admin/Notifications'));
const AdminEmployees = lazyRoute(() =>
  import('./pages/admin/Employees').then(m => ({ default: m.AdminEmployees })),
);
const AdminCampaigns = lazyRoute(() =>
  import('./pages/admin/Management').then(m => ({ default: m.AdminCampaigns })),
);
const AdminSmsPanel = lazyRoute(() =>
  import('./pages/admin/Management').then(m => ({ default: m.AdminSmsPanel })),
);
const AdminReviews = lazyRoute(() =>
  import('./pages/admin/Management').then(m => ({ default: m.AdminReviews })),
);
const AdminAuditLog = lazyRoute(() =>
  import('./pages/admin/Management').then(m => ({ default: m.AdminAuditLog })),
);
const AdminBackup = lazyRoute(() =>
  import('./pages/admin/Management').then(m => ({ default: m.AdminBackup })),
);

/**
 * Guard مسیرها: حساب‌های کارمندی فقط صفحاتی را باز می‌کنند که نقش RBAC‌شان
 * اجازه داده است. مهم است که این کامپوننت بیرون از `AppRoutes` تعریف شود؛
 * تعریف کامپوننت داخل تابع رندر باعث می‌شود هر رندر یک «نوع» جدید بسازد و
 * React کل زیردرخت را unmount/remount کند.
 */
function Guarded({ path, children }: { path: string; children: React.ReactNode }) {
  const { canAccessPage } = useApp();
  return canAccessPage(ADMIN_PAGE_PERMISSIONS[path] || []) ? <>{children}</> : <Navigate to="/admin" replace />;
}

function AppRoutes() {
  const { currentUser, adminLoggedIn } = useApp();

  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        {/* بازگشت از درگاه پرداخت — بدون Layout تا نتیجه تمام‌صفحه باشد */}
        <Route path="/payment/callback" element={<PaymentCallback />} />

        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceOrder />} />
          <Route path="/media" element={<MediaCatalog />} />
          <Route path="/store" element={<Store />} />
          <Route path="/webdesign" element={<WebDesign />} />
          <Route path="/content" element={<ContentMarketing />} />
          <Route path="/asiatech" element={<Asiatech />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/news" element={<News />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={currentUser && currentUser.role === 'customer' ? <Profile /> : <Navigate to="/auth" />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/media/:id" element={<MediaDetail />} />
          {/* Details/order page for every item of طراحی سایت & تولید محتوا */}
          <Route path="/project-services/:id" element={<ProjectServiceDetail />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/track" element={<TrackOrder />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/cart" element={<Cart />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={(currentUser?.role === 'admin' || adminLoggedIn) ? <AdminLayout /> : <Navigate to="/auth" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<Guarded path="/admin/orders"><AdminOrders /></Guarded>} />
          <Route path="customers" element={<Guarded path="/admin/customers"><AdminCustomers /></Guarded>} />
          <Route path="invites" element={<Guarded path="/admin/invites"><AdminInvites /></Guarded>} />
          <Route path="products" element={<Guarded path="/admin/products"><AdminProducts /></Guarded>} />
          <Route path="media" element={<Guarded path="/admin/media"><AdminMedia /></Guarded>} />
          <Route path="services" element={<Guarded path="/admin/services"><AdminServices /></Guarded>} />
          <Route path="projects" element={<Guarded path="/admin/projects"><AdminProjects /></Guarded>} />
          <Route path="finance" element={<Guarded path="/admin/finance"><AdminFinance /></Guarded>} />
          <Route path="settings" element={<Guarded path="/admin/settings"><AdminSettings /></Guarded>} />
          <Route path="notes" element={<Guarded path="/admin/notes"><AdminNotes /></Guarded>} />
          <Route path="analytics" element={<Guarded path="/admin/analytics"><AdminAnalytics /></Guarded>} />
          <Route path="digital-marketing" element={<Guarded path="/admin/digital-marketing"><AdminDigitalMarketing /></Guarded>} />
          <Route path="affiliates" element={<Guarded path="/admin/affiliates"><AdminAffiliates /></Guarded>} />
          <Route path="personas" element={<Guarded path="/admin/personas"><AdminPersonas /></Guarded>} />
          <Route path="suppliers" element={<Guarded path="/admin/suppliers"><AdminSuppliers /></Guarded>} />
          <Route path="employees" element={<Guarded path="/admin/employees"><AdminEmployees /></Guarded>} />
          <Route path="okr-kpi" element={<Guarded path="/admin/okr-kpi"><AdminOKRKPI /></Guarded>} />
          <Route path="campaigns" element={<Guarded path="/admin/campaigns"><AdminCampaigns /></Guarded>} />
          <Route path="sms" element={<Guarded path="/admin/sms"><AdminSmsPanel /></Guarded>} />
          <Route path="reviews" element={<Guarded path="/admin/reviews"><AdminReviews /></Guarded>} />
          <Route path="audit" element={<Guarded path="/admin/audit"><AdminAuditLog /></Guarded>} />
          <Route path="backup" element={<Guarded path="/admin/backup"><AdminBackup /></Guarded>} />
          <Route path="content-team" element={<Guarded path="/admin/content-team"><AdminContentTeam /></Guarded>} />
          <Route path="rbac" element={<Guarded path="/admin/rbac"><AdminRBAC /></Guarded>} />
          <Route path="training" element={<Guarded path="/admin/training"><AdminTraining /></Guarded>} />
          <Route path="invoices" element={<Guarded path="/admin/invoices"><AdminInvoices /></Guarded>} />
          <Route path="tickets" element={<Guarded path="/admin/tickets"><AdminTickets /></Guarded>} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

/**
 * مسیر پایهٔ اپ.
 *
 * روی دامنهٔ ریشه (`/`) مقدارش `/` است؛ روی میزبانی که سایت داخل یک زیرمسیر قرار
 * می‌گیرد (مثل GitHub Pages: `/hamyar/`) مقدار `BASE_URL` همان زیرمسیر می‌شود و
 * باید به‌عنوان `basename` به روتر داده شود، وگرنه هیچ مسیری match نمی‌شود و
 * صفحه خالی می‌ماند.
 */
const ROUTER_BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <BrowserRouter
          basename={ROUTER_BASENAME}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AnalyticsBootstrap />
          <AppRoutes />
          <SupportChat />
        </BrowserRouter>
      </AppProvider>
    </QueryClientProvider>
  );
}

// فاز ۱: فعال‌سازی پایشگر داخلی (ثبت بازدید صفحات + رفتار کاربر) در کل سایت
function AnalyticsBootstrap() {
  usePageTracking();
  useBehaviorTracking();
  return null;
}
