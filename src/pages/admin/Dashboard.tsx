import React from 'react';
import { useApp } from '../../store';
import { DollarSign, ShoppingCart, Users, Film, Package, Wrench, AlertTriangle, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const { darkMode, orders, products, users, mediaItems, services, projects, expenses } = useApp();

  const totalRevenue = orders.reduce((s, o) => s + o.paid, 0);
  const openOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const lowStock = products.filter(p => p.stock < 10).length;
  const totalCustomers = users.filter(u => u.role === 'customer').length;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const stats = [
    { label: 'درآمد کل', value: totalRevenue.toLocaleString('fa-IR') + ' تومان', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'سفارش‌های باز', value: openOrders.toString(), icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'مشتریان', value: totalCustomers.toString(), icon: Users, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: 'هزینه‌ها', value: totalExpenses.toLocaleString('fa-IR') + ' تومان', icon: TrendingUp, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  ];

  const alerts = [
    { text: `${lowStock} محصول با موجودی کم`, active: lowStock > 0 },
    { text: `${openOrders} سفارش در انتظار انجام`, active: openOrders > 0 },
    { text: 'سفارش عقب‌افتاده وجود ندارد', active: false },
  ].filter(a => a.active);

  const recentOrders = orders.slice(-5).reverse();
  const selectedMediaUsers = users.filter(u => u.selectedMedia.length > 0);

  return (
    <div className="fade-in space-y-6">
      <h1 className="text-2xl font-bold">داشبورد مدیریت</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon size={20} className={s.color} />
                </div>
              </div>
              <div className="font-bold text-lg">{s.value}</div>
              <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="font-bold text-xl">{products.length}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>محصولات</div>
        </div>
        <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="font-bold text-xl">{mediaItems.length}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>عناوین مدیا</div>
        </div>
        <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="font-bold text-xl">{services.filter(s => s.active).length}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>خدمات فعال</div>
        </div>
        <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="font-bold text-xl">{projects.length}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>پروژه‌ها</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-yellow-500" /> هشدارها
          </h3>
          {alerts.length > 0 ? (
            <div className="space-y-2">
              {alerts.map((a, i) => (
                <div key={i} className={`p-3 rounded-lg text-sm ${darkMode ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-50 text-yellow-700'}`}>
                  {a.text}
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>هشدار فعالی وجود ندارد</p>
          )}
        </div>

        {/* User Media Selections */}
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Film size={18} className="text-blue-500" /> انتخاب‌های کاربران
          </h3>
          {selectedMediaUsers.length > 0 ? (
            <div className="space-y-2">
              {selectedMediaUsers.map(u => (
                <div key={u.id} className={`p-3 rounded-lg text-sm ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <span className="font-medium">{u.name}</span>
                  <span className={`text-xs mr-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    ({u.selectedMedia.length} عنوان)
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>هنوز کاربری فیلمی انتخاب نکرده</p>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <h3 className="font-bold mb-4">آخرین سفارش‌ها</h3>
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
    </div>
  );
}
