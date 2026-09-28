import React, { useState } from 'react';
import { useApp, TicketCategory, TicketPriority, TICKET_CATEGORY_LABELS, TICKET_PRIORITY_LABELS } from '../store';
import { LifeBuoy, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface TicketFormProps {
  onClose: () => void;
}

// Public "ثبت تیکت پشتیبانی" modal used from the customer profile page and the
// chat widget fallback. Validation is intentionally minimal – everything else
// (thread creation, analytics event) is handled by store.createTicket.
export default function TicketForm({ onClose }: TicketFormProps) {
  const { darkMode, currentUser, orders, createTicket } = useApp();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('general');
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');
  const [createdCode, setCreatedCode] = useState('');

  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-slate-800'
  }`;
  const labelCls = `block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`;

  // Only offer the customer's own orders for linking a ticket to
  const myOrders = currentUser ? orders.filter(o => o.customerId === currentUser.id).slice(0, 20) : [];

  const submit = () => {
    setError('');
    const res = createTicket({ subject, description, category, priority, orderId: orderId || undefined });
    if (!res.ok) {
      setError(res.error || 'خطا در ثبت تیکت');
      return;
    }
    setCreatedCode(res.ticket?.code || '');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className={`w-full max-w-lg rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto ${
          darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-white text-slate-800'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {createdCode ? (
          <div className="text-center py-6">
            <CheckCircle2 size={56} className="mx-auto mb-4 text-green-500" />
            <h3 className="font-bold text-xl mb-2">تیکت شما ثبت شد</h3>
            <p className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              کد پیگیری تیکت را یادداشت کنید. پاسخ پشتیبانی از طریق پیامک به شما اطلاع داده می‌شود.
            </p>
            <div className="inline-block px-6 py-3 rounded-xl bg-blue-50 border border-blue-200 mb-6">
              <span className="font-mono text-lg font-bold text-blue-700">{createdCode}</span>
            </div>
            <div>
              <button onClick={onClose} className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                متوجه شدم
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <LifeBuoy size={22} className="text-blue-600" />
                <h3 className="font-bold text-lg">ثبت تیکت پشتیبانی</h3>
              </div>
              <button onClick={onClose} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                <X size={18} />
              </button>
            </div>

            {!currentUser && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-4">
                <AlertCircle size={16} /> برای ثبت تیکت ابتدا وارد حساب کاربری خود شوید.
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className={labelCls}>موضوع تیکت *</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="مثلاً: مشکل در دریافت فایل سفارش ترجمه" className={inputCls} maxLength={120} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>دسته‌بندی</label>
                  <select value={category} onChange={e => setCategory(e.target.value as TicketCategory)} className={inputCls}>
                    {(Object.keys(TICKET_CATEGORY_LABELS) as TicketCategory[]).map(c => (
                      <option key={c} value={c}>{TICKET_CATEGORY_LABELS[c]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>اولویت</label>
                  <select value={priority} onChange={e => setPriority(e.target.value as TicketPriority)} className={inputCls}>
                    {(Object.keys(TICKET_PRIORITY_LABELS) as TicketPriority[]).map(p => (
                      <option key={p} value={p}>{TICKET_PRIORITY_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {myOrders.length > 0 && (
                <div>
                  <label className={labelCls}>ارتباط با سفارش (اختیاری)</label>
                  <select value={orderId} onChange={e => setOrderId(e.target.value)} className={inputCls}>
                    <option value="">بدون ارتباط با سفارش</option>
                    {myOrders.map(o => (
                      <option key={o.id} value={o.id}>{o.trackingCode} – {o.description || o.items?.[0]?.name || 'سفارش'}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={labelCls}>شرح مشکل / درخواست *</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={5}
                  placeholder="توضیح کامل مشکل یا درخواست خود را بنویسید. هرچه جزئیات بیشتر باشد، پاسخ‌دهی سریع‌تر انجام می‌شود."
                  className={inputCls + ' resize-none'}
                  maxLength={2000}
                />
                <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{description.length}/۲۰۰۰ کاراکتر</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={submit}
                  disabled={!currentUser}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ثبت و ارسال تیکت
                </button>
                <button onClick={onClose} className={`px-4 py-2.5 rounded-lg text-sm font-medium ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
                  انصراف
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
