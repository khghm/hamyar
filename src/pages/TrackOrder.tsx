import React, { useState } from 'react';
import { useApp } from '../store';
import { Search, Package, CheckCircle, Clock, Truck, XCircle } from 'lucide-react';

export default function TrackOrder() {
  const { darkMode, orders } = useApp();
  const [trackingCode, setTrackingCode] = useState('');
  const [foundOrder, setFoundOrder] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  const handleTrack = () => {
    const order = orders.find(o => o.trackingCode.toLowerCase() === trackingCode.toLowerCase());
    if (order) {
      setFoundOrder(order);
      setNotFound(false);
    } else {
      setFoundOrder(null);
      setNotFound(true);
    }
  };

  const statusSteps = [
    { key: 'new', label: 'ثبت سفارش', icon: Package },
    { key: 'processing', label: 'در حال انجام', icon: Clock },
    { key: 'ready', label: 'آماده تحویل', icon: Truck },
    { key: 'delivered', label: 'تحویل شده', icon: CheckCircle },
  ];

  const getCurrentStep = (status: string) => {
    const idx = statusSteps.findIndex(s => s.key === status);
    return idx >= 0 ? idx : -1;
  };

  return (
    <div className="fade-in max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black mb-4">پیگیری سفارش</h1>
        <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          کد رهگیری سفارش خود را وارد کنید تا وضعیت آن را مشاهده نمایید
        </p>
      </div>

      {/* Search Box */}
      <div className={`p-6 rounded-2xl border mb-8 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="کد رهگیری (مثال: HMY-ABC123)"
              value={trackingCode}
              onChange={e => setTrackingCode(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleTrack()}
              className={`w-full pr-10 pl-4 py-3 rounded-xl border ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`}
              dir="ltr"
            />
          </div>
          <button
            onClick={handleTrack}
            className="px-8 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all"
          >
            پیگیری
          </button>
        </div>
      </div>

      {/* Not Found */}
      {notFound && (
        <div className={`p-6 rounded-2xl border text-center ${darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
          <XCircle size={48} className="mx-auto mb-3 text-red-500" />
          <h3 className="font-bold text-lg mb-2">سفارشی یافت نشد</h3>
          <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            کد رهگیری وارد شده معتبر نیست. لطفاً کد را بررسی کنید.
          </p>
        </div>
      )}

      {/* Order Details */}
      {foundOrder && (
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-lg">سفارش {foundOrder.trackingCode}</h3>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                ثبت شده در: {new Date(foundOrder.createdAt).toLocaleDateString('fa-IR')}
              </p>
            </div>
            <div className="text-left">
              <p className="text-blue-600 font-bold text-xl">{foundOrder.total.toLocaleString('fa-IR')} تومان</p>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="mb-8">
            <h4 className="font-bold mb-4">وضعیت سفارش</h4>
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className={`absolute top-5 right-0 left-0 h-1 ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                <div 
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${(getCurrentStep(foundOrder.status) / (statusSteps.length - 1)) * 100}%` }}
                ></div>
              </div>

              {/* Steps */}
              {statusSteps.map((step, idx) => {
                const Icon = step.icon;
                const currentStep = getCurrentStep(foundOrder.status);
                const isCompleted = idx <= currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                      isCompleted 
                        ? 'bg-blue-600 text-white' 
                        : darkMode ? 'bg-slate-700 text-slate-400' : 'bg-gray-200 text-gray-400'
                    } ${isCurrent ? 'ring-4 ring-blue-600/30' : ''}`}>
                      <Icon size={20} />
                    </div>
                    <span className={`text-xs text-center ${isCompleted ? 'font-bold' : ''} ${
                      isCompleted 
                        ? 'text-blue-600' 
                        : darkMode ? 'text-slate-400' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h4 className="font-bold mb-3">اقلام سفارش</h4>
            <div className="space-y-2">
              {foundOrder.items && foundOrder.items.length > 0 ? (
                foundOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className={`flex justify-between p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                    <span className="text-sm">{item.name || 'محصول'} × {item.quantity || 1}</span>
                    <span className="text-sm font-bold">{(item.total || item.price || 0).toLocaleString('fa-IR')} تومان</span>
                  </div>
                ))
              ) : (
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {foundOrder.description || 'سفارش خدمات'}
                </p>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <div className="flex justify-between mb-2">
              <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>مبلغ کل:</span>
              <span className="font-bold">{foundOrder.total.toLocaleString('fa-IR')} تومان</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>پرداخت شده:</span>
              <span className="text-green-600 font-bold">{foundOrder.paid.toLocaleString('fa-IR')} تومان</span>
            </div>
            <div className="flex justify-between">
              <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>باقی‌مانده:</span>
              <span className="text-red-600 font-bold">{foundOrder.remaining.toLocaleString('fa-IR')} تومان</span>
            </div>
          </div>

          {/* SMS Notification Info */}
          <div className={`mt-4 p-4 rounded-lg border ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
            <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              وضعیت سفارش شما از طریق پیامک اطلاع‌رسانی خواهد شد. برای تغییر شماره تماس با ما تماس بگیرید.
            </p>
          </div>
        </div>
      )}

      {/* Help Section */}
      {!foundOrder && !notFound && (
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-blue-50 border-blue-200'}`}>
          <h3 className="font-bold mb-3">راهنمای پیگیری</h3>
          <ul className={`space-y-2 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            <li>• کد رهگیری پس از ثبت سفارش برای شما ارسال می‌شود</li>
            <li>• کد رهگیری شامل حروف و اعداد است (مثال: HMY-ABC123)</li>
            <li>• در صورت فراموشی کد، با شماره 09913911880 تماس بگیرید</li>
            <li>• وضعیت سفارش از طریق پیامک نیز اطلاع‌رسانی می‌شود</li>
          </ul>
        </div>
      )}
    </div>
  );
}
