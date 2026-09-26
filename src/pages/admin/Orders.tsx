import React, { useState } from 'react';
import { useApp, Order } from '../../store';
import { Plus, Search, Filter, Kanban, List, User, Clock, AlertCircle, DollarSign, Tag, X } from 'lucide-react';

export default function AdminOrders() {
  const { darkMode, orders, setOrders, users } = useApp();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [newOrder, setNewOrder] = useState({ customerName: '', type: 'service' as const, channel: 'حضوری', priority: 'normal' as const, total: 0, description: '' });

  const statuses = ['new', 'processing', 'ready', 'delivered', 'cancelled'];
  const statusLabels: Record<string, string> = { new: 'جدید', processing: 'در حال انجام', ready: 'آماده', delivered: 'تحویل شد', cancelled: 'لغو' };
  
  const statusColors: Record<string, string> = {
    new: 'from-blue-500 to-blue-600',
    processing: 'from-yellow-500 to-orange-500',
    ready: 'from-green-500 to-green-600',
    delivered: 'from-gray-500 to-gray-600',
    cancelled: 'from-red-500 to-red-600',
  };

  const priorityColors: Record<string, string> = {
    normal: darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    vip: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  };

  const typeLabels: Record<string, string> = {
    service: 'خدمات',
    media: 'مدیا',
    product: 'کالا',
    webdesign: 'طراحی سایت',
  };

  const filtered = orders.filter(o => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    if (filterType !== 'all' && o.type !== filterType) return false;
    if (search && !o.customerName.includes(search) && !o.trackingCode.includes(search)) return false;
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

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('orderId', orderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('orderId');
    const order = orders.find(o => o.id === orderId);
    if (order && order.status !== status) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: status as any } : o));
    }
  };

  // Stats
  const stats = {
    total: orders.length,
    new: orders.filter(o => o.status === 'new').length,
    processing: orders.filter(o => o.status === 'processing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">مدیریت سفارش‌ها</h1>
        <div className="flex gap-2">
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 flex items-center gap-2 text-sm ${viewMode === 'kanban' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600'}`}
            >
              <Kanban size={16} /> کانبان
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 flex items-center gap-2 text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600'}`}
            >
              <List size={16} /> لیست
            </button>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> سفارش جدید
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کل سفارش‌ها</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>جدید</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-yellow-600">{stats.processing}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>در حال انجام</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-green-600">{stats.ready}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>آماده</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-gray-600">{stats.delivered}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>تحویل شده</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="جستجو بر اساس نام مشتری یا کد رهگیری..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className={`w-full pr-10 pl-4 py-2.5 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200'}`} 
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className={`px-3 py-2.5 rounded-lg border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200'}`}>
          <option value="all">همه وضعیت‌ها</option>
          {statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className={`px-3 py-2.5 rounded-lg border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200'}`}>
          <option value="all">همه انواع</option>
          {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {statuses.map(status => {
              const statusOrders = filtered.filter(o => o.status === status);
              return (
                <div
                  key={status}
                  onDragOver={handleDragOver}
                  onDrop={e => handleDrop(e, status)}
                  className={`w-80 flex-shrink-0 rounded-xl border-2 border-dashed transition-all ${
                    darkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  {/* Status Header */}
                  <div className={`p-3 rounded-t-xl bg-gradient-to-l ${statusColors[status]} text-white`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm">{statusLabels[status]}</h3>
                      <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                        {statusOrders.length}
                      </span>
                    </div>
                  </div>

                  {/* Orders List */}
                  <div className="p-3 space-y-3 min-h-[200px]">
                    {statusOrders.map(order => (
                      <div
                        key={order.id}
                        draggable
                        onDragStart={e => handleDragStart(e, order.id)}
                        className={`p-4 rounded-lg border cursor-move transition-all hover:shadow-lg ${
                          darkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-mono text-xs text-blue-600 font-bold mb-1">{order.trackingCode}</p>
                            <h4 className="font-bold text-sm">{order.customerName}</h4>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[order.priority]}`}>
                            {order.priority === 'urgent' ? 'فوری' : order.priority === 'vip' ? 'VIP' : 'عادی'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'}`}>
                            {typeLabels[order.type]}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'}`}>
                            {order.channel}
                          </span>
                        </div>

                        {/* Amount */}
                        <div className={`p-2 rounded-lg mb-2 ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>مبلغ کل:</span>
                            <span className="font-bold">{order.total.toLocaleString('fa-IR')} ت</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>پرداخت شده:</span>
                            <span className="font-bold text-green-600">{order.paid.toLocaleString('fa-IR')} ت</span>
                          </div>
                        </div>

                        {/* Description */}
                        {order.description && (
                          <p className={`text-xs mb-2 line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {order.description}
                          </p>
                        )}

                        {/* Date */}
                        <div className="flex items-center gap-1 text-xs">
                          <Clock size={12} className={darkMode ? 'text-slate-400' : 'text-slate-500'} />
                          <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                            {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                          <button 
                            onClick={() => setOrders(orders.filter(x => x.id !== order.id))} 
                            className="flex-1 text-red-500 text-xs py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    ))}

                    {statusOrders.length === 0 && (
                      <div className={`text-center py-8 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        سفارشی وجود ندارد
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
                <tr>
                  <th className="text-right p-3">کد رهگیری</th>
                  <th className="text-right p-3">مشتری</th>
                  <th className="text-right p-3">نوع</th>
                  <th className="text-right p-3">کانال</th>
                  <th className="text-right p-3">اولویت</th>
                  <th className="text-right p-3">وضعیت</th>
                  <th className="text-right p-3">مبلغ</th>
                  <th className="text-right p-3">تاریخ</th>
                  <th className="text-right p-3">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                    <td className="p-3 font-mono text-xs">{o.trackingCode}</td>
                    <td className="p-3 font-medium">{o.customerName}</td>
                    <td className="p-3">{typeLabels[o.type]}</td>
                    <td className="p-3">{o.channel}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[o.priority]}`}>
                        {o.priority === 'urgent' ? 'فوری' : o.priority === 'vip' ? 'VIP' : 'عادی'}
                      </span>
                    </td>
                    <td className="p-3">
                      <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                        {statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
                      </select>
                    </td>
                    <td className="p-3 font-bold">{o.total.toLocaleString('fa-IR')}</td>
                    <td className="p-3 text-xs">{new Date(o.createdAt).toLocaleDateString('fa-IR')}</td>
                    <td className="p-3">
                      <button onClick={() => setOrders(orders.filter(x => x.id !== o.id))} className="text-red-500 text-xs hover:underline">حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Clock size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
          <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>سفارشی یافت نشد</p>
        </div>
      )}

      {/* New Order Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className={`w-full max-w-md p-6 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">ثبت سفارش جدید</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
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
