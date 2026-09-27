import React, { useState } from 'react';
import { useApp } from '../../store';
import { Search, Users, Star, Eye, Film, ShoppingCart, Wrench, Package, Calendar, DollarSign, Heart, X, UserCheck, Wallet } from 'lucide-react';
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
    personas 
  } = useApp();
  
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'media' | 'products' | 'orders' | 'services' | 'personas'>('overview');
  const [showPersonaModal, setShowPersonaModal] = useState(false);

  const customers = users.filter(u => u.role === 'customer' && (u.name.includes(search) || u.phone.includes(search)));
  const detail = selectedUser ? users.find(u => u.id === selectedUser) : null;

  const levelLabels: Record<string, string> = { normal: 'عادی', silver: 'نقره‌ای', gold: 'طلایی', vip: 'VIP' };
  const levelColors: Record<string, string> = { 
    normal: 'bg-gray-400', 
    silver: 'bg-gray-300', 
    gold: 'bg-yellow-400', 
    vip: 'bg-purple-500' 
  };

  // محاسبه آمار مشتری
  const getCustomerStats = (userId: string) => {
    const userOrders = orders.filter(o => o.customerId === userId);
    const totalSpent = userOrders.reduce((sum, o) => sum + o.paid, 0);
    const totalOrders = userOrders.length;
    const completedOrders = userOrders.filter(o => o.status === 'delivered').length;
    
    return {
      totalSpent,
      totalOrders,
      completedOrders,
      avgOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0
    };
  };

  // دریافت فیلم‌های انتخاب شده با جزئیات کامل
  const getSelectedMediaDetails = (mediaIds: string[]) => {
    return mediaIds.map(id => mediaItems.find(m => m.id === id)).filter(Boolean);
  };

  // دریافت محصولات از سبد خرید
  const getCartProducts = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user || !user.cart) return [];
    return user.cart.map((item: any) => {
      const product = products.find(p => p.id === item.productId);
      return product ? { ...product, qty: item.quantity } : null;
    }).filter(Boolean);
  };

  // نسبت دادن پرسونا به مشتری
  const assignPersona = (userId: string, personaId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const personaIds = user.personaIds || [];
    const updatedPersonaIds = personaIds.includes(personaId)
      ? personaIds.filter(id => id !== personaId)
      : [...personaIds, personaId];
    
    setUsers(users.map(u => u.id === userId ? { ...u, personaIds: updatedPersonaIds } : u));
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
                const stats = getCustomerStats(c.id);
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
      {detail && (
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
                <div className="text-2xl font-bold">{detail.loyaltyPoints}</div>
              </div>
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart size={16} className="text-blue-500" />
                  <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>سفارشات</span>
                </div>
                <div className="text-2xl font-bold">{getCustomerStats(detail.id).totalOrders}</div>
              </div>
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={16} className="text-green-500" />
                  <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>مجموع خرید</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {getCustomerStats(detail.id).totalSpent.toLocaleString('fa-IR')} ت
                </div>
              </div>
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Wallet size={16} className="text-emerald-500" />
                  <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کیف پول</span>
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                  {(detail.walletBalance || 0).toLocaleString('fa-IR')} ت
                </div>
              </div>
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Heart size={16} className="text-red-500" />
                  <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>علاقه‌مندی</span>
                </div>
                <div className="text-2xl font-bold">{detail.favorites.length}</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {[
                { id: 'overview', label: 'نمای کلی', icon: Users },
                { id: 'personas', label: 'پرسوناها', icon: UserCheck },
                { id: 'media', label: 'فیلم‌ها', icon: Film },
                { id: 'products', label: 'محصولات', icon: Package },
                { id: 'orders', label: 'سفارشات', icon: ShoppingCart },
                { id: 'services', label: 'خدمات', icon: Wrench },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDetailTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      activeDetailTab === tab.id
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

            {/* Tab Content */}
            {activeDetailTab === 'overview' && (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <h4 className="font-bold mb-3">اطلاعات حساب</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>کد دعوت:</span>
                      <p className="font-mono font-bold">{detail.inviteCode}</p>
                    </div>
                    <div>
                      <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>تعداد دعوت‌ها:</span>
                      <p className="font-bold">{detail.invitedCount || 0}</p>
                    </div>
                    <div>
                      <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>فیلم‌های انتخاب شده:</span>
                      <p className="font-bold">{detail.selectedMedia.length}</p>
                    </div>
                    <div>
                      <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>علاقه‌مندی‌ها:</span>
                      <p className="font-bold">{detail.favorites.length}</p>
                    </div>
                  </div>
                </div>

                {/* Assigned Personas */}
                {detail.personaIds && detail.personaIds.length > 0 && (
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <UserCheck size={18} className="text-purple-600" />
                      پرسوناهای اختصاص یافته
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {detail.personaIds.map(personaId => {
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
                              onClick={() => assignPersona(detail.id, personaId)}
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
                    {orders
                      .filter(o => o.customerId === detail.id)
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
                    {orders.filter(o => o.customerId === detail.id).length === 0 && (
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

                {detail.personaIds && detail.personaIds.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {detail.personaIds.map(personaId => {
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
                              onClick={() => assignPersona(detail.id, personaId)}
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
                {detail.selectedMedia.length > 0 && (
                  <div>
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <Film size={18} className="text-blue-600" />
                      فیلم‌های انتخاب شده برای کپی ({detail.selectedMedia.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {getSelectedMediaDetails(detail.selectedMedia).map((media: any) => (
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
                {detail.favorites.length > 0 && (
                  <div>
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <Heart size={18} className="text-red-600" />
                      علاقه‌مندی‌ها ({detail.favorites.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {getSelectedMediaDetails(detail.favorites).map((media: any) => (
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

                {detail.selectedMedia.length === 0 && detail.favorites.length === 0 && (
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
                {getCartProducts(detail.id).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getCartProducts(detail.id).map((product: any) => (
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
                {orders.filter(o => o.customerId === detail.id).length > 0 ? (
                  <div className="space-y-3">
                    {orders
                      .filter(o => o.customerId === detail.id)
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
                {orders.filter(o => o.customerId === detail.id && o.type === 'service').length > 0 ? (
                  <div className="space-y-3">
                    {orders
                      .filter(o => o.customerId === detail.id && o.type === 'service')
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
          </div>
        </div>
      )}
    </div>
  );
}
