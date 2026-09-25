import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { LayoutDashboard, ShoppingCart, Users, Package, Film, Wrench, FolderOpen, DollarSign, Settings, LogOut, Menu, X, ChevronLeft, StickyNote } from 'lucide-react';

export default function AdminLayout() {
  const { darkMode, toggleDarkMode, logout } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'داشبورد' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'سفارش‌ها' },
    { path: '/admin/notes', icon: StickyNote, label: 'یادداشت‌های شخصی' },
    { path: '/admin/customers', icon: Users, label: 'مشتریان' },
    { path: '/admin/products', icon: Package, label: 'محصولات و انبار' },
    { path: '/admin/media', icon: Film, label: 'کالکشن مدیا' },
    { path: '/admin/services', icon: Wrench, label: 'خدمات کافی‌نت' },
    { path: '/admin/projects', icon: FolderOpen, label: 'پروژه‌های طراحی' },
    { path: '/admin/finance', icon: DollarSign, label: 'حسابداری' },
    { path: '/admin/settings', icon: Settings, label: 'تنظیمات' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gray-100 text-slate-800'}`}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'} transition-all duration-300 fixed lg:relative h-screen z-40 ${darkMode ? 'bg-slate-800 border-l border-slate-700' : 'bg-white border-l border-gray-200'} shadow-xl`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">H</div>
              <span className="font-bold">پنل مدیریت</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-slate-700">
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 pt-6 border-t border-slate-700/30">
            <Link to="/" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-gray-100'}`}>
              <ChevronLeft size={18} />
              بازگشت به سایت
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-500/10 w-full">
              <LogOut size={18} />
              خروج
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className={`sticky top-0 z-30 h-14 flex items-center justify-between px-4 ${darkMode ? 'bg-slate-800/95 border-b border-slate-700' : 'bg-white/95 border-b border-gray-200'} backdrop-blur-md`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
              <Menu size={20} />
            </button>
            <h1 className="font-bold text-sm">کافی نت همیار - پنل مدیریت</h1>
          </div>
          <button onClick={toggleDarkMode} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-700 text-yellow-400' : 'hover:bg-gray-100'}`}>
            {darkMode ? 'روشن' : 'تاریک'}
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
