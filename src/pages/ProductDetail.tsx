import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { ArrowRight, ShoppingCart, Star, Package, Shield, Truck } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const { darkMode, products } = useApp();
  const navigate = useNavigate();
  
  const product = products.find(p => p.id === id);

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
            <button className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
              <ShoppingCart size={20} />
              افزودن به سبد خرید
            </button>
            <a href="tel:09913911880" className={`px-6 py-3 rounded-xl border-2 font-medium transition-all ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}>
              تماس برای خرید
            </a>
          </div>
        </div>
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
