import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { LayoutDashboard, ShoppingCart, Users, Package, Film, Wrench, FolderOpen, DollarSign, Settings, LogOut, Menu, X, ChevronLeft, StickyNote, BarChart3, Truck, UserCog, Percent, MessageSquare, Shield, Download, HelpCircle, Star, Gift, Video, BookOpen, FileText } from 'lucide-react';

export default function AdminLayout() {
  const { darkMode, toggleDarkMode, logout } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const location = useLocation();
  const navigate = useNavigate();

  // بستن سایدبار در موبایل هنگام تغییر سایز پنجره
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'داشبورد' },
    { path: '/admin/analytics', icon: BarChart3, label: 'تحلیل و گزارش' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'سفارش‌ها' },
    { path: '/admin/notes', icon: StickyNote, label: 'یادداشت‌ها' },
    { path: '/admin/customers', icon: Users, label: 'مشتریان' },
    { path: '/admin/invites', icon: Gift, label: 'کدهای دعوت' },
    { path: '/admin/products', icon: Package, label: 'محصولات' },
    { path: '/admin/media', icon: Film, label: 'کالکشن مدیا' },
    { path: '/admin/services', icon: Wrench, label: 'خدمات' },
    { path: '/admin/projects', icon: FolderOpen, label: 'پروژه‌ها' },
    { path: '/admin/finance', icon: DollarSign, label: 'حسابداری' },
    { path: '/admin/invoices', icon: FileText, label: 'فاکتورها' },
    { path: '/admin/employees', icon: UserCog, label: 'کارمندان' },
    { path: '/admin/suppliers', icon: Truck, label: 'تأمین‌کنندگان' },
    { path: '/admin/campaigns', icon: Percent, label: 'کمپین تخفیف' },
    { path: '/admin/sms', icon: MessageSquare, label: 'پیامک انبوه' },
    { path: '/admin/reviews', icon: Star, label: 'نظرات' },
    { path: '/admin/content-team', icon: Video, label: 'تیم تولید محتوا' },
    { path: '/admin/rbac', icon: Shield, label: 'کنترل دسترسی (RBAC)' },
    { path: '/admin/training', icon: BookOpen, label: 'آموزش ادمین' },
    { path: '/admin/audit', icon: Shield, label: 'لاگ فعالیت' },
    { path: '/admin/backup', icon: Download, label: 'پشتیبان‌گیری' },
    { path: '/admin/settings', icon: Settings, label: 'تنظیمات' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gray-100 text-slate-800'}`}>
      {/* Sidebar */}
      <aside 
        className={`
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden'} 
          transition-transform duration-300 ease-in-out
          fixed lg:relative 
          right-0 top-0 
          w-72 sm:w-64 
          h-screen 
          z-50 
          ${darkMode ? 'bg-slate-800 border-l border-slate-700' : 'bg-white border-l border-gray-200'} 
          shadow-2xl lg:shadow-xl
          overflow-y-auto
        `}
      >
        <div className="p-4 pb-20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">H</div>
              <span className="font-bold text-sm sm:text-base">پنل مدیریت</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className={`lg:hidden p-2 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
            >
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 pt-6 border-t border-slate-700/30">
            <Link 
              to="/" 
              onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-gray-100'}`}
            >
              <ChevronLeft size={18} className="flex-shrink-0" />
              <span className="truncate">بازگشت به سایت</span>
            </Link>
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-500/10 w-full"
            >
              <LogOut size={18} className="flex-shrink-0" />
              <span className="truncate">خروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen w-full">
        {/* Header */}
        <header className={`sticky top-0 z-40 h-14 flex items-center justify-between px-3 sm:px-4 ${darkMode ? 'bg-slate-800/95 border-b border-slate-700' : 'bg-white/95 border-b border-gray-200'} backdrop-blur-md`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
            >
              <Menu size={20} />
            </button>
            <h1 className="font-bold text-xs sm:text-sm truncate">کافی نت همیار - پنل مدیریت</h1>
          </div>
          <button 
            onClick={toggleDarkMode} 
            className={`p-2 rounded-lg text-xs sm:text-sm ${darkMode ? 'hover:bg-slate-700 text-yellow-400' : 'hover:bg-gray-100'}`}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
    </div>
  );
}
