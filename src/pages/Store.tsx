import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store';
import { Search, SlidersHorizontal, ShoppingCart, X, Star, ChevronDown, Heart } from 'lucide-react';

export default function Store() {
  const { darkMode, products } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [sortBy, setSortBy] = useState('default');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [cart, setCart] = useState<{ id: string; qty: number }[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const { campaigns } = useApp();

  const cartTotal = cart.reduce((sum, c) => {
    const p = products.find(pr => pr.id === c.id);
    return sum + (p ? p.price * c.qty : 0);
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

  const categories = Array.from(new Set(products.map(p => p.category)));
  const brands = Array.from(new Set(products.map(p => p.brand)));

  const categoryLabels: Record<string, string> = {
    flash: 'فلش مموری', hard: 'هارد', cable: 'کابل', charger: 'شارژر و پاوربانک',
    cctv: 'دوربین مداربسته', pos: 'دستگاه پوز', accessories: 'لوازم جانبی',
    storage: 'حافظه', audio: 'صوتی'
  };

  const filtered = useMemo(() => {
    let items = products.filter(p => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (brandFilter !== 'all' && p.brand !== brandFilter) return false;
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      if (search && !p.name.includes(search) && !p.brand.includes(search)) return false;
      return true;
    });
    if (sortBy === 'price-asc') items.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') items.sort((a, b) => b.price - a.price);
    else if (sortBy === 'name') items.sort((a, b) => a.name.localeCompare(b.name));
    return items;
  }, [products, categoryFilter, brandFilter, priceRange, search, sortBy]);

  const formatPrice = (p: number) => p.toLocaleString('fa-IR');
  const { currentUser, orders, setOrders } = useApp();
  
  const addToCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === id);
      if (existing) return prev.map(c => c.id === id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { id, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(c => c.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id);
    } else {
      setCart(prev => prev.map(c => c.id === id ? { ...c, qty } : c));
    }
  };

  const checkout = () => {
    if (!currentUser) {
      alert('لطفاً ابتدا وارد حساب کاربری خود شوید');
      return;
    }
    if (cart.length === 0) {
      alert('سبد خرید شما خالی است');
      return;
    }

    const orderItems = cart.map(c => {
      const product = products.find(p => p.id === c.id);
      return {
        productId: c.id,
        name: product?.name || '',
        price: product?.price || 0,
        quantity: c.qty,
        total: (product?.price || 0) * c.qty
      };
    });

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
      total: cartTotal,
      paid: 0,
      remaining: cartTotal,
      createdAt: new Date().toISOString(),
      description: 'سفارش از فروشگاه آنلاین'
    };

    setOrders([...orders, newOrder]);
    setCart([]);
    alert(`سفارش شما با کد رهگیری ${newOrder.trackingCode} ثبت شد. برای پرداخت با ما تماس بگیرید.`);
  };

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-bold mb-3 text-sm">دسته‌بندی</h3>
        <div className="space-y-1">
          <button onClick={() => setCategoryFilter('all')}
            className={`block w-full text-right px-3 py-2 rounded-lg text-sm ${categoryFilter === 'all' ? 'bg-blue-600 text-white' : darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-slate-600'}`}>
            همه محصولات
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(cat)}
              className={`block w-full text-right px-3 py-2 rounded-lg text-sm ${categoryFilter === cat ? 'bg-blue-600 text-white' : darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-slate-600'}`}>
              {categoryLabels[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Brand */}
      <div>
        <h3 className="font-bold mb-3 text-sm">برند</h3>
        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}
          className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
          <option value="all">همه برندها</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-bold mb-3 text-sm">محدوده قیمت</h3>
        <div className="space-y-2">
          <input type="range" min="0" max="10000000" step="50000" value={priceRange[1]}
            onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
            className="w-full accent-blue-600" />
          <div className="flex justify-between text-xs">
            <span>{formatPrice(priceRange[0])} تومان</span>
            <span>{formatPrice(priceRange[1])} تومان</span>
          </div>
        </div>
      </div>

      {/* Reset */}
      <button onClick={() => { setCategoryFilter('all'); setBrandFilter('all'); setPriceRange([0, 10000000]); setSearch(''); }}
        className="w-full py-2 rounded-lg border border-red-300 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20">
        حذف فیلترها
      </button>
    </div>
  );

  return (
    <div className="fade-in">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        <img 
          src="https://image.qwenlm.ai/generated-images/9457689d-cfab-485b-9c4b-437a4dabb462/_result.png" 
          alt="فروشگاه محصولات دیجیتال" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3 drop-shadow-lg">فروشگاه محصولات دیجیتال</h1>
          <p className="text-white/90 text-sm md:text-lg drop-shadow">فلش مموری، هارد، کابل، شارژر، دوربین مداربسته و لوازم جانبی</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="جستجو در محصولات..." value={search} onChange={e => setSearch(e.target.value)}
            className={`w-full pr-10 pl-4 py-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' : 'bg-white border-gray-200 placeholder-gray-400'}`} />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className={`px-4 py-3 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200'}`}>
          <option value="default">مرتب‌سازی</option>
          <option value="price-asc">ارزان‌ترین</option>
          <option value="price-desc">گران‌ترین</option>
          <option value="name">نام محصول</option>
        </select>
        <button onClick={() => setShowMobileFilter(true)} className="md:hidden flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white">
          <SlidersHorizontal size={18} /> فیلتر
        </button>
      </div>

      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <aside className={`hidden md:block w-64 flex-shrink-0 p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <FilterSidebar />
        </aside>

        {/* Mobile Filter Modal */}
        {showMobileFilter && (
          <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setShowMobileFilter(false)}>
            <div className={`absolute right-0 top-0 bottom-0 w-80 p-6 overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold">فیلترها</h3>
                <button onClick={() => setShowMobileFilter(false)}><X size={20} /></button>
              </div>
              <FilterSidebar />
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="flex-1">
          <p className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{filtered.length} محصول</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(product => (
              <Link key={product.id} to={`/product/${product.id}`} className={`rounded-xl border overflow-hidden transition-all hover:shadow-lg block ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className={`h-48 flex items-center justify-center ${darkMode ? 'bg-slate-700' : 'bg-gray-50'} relative`}>
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  {product.originalPrice && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      {Math.round((1 - product.price / product.originalPrice) * 100)}%
                    </span>
                  )}
                  {product.stock < 10 && (
                    <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">موجودی محدود</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm mb-1 line-clamp-2">{product.name}</h3>
                  <p className={`text-xs mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{product.brand} | {categoryLabels[product.category]}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-blue-600">{formatPrice(product.price)}</span>
                      <span className="text-xs text-slate-400 mr-1">تومان</span>
                      {product.originalPrice && (
                        <div className="text-xs text-slate-400 line-through">{formatPrice(product.originalPrice)}</div>
                      )}
                    </div>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product.id); }}
                      className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all">
                      <ShoppingCart size={16} />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-4 rounded-xl shadow-2xl border z-40 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-sm">سبد خرید ({cart.reduce((s, c) => s + c.qty, 0)} کالا)</span>
            <button onClick={() => setCart([])} className="text-red-500 text-xs hover:underline">پاک کردن همه</button>
          </div>
          
          {/* Cart Items */}
          <div className="max-h-60 overflow-y-auto mb-3 space-y-2">
            {cart.map(item => {
              const product = products.find(p => p.id === item.id);
              if (!product) return null;
              return (
                <div key={item.id} className={`flex items-center gap-2 p-2 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{product.name}</p>
                    <p className="text-xs text-blue-600">{formatPrice(product.price * item.qty)} تومان</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => updateQuantity(item.id, item.qty - 1)}
                      className={`w-6 h-6 rounded text-xs ${darkMode ? 'bg-slate-600 hover:bg-slate-500' : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                      -
                    </button>
                    <span className="text-xs w-6 text-center">{item.qty}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.qty + 1)}
                      className={`w-6 h-6 rounded text-xs ${darkMode ? 'bg-slate-600 hover:bg-slate-500' : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                      +
                    </button>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="w-6 h-6 rounded text-xs bg-red-500 text-white hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Coupon */}
          <div className="mb-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                placeholder="کد تخفیف"
                className={`flex-1 px-2 py-1.5 rounded text-xs ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'} border`}
              />
              <button
                onClick={applyCoupon}
                className="px-3 py-1.5 rounded bg-purple-600 text-white text-xs hover:bg-purple-700"
              >
                اعمال
              </button>
            </div>
            {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
            {appliedCoupon && (
              <p className="text-green-600 text-xs mt-1">✓ کد {appliedCoupon.title} اعمال شد</p>
            )}
          </div>

          <div className="border-t pt-2 mb-3 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm">جمع کل:</span>
              <span className="text-sm">{formatPrice(cartTotal)} تومان</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm">تخفیف:</span>
                <span className="text-sm">-{formatPrice(discountAmount)} تومان</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 border-t border-gray-200 dark:border-slate-700">
              <span className="text-sm font-bold">مبلغ نهایی:</span>
              <span className="text-blue-600 font-bold">{formatPrice(finalTotal)} تومان</span>
            </div>
          </div>
          
          <button 
            onClick={checkout}
            className="w-full py-2.5 rounded-lg bg-green-600 text-white font-medium text-sm hover:bg-green-700 transition-all"
          >
            ثبت سفارش
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
