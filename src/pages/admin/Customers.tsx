import React, { useState, useEffect, useRef } from 'react';
import { useApp, User } from '../../store';
import { fetchProfiles, profileToUser } from '../../api/users';
import type { ProfileRow } from '../../api/users';
import { Search, Users, Star, Eye, Film, ShoppingCart, Wrench, Package, Calendar, DollarSign, Heart, X, UserCheck, Wallet, LifeBuoy } from 'lucide-react';
import { toJalaliString } from '../../utils/jalali';

export default function AdminCustomers() {
  const { 
    darkMode, 
    users, 
    setUsers,
    mediaItems, 
    products, 
    orders, 
    services,
    personas,
    tickets,
  } = useApp();
   
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'media' | 'products' | 'orders' | 'services' | 'personas' | 'tickets'>('overview');
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [customers, setCustomers] = useState<User[]>([]);

  const sameCustomer = (a: Partial<User> | { phone?: string | null; email?: string | null; id?: string }, b: Partial<User> | { phone?: string | null; email?: string | null; id?: string }) => {
    const norm = (s?: string | null) => (s || '').toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (a.id && b.id && a.id === b.id) return true;
    if (norm(a.phone) && norm(b.phone) && norm(a.phone) === norm(b.phone)) return true;
    if (norm(a.email) && norm(b.email) && norm(a.email) === norm(b.email)) return true;
    return false;
  };

  const normalizePhone = (p?: string | null): string => {
    const digits = (p || '').toString().replace(/\D/g, '');
    return digits.length >= 10 ? '0' + digits.slice(-10) : (p || '').toString();
  };

  const filterCustomerOrders = (customer: Pick<User, 'id' | 'phone' | 'email' | 'name'> & { supabaseUserId?: string }) => {
    const e = (customer.email || '').trim().toLowerCase();
    const n = (customer.name || '').trim();
    return orders.filter(o => {
      // شناسهٔ Supabase مرجع اصلی است. مشتری‌ای که از localStorage قدیمی آمده
      // ممکن است `id` محلی داشته باشد؛ برای همین `supabaseUserId` هم بررسی می‌شود.
      if (o.customerId === customer.id) return true;
      if (customer.supabaseUserId && o.customerId === customer.supabaseUserId) return true;
      // سفارش‌ها ستون شمارهٔ موبایل ندارند، پس مقایسهٔ شماره با `customerName`
      // بی‌معنی بود (و باعث می‌شد سفارش‌های قدیمی هیچ‌وقت پیدا نشوند).
      if (e && o.customerName && o.customerName.trim().toLowerCase() === e) return true;
      if (n && (o.customerName || '').trim() === n) return true;
      return false;
    });
  };

  const findCustomerInAllUsers = (customer: Pick<User, 'id' | 'phone' | 'email' | 'name'>): User | undefined => {
    const locals = users.filter(u => u.role === 'customer');
    let hit = locals.find(u => sameCustomer(u, customer));
    if (hit) return hit;
    hit = customersList.find(u => sameCustomer(u, customer));
    return hit;
  };

  const filterCustomerTickets = (customer: Pick<User, 'id' | 'phone' | 'email' | 'name'>) => {
    const p = normalizePhone(customer.phone);
    const n = (customer.name || '').trim();
    return tickets.filter(t => {
      if (t.customerId === customer.id) return true;
      if (p && normalizePhone(t.customerPhone) === p) return true;
      if (n && (t.customerName || '').trim() === n) return true;
      return false;
    });
  };

  // Keep a live reference to `users` so the one-shot profile-fetch below can
  // merge against the latest local customers without re-running every time the
  // store hands us a new `users` array reference (which happens repeatedly
  // during hydration and was causing the fetch/setCustomers loop).
  const usersRef = useRef(users);
  usersRef.current = users;

  // Sync customer profiles from Supabase so the admin panel sees every
  // registered customer — not just those whose local login wrote to localStorage.
  // Ran once on mount; the merge reads the latest `users` through `usersRef`.
  useEffect(() => {
    let mounted = true;
    fetchProfiles()
      .then(profiles => {
        if (!mounted) return;
        const localCustomers = usersRef.current.filter(u => u.role === 'customer');

        const fromProfile: User[] = profiles
          .filter(p => p.id)
          .map(rawProfile => {
            const localMatch = localCustomers.find(lc => sameCustomer(lc, rawProfile));
            const enriched = profileToUser(rawProfile);
            if (localMatch) {
              const cart = (localMatch.cart && localMatch.cart.length) ? localMatch.cart : enriched.cart;
              return {
                ...enriched,
                ...localMatch,
                id: localMatch.id,
                supabaseUserId: rawProfile.id,
                name: localMatch.name || enriched.name,
                phone: localMatch.phone || enriched.phone,
                email: localMatch.email || enriched.email,
                cart,
                favorites: (localMatch.favorites && localMatch.favorites.length) ? localMatch.favorites : enriched.favorites,
                selectedMedia: (localMatch.selectedMedia && localMatch.selectedMedia.length) ? localMatch.selectedMedia : enriched.selectedMedia,
                loyaltyPoints: Math.max(localMatch.loyaltyPoints || 0, enriched.loyaltyPoints || 0),
                walletBalance: Math.max(localMatch.walletBalance || 0, enriched.walletBalance || 0),
              } as User;
            }
            return enriched;
          });

        const supaNormalizedKeys = new Set(fromProfile.map(u => `${normalizePhone(u.phone)}|${(u.email||'').toLowerCase().trim()}|${u.id}`));
        const remainingLocals = localCustomers.filter(lc => {
          const key = `${normalizePhone(lc.phone)}|${(lc.email||'').toLowerCase().trim()}|${lc.id}`;
          if (supaNormalizedKeys.has(key)) return false;
          return !fromProfile.some(fp => sameCustomer(fp, lc));
        });
        const merged = [...fromProfile, ...remainingLocals];
        setCustomers(merged);
      })
      .catch(err => {
        console.warn('[Customers] fetchProfiles failed, using local customers only:', err);
        setCustomers(usersRef.current.filter(u => u.role === 'customer'));
      });
    return () => { mounted = false; };
  }, []);

  const customersList = customers.length > 0 ? customers : users.filter(u => u.role === 'customer');
  const detail = selectedUser ? (customersList.find(u => u.id === selectedUser) || customersList.find(u => sameCustomer(u, { id: selectedUser }))) : null;

  const levelLabels: Record<string, string> = { normal: 'عادی', silver: 'نقره‌ای', gold: 'طلایی', vip: 'VIP' };
  const levelColors: Record<string, string> = { 
    normal: 'bg-gray-400', 
    silver: 'bg-gray-300', 
    gold: 'bg-yellow-400', 
    vip: 'bg-purple-500' 
  };

  // محاسبه آمار مشتری
  const getCustomerStats = (customerOrId: string | User) => {
    const customer = typeof customerOrId === 'string'
      ? (customersList.find(u => u.id === customerOrId) || { id: customerOrId, phone: '', email: '', name: '' })
      : customerOrId;
    const userOrders = filterCustomerOrders(customer);
    // «مجموع خرید» ارزش سفارش‌هاست، نه مبلغ پرداخت‌شده. در دادهٔ واقعی
    // `orders.paid` برای بسیاری از سفارش‌ها صفر می‌ماند (پرداخت خارج از سیستم
    // ثبت می‌شود)، بنابراین جمع‌زدن `paid` همیشه صفر می‌داد. اگر `total` خالی
    // بود به `paid` برمی‌گردیم.
    const orderValue = (o: { total?: number; paid?: number }) => {
      const total = Number(o.total) || 0;
      return total > 0 ? total : (Number(o.paid) || 0);
    };
    const billableOrders = userOrders.filter(o => o.status !== 'cancelled');
    const totalSpent = billableOrders.reduce((sum, o) => sum + orderValue(o), 0);
    const paidAmount = billableOrders.reduce((sum, o) => sum + (Number(o.paid) || 0), 0);
    const totalOrders = userOrders.length;
    const completedOrders = userOrders.filter(o => o.status === 'delivered').length;

    return {
      totalSpent,
      paidAmount,
      totalOrders,
      completedOrders,
      avgOrderValue: billableOrders.length > 0 ? totalSpent / billableOrders.length : 0
    };
  };

  // دریافت فیلم‌های انتخاب شده با جزئیات کامل
  const getSelectedMediaDetails = (mediaIds: string[]) => {
    return mediaIds.map(id => mediaItems.find(m => m.id === id)).filter(Boolean);
  };

  // دریافت محصولات از سبد خرید
  const getCartProducts = (customerOrId: string | User) => {
    const byId = typeof customerOrId === 'string'
      ? customersList.find(u => u.id === customerOrId)
      : customerOrId;
    const customer = byId || (typeof customerOrId === 'string' ? findCustomerInAllUsers({ id: customerOrId, phone: '', email: '', name: '' }) : undefined);
    const cart = customer?.cart;
    if (!cart || cart.length === 0) return [];
    return cart.map((item: any) => {
      const product = products.find(p => p.id === item.productId);
      return product ? { ...product, qty: item.quantity } : null;
    }).filter(Boolean);
  };

  // نسبت دادن پرسونا به مشتری
  const assignPersona = (userId: string, personaId: string) => {
    const user = customersList.find(u => u.id === userId);
    if (!user) return;
    
    const personaIds = user.personaIds || [];
    const updatedPersonaIds = personaIds.includes(personaId)
      ? personaIds.filter(id => id !== personaId)
      : [...personaIds, personaId];
    
    setUsers(users.map(u => u.id === userId ? { ...u, personaIds: updatedPersonaIds } : u));
    setCustomers(customersList.map(u => u.id === userId ? { ...u, personaIds: updatedPersonaIds } : u));
  };

  return (
    <div className="fade-in space-y-4">
      <h1 className="text-2xl font-bold">مدیریت مشتریان (CRM)</h1>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="جستجوی نام یا شماره..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className={`w-full pr-10 pl-4 py-2.5 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200'}`} 
        />
      </div>

      {/* Customers Table */}
      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
              <tr>
                <th className="text-right p-3">نام</th>
                <th className="text-right p-3">شماره</th>
                <th className="text-right p-3">سطح</th>
                <th className="text-right p-3">امتیاز</th>
                <th className="text-right p-3">سفارشات</th>
                <th className="text-right p-3">مجموع خرید</th>
                <th className="text-right p-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => {
                const stats = getCustomerStats(c);
                return (
                  <tr key={c.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 font-mono text-xs">{c.phone}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${levelColors[c.level]} text-white`}>
                        {levelLabels[c.level]}
                      </span>
                    </td>
                    <td className="p-3">{c.loyaltyPoints}</td>
                    <td className="p-3">{stats.totalOrders}</td>
                    <td className="p-3 font-bold text-green-600">{stats.totalSpent.toLocaleString('fa-IR')} ت</td>
                    <td className="p-3">
                      <button 
                        onClick={() => setSelectedUser(c.id)} 
                        className="text-blue-600 text-xs hover:underline flex items-center gap-1"
                      >
                        <Eye size={12} /> جزئیات کامل
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {customers.length === 0 && <p className="text-center py-8 text-sm text-slate-400">مشتری‌ای یافت نشد</p>}
      </div>

      {/* Persona Assignment Modal */}
      {showPersonaModal && detail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPersonaModal(false)}>
          <div 
            className={`w-full max-w-2xl p-6 rounded-2xl max-h-[80vh] overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`} 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">اختصاص پرسونا به {detail.name}</h3>
              <button onClick={() => setShowPersonaModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {personas.map(persona => {
                const isAssigned = detail.personaIds?.includes(persona.id);
                return (
                  <div 
                    key={persona.id}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isAssigned 
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                        : darkMode ? 'border-slate-600 hover:border-purple-500' : 'border-gray-200 hover:border-purple-300'
                    }`}
                    onClick={() => assignPersona(detail.id, persona.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{persona.avatar}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold">{persona.name}</h4>
                          {isAssigned && (
                            <span className="px-2 py-0.5 rounded text-xs bg-purple-600 text-white">اختصاص یافته</span>
                          )}
                        </div>
                        <p className={`text-xs italic ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{persona.tagline}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {persona.services.primaryServices.slice(0, 3).map((service, idx) => (
                            <span key={idx} className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {personas.length === 0 && (
              <div className="text-center py-8">
                <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  هنوز پرسونایی تعریف نشده است
                </p>
              </div>
            )}
            <button 
              onClick={() => setShowPersonaModal(false)}
              className="w-full mt-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
            >
              بستن
            </button>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {detail && (() => {
        const localMatch = findCustomerInAllUsers(detail);
        const resolvedDetail: User = {
          ...detail,
          ...(localMatch || {}),
          id: detail.id,
          cart: (localMatch && localMatch.cart?.length) ? localMatch.cart : detail.cart || [],
          favorites: (localMatch && localMatch.favorites?.length) ? localMatch.favorites : detail.favorites || [],
          selectedMedia: (localMatch && localMatch.selectedMedia?.length) ? localMatch.selectedMedia : detail.selectedMedia || [],
          walletBalance: Math.max(detail.walletBalance || 0, localMatch?.walletBalance || 0),
          loyaltyPoints: Math.max(detail.loyaltyPoints || 0, localMatch?.loyaltyPoints || 0),
          phone: detail.phone || localMatch?.phone || '',
          email: detail.email || localMatch?.email || '',
        } as User;
        const TICKET_STATUS_LABELS: Record<string, string> = {
          open: 'باز', in_progress: 'در حال پیگیری', resolved: 'حل شده', closed: 'بسته شده',
        };
        const ticketStatusCls: Record<string, string> = {
          open: 'bg-blue-100 text-blue-700',
          in_progress: 'bg-yellow-100 text-yellow-700',
          resolved: 'bg-green-100 text-green-700',
          closed: 'bg-gray-100 text-gray-600',
        };
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedUser(null)}>
          <div 
            className={`w-full max-w-4xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`} 
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {detail.avatar ? (
                  <img 
                    src={detail.avatar} 
                    alt={detail.name}
                    className={`w-16 h-16 rounded-full object-cover border-4 ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}
                  />
                ) : (
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold ${levelColors[detail.level]}`}>
                    {detail.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold">{detail.name}</h3>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{detail.phone}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs ${levelColors[detail.level]} text-white`}>
                      {levelLabels[detail.level]}
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      عضویت: {toJalaliString(detail.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                <X size={20} />
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Star size={16} className="text-yellow-500" />
                  <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>امتیاز وفاداری</span>
                </div>
                <div className="text-2xl font-bold">{resolvedDetail.loyaltyPoints}</div>
              </div>
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart size={16} className="text-blue-500" />
                  <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>سفارشات</span>
                </div>
                <div className="text-2xl font-bold">{getCustomerStats(resolvedDetail).totalOrders}</div>
              </div>
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={16} className="text-green-500" />
                  <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>مجموع خرید</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {getCustomerStats(resolvedDetail).totalSpent.toLocaleString('fa-IR')} ت
                </div>
              </div>
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Wallet size={16} className="text-emerald-500" />
                  <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کیف پول</span>
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                  {(resolvedDetail.walletBalance || 0).toLocaleString('fa-IR')} ت
                </div>
              </div>
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Heart size={16} className="text-red-500" />
                  <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>علاقه‌مندی</span>
                </div>
                <div className="text-2xl font-bold">{resolvedDetail.favorites.length}</div>
              </div>
            </div>

            {/* Tabs — روی موبایل می‌شکنند تا برچسب هیچ تبی بریده نشود */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { id: 'overview', label: 'نمای کلی', icon: Users },
                { id: 'personas', label: 'پرسوناها', icon: UserCheck },
                { id: 'orders', label: 'سفارشات', icon: ShoppingCart },
                { id: 'tickets', label: 'تیکت‌ها', icon: LifeBuoy },
                { id: 'services', label: 'خدمات', icon: Wrench },
                { id: 'media', label: 'فیلم‌ها', icon: Film },
                { id: 'products', label: 'محصولات', icon: Package },
              ].map(tab => {
                const Icon = tab.icon;
                const count =
                  tab.id === 'orders' ? filterCustomerOrders(detail).length :
                  tab.id === 'tickets' ? filterCustomerTickets(detail).length :
                  tab.id === 'media' ? (detail.selectedMedia?.length || 0) + (detail.favorites?.length || 0) :
                  tab.id === 'products' ? getCartProducts(detail).length :
                  undefined;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDetailTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-all ${
                      activeDetailTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                    {typeof count === 'number' && count > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        activeDetailTab === tab.id ? 'bg-white/30 text-white' : 'bg-blue-100 text-blue-700'
                      }`}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            {activeDetailTab === 'overview' && (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <h4 className="font-bold mb-3">اطلاعات حساب</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>کد دعوت:</span>
                      <p className="font-mono font-bold">{resolvedDetail.inviteCode || '---'}</p>
                    </div>
                    <div>
                      <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>تعداد دعوت‌ها:</span>
                      <p className="font-bold">{resolvedDetail.invitedCount || 0}</p>
                    </div>
                    <div>
                      <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>فیلم‌های انتخاب شده:</span>
                      <p className="font-bold">{resolvedDetail.selectedMedia.length}</p>
                    </div>
                    <div>
                      <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>علاقه‌مندی‌ها:</span>
                      <p className="font-bold">{resolvedDetail.favorites.length}</p>
                    </div>
                  </div>
                </div>

                {/* Assigned Personas */}
                {resolvedDetail.personaIds && resolvedDetail.personaIds.length > 0 && (
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <UserCheck size={18} className="text-purple-600" />
                      پرسوناهای اختصاص یافته
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {resolvedDetail.personaIds.map(personaId => {
                        const persona = personas.find(p => p.id === personaId);
                        if (!persona) return null;
                        return (
                          <div key={personaId} className={`p-3 rounded-lg flex items-center gap-3 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                            <div className="text-3xl">{persona.avatar}</div>
                            <div className="flex-1">
                              <p className="font-bold text-sm">{persona.name}</p>
                              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{persona.tagline}</p>
                            </div>
                            <button
                              onClick={() => assignPersona(resolvedDetail.id, personaId)}
                              className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <h4 className="font-bold mb-3">فعالیت‌های اخیر</h4>
                  <div className="space-y-2">
                    {filterCustomerOrders(resolvedDetail)
                      .slice(-5)
                      .reverse()
                      .map(order => (
                        <div key={order.id} className={`p-3 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{order.trackingCode}</p>
                              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {toJalaliString(order.createdAt)}
                              </p>
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-sm">{order.total.toLocaleString('fa-IR')} ت</p>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {order.status === 'delivered' ? 'تحویل شده' : 
                                 order.status === 'processing' ? 'در حال انجام' : 
                                 order.status === 'new' ? 'جدید' : order.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    {filterCustomerOrders(resolvedDetail).length === 0 && (
                      <p className={`text-sm text-center py-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        فعالیتی ثبت نشده است
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeDetailTab === 'personas' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold flex items-center gap-2">
                    <UserCheck size={18} className="text-purple-600" />
                    مدیریت پرسوناهای مشتری
                  </h4>
                  <button
                    onClick={() => setShowPersonaModal(true)}
                    className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700 flex items-center gap-2"
                  >
                    <UserCheck size={16} />
                    اختصاص پرسونا
                  </button>
                </div>

                {resolvedDetail.personaIds && resolvedDetail.personaIds.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {resolvedDetail.personaIds.map(personaId => {
                      const persona = personas.find(p => p.id === personaId);
                      if (!persona) return null;
                      return (
                        <div key={personaId} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="text-4xl">{persona.avatar}</div>
                              <div>
                                <h5 className="font-bold">{persona.name}</h5>
                                <p className={`text-xs italic ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{persona.tagline}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => assignPersona(resolvedDetail.id, personaId)}
                              className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>سن: </span>
                              <span className="font-medium">{persona.demographics.ageRange}</span>
                            </div>
                            <div>
                              <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>شغل: </span>
                              <span className="font-medium">{persona.demographics.occupation}</span>
                            </div>
                            <div>
                              <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>خدمات اصلی: </span>
                              <span className="font-medium">{persona.services.primaryServices.join(', ')}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`p-8 rounded-xl border text-center ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                    <UserCheck size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
                    <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      هنوز پرسونایی به این مشتری اختصاص داده نشده است
                    </p>
                    <button
                      onClick={() => setShowPersonaModal(true)}
                      className="mt-4 px-6 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700"
                    >
                      اختصاص پرسونا
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === 'media' && (
              <div className="space-y-4">
                {/* Selected Media */}
                {resolvedDetail.selectedMedia.length > 0 && (
                  <div>
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <Film size={18} className="text-blue-600" />
                      فیلم‌های انتخاب شده برای کپی ({resolvedDetail.selectedMedia.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {getSelectedMediaDetails(resolvedDetail.selectedMedia).map((media: any) => (
                        <div key={media.id} className={`rounded-lg overflow-hidden border ${darkMode ? 'border-slate-600' : 'border-gray-200'}`}>
                          <div className="aspect-[2/3] relative">
                            {media.image && (
                              <img src={media.image} alt={media.title} className="w-full h-full object-cover" />
                            )}
                            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                              {media.type === 'movie' ? 'فیلم' : 
                               media.type === 'series' ? 'سریال' : 
                               media.type === 'animation' ? 'انیمیشن' : 'انیمه'}
                            </div>
                            <div className="absolute bottom-2 left-2 bg-black/70 text-yellow-400 text-xs px-2 py-1 rounded flex items-center gap-1">
                              <Star size={10} fill="currentColor" />
                              {media.imdb || media.rating}
                            </div>
                          </div>
                          <div className="p-2">
                            <p className="font-bold text-sm line-clamp-2">{media.title}</p>
                            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              {media.year} | {media.quality}
                            </p>
                            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              حجم: {media.volume}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Favorites */}
                {resolvedDetail.favorites.length > 0 && (
                  <div>
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <Heart size={18} className="text-red-600" />
                      علاقه‌مندی‌ها ({resolvedDetail.favorites.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {getSelectedMediaDetails(resolvedDetail.favorites).map((media: any) => (
                        <div key={media.id} className={`rounded-lg overflow-hidden border ${darkMode ? 'border-slate-600' : 'border-gray-200'}`}>
                          <div className="aspect-[2/3] relative">
                            {media.image && (
                              <img src={media.image} alt={media.title} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="p-2">
                            <p className="font-bold text-sm line-clamp-2">{media.title}</p>
                            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              {media.year}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resolvedDetail.selectedMedia.length === 0 && resolvedDetail.favorites.length === 0 && (
                  <div className="text-center py-12">
                    <Film size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
                    <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      فیلمی انتخاب یا علاقه‌مندی ثبت نشده است
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === 'products' && (
              <div className="space-y-4">
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <Package size={18} className="text-green-600" />
                  محصولات در سبد خرید
                </h4>
                {getCartProducts(resolvedDetail).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getCartProducts(resolvedDetail).map((product: any) => (
                      <div key={product.id} className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex gap-3">
                          {product.image && (
                            <img src={product.image} alt={product.name} className="w-20 h-20 rounded object-cover" />
                          )}
                          <div className="flex-1">
                            <p className="font-bold text-sm">{product.name}</p>
                            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{product.brand}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm">تعداد: {product.qty}</span>
                              <span className="font-bold text-green-600">
                                {(product.price * product.qty).toLocaleString('fa-IR')} ت
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
                    <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      محصولی در سبد خرید وجود ندارد
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === 'orders' && (
              <div className="space-y-4">
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <ShoppingCart size={18} className="text-purple-600" />
                  تاریخچه سفارشات
                </h4>
                {filterCustomerOrders(resolvedDetail).length > 0 ? (
                  <div className="space-y-3">
                    {filterCustomerOrders(resolvedDetail)
                      .slice()
                      .reverse()
                      .map(order => (
                        <div key={order.id} className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
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
                          {order.description && (
                            <p className={`text-sm mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                              {order.description}
                            </p>
                          )}
                          {/* نمایش محصولات سفارش */}
                          {order.items && order.items.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-600">
                              <p className={`text-xs font-bold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                محصولات سفارش:
                              </p>
                              <div className="space-y-2">
                                {order.items.map((item: any, idx: number) => (
                                  <div key={idx} className={`flex items-center gap-2 p-2 rounded ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                                    {item.image && (
                                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover" />
                                    )}
                                    <div className="flex-1">
                                      <p className="text-xs font-medium">{item.name}</p>
                                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        تعداد: {item.quantity} | قیمت: {item.price.toLocaleString('fa-IR')} ت
                                      </p>
                                    </div>
                                    <p className="text-xs font-bold text-green-600">
                                      {item.total.toLocaleString('fa-IR')} ت
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingCart size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
                    <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      سفارشی ثبت نشده است
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === 'services' && (
              <div className="space-y-4">
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <Wrench size={18} className="text-orange-600" />
                  خدمات درخواست شده
                </h4>
                {filterCustomerOrders(resolvedDetail).filter(o => o.type === 'service').length > 0 ? (
                  <div className="space-y-3">
                    {filterCustomerOrders(resolvedDetail)
                      .filter(o => o.type === 'service')
                      .slice()
                      .reverse()
                      .map(order => (
                        <div key={order.id} className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold">{order.description || 'خدمات کافی‌نت'}</p>
                              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {toJalaliString(order.createdAt)}
                              </p>
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-green-600">{order.total.toLocaleString('fa-IR')} ت</p>
                              <span className={`text-xs px-2 py-1 rounded ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {order.status === 'delivered' ? 'انجام شده' : 
                                 order.status === 'processing' ? 'در حال انجام' : 'جدید'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Wrench size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
                    <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      خدماتی درخواست نشده است
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === 'tickets' && (
              <div className="space-y-4">
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <LifeBuoy size={18} className="text-cyan-600" />
                  تیکت‌های پشتیبانی
                </h4>
                {filterCustomerTickets(resolvedDetail).length > 0 ? (
                  <div className="space-y-3">
                    {filterCustomerTickets(resolvedDetail)
                      .slice()
                      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                      .map(ticket => (
                        <div key={ticket.id} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-bold text-sm">{ticket.subject}</p>
                              <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                <span className="font-mono text-cyan-600">{ticket.code}</span>
                                {' · '}بروزرسانی: {toJalaliString(ticket.updatedAt)}
                                {ticket.orderId && ` · سفارش مرتبط: ${ticket.orderId}`}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-xs px-2 py-1 rounded ${ticketStatusCls[ticket.status] || 'bg-gray-100 text-gray-600'}`}>
                                {TICKET_STATUS_LABELS[ticket.status] || ticket.status}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                ticket.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                ticket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                ticket.priority === 'low' ? 'bg-gray-200 text-gray-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {ticket.priority === 'urgent' ? 'فوری' :
                                 ticket.priority === 'high' ? 'بالا' :
                                 ticket.priority === 'low' ? 'پایین' : 'معمولی'}
                              </span>
                            </div>
                          </div>
                          {ticket.description && (
                            <p className={`text-xs mb-3 border-l-2 pl-3 ${darkMode ? 'border-slate-500 text-slate-300' : 'border-slate-200 text-slate-600'}`}>
                              {ticket.description.length > 200 ? ticket.description.slice(0, 200) + '…' : ticket.description}
                            </p>
                          )}
                          {ticket.messages && ticket.messages.length > 0 && (
                            <div className={`p-3 rounded-lg space-y-2 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                              <p className={`text-[11px] font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                آخرین پیام ({ticket.messages.length} پیام کل):
                              </p>
                              {(() => {
                                const lastMsg = ticket.messages[ticket.messages.length - 1];
                                return (
                                  <div className={`rounded-lg px-3 py-2 text-xs ${
                                    lastMsg.sender === 'support'
                                      ? 'bg-cyan-50 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200'
                                      : darkMode ? 'bg-slate-700 text-slate-200' : 'bg-gray-50 text-slate-700'
                                  }`}>
                                    <p className="font-bold mb-0.5">
                                      {lastMsg.author || (lastMsg.sender === 'support' ? 'پشتیبانی' : ticket.customerName)}
                                      <span className="opacity-60 mr-1">· {toJalaliString(lastMsg.createdAt)}</span>
                                    </p>
                                    <p className="leading-6 whitespace-pre-wrap">{lastMsg.text}</p>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <LifeBuoy size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
                    <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      تیکتی ثبت نشده است
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );})()}
    </div>
  );
}
