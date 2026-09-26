import React, { useState, useMemo } from 'react';
import { useApp } from '../../store';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, Film, 
  BarChart3, PieChart, Download, Calendar, Filter, Eye, ArrowUp, ArrowDown,
  AlertTriangle, CheckCircle, Clock
} from 'lucide-react';
import { exportToExcel } from '../../utils/export';

export default function AdminAnalytics() {
  const { 
    darkMode, orders, products, users, mediaItems, services, expenses, 
    campaigns, contentProjects, notes, reviews, suppliers, employees
  } = useApp();

  const [dateRange, setDateRange] = useState('all');
  const [reportType, setReportType] = useState('overview');

  // محاسبات پیشرفته
  const stats = useMemo(() => {
    const filteredOrders = dateRange === 'all' ? orders : 
      orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        const now = new Date();
        if (dateRange === 'today') return orderDate.toDateString() === now.toDateString();
        if (dateRange === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        }
        if (dateRange === 'month') {
          return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        }
        return true;
      });

    const totalRevenue = filteredOrders.reduce((s, o) => s + o.paid, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const profit = totalRevenue - totalExpenses;
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalCustomers = users.filter(u => u.role === 'customer').length;
    
    // آمار به تفکیک جریان
    const revenueByType = {
      service: filteredOrders.filter(o => o.type === 'service').reduce((s, o) => s + o.paid, 0),
      media: filteredOrders.filter(o => o.type === 'media').reduce((s, o) => s + o.paid, 0),
      product: filteredOrders.filter(o => o.type === 'product').reduce((s, o) => s + o.paid, 0),
      webdesign: filteredOrders.filter(o => o.type === 'webdesign').reduce((s, o) => s + o.paid, 0),
    };

    // آمار به تفکیک کانال
    const revenueByChannel: Record<string, number> = {};
    filteredOrders.forEach(o => {
      revenueByChannel[o.channel] = (revenueByChannel[o.channel] || 0) + o.paid;
    });

    // آمار سفارش‌ها
    const ordersByStatus = {
      new: filteredOrders.filter(o => o.status === 'new').length,
      processing: filteredOrders.filter(o => o.status === 'processing').length,
      ready: filteredOrders.filter(o => o.status === 'ready').length,
      delivered: filteredOrders.filter(o => o.status === 'delivered').length,
      cancelled: filteredOrders.filter(o => o.status === 'cancelled').length,
    };

    // محصولات کم‌موجود
    const lowStockProducts = products.filter(p => p.stock < 10);
    
    // پرفروش‌ترین محصولات
    const productSales: Record<string, number> = {};
    filteredOrders.filter(o => o.type === 'product').forEach(o => {
      o.items?.forEach((item: any) => {
        productSales[item.name] = (productSales[item.name] || 0) + (item.quantity || 1);
      });
    });
    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // پرفروش‌ترین خدمات
    const serviceSales: Record<string, number> = {};
    filteredOrders.filter(o => o.type === 'service').forEach(o => {
      serviceSales[o.description || 'خدمات'] = (serviceSales[o.description || 'خدمات'] || 0) + 1;
    });
    const topServices = Object.entries(serviceSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // آمار ماهانه
    const monthlyData: Record<string, { revenue: number; orders: number; expenses: number }> = {};
    filteredOrders.forEach(o => {
      const month = new Date(o.createdAt).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' });
      if (!monthlyData[month]) monthlyData[month] = { revenue: 0, orders: 0, expenses: 0 };
      monthlyData[month].revenue += o.paid;
      monthlyData[month].orders += 1;
    });
    expenses.forEach(e => {
      const month = new Date(e.date).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' });
      if (!monthlyData[month]) monthlyData[month] = { revenue: 0, orders: 0, expenses: 0 };
      monthlyData[month].expenses += e.amount;
    });

    return {
      totalRevenue,
      totalExpenses,
      profit,
      totalOrders,
      avgOrderValue,
      totalCustomers,
      revenueByType,
      revenueByChannel,
      ordersByStatus,
      lowStockProducts,
      topProducts,
      topServices,
      monthlyData,
    };
  }, [orders, products, users, expenses, dateRange]);

  // خروجی گزارش
  const exportReport = (format: 'excel' | 'products' | 'orders') => {
    if (format === 'excel') {
      const headers = ['شاخص', 'مقدار'];
      const rows = [
        ['درآمد کل', stats.totalRevenue.toLocaleString('fa-IR') + ' تومان'],
        ['هزینه‌ها', stats.totalExpenses.toLocaleString('fa-IR') + ' تومان'],
        ['سود خالص', stats.profit.toLocaleString('fa-IR') + ' تومان'],
        ['تعداد سفارش', stats.totalOrders.toString()],
        ['میانگین سفارش', Math.round(stats.avgOrderValue).toLocaleString('fa-IR') + ' تومان'],
        ['تعداد مشتریان', stats.totalCustomers.toString()],
      ];
      exportToExcel('analytics-report', headers, rows, 'گزارش تحلیل و آمار');
    } else if (format === 'products') {
      const headers = ['نام محصول', 'موجودی', 'قیمت (تومان)', 'وضعیت'];
      const rows = products.map(p => [
        p.name,
        p.stock.toString(),
        p.price.toLocaleString('fa-IR'),
        p.stock === 0 ? 'ناموجود' : p.stock <= (p.alertThreshold || 10) ? 'کم' : 'موجود'
      ]);
      exportToExcel('products-report', headers, rows, 'گزارش محصولات');
    } else {
      const headers = ['کد رهگیری', 'مشتری', 'نوع', 'مبلغ (تومان)', 'وضعیت', 'تاریخ'];
      const rows = orders.map(o => [
        o.trackingCode,
        o.customerName,
        o.type,
        o.total.toLocaleString('fa-IR'),
        o.status,
        new Date(o.createdAt).toLocaleDateString('fa-IR')
      ]);
      exportToExcel('orders-report', headers, rows, 'گزارش سفارش‌ها');
    }
  };

  const maxRevenue = Math.max(...Object.values(stats.revenueByType), 1);
  const maxMonthlyRevenue = Math.max(...Object.values(stats.monthlyData).map(d => d.revenue), 1);

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 size={28} className="text-blue-600" />
          تحلیل و گزارش پیشرفته
        </h1>
        <div className="flex gap-2">
          <button onClick={() => exportReport('excel')} className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 flex items-center gap-2">
            <Download size={16} /> خروجی اکسل
          </button>
          <button onClick={() => exportReport('products')} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 flex items-center gap-2">
            <Download size={16} /> گزارش محصولات
          </button>
          <button onClick={() => exportReport('orders')} className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700 flex items-center gap-2">
            <Download size={16} /> گزارش سفارش‌ها
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={18} className={darkMode ? 'text-slate-400' : 'text-slate-500'} />
            <select 
              value={dateRange} 
              onChange={e => setDateRange(e.target.value)}
              className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}
            >
              <option value="all">همه زمان‌ها</option>
              <option value="today">امروز</option>
              <option value="week">هفته اخیر</option>
              <option value="month">ماه جاری</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={20} className="text-green-500" />
            <ArrowUp size={14} className="text-green-500" />
          </div>
          <div className="text-xl font-bold text-green-600">{stats.totalRevenue.toLocaleString('fa-IR')}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>درآمد کل (تومان)</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <TrendingDown size={20} className="text-red-500" />
            <ArrowDown size={14} className="text-red-500" />
          </div>
          <div className="text-xl font-bold text-red-600">{stats.totalExpenses.toLocaleString('fa-IR')}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>هزینه‌ها (تومان)</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={20} className={stats.profit >= 0 ? 'text-blue-500' : 'text-red-500'} />
          </div>
          <div className={`text-xl font-bold ${stats.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{stats.profit.toLocaleString('fa-IR')}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>سود خالص (تومان)</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart size={20} className="text-purple-500" />
          </div>
          <div className="text-xl font-bold text-purple-600">{stats.totalOrders}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>تعداد سفارش</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={20} className="text-cyan-500" />
          </div>
          <div className="text-xl font-bold text-cyan-600">{Math.round(stats.avgOrderValue).toLocaleString('fa-IR')}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>میانگین سفارش</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <Users size={20} className="text-orange-500" />
          </div>
          <div className="text-xl font-bold text-orange-600">{stats.totalCustomers}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>مشتریان</div>
        </div>
      </div>

      {/* Revenue Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Type */}
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <PieChart size={18} className="text-blue-600" />
            درآمد به تفکیک جریان
          </h3>
          <div className="space-y-3">
            {[
              { label: 'خدمات کافی‌نت', value: stats.revenueByType.service, color: 'bg-blue-500' },
              { label: 'کپی مدیا', value: stats.revenueByType.media, color: 'bg-purple-500' },
              { label: 'فروش کالا', value: stats.revenueByType.product, color: 'bg-green-500' },
              { label: 'طراحی سایت', value: stats.revenueByType.webdesign, color: 'bg-orange-500' },
            ].map((item, i) => {
              const percent = stats.totalRevenue > 0 ? (item.value / stats.totalRevenue) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.label}</span>
                    <span className="font-bold">{item.value.toLocaleString('fa-IR')} ت ({percent.toFixed(1)}%)</span>
                  </div>
                  <div className={`h-3 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                    <div className={`h-full rounded-full ${item.color} transition-all`} style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue by Channel */}
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-purple-600" />
            درآمد به تفکیک کانال
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.revenueByChannel).length > 0 ? (
              Object.entries(stats.revenueByChannel)
                .sort((a, b) => b[1] - a[1])
                .map(([channel, value]) => (
                  <div key={channel} className={`flex justify-between p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                    <span className="text-sm font-medium">{channel}</span>
                    <span className="font-bold text-sm">{value.toLocaleString('fa-IR')} تومان</span>
                  </div>
                ))
            ) : (
              <p className={`text-sm text-center py-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>داده‌ای موجود نیست</p>
            )}
          </div>
        </div>
      </div>

      {/* Orders Status */}
      <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <ShoppingCart size={18} className="text-green-600" />
          وضعیت سفارش‌ها
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'جدید', value: stats.ordersByStatus.new, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
            { label: 'در حال انجام', value: stats.ordersByStatus.processing, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
            { label: 'آماده', value: stats.ordersByStatus.ready, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
            { label: 'تحویل شده', value: stats.ordersByStatus.delivered, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900/30' },
            { label: 'لغو شده', value: stats.ordersByStatus.cancelled, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
          ].map((item, i) => (
            <div key={i} className={`p-4 rounded-lg text-center ${item.bg}`}>
              <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
              <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products & Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Package size={18} className="text-blue-600" />
            پرفروش‌ترین محصولات
          </h3>
          {stats.topProducts.length > 0 ? (
            <div className="space-y-2">
              {stats.topProducts.map(([name, count], i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      i === 0 ? 'bg-yellow-500 text-white' :
                      i === 1 ? 'bg-gray-400 text-white' :
                      i === 2 ? 'bg-orange-600 text-white' :
                      darkMode ? 'bg-slate-600 text-slate-300' : 'bg-gray-300 text-slate-600'
                    }`}>
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                  <span className="font-bold text-sm">{count} عدد</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm text-center py-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>فروشی ثبت نشده</p>
          )}
        </div>

        {/* Top Services */}
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Film size={18} className="text-purple-600" />
            پرفروش‌ترین خدمات
          </h3>
          {stats.topServices.length > 0 ? (
            <div className="space-y-2">
              {stats.topServices.map(([name, count], i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      i === 0 ? 'bg-yellow-500 text-white' :
                      i === 1 ? 'bg-gray-400 text-white' :
                      i === 2 ? 'bg-orange-600 text-white' :
                      darkMode ? 'bg-slate-600 text-slate-300' : 'bg-gray-300 text-slate-600'
                    }`}>
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                  <span className="font-bold text-sm">{count} بار</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm text-center py-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>فروشی ثبت نشده</p>
          )}
        </div>
      </div>

      {/* Monthly Stats */}
      <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-orange-600" />
          آمار ماهانه
        </h3>
        {Object.keys(stats.monthlyData).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(stats.monthlyData).slice(-6).reverse().map(([month, data]) => (
              <div key={month} className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <div className="font-bold mb-2">{month}</div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>درآمد</div>
                    <div className="font-bold text-green-600">{data.revenue.toLocaleString('fa-IR')} ت</div>
                  </div>
                  <div>
                    <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>سفارش</div>
                    <div className="font-bold text-blue-600">{data.orders}</div>
                  </div>
                  <div>
                    <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>سود</div>
                    <div className={`font-bold ${data.revenue - data.expenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(data.revenue - data.expenses).toLocaleString('fa-IR')} ت
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-sm text-center py-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>داده‌ای موجود نیست</p>
        )}
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockProducts.length > 0 && (
        <div className={`p-5 rounded-xl border-2 border-red-500 ${darkMode ? 'bg-red-900/10' : 'bg-red-50'}`}>
          <h3 className="font-bold mb-4 flex items-center gap-2 text-red-600">
            <AlertTriangle size={18} />
            هشدار موجودی کم ({stats.lowStockProducts.length} محصول)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.lowStockProducts.slice(0, 6).map(p => (
              <div key={p.id} className={`p-3 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                <div className="font-medium text-sm mb-1">{p.name}</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-red-500 font-bold">{p.stock} عدد</span>
                  <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{p.price.toLocaleString('fa-IR')} ت</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
