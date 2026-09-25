import React, { useState } from 'react';
import { useApp, Order } from '../../store';
import { Plus, Search, Filter } from 'lucide-react';

export default function AdminOrders() {
  const { darkMode, orders, setOrders, users, products, mediaItems } = useApp();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [newOrder, setNewOrder] = useState({ customerName: '', type: 'service' as const, channel: 'حضوری', priority: 'normal' as const, total: 0, description: '' });

  const statuses = ['new', 'processing', 'ready', 'delivered', 'cancelled'];
  const statusLabels: Record<string, string> = { new: 'جدید', processing: 'در حال انجام', ready: 'آماده', delivered: 'تحویل شد', cancelled: 'لغو' };
  const statusColors: Record<string, string> = { new: 'border-blue-500', processing: 'border-yellow-500', ready: 'border-green-500', delivered: 'border-gray-400', cancelled: 'border-red-500' };

  const filtered = orders.filter(o => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    if (filterType !== 'all' && o.type !== filterType) return false;
    return true;
  });

  const createOrder = () => {
    const order: Order = {
      id: 'o' + Date.now(),
      trackingCode: 'HMY-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      customerId: '',
      customerName: newOrder.customerName,
      type: newOrder.type,
      channel: newOrder.channel,
      status: 'new',
      priority: newOrder.priority,
      items: [],
      total: newOrder.total,
      paid: 0,
      remaining: newOrder.total,
      createdAt: new Date().toISOString(),
      description: newOrder.description,
    };
    setOrders([...orders, order]);
    setShowForm(false);
    setNewOrder({ customerName: '', type: 'service', channel: 'حضوری', priority: 'normal', total: 0, description: '' });
  };

  const updateStatus = (id: string, status: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: status as any } : o));
  };

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت سفارش‌ها</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> سفارش جدید
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200'}`}>
          <option value="all">همه وضعیت‌ها</option>
          {statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200'}`}>
          <option value="all">همه انواع</option>
          <option value="service">خدمات</option>
          <option value="media">مدیا</option>
          <option value="product">کالا</option>
          <option value="webdesign">طراحی سایت</option>
        </select>
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
          <button onClick={() => setView('kanban')} className={`px-3 py-2 text-sm ${view === 'kanban' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-800' : 'bg-white'}`}>کانبان</button>
          <button onClick={() => setView('list')} className={`px-3 py-2 text-sm ${view === 'list' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-800' : 'bg-white'}`}>لیست</button>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
          {statuses.map(status => {
            const statusOrders = filtered.filter(o => o.status === status);
            return (
              <div key={status} className={`rounded-xl border-t-4 ${statusColors[status]} ${darkMode ? 'bg-slate-800/50' : 'bg-gray-50'} p-3`}>
                <h3 className="font-bold text-sm mb-3 flex items-center justify-between">
                  {statusLabels[status]}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>{statusOrders.length}</span>
                </h3>
                <div className="space-y-2">
                  {statusOrders.map(order => (
                    <div key={order.id} className={`p-3 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs text-blue-600">{order.trackingCode}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${order.priority === 'urgent' ? 'bg-red-100 text-red-700' : order.priority === 'vip' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                          {order.priority === 'urgent' ? 'فوری' : order.priority === 'vip' ? 'VIP' : 'عادی'}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{order.customerName}</p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{order.type} | {order.channel}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-bold">{order.total.toLocaleString('fa-IR')} تومان</span>
                        <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)}
                          className={`text-xs px-1 py-0.5 rounded border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                          {statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <table className="w-full text-sm">
            <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
              <tr>
                <th className="text-right p-3">کد رهگیری</th>
                <th className="text-right p-3">مشتری</th>
                <th className="text-right p-3">نوع</th>
                <th className="text-right p-3">کانال</th>
                <th className="text-right p-3">وضعیت</th>
                <th className="text-right p-3">مبلغ</th>
                <th className="text-right p-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                  <td className="p-3 font-mono text-xs">{o.trackingCode}</td>
                  <td className="p-3">{o.customerName}</td>
                  <td className="p-3">{o.type}</td>
                  <td className="p-3">{o.channel}</td>
                  <td className="p-3">
                    <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                      {statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
                    </select>
                  </td>
                  <td className="p-3">{o.total.toLocaleString('fa-IR')}</td>
                  <td className="p-3">
                    <button onClick={() => setOrders(orders.filter(x => x.id !== o.id))} className="text-red-500 text-xs hover:underline">حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Order Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className={`w-full max-w-md p-6 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">ثبت سفارش جدید</h3>
            <div className="space-y-3">
              <input type="text" placeholder="نام مشتری" value={newOrder.customerName} onChange={e => setNewOrder({...newOrder, customerName: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <select value={newOrder.type} onChange={e => setNewOrder({...newOrder, type: e.target.value as any})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                <option value="service">خدمات</option>
                <option value="media">مدیا</option>
                <option value="product">کالا</option>
                <option value="webdesign">طراحی سایت</option>
              </select>
              <select value={newOrder.channel} onChange={e => setNewOrder({...newOrder, channel: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                <option>حضوری</option>
                <option>وب‌سایت</option>
                <option>تلگرام</option>
                <option>ایتا</option>
                <option>روبیکا</option>
                <option>بله</option>
                <option>اینستاگرام</option>
              </select>
              <select value={newOrder.priority} onChange={e => setNewOrder({...newOrder, priority: e.target.value as any})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                <option value="normal">عادی</option>
                <option value="urgent">فوری</option>
                <option value="vip">VIP</option>
              </select>
              <input type="number" placeholder="مبلغ (تومان)" value={newOrder.total || ''} onChange={e => setNewOrder({...newOrder, total: Number(e.target.value)})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <textarea placeholder="توضیحات" value={newOrder.description} onChange={e => setNewOrder({...newOrder, description: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} rows={3} />
              <button onClick={createOrder} className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">ثبت سفارش</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
