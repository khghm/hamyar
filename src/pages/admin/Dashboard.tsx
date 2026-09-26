import React from 'react';
import { useApp } from '../../store';
import { 
  DollarSign, ShoppingCart, Users, Film, Package, Wrench, AlertTriangle, TrendingUp, 
  MessageSquare, Lightbulb, Gift, Truck, Percent, Bell, Shield, FileText, Video,
  CheckCircle, Clock, XCircle, Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatJalali, getJalaliDayName, toJalaliString } from '../../utils/jalali';

export default function AdminDashboard() {
  const { 
    darkMode, orders, products, users, mediaItems, services, projects, expenses,
    notes, reviews, suppliers, employees, campaigns, smsLogs, contentProjects, 
    contentIdeas, faqs, systemUsers, roles
  } = useApp();

  // محاسبات اصلی
  const totalRevenue = orders.reduce((s, o) => s + o.paid, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalRevenue - totalExpenses;
  const openOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const lowStock = products.filter(p => p.stock < 10).length;
  const totalCustomers = users.filter(u => u.role === 'customer').length;
  const pendingReviews = reviews.filter(r => !r.approved).length;
  const urgentContentProjects = contentProjects.filter(p => p.priority === 'urgent' && p.status !== 'completed').length;
  const totalInvites = users.filter(u => u.invitedBy).length;
  const activeCampaigns = campaigns.filter(c => c.active).length;
  const pendingNotes = notes.filter(n => n.status === 'pending').length;

  const stats = [
    { label: 'درآمد کل', value: totalRevenue.toLocaleString('fa-IR') + ' ت', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30', link: '/admin/finance' },
    { label: 'سود خالص', value: profit.toLocaleString('fa-IR') + ' ت', icon: TrendingUp, color: profit >= 0 ? 'text-blue-500' : 'text-red-500', bg: 'bg-blue-100 dark:bg-blue-900/30', link: '/admin/finance' },
    { label: 'سفارش‌های باز', value: openOrders.toString(), icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', link: '/admin/orders' },
    { label: 'مشتریان', value: totalCustomers.toString(), icon: Users, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30', link: '/admin/customers' },
  ];

  const moduleStats = [
    { label: 'محصولات', value: products.length, icon: Package, color: 'text-blue-600', link: '/admin/products' },
    { label: 'عناوین مدیا', value: mediaItems.length, icon: Film, color: 'text-purple-600', link: '/admin/media' },
    { label: 'خدمات فعال', value: services.filter(s => s.active).length, icon: Wrench, color: 'text-green-600', link: '/admin/services' },
    { label: 'پروژه‌های طراحی', value: projects.length, icon: FileText, color: 'text-orange-600', link: '/admin/projects' },
    { label: 'پروژه‌های محتوا', value: contentProjects.length, icon: Video, color: 'text-pink-600', link: '/admin/content-team' },
    { label: 'ایده‌های جدید', value: contentIdeas.filter(i => i.status === 'new').length, icon: Lightbulb, color: 'text-yellow-600', link: '/admin/content-team' },
    { label: 'تأمین‌کنندگان', value: suppliers.length, icon: Truck, color: 'text-cyan-600', link: '/admin/suppliers' },
    { label: 'کمپین‌های فعال', value: activeCampaigns, icon: Percent, color: 'text-indigo-600', link: '/admin/campaigns' },
    { label: 'کارمندان', value: employees.length, icon: Users, color: 'text-teal-600', link: '/admin/employees' },
    { label: 'کاربران سیستم', value: systemUsers.length, icon: Shield, color: 'text-red-600', link: '/admin/rbac' },
    { label: 'نقش‌ها', value: roles.length, icon: Shield, color: 'text-amber-600', link: '/admin/rbac' },
    { label: 'دعوت‌های موفق', value: totalInvites, icon: Gift, color: 'text-fuchsia-600', link: '/admin/invites' },
  ];

  const alerts = [
    { text: `${pendingReviews} نظر در انتظار تایید`, active: pendingReviews > 0, link: '/admin/reviews', color: 'yellow' },
    { text: `${lowStock} محصول با موجودی کم`, active: lowStock > 0, link: '/admin/products', color: 'red' },
    { text: `${urgentContentProjects} پروژه محتوای فوری`, active: urgentContentProjects > 0, link: '/admin/content-team', color: 'orange' },
    { text: `${pendingNotes} یادداشت در انتظار`, active: pendingNotes > 0, link: '/admin/notes', color: 'blue' },
    { text: `${openOrders} سفارش در انتظار انجام`, active: openOrders > 0, link: '/admin/orders', color: 'purple' },
  ].filter(a => a.active);

  const recentOrders = orders.slice(-5).reverse();
  const recentContentProjects = contentProjects.slice(-3).reverse();
  const pendingReviewList = reviews.filter(r => !r.approved).slice(0, 5);
  const urgentProjects = contentProjects.filter(p => p.priority === 'urgent' && p.status !== 'completed').slice(0, 3);

  // درآمد به تفکیک جریان
  const revenueByType = {
    service: orders.filter(o => o.type === 'service').reduce((s, o) => s + o.paid, 0),
    media: orders.filter(o => o.type === 'media').reduce((s, o) => s + o.paid, 0),
    product: orders.filter(o => o.type === 'product').reduce((s, o) => s + o.paid, 0),
    webdesign: orders.filter(o => o.type === 'webdesign').reduce((s, o) => s + o.paid, 0),
  };

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">داشبورد مدیریت</h1>
        <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {new Date().toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <Link key={i} to={s.link} className={`p-5 rounded-xl border transition-all hover:shadow-lg ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon size={20} className={s.color} />
                </div>
              </div>
              <div className="font-bold text-xl">{s.value}</div>
              <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</div>
            </Link>
          );
        })}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-yellow-500" /> هشدارها و اقدامات لازم
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {alerts.map((alert, i) => {
              const colorClasses: Record<string, string> = {
                yellow: darkMode ? 'bg-yellow-900/20 text-yellow-300 hover:bg-yellow-900/30' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
                red: darkMode ? 'bg-red-900/20 text-red-300 hover:bg-red-900/30' : 'bg-red-50 text-red-700 hover:bg-red-100',
                orange: darkMode ? 'bg-orange-900/20 text-orange-300 hover:bg-orange-900/30' : 'bg-orange-50 text-orange-700 hover:bg-orange-100',
                blue: darkMode ? 'bg-blue-900/20 text-blue-300 hover:bg-blue-900/30' : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
                purple: darkMode ? 'bg-purple-900/20 text-purple-300 hover:bg-purple-900/30' : 'bg-purple-50 text-purple-700 hover:bg-purple-100',
              };
              return (
                <Link key={i} to={alert.link} className={`p-3 rounded-lg text-sm flex items-center justify-between transition-all ${colorClasses[alert.color]}`}>
                  <span>{alert.text}</span>
                  <Eye size={14} />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Module Stats */}
      <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <h3 className="font-bold mb-4">آمار بخش‌ها</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {moduleStats.map((s, i) => {
            const Icon = s.icon;
            return (
              <Link key={i} to={s.link} className={`p-3 rounded-lg text-center transition-all hover:shadow-md ${darkMode ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-gray-50 hover:bg-gray-100'}`}>
                <Icon size={20} className={`mx-auto mb-1 ${s.color}`} />
                <div className="font-bold text-lg">{s.value}</div>
                <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Type */}
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold mb-4">درآمد به تفکیک جریان</h3>
          <div className="space-y-3">
            {[
              { label: 'خدمات کافی‌نت', value: revenueByType.service, color: 'bg-blue-500', link: '/admin/services' },
              { label: 'کپی مدیا', value: revenueByType.media, color: 'bg-purple-500', link: '/admin/media' },
              { label: 'فروش کالا', value: revenueByType.product, color: 'bg-green-500', link: '/admin/products' },
              { label: 'طراحی سایت', value: revenueByType.webdesign, color: 'bg-orange-500', link: '/admin/projects' },
            ].map((item, i) => {
              const percent = totalRevenue > 0 ? (item.value / totalRevenue) * 100 : 0;
              return (
                <Link key={i} to={item.link} className="block">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.label}</span>
                    <span className="font-bold">{item.value.toLocaleString('fa-IR')} ت</span>
                  </div>
                  <div className={`h-2 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                    <div className={`h-full rounded-full ${item.color} transition-all`} style={{ width: `${percent}%` }}></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Urgent Content Projects */}
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Video size={18} className="text-pink-500" /> پروژه‌های فوری محتوا
            </h3>
            <Link to="/admin/content-team" className="text-blue-600 text-xs hover:underline">مشاهده همه</Link>
          </div>
          {urgentProjects.length > 0 ? (
            <div className="space-y-2">
              {urgentProjects.map(p => (
                <div key={p.id} className={`p-3 rounded-lg ${darkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{p.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">فوری</span>
                  </div>
                  {p.deadline && (
                    <p className="text-xs text-red-500 mt-1">تحویل: {toJalaliString(p.deadline)}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm text-center py-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>پروژه فوری وجود ندارد</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Reviews */}
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <MessageSquare size={18} className="text-yellow-500" /> نظرات در انتظار تایید
            </h3>
            <Link to="/admin/reviews" className="text-blue-600 text-xs hover:underline">مشاهده همه</Link>
          </div>
          {pendingReviewList.length > 0 ? (
            <div className="space-y-2">
              {pendingReviewList.map(r => (
                <div key={r.id} className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{r.customerName}</span>
                    <span className="text-yellow-500">{'⭐'.repeat(r.rating)}</span>
                  </div>
                  <p className={`text-xs line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{r.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm text-center py-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>نظر در انتظاری وجود ندارد</p>
          )}
        </div>

        {/* Recent Content Projects */}
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Video size={18} className="text-blue-500" /> آخرین پروژه‌های محتوا
            </h3>
            <Link to="/admin/content-team" className="text-blue-600 text-xs hover:underline">مشاهده همه</Link>
          </div>
          {recentContentProjects.length > 0 ? (
            <div className="space-y-2">
              {recentContentProjects.map(p => (
                <div key={p.id} className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{p.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      p.status === 'planning' ? 'bg-blue-100 text-blue-700' :
                      p.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                      p.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {p.status === 'planning' ? 'برنامه‌ریزی' :
                       p.status === 'in-progress' ? 'در حال انجام' :
                       p.status === 'completed' ? 'تکمیل شده' : p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm text-center py-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>پروژه‌ای ثبت نشده</p>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">آخرین سفارش‌ها</h3>
          <Link to="/admin/orders" className="text-blue-600 text-xs hover:underline">مشاهده همه</Link>
        </div>
        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                  <th className="text-right py-2">کد رهگیری</th>
                  <th className="text-right py-2">مشتری</th>
                  <th className="text-right py-2">نوع</th>
                  <th className="text-right py-2">وضعیت</th>
                  <th className="text-right py-2">مبلغ</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id} className={`border-b ${darkMode ? 'border-slate-700/50' : 'border-gray-100'}`}>
                    <td className="py-2 font-mono text-xs">{o.trackingCode}</td>
                    <td className="py-2">{o.customerName}</td>
                    <td className="py-2">{o.type}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        o.status === 'new' ? 'bg-blue-100 text-blue-700' :
                        o.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                        o.status === 'ready' ? 'bg-green-100 text-green-700' :
                        o.status === 'delivered' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'
                      }`}>{o.status}</span>
                    </td>
                    <td className="py-2">{o.total.toLocaleString('fa-IR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={`text-sm text-center py-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>سفارشی ثبت نشده</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <h3 className="font-bold mb-4">دسترسی سریع</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Link to="/admin/orders" className={`p-3 rounded-lg text-center text-sm transition-all ${darkMode ? 'bg-blue-900/20 text-blue-300 hover:bg-blue-900/30' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
            <ShoppingCart size={20} className="mx-auto mb-1" />
            سفارش جدید
          </Link>
          <Link to="/admin/products" className={`p-3 rounded-lg text-center text-sm transition-all ${darkMode ? 'bg-green-900/20 text-green-300 hover:bg-green-900/30' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
            <Package size={20} className="mx-auto mb-1" />
            محصول جدید
          </Link>
          <Link to="/admin/content-team" className={`p-3 rounded-lg text-center text-sm transition-all ${darkMode ? 'bg-pink-900/20 text-pink-300 hover:bg-pink-900/30' : 'bg-pink-50 text-pink-700 hover:bg-pink-100'}`}>
            <Video size={20} className="mx-auto mb-1" />
            پروژه محتوا
          </Link>
          <Link to="/admin/reviews" className={`p-3 rounded-lg text-center text-sm transition-all ${darkMode ? 'bg-yellow-900/20 text-yellow-300 hover:bg-yellow-900/30' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'}`}>
            <MessageSquare size={20} className="mx-auto mb-1" />
            تایید نظرات
          </Link>
          <Link to="/admin/campaigns" className={`p-3 rounded-lg text-center text-sm transition-all ${darkMode ? 'bg-purple-900/20 text-purple-300 hover:bg-purple-900/30' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}>
            <Percent size={20} className="mx-auto mb-1" />
            کمپین جدید
          </Link>
          <Link to="/admin/rbac" className={`p-3 rounded-lg text-center text-sm transition-all ${darkMode ? 'bg-red-900/20 text-red-300 hover:bg-red-900/30' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>
            <Shield size={20} className="mx-auto mb-1" />
            مدیریت دسترسی
          </Link>
        </div>
      </div>
    </div>
  );
}
