import React, { useMemo, useState } from 'react';
import {
  useApp, SupportTicket, TicketStatus, TicketPriority, TicketCategory,
  TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS, TICKET_CATEGORY_LABELS, TICKET_SLA_HOURS,
} from '../../store';
import {
  LifeBuoy, Search, MessageSquare, Clock, CheckCircle2, XCircle, Star,
  AlertTriangle, Send, ChevronLeft, Inbox, User as UserIcon, Link2,
} from 'lucide-react';
import { toJalaliString } from '../../utils/jalali';

const STATUS_COLORS: Record<TicketStatus, string> = {
  open: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-slate-200 text-slate-500',
};

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-sky-100 text-sky-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

// Hours elapsed since an ISO timestamp
const hoursSince = (iso: string) => (Date.now() - new Date(iso).getTime()) / 36e5;

export default function AdminTickets() {
  const { darkMode, currentUser, tickets, adminReplyTicket, updateTicket, orders } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | TicketStatus>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | TicketCategory>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');

  const card = `rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`;
  const inputCls = `px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-slate-800'
  }`;

  // SLA breach: an unfinished ticket older than its priority deadline
  const isOverdue = (t: SupportTicket) =>
    (t.status === 'open' || t.status === 'in_progress') && hoursSince(t.createdAt) > TICKET_SLA_HOURS[t.priority];

  const stats = useMemo(() => ({
    open: tickets.filter(t => t.status === 'open').length,
    progress: tickets.filter(t => t.status === 'in_progress').length,
    overdue: tickets.filter(isOverdue).length,
    avgRating: (() => {
      const rated = tickets.filter(t => t.rating);
      return rated.length ? rated.reduce((s, t) => s + (t.rating || 0), 0) / rated.length : null;
    })(),
  }), [tickets]);

  const filtered = useMemo(() => tickets.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (search) {
      const q = search.trim();
      if (!t.subject.includes(q) && !t.customerName.includes(q) && !t.code.includes(q) && !t.description.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [tickets, filterStatus, filterCategory, search]);

  const selected = tickets.find(t => t.id === selectedId) || null;
  const linkedOrder = selected?.orderId ? orders.find(o => o.id === selected.orderId) : null;

  const sendReply = () => {
    if (!selected || !reply.trim()) return;
    adminReplyTicket(selected.id, reply);
    setReply('');
  };

  const setStatus = (status: TicketStatus) => {
    if (!selected) return;
    updateTicket(selected.id, { status });
  };

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
            <LifeBuoy size={22} className="text-blue-600" />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>تیکت و پشتیبانی</h1>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>مدیریت تیکت‌های ارسالی مشتریان و پاسخ‌دهی تیم پشتیبانی</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'تیکت‌های باز', value: stats.open, icon: Inbox, color: 'text-gray-500' },
          { label: 'در حال رسیدگی', value: stats.progress, icon: Clock, color: 'text-blue-500' },
          { label: 'متأخر از SLA', value: stats.overdue, icon: AlertTriangle, color: 'text-red-500' },
          { label: 'میانگین رضایت', value: stats.avgRating ? stats.avgRating.toFixed(1) : '—', icon: Star, color: 'text-yellow-500' },
        ].map(s => (
          <div key={s.label} className={`${card} p-4 text-center`}>
            <s.icon size={20} className={`mx-auto mb-2 ${s.color}`} />
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{s.value}</p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={`${card} p-4 flex flex-wrap items-center gap-3`}>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجو در موضوع، مشتری یا کد پیگیری…"
            className={inputCls + ' w-full pr-9'}
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className={inputCls}>
          <option value="all">همه وضعیت‌ها</option>
          {(Object.keys(TICKET_STATUS_LABELS) as TicketStatus[]).map(s => (
            <option key={s} value={s}>{TICKET_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as any)} className={inputCls}>
          <option value="all">همه دسته‌ها</option>
          {(Object.keys(TICKET_CATEGORY_LABELS) as TicketCategory[]).map(c => (
            <option key={c} value={c}>{TICKET_CATEGORY_LABELS[c]}</option>
          ))}
        </select>
      </div>

      {/* List + detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Ticket list */}
        <div className={`${card} lg:col-span-2 overflow-hidden`}>
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Inbox size={44} className={`mx-auto mb-3 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>تیکتی مطابق فیلترها یافت نشد</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
              {filtered.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setSelectedId(t.id); setReply(''); }}
                  className={`w-full text-right p-4 transition-colors hover:bg-blue-50/50 ${
                    selectedId === t.id ? (darkMode ? 'bg-slate-700' : 'bg-blue-50') : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-xs text-blue-600">{t.code}</span>
                    <div className="flex items-center gap-1.5">
                      {isOverdue(t) && (
                        <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                          <AlertTriangle size={10} /> تأخیر
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status]}`}>{TICKET_STATUS_LABELS[t.status]}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${PRIORITY_COLORS[t.priority]}`}>{TICKET_PRIORITY_LABELS[t.priority]}</span>
                    </div>
                  </div>
                  <p className={`text-sm font-medium truncate mb-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{t.subject}</p>
                  <div className={`flex items-center justify-between text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span className="flex items-center gap-1"><UserIcon size={11} /> {t.customerName}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={11} /> {t.messages.length}
                      <Clock size={11} /> {toJalaliString(t.updatedAt)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ticket detail / conversation */}
        <div className={`${card} lg:col-span-3 p-5`}>
          {!selected ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center">
              <ChevronLeft size={40} className={darkMode ? 'text-slate-600' : 'text-gray-300'} />
              <p className={`mt-3 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>یک تیکت را از لیست انتخاب کنید تا گفتگو و ابزارهای رسیدگی نمایش داده شود.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Meta */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-slate-800'}`}>{selected.subject}</h2>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {selected.code} • {selected.customerName} • {selected.customerPhone} • ثبت: {toJalaliString(selected.createdAt)}
                    {' '}• دسته: {TICKET_CATEGORY_LABELS[selected.category]}
                  </p>
                  {linkedOrder && (
                    <p className="text-xs mt-1 flex items-center gap-1 text-blue-600">
                      <Link2 size={12} /> مرتبط با سفارش {linkedOrder.trackingCode}
                    </p>
                  )}
                  {selected.assignedTo && (
                    <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>مسئول: {selected.assignedTo}</p>
                  )}
                  {selected.rating ? (
                    <p className="text-xs mt-1 flex items-center gap-1 text-yellow-500">
                      <Star size={12} fill="currentColor" /> امتیاز مشتری: {selected.rating} از ۵
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selected.priority}
                    onChange={e => updateTicket(selected.id, { priority: e.target.value as TicketPriority })}
                    className={inputCls + ' text-xs'}
                    title="اولویت"
                  >
                    {(Object.keys(TICKET_PRIORITY_LABELS) as TicketPriority[]).map(p => (
                      <option key={p} value={p}>{TICKET_PRIORITY_LABELS[p]}</option>
                    ))}
                  </select>
                  <select
                    value={selected.status}
                    onChange={e => setStatus(e.target.value as TicketStatus)}
                    className={inputCls + ' text-xs'}
                    title="وضعیت"
                  >
                    {(Object.keys(TICKET_STATUS_LABELS) as TicketStatus[]).map(s => (
                      <option key={s} value={s}>{TICKET_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {isOverdue(selected) && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertTriangle size={16} />
                  این تیکت بیش از مهلت SLA ({TICKET_SLA_HOURS[selected.priority]} ساعت) بدون پاسخ مانده است.
                </div>
              )}

              {/* Conversation thread */}
              <div className={`rounded-xl border p-4 space-y-3 max-h-[45vh] overflow-y-auto ${darkMode ? 'border-slate-700 bg-slate-900/40' : 'border-gray-200 bg-gray-50'}`}>
                {selected.messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender === 'support' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      m.sender === 'support'
                        ? 'bg-blue-600 text-white'
                        : darkMode ? 'bg-slate-700 text-slate-100' : 'bg-white border border-gray-200 text-slate-800'
                    }`}>
                      <p className="font-medium text-xs opacity-80 mb-1">
                        {m.sender === 'support' ? `پشتیبانی – ${m.author}` : `مشتری – ${m.author}`}
                      </p>
                      <p className="whitespace-pre-wrap leading-6">{m.text}</p>
                      <p className="text-[10px] opacity-70 mt-1">{toJalaliString(m.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply box (only while the ticket is being handled) */}
              {selected.status !== 'closed' ? (
                <div className="flex gap-2">
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    rows={3}
                    placeholder={`پاسخ به عنوان ${currentUser?.name || 'تیم پشتیبانی'}…`}
                    className={inputCls + ' flex-1 resize-none'}
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={sendReply}
                      disabled={!reply.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Send size={15} /> ارسال
                    </button>
                    <button
                      onClick={() => { if (reply.trim()) { sendReply(); } setStatus('resolved'); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
                      title="ارسال پاسخ و بستن تیکت به عنوان حل‌شده"
                    >
                      <CheckCircle2 size={15} /> حل شد
                    </button>
                    <button
                      onClick={() => setStatus('closed')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-500 text-white text-sm font-medium hover:bg-gray-600"
                      title="بستن تیکت بدون رسیدگی (هرزنامه/تکراری)"
                    >
                      <XCircle size={15} /> بستن
                    </button>
                  </div>
                </div>
              ) : (
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  این تیکت بسته شده است. با تغییر وضعیت به «باز» می‌توانید دوباره آن را فعال کنید.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
