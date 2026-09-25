import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { ArrowRight, ShoppingCart, Star, Package, Shield, Truck, MessageSquare } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const { darkMode, products, reviews, setReviews, currentUser } = useApp();
  const navigate = useNavigate();
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  
  const product = products.find(p => p.id === id);
  const productReviews = reviews.filter(r => r.productId === id && r.approved);
  const avgRating = productReviews.length > 0 
    ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length 
    : 0;

  const submitReview = () => {
    if (!currentUser) {
      alert('لطفاً ابتدا وارد حساب کاربری خود شوید');
      return;
    }
    if (!newComment.trim()) {
      alert('لطفاً نظر خود را بنویسید');
      return;
    }
    const review = {
      id: 'r' + Date.now(),
      productId: id!,
      customerName: currentUser.name,
      rating: newRating,
      comment: newComment,
      date: new Date().toLocaleDateString('fa-IR'),
      approved: false // نظرات جدید باید توسط ادمین تایید شوند
    };
    setReviews([...reviews, review]);
    setNewComment('');
    setNewRating(5);
    alert('نظر شما با موفقیت ثبت شد و پس از تایید مدیریت نمایش داده خواهد شد');
  };

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>محصول یافت نشد</p>
        <Link to="/store" className="text-blue-600 hover:underline mt-4 inline-block">بازگشت به فروشگاه</Link>
      </div>
    );
  }

  const formatPrice = (p: number) => p.toLocaleString('fa-IR');
  const categoryLabels: Record<string, string> = {
    flash: 'فلش مموری', hard: 'هارد', cable: 'کابل', charger: 'شارژر و پاوربانک',
    cctv: 'دوربین مداربسته', pos: 'دستگاه پوز', accessories: 'لوازم جانبی',
    storage: 'حافظه', audio: 'صوتی'
  };

  const relatedProducts = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="fade-in max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link to="/" className={`${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>خانه</Link>
        <span className={darkMode ? 'text-slate-600' : 'text-slate-300'}>/</span>
        <Link to="/store" className={`${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>فروشگاه</Link>
        <span className={darkMode ? 'text-slate-600' : 'text-slate-300'}>/</span>
        <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image */}
        <div className={`rounded-2xl overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-white'} border ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="aspect-square flex items-center justify-center p-8">
            {product.image ? (
              <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain" />
            ) : (
              <Package size={120} className={darkMode ? 'text-slate-600' : 'text-gray-300'} />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center gap-3 text-sm">
              <span className={`px-3 py-1 rounded-full ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>
                {product.brand}
              </span>
              <span className={`px-3 py-1 rounded-full ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>
                {categoryLabels[product.category] || product.category}
              </span>
            </div>
          </div>

          {/* Price */}
          <div className={`p-6 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-blue-600">{formatPrice(product.price)}</span>
              <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>تومان</span>
            </div>
            {product.originalPrice && (
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-sm line-through ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {formatPrice(product.originalPrice)} تومان
                </span>
                <span className="text-sm text-red-500 font-bold">
                  {Math.round((1 - product.price / product.originalPrice) * 100)}% تخفیف
                </span>
              </div>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2">
            {product.stock > 0 ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  موجود در انبار ({product.stock} عدد)
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-sm text-red-500">ناموجود</span>
              </>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="font-bold mb-2">توضیحات محصول</h3>
            <p className={`leading-7 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {product.description}
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
              <Shield size={24} className="mx-auto mb-2 text-blue-600" />
              <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>گارانتی اصالت</p>
            </div>
            <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
              <Truck size={24} className="mx-auto mb-2 text-green-600" />
              <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>ارسال سریع</p>
            </div>
            <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
              <Star size={24} className="mx-auto mb-2 text-yellow-600" />
              <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>کیفیت تضمینی</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button 
              onClick={() => {
                const saved = localStorage.getItem('hamyar_cart');
                const cart = saved ? JSON.parse(saved) : [];
                const existing = cart.find((c: any) => c.id === product.id);
                if (existing) {
                  const updated = cart.map((c: any) => c.id === product.id ? { ...c, qty: c.qty + 1 } : c);
                  localStorage.setItem('hamyar_cart', JSON.stringify(updated));
                } else {
                  cart.push({ id: product.id, qty: 1 });
                  localStorage.setItem('hamyar_cart', JSON.stringify(cart));
                }
                window.dispatchEvent(new Event('cartUpdated'));
                alert('محصول به سبد خرید اضافه شد');
              }}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingCart size={20} />
              افزودن به سبد خرید
            </button>
            <a href="tel:09913911880" className={`px-6 py-3 rounded-xl border-2 font-medium transition-all ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}>
              تماس برای خرید
            </a>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare size={24} className="text-blue-600" />
            نظرات کاربران
          </h2>
          {avgRating > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={18} className={i <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                ))}
              </div>
              <span className="text-sm font-bold">{avgRating.toFixed(1)}</span>
              <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>({productReviews.length} نظر)</span>
            </div>
          )}
        </div>

        {/* Add Review Form */}
        <div className={`p-6 rounded-2xl border mb-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold mb-4">ثبت نظر</h3>
          <div className="mb-3">
            <label className="text-sm font-medium block mb-2">امتیاز شما:</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <button key={i} onClick={() => setNewRating(i)}>
                  <Star size={28} className={i <= newRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="نظر خود را درباره این محصول بنویسید..."
            rows={3}
            className={`w-full px-3 py-2 rounded-lg border mb-3 ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`}
          />
          <button
            onClick={submitReview}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700"
          >
            ثبت نظر
          </button>
        </div>

        {/* Reviews List */}
        {productReviews.length > 0 ? (
          <div className="space-y-4">
            {productReviews.map(review => (
              <div key={review.id} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {review.customerName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{review.customerName}</p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{review.date}</p>
                    </div>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} size={14} className={i <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                    ))}
                  </div>
                </div>
                <p className={`text-sm leading-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-8 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
            <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>هنوز نظری ثبت نشده است. اولین نفر باشید!</p>
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">محصولات مشابه</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map(p => (
              <Link key={p.id} to={`/product/${p.id}`} className={`rounded-xl overflow-hidden border transition-all hover:shadow-lg ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className={`h-40 flex items-center justify-center ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  {p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover" />}
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-sm line-clamp-2 mb-2">{p.name}</h3>
                  <p className="text-blue-600 font-bold">{formatPrice(p.price)} تومان</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
