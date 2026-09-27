import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, Wallet, ArrowLeft, Tag, CheckCircle } from 'lucide-react';

export default function Cart() {
  const { darkMode, currentUser, products, campaigns, orders, setOrders, cartItems, clearCart, updateCartQuantity, removeFromCart, deductWallet } = useApp();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'wallet'>('online');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Single source of truth: the main store's cart (persisted in localStorage)
  const cart = cartItems;
  
  const cartTotal = cart.reduce((sum, c) => {
    const p = products.find(pr => pr.id === c.productId);
    return sum + (p ? p.price * c.quantity : 0);
  }, 0);

  const applyCoupon = () => {
    const campaign = campaigns.find(c => c.code === couponCode.toUpperCase() && c.active);
    if (!campaign) {
      setCouponError('کد تخفیف معتبر نیست');
      setAppliedCoupon(null);
      return;
    }
    if (new Date(campaign.endDate) < new Date()) {
      setCouponError('کد تخفیف منقضی شده است');
      setAppliedCoupon(null);
      return;
    }
    if (campaign.usedCount >= campaign.maxUses) {
      setCouponError('ظرفیت استفاده از این کد تکمیل شده است');
      setAppliedCoupon(null);
      return;
    }
    if (cartTotal < campaign.minPurchase) {
      setCouponError(`حداقل خرید برای این کد: ${campaign.minPurchase.toLocaleString('fa-IR')} تومان`);
      setAppliedCoupon(null);
      return;
    }
    setAppliedCoupon(campaign);
    setCouponError('');
  };

  const discountAmount = appliedCoupon 
    ? appliedCoupon.type === 'percent' 
      ? Math.round(cartTotal * appliedCoupon.discount / 100)
      : appliedCoupon.discount
    : 0;
  
  const finalTotal = cartTotal - discountAmount;

  const handleCheckout = () => {
    if (!currentUser) {
      alert('لطفاً ابتدا وارد حساب کاربری خود شوید');
      navigate('/auth');
      return;
    }
    if (cart.length === 0) {
      alert('سبد خرید شما خالی است');
      return;
    }
    if (paymentMethod === 'wallet' && (currentUser.walletBalance || 0) < finalTotal) {
      alert('موجودی کیف پول شما کافی نیست');
      return;
    }
    setShowPaymentModal(true);
  };

  const completePayment = () => {
    if (!currentUser) return;

    const orderItems = cart.map(c => {
      const product = products.find(p => p.id === c.productId);
      return {
        productId: c.productId,
        name: product?.name || '',
        price: product?.price || 0,
        quantity: c.quantity,
        total: (product?.price || 0) * c.quantity,
        image: product?.image || ''
      };
    });

    // اگر پرداخت از کیف پول است، مبلغ را کسر کن
    if (paymentMethod === 'wallet') {
      const success = deductWallet(finalTotal);
      if (!success) {
        alert('موجودی کیف پول شما کافی نیست');
        return;
      }
    }

    const newOrder = {
      id: 'o' + Date.now(),
      trackingCode: 'HMY-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      customerId: currentUser.id,
      customerName: currentUser.name,
      type: 'product' as const,
      channel: 'وب‌سایت',
      status: 'new' as const,
      priority: 'normal' as const,
      items: orderItems,
      total: finalTotal,
      paid: paymentMethod === 'wallet' ? finalTotal : 0,
      remaining: paymentMethod === 'wallet' ? 0 : finalTotal,
      createdAt: new Date().toISOString(),
      description: `سفارش از فروشگاه آنلاین - پرداخت ${paymentMethod === 'wallet' ? 'کیف پول' : 'آنلاین'}`,
      paymentMethod: paymentMethod,
      couponCode: appliedCoupon?.code || null
    };

    setOrders([...orders, newOrder]);
    clearCart();
    
    alert(`سفارش شما با کد رهگیری ${newOrder.trackingCode} ثبت شد${paymentMethod === 'online' ? '. پس از پرداخت آنلاین، سفارش شما پردازش خواهد شد.' : ' و مبلغ از کیف پول شما کسر شد.'}`);
    navigate('/profile');
  };

  const formatPrice = (p: number) => p.toLocaleString('fa-IR');

  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <ShoppingCart size={64} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
        <h2 className="text-2xl font-bold mb-4">لطفاً ابتدا وارد حساب کاربری خود شوید</h2>
        <Link to="/auth" className="inline-block px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700">
          ورود / ثبت‌نام
        </Link>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <ShoppingCart size={64} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
        <h2 className="text-2xl font-bold mb-4">سبد خرید شما خالی است</h2>
        <Link to="/store" className="inline-block px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700">
          بازگشت به فروشگاه
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ShoppingCart size={32} className="text-blue-600" />
          سبد خرید
        </h1>
        <Link to="/store" className="flex items-center gap-2 text-blue-600 hover:underline">
          <ArrowLeft size={18} />
          ادامه خرید
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return null;
            
            return (
              <div key={item.productId} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="flex gap-4">
                  {product.image && (
                    <img src={product.image} alt={product.name} className="w-24 h-24 rounded-lg object-cover" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                    <p className={`text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{product.brand}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateCartQuantity(item.productId, item.quantity - 1);
                            }
                          }}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-12 text-center font-bold">{item.quantity}</span>
                        <button 
                          onClick={() => {
                            updateCartQuantity(item.productId, item.quantity + 1);
                          }}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-blue-600 font-bold">{formatPrice(product.price * item.quantity)} تومان</p>
                        {item.quantity > 1 && (
                          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {formatPrice(product.price)} تومان × {item.quantity}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      removeFromCart(item.productId);
                    }}
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className={`p-6 rounded-xl border sticky top-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h2 className="text-xl font-bold mb-4">خلاصه سفارش</h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>جمع کل:</span>
                <span className="font-bold">{formatPrice(cartTotal)} تومان</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>تخفیف:</span>
                  <span className="font-bold">-{formatPrice(discountAmount)} تومان</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200 dark:border-slate-700">
                <span>مبلغ نهایی:</span>
                <span className="text-blue-600">{formatPrice(finalTotal)} تومان</span>
              </div>
            </div>

            {/* Coupon */}
            <div className="mb-4">
              <label className="text-sm font-medium block mb-2">کد تخفیف</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  placeholder="کد تخفیف را وارد کنید"
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`}
                />
                <button
                  onClick={applyCoupon}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700 flex items-center gap-1"
                >
                  <Tag size={14} />
                  اعمال
                </button>
              </div>
              {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
              {appliedCoupon && (
                <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                  <CheckCircle size={12} />
                  کد {appliedCoupon.title} اعمال شد
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <label className="text-sm font-medium block mb-2">روش پرداخت</label>
              <div className="space-y-2">
                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  paymentMethod === 'online' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : darkMode ? 'border-slate-600 hover:border-slate-500' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-4 h-4"
                  />
                  <CreditCard size={20} className="text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">درگاه پرداخت آنلاین</p>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>پرداخت امن با کارت بانکی</p>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  paymentMethod === 'wallet' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : darkMode ? 'border-slate-600 hover:border-slate-500' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="wallet"
                    checked={paymentMethod === 'wallet'}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-4 h-4"
                  />
                  <Wallet size={20} className="text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">کیف پول</p>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      موجودی: {formatPrice(currentUser.walletBalance || 0)} تومان
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <CreditCard size={20} />
              پرداخت و ثبت سفارش
            </button>

            <p className={`text-xs text-center mt-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              با کلیک روی دکمه بالا، شرایط و قوانین را می‌پذیرید
            </p>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPaymentModal(false)}>
          <div className={`w-full max-w-md p-6 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              {paymentMethod === 'online' ? <CreditCard size={24} className="text-blue-600" /> : <Wallet size={24} className="text-green-600" />}
              {paymentMethod === 'online' ? 'پرداخت آنلاین' : 'پرداخت از کیف پول'}
            </h3>
            
            <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
              <div className="flex justify-between mb-2">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>مبلغ قابل پرداخت:</span>
                <span className="font-bold text-lg">{formatPrice(finalTotal)} تومان</span>
              </div>
              {paymentMethod === 'wallet' && (
                <div className="flex justify-between text-sm">
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>موجودی کیف پول:</span>
                  <span className="font-bold">{formatPrice(currentUser.walletBalance || 0)} تومان</span>
                </div>
              )}
            </div>

            {paymentMethod === 'online' && (
              <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                <p className="text-sm">
                  شما به درگاه پرداخت امن منتقل خواهید شد. پس از پرداخت موفق، سفارش شما ثبت و پردازش خواهد شد.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={completePayment}
                className="flex-1 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                تأیید پرداخت
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className={`px-6 py-3 rounded-lg border ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
