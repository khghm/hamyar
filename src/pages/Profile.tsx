import React, { useEffect, useState } from 'react';
import { useApp } from '../store';
import { 
  Heart, Star, Gift, Users, Copy, Film, Award, ChevronLeft, ShoppingCart, 
  Package, Eye, Clock, CheckCircle, TrendingUp, DollarSign, Calendar,
  User, Phone, Mail, Upload, Wallet, Trophy, Zap, CalendarCheck, History as LoyaltyHistory,
  LifeBuoy, Plus, Send, RotateCcw, CreditCard
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { startOnlinePayment, startWalletTopUp, reconcilePayments } from '../api/zarinpal';
import { uploadImageToSupabase } from '../api/storage';
import { updateCustomerProfile as updateCustomerProfileApi } from '../api/auth';
import { useAuthStore } from '../state/authStore';
import { useOrderStore } from '../state/orderStore';
import { toJalaliString } from '../utils/jalali';
import TicketForm from '../components/TicketForm';
import {
  TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS, TICKET_CATEGORY_LABELS,
  isTicketOwner, isOrderOwner, SupportTicket,
} from '../store';

const ticketStatusCls: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
};

// Customer-side ticket thread: list of my tickets + inline reply / reopen / rating
function MyTickets({ darkMode }: { darkMode: boolean }) {
  const { currentUser, tickets, replyTicket, reopenTicket, rateTicket } = useApp();
  const [openForm, setOpenForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  if (!currentUser) return null;
  const myTickets = tickets
    .filter(t => t.customerId === currentUser.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const cardCls = `rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`;

  const sendReply = (t: SupportTicket) => {
    const text = replyText.trim();
    if (!text) return;
    if (t.status === 'resolved' || t.status === 'closed') reopenTicket(t.id, text);
    else replyTicket(t.id, text);
    setReplyText('');
  };

  return (
    <div className="space-y-6">
      {/* Header + new-ticket button */}
      <div className={`${cardCls} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <LifeBuoy size={20} className="text-blue-500" />
            <h3 className="font-bold text-lg">تیکت‌های پشتیبانی من</h3>
          </div>
          <button
            onClick={() => setOpenForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            <Plus size={16} /> ثبت تیکت جدید
          </button>
        </div>

        {myTickets.length === 0 ? (
          <div className="py-10 text-center">
            <LifeBuoy size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
            <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>هنوز تیکتی ثبت نکرده‌اید</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myTickets.map(t => {
              const isOpen = expandedId === t.id;
              const canReply = t.status !== 'closed' || true; // customers can always follow up (reopens the ticket)
              return (
                <div key={t.id} className={`rounded-xl border ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                  {/* Row header */}
                  <button
                    onClick={() => { setExpandedId(isOpen ? null : t.id); setReplyText(''); }}
                    className="w-full p-4 flex items-center justify-between gap-3 text-right"
                  >
                    <div className="min-w-0">
                      <p className="font-bold truncate">{t.subject}</p>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span className="font-mono text-blue-600">{t.code}</span>
                        {' · '}{TICKET_CATEGORY_LABELS[t.category]}
                        {' · '}به‌روزرسانی: {toJalaliString(t.updatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-1 rounded ${ticketStatusCls[t.status]}`}>{TICKET_STATUS_LABELS[t.status]}</span>
                      <span className={`text-xs px-2 py-1 rounded ${t.priority === 'urgent' ? 'bg-red-100 text-red-700' : t.priority === 'high' ? 'bg-orange-100 text-orange-700' : darkMode ? 'bg-slate-600 text-slate-200' : 'bg-gray-200 text-gray-600'}`}>
                        {TICKET_PRIORITY_LABELS[t.priority]}
                      </span>
                      <ChevronLeft size={16} className={`transition-transform ${isOpen ? '-rotate-90' : ''}`} />
                    </div>
                  </button>

                  {/* Thread */}
                  {isOpen && (
                    <div className={`px-4 pb-4 space-y-3 ${darkMode ? 'border-t border-slate-600' : 'border-t border-gray-200'}`}>
                      <div className="pt-4 space-y-2">
                        {t.messages.map(m => (
                          <div key={m.id} className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                            m.sender === 'support'
                              ? 'ms-auto bg-blue-600 text-white'
                              : darkMode ? 'bg-slate-600 text-white' : 'bg-white border border-gray-200'
                          }`}>
                            <p className={`text-[11px] mb-1 ${m.sender === 'support' ? 'text-blue-100' : darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                              {m.author} · {toJalaliString(m.createdAt)}
                            </p>
                            <p className="whitespace-pre-wrap leading-6">{m.text}</p>
                          </div>
                        ))}
                      </div>

                      {/* Rating after resolution */}
                      {t.status === 'resolved' && (
                        <div className={`p-3 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-600' : 'bg-green-50 border-green-200'}`}>
                          {t.rating ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Star size={14} className="text-amber-500 fill-amber-500" />
                              <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                                امتیاز شما به این پشتیبانی: {t.rating.toLocaleString('fa-IR')} از ۵ — سپاسگزاریم!
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>نظر شما درباره کیفیت پاسخ پشتیبانی:</span>
                              {[1, 2, 3, 4, 5].map(n => (
                                <button key={n} onClick={() => rateTicket(t.id, n)} title={`${n} ستاره`}>
                                  <Star size={18} className="text-amber-400 hover:fill-amber-400" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Reply box */}
                      {canReply && (
                        <div className="flex gap-2">
                          <input
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendReply(t)}
                            placeholder={(t.status === 'resolved' || t.status === 'closed') ? 'برای بازگشایی تیکت، پیام خود را بنویسید…' : 'پاسخ یا پیام تکمیلی…'}
                            className={`flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300'
                            }`}
                          />
                          <button
                            onClick={() => sendReply(t)}
                            disabled={!replyText.trim()}
                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                              replyText.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : darkMode ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {(t.status === 'resolved' || t.status === 'closed') ? <RotateCcw size={15} /> : <Send size={15} />}
                            {(t.status === 'resolved' || t.status === 'closed') ? 'بازگشایی و ارسال' : 'ارسال'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {openForm && <TicketForm onClose={() => setOpenForm(false)} />}
    </div>
  );
}

export default function Profile() {
  const {
    darkMode, currentUser, mediaItems, orders, products, addToFavorites, selectMedia, updateAvatar,
    updateCustomerProfile, gamificationConfig, redeemLoyaltyReward, getEarnedBadges, loyaltyTx,
  } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'media' | 'products' | 'orders' | 'tickets' | 'loyalty' | 'wallet'>('overview');
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [chargeAmount, setChargeAmount] = useState(0);
  const [birthDateDraft, setBirthDateDraft] = useState(currentUser?.birthDate?.slice(0, 10) || '');
  const [payingId, setPayingId] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(currentUser?.name || '');

  /** آپلود واقعی آواتار در Storage + ذخیرهٔ آدرس در پروفایل. */
  const handleAvatarUpload = async (file: File) => {
    if (!file || avatarUploading) return;
    setAvatarUploading(true);
    try {
      const { url, error } = await uploadImageToSupabase('avatars', file);
      if (!url) {
        alert('آپلود عکس ناموفق بود: ' + (error || 'خطای نامشخص'));
        return;
      }
      const res = await updateCustomerProfileApi({ avatarUrl: url });
      if (!res.ok) {
        alert('ذخیرهٔ عکس ناموفق بود: ' + (res.error || 'خطای نامشخص'));
        return;
      }
      updateAvatar(url);
    } catch (e: any) {
      alert('ذخیرهٔ عکس ناموفق بود: ' + (e?.message || 'خطای شبکه'));
    } finally {
      setAvatarUploading(false);
    }
  };

  const saveName = () => {
    const name = (nameDraft || '').trim();
    if (name.length < 3) {
      alert('نام و نام خانوادگی را کامل وارد کنید');
      return;
    }
    updateCustomerProfile({ name });
    setEditingName(false);
  };

  // اگر پرداختی در درگاه انجام شده ولی کاربر به صفحهٔ بازگشت نرسیده باشد، با
  // ورود به پروفایل یک‌بار بازبینی و تسویه می‌شود.
  useEffect(() => {
    let alive = true;
    reconcilePayments()
      .then((res) => {
        if (!alive || !res.ok || res.settled <= 0) return;
        void useAuthStore.getState().refreshProfile?.();
        void useOrderStore.getState().refresh?.();
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!currentUser) return null;

  /** شارژ کیف پول از طریق درگاه زرین‌پال (مبلغ به تومان). */
  const startTopUp = async () => {
    if (!Number.isFinite(chargeAmount) || chargeAmount < 10000) {
      window.alert('حداقل مبلغ شارژ ۱۰٬۰۰۰ تومان است.');
      return;
    }
    setShowChargeModal(false);
    const res = await startWalletTopUp(chargeAmount);
    if (res.ok && res.startUrl) {
      window.location.assign(res.startUrl);
      return;
    }
    window.alert(res.error || 'اتصال به درگاه پرداخت ناموفق بود');
  };

  /** پرداخت دوبارهٔ سفارش پرداخت‌نشده از پروفایل (زرین‌پال). */
  const payNow = async (orderId: string) => {
    setPayingId(orderId);
    const res = await startOnlinePayment(orderId);
    if (res.ok && res.startUrl) {
      window.location.assign(res.startUrl);
      return;
    }
    setPayingId(null);
    window.alert(res.error || 'اتصال به درگاه پرداخت ناموفق بود');
  };

  const favMedia = mediaItems.filter(m => currentUser.favorites.includes(m.id));
  const selectedMedia = mediaItems.filter(m => currentUser.selectedMedia.includes(m.id));
  const userOrders = orders.filter(o => o.customerId === currentUser.id);
  
  // Get products from cart (from user data)
  const cart = currentUser.cart || [];
  const cartProducts = cart.map((item: any) => {
    const product = products.find(p => p.id === item.productId);
    return product ? { ...product, qty: item.quantity } : null;
  }).filter(Boolean);

  const levelLabels: Record<string, string> = { normal: 'عادی', silver: 'نقره‌ای', gold: 'طلایی', vip: 'VIP' };
  const levelColors: Record<string, string> = { normal: 'bg-gray-400', silver: 'bg-gray-300', gold: 'bg-yellow-400', vip: 'bg-purple-500' };

  const copyInviteCode = () => {
    if (currentUser.inviteCode) navigator.clipboard.writeText(currentUser.inviteCode);
  };

  const stats = {
    totalSpent: userOrders.reduce((sum, o) => sum + o.paid, 0),
    totalOrders: userOrders.length,
    completedOrders: userOrders.filter(o => o.status === 'delivered').length,
    avgOrderValue: userOrders.length > 0 ? userOrders.reduce((sum, o) => sum + o.total, 0) / userOrders.length : 0,
  };

  return (
    <div className="fade-in max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className={`p-6 rounded-2xl border mb-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            {currentUser.avatar ? (
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name}
                className={`w-24 h-24 rounded-full object-cover border-4 ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}
              />
            ) : (
              <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold ${levelColors[currentUser.level]}`}>
                {currentUser.name.charAt(0)}
              </div>
            )}
            <label className="absolute bottom-0 right-0 p-2 rounded-full bg-blue-600 text-white cursor-pointer hover:bg-blue-700 transition-all disabled:opacity-60" title="تغییر عکس پروفایل">
              <Upload size={16} className={avatarUploading ? 'animate-pulse' : ''} />
              <input
                type="file"
                accept="image/*"
                disabled={avatarUploading}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                  e.target.value = '';
                }}
                className="hidden"
              />
            </label>
            {avatarUploading && (
              <span className="absolute -bottom-6 right-0 text-[10px] text-blue-600 whitespace-nowrap">در حال آپلود…</span>
            )}
          </div>
          <div className="text-center md:text-right flex-1">
            {editingName ? (
              <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                <input
                  type="text"
                  value={nameDraft}
                  onChange={e => setNameDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                  placeholder="نام و نام خانوادگی"
                  className={`px-3 py-1.5 rounded-lg border text-lg font-bold ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}
                  autoFocus
                />
                <button onClick={saveName} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">ذخیره</button>
                <button onClick={() => { setEditingName(false); setNameDraft(currentUser.name || ''); }} className={`px-3 py-1.5 rounded-lg text-sm ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>لغو</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <h1 className="text-2xl font-bold mb-1">{currentUser.name || 'بدون نام'}</h1>
                <button
                  onClick={() => { setNameDraft(currentUser.name || ''); setEditingName(true); }}
                  className={`px-2 py-1 rounded-lg text-xs ${darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-slate-500'}`}
                  title="ویرایش نام"
                >
                  ✎ ویرایش
                </button>
              </div>
            )}
            <p className={`text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{currentUser.phone}</p>
            <div className="flex items-center gap-3 justify-center md:justify-start flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${levelColors[currentUser.level]}`}>
                {levelLabels[currentUser.level]}
              </span>
              <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                عضویت: {toJalaliString(currentUser.createdAt)}
              </span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-500 mb-1">{currentUser.loyaltyPoints}</div>
            <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>امتیاز وفاداری</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <ShoppingCart size={24} className="mx-auto mb-2 text-blue-500" />
          <div className="text-2xl font-bold">{stats.totalOrders}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>سفارشات</div>
        </div>
        <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <CheckCircle size={24} className="mx-auto mb-2 text-green-500" />
          <div className="text-2xl font-bold">{stats.completedOrders}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>تکمیل شده</div>
        </div>
        <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <DollarSign size={24} className="mx-auto mb-2 text-purple-500" />
          <div className="text-2xl font-bold">{stats.totalSpent.toLocaleString('fa-IR')}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>مجموع خرید (تومان)</div>
        </div>
        <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <TrendingUp size={24} className="mx-auto mb-2 text-orange-500" />
          <div className="text-2xl font-bold">{Math.round(stats.avgOrderValue).toLocaleString('fa-IR')}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>میانگین سفارش</div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`p-2 rounded-xl border mb-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
          {[
            { id: 'overview', label: 'نمای کلی', icon: User },
            { id: 'wallet', label: 'کیف پول', icon: Wallet },
            { id: 'media', label: 'فیلم‌ها', icon: Film },
            { id: 'products', label: 'سبد خرید', icon: Package },
            { id: 'orders', label: 'سفارشات', icon: ShoppingCart },
            { id: 'tickets', label: 'تیکت‌ها', icon: LifeBuoy },
            { id: 'loyalty', label: 'باشگاه مشتریان', icon: Award },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          {/* Wallet Balance */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-800' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              <Wallet size={24} className="text-green-600" />
              <h3 className="font-bold text-lg">کیف پول شما</h3>
            </div>
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {(currentUser.walletBalance || 0).toLocaleString('fa-IR')}
              </div>
              <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>موجودی کیف پول (تومان)</div>
            </div>
            <button
              onClick={() => setShowChargeModal(true)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Upload size={20} />
              شارژ کیف پول
            </button>
          </div>

          {/* Wallet Info */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h3 className="font-bold text-lg mb-4">راهنمای استفاده از کیف پول</h3>
            <ul className={`space-y-3 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <li className="flex items-start gap-2">
                <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span>برای شارژ کیف پول، روی دکمه "شارژ کیف پول" کلیک کنید و مبلغ مورد نظر را وارد نمایید.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span>هنگام خرید از فروشگاه، می‌توانید به جای پرداخت آنلاین، از موجودی کیف پول خود استفاده کنید.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span>موجودی کیف پول شما به صورت امن ذخیره می‌شود و در هر زمان قابل استفاده است.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span>شارژ کیف پول از طریق درگاه امن زرین‌پال انجام می‌شود و مبلغ بلافاصله پس از پرداخت اضافه می‌شود.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Invite Code */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-800' : 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              <Gift size={24} className="text-purple-600" />
              <h3 className="font-bold text-lg">کد دعوت شما</h3>
            </div>
            <p className={`text-sm mb-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              با به اشتراک گذاشتن کد دعوت خود، هم شما و هم دوستتان ۵۰ امتیاز وفاداری دریافت می‌کنید!
            </p>
            <div className={`flex items-center gap-2 p-4 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
              <code className="flex-1 text-2xl font-mono font-bold text-purple-600">{currentUser.inviteCode || '---'}</code>
              <button 
                onClick={copyInviteCode}
                className="px-6 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 flex items-center gap-2"
              >
                <Copy size={16} /> کپی کد
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-slate-800/50' : 'bg-white/50'}`}>
                <p className="text-2xl font-bold text-purple-600">{currentUser.invitedCount || 0}</p>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>دعوت‌های موفق</p>
              </div>
              <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-slate-800/50' : 'bg-white/50'}`}>
                <p className="text-2xl font-bold text-green-600">{(currentUser.invitedCount || 0) * 50}</p>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>امتیاز کسب شده</p>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          {userOrders.length > 0 && (
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <ShoppingCart size={20} className="text-blue-500" />
                آخرین سفارشات
              </h3>
              <div className="space-y-3">
                {userOrders.slice(-3).reverse().map(order => (
                  <div key={order.id} className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm font-bold text-blue-600">{order.trackingCode}</p>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {toJalaliString(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-lg">{order.total.toLocaleString('fa-IR')} ت</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {order.status === 'delivered' ? 'تحویل شده' : 
                           order.status === 'processing' ? 'در حال انجام' : 'جدید'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/track" className="block mt-4 text-center text-blue-600 text-sm hover:underline">
                مشاهده همه سفارشات و پیگیری
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'media' && (
        <div className="space-y-6">
          {/* Selected Media */}
          {selectedMedia.length > 0 && (
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-3 mb-4">
                <Film size={20} className="text-blue-500" />
                <h3 className="font-bold text-lg">فیلم‌های انتخاب شده برای کپی</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedMedia.map(item => (
                  <div key={item.id} className={`rounded-lg overflow-hidden border ${darkMode ? 'border-slate-600' : 'border-gray-200'}`}>
                    <div className="aspect-[2/3] relative">
                      {item.image && <img src={item.image} alt={item.title} className="w-full h-full object-cover" />}
                      <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        {item.type === 'movie' ? 'فیلم' : 
                         item.type === 'series' ? 'سریال' : 
                         item.type === 'animation' ? 'انیمیشن' : 'انیمه'}
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="font-bold text-sm line-clamp-2">{item.title}</p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {item.year} | {item.quality}
                      </p>
                      <button 
                        onClick={() => selectMedia(item.id)} 
                        className="w-full mt-2 text-red-500 text-xs hover:underline"
                      >
                        حذف از لیست
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className={`text-xs mt-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                لیست انتخابی شما برای مدیر ارسال شده است. برای نهایی‌سازی سفارش با ما تماس بگیرید.
              </p>
            </div>
          )}

          {/* Favorites */}
          {favMedia.length > 0 && (
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-3 mb-4">
                <Heart size={20} className="text-red-500" />
                <h3 className="font-bold text-lg">علاقه‌مندی‌ها</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {favMedia.map(item => (
                  <div key={item.id} className={`rounded-lg overflow-hidden border ${darkMode ? 'border-slate-600' : 'border-gray-200'}`}>
                    <div className="aspect-[2/3] relative">
                      {item.image && <img src={item.image} alt={item.title} className="w-full h-full object-cover" />}
                    </div>
                    <div className="p-2">
                      <p className="font-bold text-sm line-clamp-2">{item.title}</p>
                      <button 
                        onClick={() => addToFavorites(item.id)} 
                        className="w-full mt-2 text-red-500 text-xs hover:underline"
                      >
                        حذف از علاقه‌مندی
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedMedia.length === 0 && favMedia.length === 0 && (
            <div className={`p-12 rounded-2xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <Film size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
              <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                هنوز فیلمی انتخاب یا به علاقه‌مندی‌ها اضافه نکرده‌اید
              </p>
              <Link to="/media" className="inline-block mt-4 px-6 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
                مشاهده کالکشن فیلم
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-6">
          {cartProducts.length > 0 ? (
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-3 mb-4">
                <ShoppingCart size={20} className="text-green-500" />
                <h3 className="font-bold text-lg">محصولات در سبد خرید</h3>
              </div>
              <div className="space-y-3">
                {cartProducts.map((item: any) => (
                  <div key={item.id} className={`flex items-center gap-4 p-4 rounded-lg border ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-20 h-20 rounded object-cover" />
                    )}
                    <div className="flex-1">
                      <p className="font-bold">{item.name}</p>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.brand}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm">تعداد: {item.qty}</span>
                        <span className="font-bold text-green-600">
                          {(item.price * item.qty).toLocaleString('fa-IR')} تومان
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between items-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <span className="font-bold">جمع کل:</span>
                <span className="text-xl font-bold text-blue-600">
                  {cartProducts.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0).toLocaleString('fa-IR')} تومان
                </span>
              </div>
              <Link to="/store" className="block mt-4 text-center px-6 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700">
                ادامه خرید
              </Link>
            </div>
          ) : (
            <div className={`p-12 rounded-2xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <Package size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
              <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                سبد خرید شما خالی است
              </p>
              <Link to="/store" className="inline-block mt-4 px-6 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
                مشاهده فروشگاه
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6">
          {userOrders.length > 0 ? (
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-3 mb-4">
                <ShoppingCart size={20} className="text-purple-500" />
                <h3 className="font-bold text-lg">تاریخچه سفارشات</h3>
              </div>
              <div className="space-y-3">
                {userOrders.slice().reverse().map(order => (
                  <div key={order.id} className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-mono text-sm font-bold text-blue-600">{order.trackingCode}</p>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {toJalaliString(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-lg">{order.total.toLocaleString('fa-IR')} ت</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                          order.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'new' ? 'bg-gray-100 text-gray-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {order.status === 'delivered' ? 'تحویل شده' : 
                           order.status === 'processing' ? 'در حال انجام' : 
                           order.status === 'ready' ? 'آماده' :
                           order.status === 'new' ? 'جدید' : 'لغو شده'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Link 
                        to={`/track?code=${order.trackingCode}`} 
                        className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                      >
                        <Eye size={14} /> پیگیری سفارش
                      </Link>
                      {(order.paid || 0) < (order.total || 0) && order.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => payNow(order.id)}
                          disabled={payingId === order.id}
                          className="text-green-600 text-sm hover:underline flex items-center gap-1 disabled:opacity-50"
                        >
                          <CreditCard size={14} />
                          {payingId === order.id
                            ? 'در حال انتقال به درگاه…'
                            : `پرداخت آنلاین (${((order.total || 0) - (order.paid || 0)).toLocaleString('fa-IR')} ت)`}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={`p-12 rounded-2xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <ShoppingCart size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
              <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                هنوز سفارشی ثبت نکرده‌اید
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tickets' && <MyTickets darkMode={darkMode} />}

      {activeTab === 'loyalty' && (() => {
        const cfg = gamificationConfig;
        const total = currentUser.totalEarnedPoints ?? currentUser.loyaltyPoints ?? 0;
        const sortedTiers = [...cfg.tiers].sort((a, b) => a.minPoints - b.minPoints);
        const currentTier = [...sortedTiers].reverse().find(t => t.minPoints <= total) || sortedTiers[0];
        const nextTier = sortedTiers.find(t => t.minPoints > total);
        const prevMin = currentTier?.minPoints ?? 0;
        const progress = nextTier ? Math.min(100, Math.round(((total - prevMin) / Math.max(1, nextTier.minPoints - prevMin)) * 100)) : 100;
        const badges = getEarnedBadges(currentUser);
        const earnedBadges = badges.filter(b => b.earned);
        const enabledRewards = cfg.rewards.filter(r => r.enabled);
        const myTx = loyaltyTx.filter(t => t.userId === currentUser.id).slice(0, 12);
        const rules = [
          { icon: '🛒', text: `به ازای هر ${cfg.pointsPerToman.toLocaleString('fa-IR')} تومان خرید: ۱ امتیاز${currentTier && currentTier.multiplier !== 1 ? ` (سطح شما: ×${currentTier.multiplier})` : ''}` },
          { icon: '🤝', text: `دعوت دوست: شما +${cfg.inviteBonus} و دوستتان +${cfg.invitedUserBonus} امتیاز` },
          { icon: '🔥', text: `ورود روزانه: ${cfg.dailyLoginBonus} × روز متوالی (تا ${cfg.streakMaxDays} روز)` },
          { icon: '✍️', text: `ثبت نظر: +${cfg.reviewBonus} امتیاز` },
          { icon: '👤', text: `تکمیل پروفایل: +${cfg.profileCompletionBonus} امتیاز` },
          { icon: '🎁', text: `هدیه تولد: +${cfg.birthdayBonus}${currentUser.level === 'vip' ? ' (VIP: دوچندان)' : ''} امتیاز — تاریخ تولد خود را در «پروفایل باشگاه» وارد کنید` },
        ];
        return (
        <div className="space-y-6">
          {!cfg.enabled && (
            <div className={`p-4 rounded-xl text-sm flex items-center gap-2 ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'}`}>
              ⚠️ باشگاه مشتریان در حال حاضر توسط مدیر غیرفعال شده است.
            </div>
          )}

          {/* Balance hero */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-800' : 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              <Award size={24} className="text-yellow-500" />
              <h3 className="font-bold text-lg">باشگاه مشتریان</h3>
              {currentTier && (
                <span className={`mr-auto px-3 py-1 rounded-full text-xs font-bold ${
                  currentUser.level === 'vip' ? 'bg-purple-600 text-white' :
                  currentUser.level === 'gold' ? 'bg-yellow-400 text-black' :
                  currentUser.level === 'silver' ? 'bg-gray-300 text-gray-800' : 'bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-slate-200'}`}>
                  {currentTier.label}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-800/60' : 'bg-white/70'}`}>
                <div className="text-2xl font-bold text-green-600">{(currentUser.loyaltyPoints || 0).toLocaleString('fa-IR')}</div>
                <div className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>موجودی قابل خرج</div>
              </div>
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-800/60' : 'bg-white/70'}`}>
                <div className="text-2xl font-bold">{total.toLocaleString('fa-IR')}</div>
                <div className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>امتیاز کل کسب‌شده</div>
              </div>
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-800/60' : 'bg-white/70'}`}>
                <div className="text-2xl font-bold text-orange-500">{currentUser.loginStreak || 0} 🔥</div>
                <div className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>روز ورود متوالی</div>
              </div>
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-800/60' : 'bg-white/70'}`}>
                <div className="text-2xl font-bold text-purple-600">{currentUser.invitedCount || 0}</div>
                <div className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>دعوت موفق</div>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>{nextTier ? `پیشرفت به سطح «${nextTier.label}» (${nextTier.minPoints.toLocaleString('fa-IR')} امتیاز)` : 'بالاترین سطح را دارید 🎉'}</span>
                <span className="font-bold">{progress}%</span>
              </div>
              <div className={`h-3 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>

          {/* Tiers (from admin settings) */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h4 className="font-bold mb-4 flex items-center gap-2"><Star size={18} className="text-yellow-500" /> سطوح عضویت</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {sortedTiers.map(t => (
                <div key={t.level} className={`p-4 rounded-xl text-center ${currentUser.level === t.level ? 'ring-2 ring-blue-500 shadow-lg' : ''} ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <div className={`w-12 h-12 mx-auto rounded-full mb-2 flex items-center justify-center ${
                    t.level === 'vip' ? 'bg-purple-500' : t.level === 'gold' ? 'bg-yellow-400' : t.level === 'silver' ? 'bg-gray-300' : 'bg-gray-400'}`}>
                    {t.level === 'vip' && <Star size={20} className="text-white" fill="white" />}
                  </div>
                  <div className="font-bold">{t.label}</div>
                  <div className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>از {t.minPoints.toLocaleString('fa-IR')} امتیاز</div>
                  {t.discountPercent > 0 && <div className="text-xs mt-1 text-green-600 font-medium">{t.discountPercent}٪ تخفیف عضویت</div>}
                  {t.perks.length > 0 && <div className={`text-[11px] mt-2 leading-5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.perks.join(' • ')}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Rewards shop */}
          {enabledRewards.length > 0 && (
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h4 className="font-bold mb-4 flex items-center gap-2"><Gift size={18} className="text-purple-600" /> فروشگاه پاداش‌ها</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {enabledRewards.map(r => {
                  const canAfford = (currentUser.loyaltyPoints || 0) >= r.cost;
                  return (
                    <div key={r.id} className={`p-4 rounded-xl border flex flex-col gap-2 ${darkMode ? 'border-slate-700 bg-slate-700/40' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="text-3xl">{r.icon}</div>
                      <div className="font-bold text-sm">{r.title}</div>
                      {r.description && <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{r.description}</div>}
                      <div className="mt-auto flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-purple-600">{r.cost.toLocaleString('fa-IR')} امتیاز</span>
                        <button
                          disabled={!canAfford}
                          onClick={() => {
                            const res = redeemLoyaltyReward(currentUser.id, r.id);
                            alert(res.ok ? `🎉 پاداش «${r.title}» با موفقیت ثبت شد و ${r.cost.toLocaleString('fa-IR')} امتیاز از موجودی شما کسر گردید.` : res.error);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${canAfford ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-400 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed'}`}>
                          {canAfford ? 'خرج امتیاز' : 'امتیاز ناکافی'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Badges */}
          {badges.length > 0 && (
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h4 className="font-bold mb-1 flex items-center gap-2"><Trophy size={18} className="text-yellow-500" /> نشان‌های من ({earnedBadges.length}/{badges.length})</h4>
              <p className={`text-xs mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>با رسیدن هر کاربر به آستانه، نشان به‌صورت خودکار فعال می‌شود.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {badges.map(b => (
                  <div key={b.def.id} title={b.def.description}
                    className={`p-4 rounded-xl text-center border ${b.earned
                      ? (darkMode ? 'border-yellow-700 bg-yellow-900/20' : 'border-yellow-300 bg-yellow-50')
                      : (darkMode ? 'border-slate-700 bg-slate-700/30 opacity-60' : 'border-gray-200 bg-gray-50 opacity-60')}`}>
                    <div className="text-3xl" style={b.earned ? undefined : { filter: 'grayscale(1)', opacity: 0.5 }}>{b.def.icon}</div>
                    <div className="font-bold text-sm mt-1">{b.def.name}</div>
                    <div className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{b.def.description}</div>
                    {!b.earned && (
                      <div className={`h-1.5 rounded-full mt-2 ${darkMode ? 'bg-slate-600' : 'bg-gray-200'}`}>
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${b.progress}%` }}></div>
                      </div>
                    )}
                    {b.earned && <div className="text-[11px] text-green-600 font-bold mt-1">✓ کسب شد</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules — live from admin gamification settings */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h4 className="font-bold mb-4 flex items-center gap-2"><Zap size={18} className="text-amber-500" /> قوانین کسب امتیاز</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {rules.map((r, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg text-sm ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <span className="text-xl">{r.icon}</span><span>{r.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Club profile fields (birthDate drives the birthday bonus) */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h4 className="font-bold mb-4 flex items-center gap-2"><CalendarCheck size={18} className="text-pink-500" /> پروفایل باشگاه</h4>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>تاریخ تولد (میلادی)</label>
                <input type="date" value={birthDateDraft} onChange={e => setBirthDateDraft(e.target.value)}
                  className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <button
                onClick={() => { updateCustomerProfile({ birthDate: birthDateDraft || undefined }); alert(birthDateDraft ? 'تاریخ تولد ذخیره شد 🎂 در روز تولد، پاداش تولد هنگام ورود به حساب به‌صورت خودکار اعطا می‌شود.' : 'تاریخ تولد حذف شد.'); }}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700">ذخیره</button>
            </div>
          </div>

          {/* Recent transactions */}
          {myTx.length > 0 && (
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h4 className="font-bold mb-4 flex items-center gap-2"><LoyaltyHistory size={18} className="text-blue-500" /> آخرین تراکنش‌های امتیاز</h4>
              <div className="space-y-2">
                {myTx.map(t => (
                  <div key={t.id} className={`flex items-center justify-between p-3 rounded-lg text-sm ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                    <div>
                      <p>{t.reason}</p>
                      <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{toJalaliString(t.createdAt)}</p>
                    </div>
                    <span className={`font-bold ${t.points > 0 ? 'text-green-600' : 'text-red-500'}`}>{t.points > 0 ? '+' : ''}{t.points.toLocaleString('fa-IR')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        );
      })()}

      {/* Charge Wallet Modal */}
      {showChargeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowChargeModal(false)}>
          <div className={`w-full max-w-md p-6 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Wallet size={24} className="text-green-600" />
                شارژ کیف پول
              </h3>
              <button onClick={() => setShowChargeModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                <ChevronLeft size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">مبلغ شارژ (تومان)</label>
                <input
                  type="number"
                  value={chargeAmount || ''}
                  onChange={e => setChargeAmount(Number(e.target.value))}
                  placeholder="مبلغ مورد نظر را وارد کنید"
                  className={`w-full px-4 py-3 rounded-lg border text-lg ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}
                />
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                <p className="text-sm text-green-700 dark:text-green-300">
                  <strong>توجه:</strong> با کلیک روی «پرداخت و شارژ کیف پول» به درگاه امن زرین‌پال منتقل می‌شوید و
                  مبلغ بلافاصله پس از تأیید پرداخت، به کیف پول شما اضافه می‌شود.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { void startTopUp(); }}
                  className="flex-1 py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition-all"
                >
                  پرداخت و شارژ کیف پول
                </button>
                <button
                  onClick={() => { setShowChargeModal(false); setChargeAmount(0); }}
                  className={`px-6 py-3 rounded-lg border ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
