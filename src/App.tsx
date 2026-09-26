import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './store';
import PublicLayout from './components/PublicLayout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import Services from './pages/Services';
import MediaCatalog from './pages/MediaCatalog';
import Store from './pages/Store';
import WebDesign from './pages/WebDesign';
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
import { AdminEmployees } from './pages/admin/Employees';
import { AdminCampaigns, AdminSmsPanel, AdminReviews, AdminAuditLog, AdminBackup } from './pages/admin/Management';

function AppRoutes() {
  const { currentUser } = useApp();

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/media" element={<MediaCatalog />} />
        <Route path="/store" element={<Store />} />
        <Route path="/webdesign" element={<WebDesign />} />
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
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={currentUser?.role === 'admin' ? <AdminLayout /> : <Navigate to="/" />}>
        <Route index element={<AdminDashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="invites" element={<AdminInvites />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="media" element={<AdminMedia />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="projects" element={<AdminProjects />} />
        <Route path="finance" element={<AdminFinance />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="notes" element={<AdminNotes />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="suppliers" element={<AdminSuppliers />} />
        <Route path="employees" element={<AdminEmployees />} />
        <Route path="okr-kpi" element={<AdminOKRKPI />} />
        <Route path="campaigns" element={<AdminCampaigns />} />
        <Route path="sms" element={<AdminSmsPanel />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="audit" element={<AdminAuditLog />} />
        <Route path="backup" element={<AdminBackup />} />
        <Route path="content-team" element={<AdminContentTeam />} />
        <Route path="rbac" element={<AdminRBAC />} />
        <Route path="training" element={<AdminTraining />} />
        <Route path="invoices" element={<AdminInvoices />} />
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
