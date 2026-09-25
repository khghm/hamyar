import React from 'react';
import { useApp } from '../store';
import { Heart, Star, Gift, Users, Copy, Film, Award, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { darkMode, currentUser, mediaItems, orders, addToFavorites, selectMedia } = useApp();

  if (!currentUser) return null;

  const favMedia = mediaItems.filter(m => currentUser.favorites.includes(m.id));
  const selectedMedia = mediaItems.filter(m => currentUser.selectedMedia.includes(m.id));
  const userOrders = orders.filter(o => o.customerId === currentUser.id);

  const levelLabels: Record<string, string> = { normal: 'عادی', silver: 'نقره‌ای', gold: 'طلایی', vip: 'VIP' };
  const levelColors: Record<string, string> = { normal: 'bg-gray-400', silver: 'bg-gray-300', gold: 'bg-yellow-400', vip: 'bg-purple-500' };

  const copyInviteCode = () => {
    if (currentUser.inviteCode) navigator.clipboard.writeText(currentUser.inviteCode);
  };

  return (
    <div className="fade-in max-w-5xl mx-auto px-4 py-12">
      {/* Profile Header */}
      <div className={`p-6 rounded-2xl border mb-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            {currentUser.name.charAt(0)}
          </div>
          <div className="text-center md:text-right flex-1">
            <h1 className="text-2xl font-bold">{currentUser.name}</h1>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{currentUser.phone}</p>
            <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
              <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${levelColors[currentUser.level]}`}>
                {levelLabels[currentUser.level]}
              </span>
              <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {currentUser.loyaltyPoints} امتیاز
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <Star size={24} className="mx-auto mb-2 text-yellow-500" />
          <div className="font-bold text-lg">{currentUser.loyaltyPoints}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>امتیاز وفاداری</div>
        </div>
        <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <Heart size={24} className="mx-auto mb-2 text-red-500" />
          <div className="font-bold text-lg">{favMedia.length}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>علاقه‌مندی‌ها</div>
        </div>
        <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <Film size={24} className="mx-auto mb-2 text-blue-500" />
          <div className="font-bold text-lg">{selectedMedia.length}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>انتخاب‌های من</div>
        </div>
        <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <Gift size={24} className="mx-auto mb-2 text-green-500" />
          <div className="font-bold text-lg">{userOrders.length}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>سفارش‌ها</div>
        </div>
      </div>

      {/* Invite Code */}
      <div className={`p-6 rounded-2xl border mb-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-3">
          <Users size={20} className="text-blue-600" />
          <h3 className="font-bold">کد دعوت</h3>
        </div>
        <p className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          دوستان خود را دعوت کنید و امتیاز وفاداری دریافت کنید
        </p>
        <div className={`flex items-center gap-2 p-3 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
          <code className="flex-1 text-lg font-mono font-bold text-blue-600">{currentUser.inviteCode || '---'}</code>
          <button onClick={copyInviteCode} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
            <Copy size={14} /> کپی
          </button>
        </div>
      </div>

      {/* Loyalty Club */}
      <div className={`p-6 rounded-2xl border mb-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          <Award size={20} className="text-yellow-500" />
          <h3 className="font-bold">باشگاه مشتریان</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            { level: 'normal', label: 'عادی', min: 0, color: 'bg-gray-400', desc: 'شروع مسیر' },
            { level: 'silver', label: 'نقره‌ای', min: 100, color: 'bg-gray-300', desc: '۵٪ تخفیف' },
            { level: 'gold', label: 'طلایی', min: 500, color: 'bg-yellow-400', desc: '۱۰٪ تخفیف' },
            { level: 'vip', label: 'VIP', min: 1000, color: 'bg-purple-500', desc: '۱۵٪ تخفیف + اولویت' },
          ].map((l, i) => (
            <div key={i} className={`p-3 rounded-xl text-center ${currentUser.level === l.level ? 'ring-2 ring-blue-500' : ''} ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
              <div className={`w-8 h-8 mx-auto rounded-full ${l.color} mb-2`}></div>
              <div className="font-bold text-sm">{l.label}</div>
              <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{l.desc}</div>
              <div className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>از {l.min} امتیاز</div>
            </div>
          ))}
        </div>
      </div>

      {/* Favorites */}
      <div className={`p-6 rounded-2xl border mb-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Heart size={20} className="text-red-500" />
            <h3 className="font-bold">علاقه‌مندی‌ها</h3>
          </div>
          <Link to="/media" className="text-blue-600 text-sm flex items-center gap-1">مشاهده کالکشن <ChevronLeft size={14} /></Link>
        </div>
        {favMedia.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {favMedia.map(item => (
              <div key={item.id} className={`rounded-lg overflow-hidden border ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="aspect-[2/3] bg-slate-700 relative">
                  {item.image && <img src={item.image} alt={item.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                </div>
                <div className="p-2">
                  <p className="text-xs font-bold truncate">{item.title}</p>
                  <button onClick={() => addToFavorites(item.id)} className="text-red-500 text-xs mt-1">حذف</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-sm text-center py-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>هنوز موردی به علاقه‌مندی‌ها اضافه نکرده‌اید</p>
        )}
      </div>

      {/* Selected Media */}
      {selectedMedia.length > 0 && (
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <Film size={20} className="text-blue-500" />
            <h3 className="font-bold">انتخاب‌های من برای کپی</h3>
          </div>
          <div className="space-y-2">
            {selectedMedia.map(item => (
              <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <span className="text-sm font-medium">{item.title}</span>
                <button onClick={() => selectMedia(item.id)} className="text-red-500 text-xs">حذف</button>
              </div>
            ))}
          </div>
          <p className={`text-xs mt-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            لیست انتخابی شما برای مدیر ارسال شده است. برای نهایی‌سازی سفارش با ما تماس بگیرید.
          </p>
        </div>
      )}
    </div>
  );
}
