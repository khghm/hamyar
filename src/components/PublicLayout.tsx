import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useApp } from '../store';
import { Sun, Moon, Menu, X, User, ChevronDown } from 'lucide-react';

export default function PublicLayout() {
  const { darkMode, toggleDarkMode, currentUser, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'صفحه اصلی' },
    { path: '/services', label: 'خدمات کافی‌نت' },
    { path: '/media', label: 'کالکشن فیلم و سریال' },
    { path: '/store', label: 'فروشگاه' },
    { path: '/webdesign', label: 'طراحی سایت' },
    { path: '/news', label: 'اخبار' },
    { path: '/about', label: 'درباره ما' },
    { path: '/contact', label: 'تماس با ما' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-slate-800'}`}>
      {/* Navbar */}
      <nav className={`sticky top-0 z-50 shadow-lg ${darkMode ? 'bg-slate-800/95 backdrop-blur-md border-b border-slate-700' : 'bg-white/95 backdrop-blur-md border-b border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">H</div>
              <span className="font-bold text-lg hidden sm:block">کافی نت همیار</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white'
                      : darkMode ? 'text-slate-300 hover:bg-slate-700 hover:text-white' : 'text-slate-600 hover:bg-gray-100 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button onClick={toggleDarkMode} className={`p-2 rounded-lg transition-all ${darkMode ? 'hover:bg-slate-700 text-yellow-400' : 'hover:bg-gray-100 text-slate-600'}`}>
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {currentUser ? (
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                    <User size={18} />
                    <span className="hidden sm:block">{currentUser.name}</span>
                    <ChevronDown size={14} />
                  </button>
                  {userMenuOpen && (
                    <div className={`absolute left-0 mt-2 w-48 rounded-lg shadow-xl py-2 z-50 ${darkMode ? 'bg-slate-700 border border-slate-600' : 'bg-white border border-gray-200'}`}>
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)} className={`block px-4 py-2 text-sm ${darkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-50'}`}>پروفایل من</Link>
                      <button onClick={() => { logout(); setUserMenuOpen(false); }} className={`block w-full text-right px-4 py-2 text-sm ${darkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-50'} text-red-500`}>خروج</button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/auth" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all">
                  ورود / ثبت‌نام
                </Link>
              )}

              {/* Mobile menu button */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 rounded-lg">
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className={`lg:hidden border-t ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'} py-2 px-4`}>
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className={`border-t ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">H</div>
                <span className="font-bold text-lg">کافی نت همیار</span>
              </div>
              <p className={`text-sm leading-7 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                ارائه‌دهنده خدمات دیجیتال، فروش محصولات، کپی مدیا و طراحی وب‌سایت
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold mb-4">دسترسی سریع</h4>
              <div className="space-y-2">
                {navItems.slice(0, 5).map(item => (
                  <Link key={item.path} to={item.path} className={`block text-sm ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold mb-4">تماس با ما</h4>
              <div className={`space-y-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <p>تلفن: 02136432665</p>
                <p>موبایل: 09913911880</p>
                <p>موبایل: 09204767001</p>
              </div>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-bold mb-4">شبکه‌های اجتماعی</h4>
              <div className="flex flex-wrap gap-3">
                <a href="https://eitaa.com/@hamyar_service1" target="_blank" rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110 ${darkMode ? 'bg-slate-700 hover:bg-orange-600' : 'bg-gray-100 hover:bg-orange-500 hover:text-white'}`}
                  title="ایتا">
                  <i className="fa-brands fa-telegram text-lg"></i>
                </a>
                <a href="https://rubika.ir/hamyar_service1" target="_blank" rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110 ${darkMode ? 'bg-slate-700 hover:bg-purple-600' : 'bg-gray-100 hover:bg-purple-500 hover:text-white'}`}
                  title="روبیکا">
                  <i className="fa-brands fa-instagram text-lg"></i>
                </a>
                <a href="https://ble.ir/hamyar_service1" target="_blank" rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110 ${darkMode ? 'bg-slate-700 hover:bg-blue-600' : 'bg-gray-100 hover:bg-blue-500 hover:text-white'}`}
                  title="بله">
                  <i className="fa-brands fa-facebook text-lg"></i>
                </a>
                <a href="https://t.me/hamyar_service1" target="_blank" rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110 ${darkMode ? 'bg-slate-700 hover:bg-sky-600' : 'bg-gray-100 hover:bg-sky-500 hover:text-white'}`}
                  title="تلگرام">
                  <i className="fa-brands fa-telegram text-lg"></i>
                </a>
                <a href="https://instagram.com/hamyar_service1" target="_blank" rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110 ${darkMode ? 'bg-slate-700 hover:bg-pink-600' : 'bg-gray-100 hover:bg-pink-500 hover:text-white'}`}
                  title="اینستاگرام">
                  <i className="fa-brands fa-instagram text-lg"></i>
                </a>
              </div>
              <p className={`text-xs mt-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                @hamyar_service1
              </p>
            </div>
          </div>

          <div className={`mt-8 pt-8 border-t text-center text-sm ${darkMode ? 'border-slate-700 text-slate-500' : 'border-gray-200 text-slate-400'}`}>
            <p>تمامی حقوق محفوظ است - کافی نت همیار ۱۴۰۳</p>
            <Link to="/admin" className="text-xs mt-2 inline-block opacity-30 hover:opacity-100 transition-opacity">پنل مدیریت</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
