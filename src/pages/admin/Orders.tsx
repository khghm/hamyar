import React, { useMemo, useState } from 'react';
import { useApp, Order } from '../../store';
import {
  Plus, Search, Clock, DollarSign, X, Eye, CheckCircle, XCircle, Paperclip, ExternalLink,
  Briefcase, Link2, ArrowUpDown, ChevronRight, ChevronLeft, Trash2, CheckSquare, Square,
  CreditCard, Inbox, Filter, User,
} from 'lucide-react';
import { toJalaliString } from '../../utils/jalali';
import { PROJECT_FIELD_LABELS, getProjectService } from '../../store';
import { settleOrderPayment } from '../../api/orders';

type SortKey = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'customer';

export default function AdminOrders() {
  const { darkMode, orders, setOrders, updateOrder, updateOrderStatus, deleteOrder, projects, setProjects, contentProjects } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('date-desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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

  // Orders created through the public wizard of «تولید محتوا» carry a
  // projectServiceId (ps-ct-*) while keeping the technical type "service" –
  // show them with their own label so admins can tell the two apart.
  const isContentOrder = (o: Order) => o.type === 'service' && (!!o.contentProjectId || (!!o.projectServiceId && o.projectServiceId.startsWith('ps-ct')));
  const orderTypeLabel = (o: Order) => (isContentOrder(o) ? 'تولید محتوا' : typeLabels[o.type]);

  // Details modal state – shows the supplementary info + uploaded documents of
  // online orders and lets the admin approve/reject the documents. The linked
  // project / invoice stay in sync through the store (same order code).
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);

  // ثبت پرداخت: مبلغی که واقعاً از مشتری گرفته شده (کارت‌به‌کارت/POS/نقدی).
  // برخلاف بقیهٔ ویرایش‌های این صفحه، این یکی سمت سرور انجام می‌شود تا عدد
  // `paid` در دیتابیس هم ثبت شود و گزارش‌های مالی واقعی بمانند.
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const registerPayment = async (o: Order) => {
    const remaining = Math.max(0, (o.total || 0) - (o.paid || 0));
    if (remaining <= 0 || settlingId) return;
    const input = window.prompt(
      `مبلغ دریافتی برای سفارش ${o.trackingCode} (تومان)\nمانده: ${remaining.toLocaleString('fa-IR')} تومان`,
      String(remaining),
    );
    if (input === null) return;
    const amount = Number(String(input).replace(/[^\d]/g, ''));
    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert('مبلغ وارد‌شده معتبر نیست.');
      return;
    }
    setSettlingId(o.id);
    const res = await settleOrderPayment(o.id, amount);
    setSettlingId(null);
    if (!res.ok) {
      window.alert('ثبت پرداخت ناموفق بود: ' + (res.error || 'خطای نامشخص'));
      return;
    }
    updateOrder(o.id, {
      paid: res.paid ?? (o.paid || 0) + amount,
      remaining: res.remaining ?? Math.max(0, (o.total || 0) - ((o.paid || 0) + amount)),
    });
  };

  const filtered = orders.filter(o => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    if (filterType === 'content') { if (!isContentOrder(o)) return false; }
    else if (filterType !== 'all' && o.type !== filterType) return false;
    if (search && !o.customerName.includes(search) && !o.trackingCode.includes(search)) return false;
    return true;
  });

  // ── مرتب‌سازی و صفحه‌بندی ─────────────────────────────────────────────────
  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sortBy) {
      case 'date-asc': list.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')); break;
      case 'amount-desc': list.sort((a, b) => (b.total || 0) - (a.total || 0)); break;
      case 'amount-asc': list.sort((a, b) => (a.total || 0) - (b.total || 0)); break;
      case 'customer': list.sort((a, b) => (a.customerName || '').localeCompare(b.customerName || '', 'fa')); break;
      default: list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }
    return list;
  }, [filtered, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const allOnPageSelected = paged.length > 0 && paged.every(o => selectedIds.includes(o.id));
  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedIds(prev => prev.filter(id => !paged.some(o => o.id === id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...paged.map(o => o.id)])]);
    }
  };
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const bulkSetStatus = (status: string) => {
    selectedIds.forEach(id => updateOrderStatus(id, status as any));
    setSelectedIds([]);
  };
  const bulkDelete = () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`حذف ${selectedIds.length} سفارش انتخاب‌شده؟ این کار قابل بازگشت نیست.`)) return;
    selectedIds.forEach(id => deleteOrder(id));
    setSelectedIds([]);
  };

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
    updateOrderStatus(id, status as any);
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
    <div className="fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">مدیریت سفارش‌ها</h1>
          <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {filtered.length.toLocaleString('fa-IR')} سفارش در نمای فعلی · {orders.length.toLocaleString('fa-IR')} سفارش در کل
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm">
          <Plus size={16} /> سفارش جدید
        </button>
      </div>

      {/* Stat chips — با کلیک روی هر کارت، فیلتر وضعیت همان را می‌گیرد */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { key: 'all', label: 'کل سفارش‌ها', value: orders.length, color: 'text-slate-700 dark:text-slate-200', ring: 'ring-slate-400' },
          { key: 'new', label: 'جدید', value: stats.new, color: 'text-blue-600', ring: 'ring-blue-500' },
          { key: 'processing', label: 'در حال انجام', value: stats.processing, color: 'text-amber-600', ring: 'ring-amber-500' },
          { key: 'ready', label: 'آماده', value: stats.ready, color: 'text-emerald-600', ring: 'ring-emerald-500' },
          { key: 'delivered', label: 'تحویل شده', value: stats.delivered, color: 'text-slate-500', ring: 'ring-slate-400' },
        ].map(card => {
          const active = filterStatus === card.key;
          return (
            <button
              key={card.key}
              onClick={() => { setFilterStatus(card.key); setPage(1); }}
              className={`text-right p-4 rounded-xl border transition-all ${active ? `ring-2 ${card.ring} border-transparent` : ''} ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white border-gray-200 hover:border-gray-300'}`}
            >
              <div className={`text-2xl font-bold ${card.color}`}>{card.value.toLocaleString('fa-IR')}</div>
              <div className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{card.label}</div>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className={`p-3 rounded-xl border flex flex-wrap items-center gap-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex-1 min-w-[220px] relative">
          <Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="جستجوی نام مشتری یا کد رهگیری…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className={`w-full pr-10 pl-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className={`flex items-center gap-1 px-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className={`bg-transparent py-2 text-sm outline-none ${darkMode ? 'text-white' : 'text-slate-700'}`}
            >
              <option value="all">همه وضعیت‌ها</option>
              {statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
            </select>
          </div>

          <select
            value={filterType}
            onChange={e => { setFilterType(e.target.value); setPage(1); }}
            className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}
          >
            <option value="all">همه انواع</option>
            {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            <option value="content">تولید محتوا</option>
          </select>

          <select
            value={sortBy}
            onChange={e => { setSortBy(e.target.value as SortKey); setPage(1); }}
            className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}
            title="مرتب‌سازی"
          >
            <option value="date-desc">جدیدترین</option>
            <option value="date-asc">قدیمی‌ترین</option>
            <option value="amount-desc">بیشترین مبلغ</option>
            <option value="amount-asc">کمترین مبلغ</option>
            <option value="customer">نام مشتری</option>
          </select>

          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}
            title="تعداد در صفحه"
          >
            {[10, 25, 50].map(n => <option key={n} value={n}>{n} در صفحه</option>)}
          </select>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className={`flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
          <span className="text-sm font-medium">{selectedIds.length.toLocaleString('fa-IR')} سفارش انتخاب شده</span>
          <div className="flex items-center gap-2 mr-auto">
            <select
              defaultValue=""
              onChange={e => { if (e.target.value) { bulkSetStatus(e.target.value); e.currentTarget.value = ''; } }}
              className={`px-3 py-1.5 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-blue-200'}`}
            >
              <option value="">تغییر وضعیت…</option>
              {statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
            </select>
            <button onClick={bulkDelete} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">
              <Trash2 size={14} /> حذف
            </button>
            <button onClick={() => setSelectedIds([])} className={`px-3 py-1.5 rounded-lg text-sm ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-600 border border-gray-200'}`}>
              لغو انتخاب
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={`sticky top-0 z-10 ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
              <tr className={`${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                <th className="p-3 w-10">
                  <button onClick={toggleSelectAll} title="انتخاب همهٔ این صفحه" className="flex items-center justify-center">
                    {allOnPageSelected ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} className="text-slate-400" />}
                  </button>
                </th>
                <th className="text-right p-3 font-medium">سفارش</th>
                <th className="text-right p-3 font-medium">
                  <button onClick={() => setSortBy(sortBy === 'customer' ? 'date-desc' : 'customer')} className="inline-flex items-center gap-1 hover:underline">
                    مشتری <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="text-right p-3 font-medium hidden md:table-cell">نوع</th>
                <th className="text-right p-3 font-medium">
                  <button onClick={() => setSortBy(sortBy === 'amount-desc' ? 'amount-asc' : 'amount-desc')} className="inline-flex items-center gap-1 hover:underline">
                    مبلغ <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="text-right p-3 font-medium hidden lg:table-cell">پرداخت</th>
                <th className="text-right p-3 font-medium">وضعیت</th>
                <th className="text-right p-3 font-medium hidden lg:table-cell">
                  <button onClick={() => setSortBy(sortBy === 'date-desc' ? 'date-asc' : 'date-desc')} className="inline-flex items-center gap-1 hover:underline">
                    تاریخ <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="text-right p-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(o => {
                const selected = selectedIds.includes(o.id);
                const paid = Number(o.paid) || 0;
                const total = Number(o.total) || 0;
                const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
                const linkedProject = projects?.find(p => p.id === o.projectId);
                return (
                  <tr
                    key={o.id}
                    className={`border-t transition-colors ${selected ? (darkMode ? 'bg-blue-900/20' : 'bg-blue-50/60') : ''} ${darkMode ? 'border-slate-700 hover:bg-slate-700/40' : 'border-gray-100 hover:bg-gray-50'}`}
                  >
                    <td className="p-3">
                      <button onClick={() => toggleSelect(o.id)} title="انتخاب سفارش" className="flex items-center justify-center">
                        {selected ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} className="text-slate-300" />}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="font-mono text-xs font-semibold whitespace-nowrap">{o.trackingCode}</div>
                      <div className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {o.channel} {o.priority !== 'normal' && <span className={`mr-1 px-1.5 py-0.5 rounded ${priorityColors[o.priority]}`}>{o.priority === 'urgent' ? 'فوری' : 'VIP'}</span>}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>
                          {(o.customerName || '؟').trim().charAt(0)}
                        </div>
                        <span className="font-medium truncate max-w-[140px]" title={o.customerName}>{o.customerName || '—'}</span>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>{orderTypeLabel(o)}</span>
                    </td>
                    <td className="p-3 font-bold whitespace-nowrap">{total.toLocaleString('fa-IR')} <span className={`text-[10px] font-normal ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>تومان</span></td>
                    <td className="p-3 hidden lg:table-cell min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                          <div className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-500' : 'bg-slate-300'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`text-[11px] tabular-nums ${pct >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>{pct}٪</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <select
                        value={o.status}
                        onChange={e => updateStatus(o.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-md border font-medium ${statusColors[o.status] || ''} ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-200'}`}
                      >
                        {statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
                      </select>
                    </td>
                    <td className={`p-3 text-xs whitespace-nowrap hidden lg:table-cell ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {toJalaliString(o.createdAt)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {(o.formData || o.documents) && (
                          <button onClick={() => setDetailsOrder(o)} title="جزئیات" className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-slate-600 text-slate-300' : 'hover:bg-gray-100 text-slate-500'}`}>
                            <Eye size={15} />
                          </button>
                        )}
                        {paid < total && (
                          <button onClick={() => registerPayment(o)} disabled={settlingId === o.id} title="ثبت پرداخت" className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 disabled:opacity-40">
                            <CreditCard size={15} />
                          </button>
                        )}
                        {o.type === 'webdesign' && (
                          <button
                            title="ایجاد پروژه"
                            onClick={() => {
                              const newProject = {
                                id: 'pr' + Date.now(),
                                title: o.formData?.industry ? `سایت ${o.formData.industry}` : `پروژه ${o.trackingCode}`,
                                clientName: o.customerName,
                                type: o.formData?.industry || 'فروشگاهی',
                                stage: 'مشاوره',
                                deadline: o.formData?.deadline || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
                                totalCost: o.total,
                                paidAmount: paid,
                                progress: 0,
                                description: `سازماندهی از سفارش ${o.trackingCode} - ${o.description || ''}`,
                                sourceOrderId: o.id,
                              };
                              setProjects([...projects, newProject]);
                              updateOrder(o.id, { projectId: newProject.id });
                              alert(`پروژه «${newProject.title}» ایجاد و به سفارش ${o.trackingCode} لینک شد.`);
                            }}
                            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-500/10"
                          >
                            <Briefcase size={15} />
                          </button>
                        )}
                        {linkedProject && (
                          <span className="text-[11px] text-blue-600 truncate max-w-[90px]" title={`${linkedProject.title} (${linkedProject.stage})`}>
                            {linkedProject.title}
                          </span>
                        )}
                        <button onClick={() => deleteOrder(o.id)} title="حذف" className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {paged.length === 0 && (
          <div className="text-center py-14">
            <Inbox size={44} className={`mx-auto mb-3 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
            <p className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>سفارشی با این فیلترها پیدا نشد</p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>فیلترها یا عبارت جستجو را تغییر دهید.</p>
          </div>
        )}

        {/* Pagination */}
        {sorted.length > 0 && (
          <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
            <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              نمایش {(currentPage - 1) * pageSize + 1} تا {Math.min(currentPage * pageSize, sorted.length)} از {sorted.length.toLocaleString('fa-IR')}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`p-1.5 rounded-lg border disabled:opacity-40 ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-200 hover:bg-gray-50'}`}
                title="صفحهٔ قبل"
              >
                <ChevronRight size={16} />
              </button>
              {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => {
                const pageNumber = totalPages <= 7 ? i + 1 : (currentPage <= 4 ? i + 1 : (currentPage >= totalPages - 3 ? totalPages - 6 + i : currentPage - 3 + i));
                if (pageNumber < 1 || pageNumber > totalPages) return null;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium ${pageNumber === currentPage ? 'bg-blue-600 text-white' : darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-slate-600'}`}
                  >
                    {pageNumber.toLocaleString('fa-IR')}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`p-1.5 rounded-lg border disabled:opacity-40 ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-200 hover:bg-gray-50'}`}
                title="صفحهٔ بعد"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

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

      {/* Order Details Modal – supplementary info + uploaded documents (approve/reject) */}
      {detailsOrder && (() => {
        // Always read the freshest copy of the order from the store so that
        // document approval instantly reflects everywhere (orders / projects sync).
        const live = orders.find(o => o.id === detailsOrder.id) || detailsOrder;
        const ps = getProjectService(live.projectServiceId);
        const linkedProject = projects?.find(p => p.id === live.projectId);
        const linkedContentTask = contentProjects?.find(cp => cp.id === live.contentProjectId);
        const CONTENT_STATUS_LABELS: Record<string, string> = { planning: 'برنامه‌ریزی', 'in-progress': 'در حال انجام', review: 'بازبینی', completed: 'تکمیل شده', published: 'منتشر شده' };
        const formEntries = Object.entries(live.formData || {});
        const docs = live.documents || [];
        const docStatus = live.documentStatus || 'pending';
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetailsOrder(null)}>
            <div className={`w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 rounded-2xl ${darkMode ? 'bg-slate-800 text-white' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">جزئیات سفارش {live.trackingCode}</h3>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {ps ? `خدمت پروژه: ${ps.title}` : live.description?.slice(0, 60)} – {orderTypeLabel(live)}
                  </p>
                </div>
                <button onClick={() => setDetailsOrder(null)}><X size={20} /></button>
              </div>

              {/* Supplementary information entered by the customer (wizard step 1) */}
              <div className="mb-5">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-1"><User size={14} /> اطلاعات تکمیلی مشتری</h4>
                {formEntries.length === 0 ? (
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>اطلاعاتی ثبت نشده است.</p>
                ) : (
                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'} p-3 rounded-lg`}>
                    {formEntries.map(([k, v]) => (
                      <div key={k} className="flex flex-col">
                        <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>{PROJECT_FIELD_LABELS[k] || k}</span>
                        <span className="font-medium break-words">{String(v) || '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Uploaded documents (wizard step 2) with admin review */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm flex items-center gap-1"><Paperclip size={14} /> مدارک بارگذاری‌شده ({docs.length})</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    docStatus === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : docStatus === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                  }`}>
                    {docStatus === 'approved' ? 'تأیید شده' : docStatus === 'rejected' ? 'رد شده' : 'در انتظار بررسی'}
                  </span>
                </div>
                {docs.length === 0 ? (
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>سندی آپلود نشده است.</p>
                ) : (
                  <div className="space-y-2">
                    {docs.map((d, i) => (
                      <div key={i} className={`flex items-center justify-between gap-2 p-2 rounded-lg border ${darkMode ? 'border-slate-700 bg-slate-700/30' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{d.label || PROJECT_FIELD_LABELS[d.key] || d.key}</p>
                          <p className={`text-[11px] truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{d.name} – {(d.size / 1024).toFixed(0)} کیلوبایت</p>
                        </div>
                        <a href={d.dataUrl} target="_blank" rel="noreferrer"
                          className="text-blue-600 text-xs flex items-center gap-1 hover:underline flex-shrink-0">
                          <ExternalLink size={12} /> مشاهده
                        </a>
                      </div>
                    ))}
                  </div>
                )}
                {docs.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => updateOrder(live.id, { documentStatus: 'approved' })}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium ${docStatus === 'approved' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300'}`}
                    >
                      <CheckCircle size={14} /> تأیید مدارک
                    </button>
                    <button
                      onClick={() => updateOrder(live.id, { documentStatus: 'rejected' })}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium ${docStatus === 'rejected' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300'}`}
                    >
                      <XCircle size={14} /> رد مدارک
                    </button>
                  </div>
                )}
              </div>

              {/* Payment information (gateway / wallet) + linked project */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <div>
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>روش پرداخت:</span>{' '}
                  <span className="font-medium">{live.paymentMethod === 'wallet' ? 'کیف پول' : live.paymentMethod === 'online' ? 'درگاه بانکی آنلاین' : '—'}</span>
                </div>
                <div>
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>کد پیگیری بانک:</span>{' '}
                  <span className="font-mono font-medium">{live.gatewayRef || '—'}</span>
                </div>
                <div>
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>مبلغ پرداخت‌شده:</span>{' '}
                  <span className="font-bold text-green-600">{live.paid.toLocaleString('fa-IR')} تومان</span>
                </div>
                <div>
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>پروژه مرتبط:</span>{' '}
                  {linkedProject && !isContentOrder(live) ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-medium text-blue-600">{linkedProject.title} ({linkedProject.stage})</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(linkedProject.id);
                          alert(`شناسه پروژه کپی شد: ${linkedProject.id}\nبرای مشاهده در بخش پروژه‌ها، به تب «پروژه‌ها» بروید.`);
                        }}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Link2 size={12} /> کپی شناسه
                      </button>
                    </div>
                  ) : isContentOrder(live) ? (
                    /* Content-production orders are tracked only in «تیم تولید محتوا», not in بخش پروژه‌ها */
                    <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>(در بخش تیم تولید محتوا پیگیری می‌شود)</span>
                  ) : '—'}
                </div>
                <div className="sm:col-span-2">
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>تسک تیم تولید محتوا:</span>{' '}
                  {linkedContentTask ? (
                    <span className="font-medium text-purple-600 dark:text-purple-400">
                      {linkedContentTask.title} – وضعیت فعلی: {CONTENT_STATUS_LABELS[linkedContentTask.status] || linkedContentTask.status}
                    </span>
                  ) : <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>(سفارش از نوع طراحی سایت است)</span>}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-5">
                {(live.paid || 0) < (live.total || 0) && (
                  <button
                    onClick={() => registerPayment(live)}
                    disabled={settlingId === live.id}
                    className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <DollarSign size={16} />
                    {settlingId === live.id
                      ? 'در حال ثبت…'
                      : `ثبت پرداخت (مانده: ${Math.max(0, (live.total || 0) - (live.paid || 0)).toLocaleString('fa-IR')} تومان)`}
                  </button>
                )}
                <button onClick={() => setDetailsOrder(null)} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">بستن</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

