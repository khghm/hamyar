import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp, ADMIN_PAGE_PERMISSIONS } from './store';
import PublicLayout from './components/PublicLayout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import Services from './pages/Services';
import MediaCatalog from './pages/MediaCatalog';
import Store from './pages/Store';
import WebDesign from './pages/WebDesign';
import ContentMarketing from './pages/ContentMarketing';
import Asiatech from './pages/Asiatech';
import About from './pages/About';
import Contact from './pages/Contact';
import News from './pages/News';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import ProductDetail from './pages/ProductDetail';
import MediaDetail from './pages/MediaDetail';
import NewsDetail from './pages/NewsDetail';
import TrackOrder from './pages/TrackOrder';
import FAQ from './pages/FAQ';
import Cart from './pages/Cart';
import SupportChat from './components/SupportChat';
import AdminDashboard from './pages/admin/Dashboard';
import AdminOrders from './pages/admin/Orders';
import AdminCustomers from './pages/admin/Customers';
import AdminProducts from './pages/admin/Products';
import AdminMedia from './pages/admin/Media';
import AdminServices from './pages/admin/Services';
import AdminProjects from './pages/admin/Projects';
import AdminFinance from './pages/admin/Finance';
import AdminSettings from './pages/admin/Settings';
import AdminNotes from './pages/admin/Notes';
import AdminAnalytics from './pages/admin/Analytics';
import AdminSuppliers from './pages/admin/Suppliers';
import AdminInvites from './pages/admin/Invites';
import AdminContentTeam from './pages/admin/ContentTeam';
import AdminRBAC from './pages/admin/RBAC';
import AdminTraining from './pages/admin/Training';
import AdminInvoices from './pages/admin/Invoices';
import AdminOKRKPI from './pages/admin/OKRKPI';
import AdminDigitalMarketing from './pages/admin/DigitalMarketing';
import AdminAffiliates from './pages/admin/Affiliates';
import AdminPersonas from './pages/admin/Personas';
import { AdminEmployees } from './pages/admin/Employees';
import { AdminCampaigns, AdminSmsPanel, AdminReviews, AdminAuditLog, AdminBackup } from './pages/admin/Management';

function AppRoutes() {
  const { currentUser, canAccessPage } = useApp();

  // Route-level guard: staff accounts can only open the admin pages their RBAC
  // role allows. Direct URL access to a restricted page sends them back to the
  // dashboard (which every admin can see) instead of rendering the page.
  const Guarded = ({ path, children }: { path: string; children: React.ReactNode }) =>
    canAccessPage(ADMIN_PAGE_PERMISSIONS[path] || []) ? <>{children}</> : <Navigate to="/admin" replace />;

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
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
        <Route path="/news/:id" element={<NewsDetail />} />
        <Route path="/track" element={<TrackOrder />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/cart" element={<Cart />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={currentUser?.role === 'admin' ? <AdminLayout /> : <Navigate to="/auth" />}>
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
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <SupportChat />
      </BrowserRouter>
    </AppProvider>
  );
}
