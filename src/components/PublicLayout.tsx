import React, { Suspense, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { RouteLoading } from './FullPageLoader';
import { useApp } from '../store';
import { track } from '../utils/analytics';
import { Sun, Moon, Menu, X, User, ChevronDown, ShoppingCart, MessageCircle, Send, Instagram, Shield } from 'lucide-react';

export default function PublicLayout() {
  const { darkMode, toggleDarkMode, currentUser, logout, cartItems, aboutContent, adminLoggedIn, systemUsers, currentAdminId } = useApp();
  // کارمند واردشده با Supabase Auth پروفایل مشتری ندارد؛ برای همین منوی کاربر
  // باید با نشست مدیریت هم نمایش داده شود وگرنه راهی به پنل نیست.
  const adminProfile = adminLoggedIn ? systemUsers.find(u => u.id === currentAdminId) : undefined;
  const accountName = currentUser?.name || adminProfile?.name || (adminLoggedIn ? 'کاربر مدیریت' : '');
  const isSignedIn = !!currentUser || !!adminLoggedIn;
  // مقادیر تماس/شبکه‌های اجتماعی از «تنظیمات → درباره ما» می‌آیند و اگر خالی
  // باشند به مقادیر پیش‌فرض قبلی برمی‌گردیم.
  const contactPhone = aboutContent.phone || '02136432665';
  const contactMobile = aboutContent.mobile || '09913911880';
  const contactAddress = aboutContent.address || 'تهران';
  const socials = (aboutContent.socialMedia || []).filter(s => s.url);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();

  // Read badge count from the main store's cart (single source of truth)
  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const navItems = [
    { path: '/', label: 'صفحه اصلی' },
    { path: '/services', label: 'خدمات کافی‌نت' },
    { path: '/media', label: 'کالکشن فیلم و سریال' },
    { path: '/store', label: 'فروشگاه' },
    { path: '/webdesign', label: 'طراحی سایت' },
    { path: '/content', label: 'تولید محتوا' },
    { path: '/asiatech', label: 'اینترنت آسیاتک' },
    { path: '/track', label: 'پیگیری سفارش' },
    { path: '/faq', label: 'سوالات متداول' },
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
            {/* Logo — از تنظیمات «درباره ما» */}
            <Link to="/" className="flex items-center gap-2">
              {aboutContent.logo ? (
                <img src={aboutContent.logo} alt="لوگوی کافی نت همیار" className="w-10 h-10 object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">H</div>
              )}
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

              {/* Cart Icon */}
              {currentUser && (
                <Link to="/cart" className={`relative p-2 rounded-lg transition-all ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                  <ShoppingCart size={20} />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {cartItemsCount}
                    </span>
                  )}
                </Link>
              )}

              {isSignedIn ? (
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                    <User size={18} />
                    <span className="hidden sm:block">{accountName}</span>
                    <ChevronDown size={14} />
                  </button>
                  {userMenuOpen && (
                    <div className={`absolute left-0 mt-2 w-48 rounded-lg shadow-xl py-2 z-50 ${darkMode ? 'bg-slate-700 border border-slate-600' : 'bg-white border border-gray-200'}`}>
                      {currentUser && (
                        <Link to="/profile" onClick={() => setUserMenuOpen(false)} className={`block px-4 py-2 text-sm ${darkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-50'}`}>پروفایل من</Link>
                      )}
                      {(currentUser?.role === 'admin' || adminLoggedIn) && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 ${darkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-50'}`}>
                          <Shield size={14} /> پنل مدیریت
                        </Link>
                      )}
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
        <Suspense fallback={<RouteLoading />}>
          <Outlet />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className={`border-t ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                {aboutContent.logo ? (
                  <img src={aboutContent.logo} alt="لوگوی کافی نت همیار" className="w-10 h-10 object-contain" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">H</div>
                )}
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
                <p>تلفن: {contactPhone}</p>
                <p>موبایل: {contactMobile}</p>
                {(aboutContent.extraPhones || []).filter(Boolean).map((extra, i) => (
                  <p key={`extra-${i}`}>موبایل: {extra}</p>
                ))}
                <p className="leading-6">{contactAddress}</p>
                {aboutContent.email ? <p dir="ltr" className="text-left">{aboutContent.email}</p> : null}
              </div>
            </div>

            {/* Social — هر شبکه‌ای که در تنظیمات تعریف شده، با لوگوی آپلودشده */}
            <div>
              <h4 className="font-bold mb-4">شبکه‌های اجتماعی</h4>
              <div className="flex flex-wrap gap-3">
                {socials.length > 0 ? socials.map(social => (
                  <a
                    key={social.id || social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track('social_icon', { network: social.name })}
                    title={social.name}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110 ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    {social.icon ? (
                      <img src={social.icon} alt={social.name} className="w-7 h-7 object-contain rounded" />
                    ) : (
                      <MessageCircle size={18} aria-hidden="true" />
                    )}
                  </a>
                )) : (
                  <>
                    <a onClick={() => track('social_icon', { network: 'telegram' })}
                      href="https://t.me/hamyar_service1" target="_blank" rel="noopener noreferrer"
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110 ${darkMode ? 'bg-slate-700 hover:bg-sky-600' : 'bg-gray-100 hover:bg-sky-500 hover:text-white'}`}
                      title="تلگرام">
                      <Send size={18} aria-hidden="true" />
                    </a>
                    <a onClick={() => track('social_icon', { network: 'instagram' })}
                      href="https://instagram.com/hamyar_service1" target="_blank" rel="noopener noreferrer"
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110 ${darkMode ? 'bg-slate-700 hover:bg-pink-600' : 'bg-gray-100 hover:bg-pink-500 hover:text-white'}`}
                      title="اینستاگرام">
                      <Instagram size={18} aria-hidden="true" />
                    </a>
                  </>
                )}
              </div>
              {socials.length > 0 && (
                <p className={`text-xs mt-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {[...new Set(socials.map(s => s.handle).filter(Boolean))].slice(0, 3).join(' · ')}
                </p>
              )}
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
