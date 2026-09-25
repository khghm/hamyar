import React from 'react';
import { useApp } from '../../store';
import { TrendingUp, DollarSign, ShoppingCart, Users, Package, Film } from 'lucide-react';

export default function AdminAnalytics() {
  const { darkMode, orders, products, users, mediaItems, services, expenses, campaigns } = useApp();

  const totalRevenue = orders.reduce((s, o) => s + o.paid, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalRevenue - totalExpenses;
  const totalCustomers = users.filter(u => u.role === 'customer').length;
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Revenue by type
  const revenueByType = {
    service: orders.filter(o => o.type === 'service').reduce((s, o) => s + o.paid, 0),
    media: orders.filter(o => o.type === 'media').reduce((s, o) => s + o.paid, 0),
    product: orders.filter(o => o.type === 'product').reduce((s, o) => s + o.paid, 0),
    webdesign: orders.filter(o => o.type === 'webdesign').reduce((s, o) => s + o.paid, 0),
  };

  // Revenue by channel
  const revenueByChannel: Record<string, number> = {};
  orders.forEach(o => {
    revenueByChannel[o.channel] = (revenueByChannel[o.channel] || 0) + o.paid;
  });

  // Top products
  const productSales: Record<string, number> = {};
  orders.filter(o => o.type === 'product').forEach(o => {
    o.items?.forEach((item: any) => {
      productSales[item.name] = (productSales[item.name] || 0) + (item.quantity || 1);
    });
  });

  const lowStockProducts = products.filter(p => p.stock < 10);
  const activeCampaigns = campaigns.filter(c => c.active);

  const stats = [
    { label: 'درآمد کل', value: totalRevenue.toLocaleString('fa-IR'), icon: DollarSign, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'سود خالص', value: profit.toLocaleString('fa-IR'), icon: TrendingUp, color: profit >= 0 ? 'text-blue-500' : 'text-red-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'تعداد سفارش', value: totalOrders.toString(), icon: ShoppingCart, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: 'مشتریان', value: totalCustomers.toString(), icon: Users, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
    { label: 'میانگین سفارش', value: Math.round(avgOrderValue).toLocaleString('fa-IR'), icon: DollarSign, color: 'text-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
    { label: 'هزینه‌ها', value: totalExpenses.toLocaleString('fa-IR'), icon: TrendingUp, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  ];

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">داشبورد تحلیلی</h1>
        <button 
          onClick={() => {
            const data = { orders, products, users, totalRevenue, profit, totalExpenses };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
          }}
          className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
        >
          خروجی گزارش
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                <Icon size={20} className={s.color} />
              </div>
              <div className="font-bold text-lg">{s.value}</div>
              <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Type */}
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold mb-4">درآمد به تفکیک جریان</h3>
          <div className="space-y-3">
            {[
              { label: 'خدمات کافی‌نت', value: revenueByType.service, color: 'bg-blue-500' },
              { label: 'کپی مدیا', value: revenueByType.media, color: 'bg-purple-500' },
              { label: 'فروش کالا', value: revenueByType.product, color: 'bg-green-500' },
              { label: 'طراحی سایت', value: revenueByType.webdesign, color: 'bg-orange-500' },
            ].map((item, i) => {
              const percent = totalRevenue > 0 ? (item.value / totalRevenue) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.label}</span>
                    <span className="font-bold">{item.value.toLocaleString('fa-IR')} تومان</span>
                  </div>
                  <div className={`h-2 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue by Channel */}
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold mb-4">درآمد به تفکیک کانال</h3>
          <div className="space-y-2">
            {Object.entries(revenueByChannel).map(([channel, value]) => (
              <div key={channel} className={`flex justify-between p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <span className="text-sm">{channel}</span>
                <span className="font-bold text-sm">{value.toLocaleString('fa-IR')} تومان</span>
              </div>
            ))}
            {Object.keys(revenueByChannel).length === 0 && (
              <p className={`text-sm text-center py-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>داده‌ای موجود نیست</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold mb-4 text-red-500">هشدار موجودی کم</h3>
          <div className="space-y-2">
            {lowStockProducts.slice(0, 5).map(p => (
              <div key={p.id} className={`flex justify-between p-2 rounded ${darkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
                <span className="text-sm">{p.name}</span>
                <span className="text-sm font-bold text-red-500">{p.stock} عدد</span>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <p className={`text-sm text-center py-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>همه محصولات موجودی کافی دارند</p>
            )}
          </div>
        </div>

        {/* Active Campaigns */}
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold mb-4">کمپین‌های فعال</h3>
          <div className="space-y-2">
            {activeCampaigns.map(c => (
              <div key={c.id} className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-sm">{c.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">فعال</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>کد: {c.code}</span>
                  <span>استفاده: {c.usedCount}/{c.maxUses}</span>
                </div>
              </div>
            ))}
            {activeCampaigns.length === 0 && (
              <p className={`text-sm text-center py-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کمپین فعالی وجود ندارد</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
