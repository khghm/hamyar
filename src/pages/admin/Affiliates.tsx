import React, { useState } from 'react';
import { useApp, Affiliate, AffiliateOrder, AffiliateTransaction } from '../../store';
import { 
  Users, Plus, X, Edit, Trash2, Wallet, TrendingUp, DollarSign, 
  ShoppingCart, Eye, Download, Search, Filter, Copy, CheckCircle,
  Clock, XCircle, Link as LinkIcon
} from 'lucide-react';
import { exportToExcel } from '../../utils/export';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

export default function AdminAffiliates() {
  const { 
    darkMode, 
    affiliates, 
    setAffiliates,
    affiliateOrders,
    setAffiliateOrders,
    affiliateTransactions,
    setAffiliateTransactions,
    orders
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'affiliates' | 'orders' | 'transactions' | 'reports'>('overview');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedAffiliate, setSelectedAffiliate] = useState<string | null>(null);
  
  const [form, setForm] = useState<Partial<Affiliate>>({
    name: '',
    phone: '',
    email: '',
    commissionRate: 10,
    status: 'active',
    notes: ''
  });

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAction, setWalletAction] = useState<'withdrawal' | 'expense'>('withdrawal');
  const [walletAmount, setWalletAmount] = useState(0);
  const [walletDescription, setWalletDescription] = useState('');

  const generateReferralCode = () => {
    return 'HMY' + Math.random().toString(36).substr(2, 6).toUpperCase();
  };

  const openNew = () => {
    setForm({
      name: '',
      phone: '',
      email: '',
      referralCode: generateReferralCode(),
      commissionRate: 10,
      status: 'active',
      notes: ''
    });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (affiliate: Affiliate) => {
    setForm(affiliate);
    setEditId(affiliate.id);
    setShowForm(true);
  };

  const save = () => {
    if (editId) {
      setAffiliates(affiliates.map(a => a.id === editId ? { ...a, ...form } as Affiliate : a));
    } else {
      const newAffiliate: Affiliate = {
        id: 'aff' + Date.now(),
        name: form.name || '',
        phone: form.phone || '',
        email: form.email,
        referralCode: form.referralCode || generateReferralCode(),
        commissionRate: form.commissionRate || 10,
        walletBalance: 0,
        totalEarnings: 0,
        totalWithdrawn: 0,
        totalSpent: 0,
        status: form.status || 'active',
        joinDate: new Date().toISOString(),
        notes: form.notes
      };
      setAffiliates([...affiliates, newAffiliate]);
    }
    setShowForm(false);
  };

  const handleWalletAction = () => {
    if (!selectedAffiliate || walletAmount <= 0) return;

    const affiliate = affiliates.find(a => a.id === selectedAffiliate);
    if (!affiliate) return;

    if (walletAction === 'withdrawal' && walletAmount > affiliate.walletBalance) {
      alert('موجودی کیف پول کافی نیست');
      return;
    }

    const transaction: AffiliateTransaction = {
      id: 'trans' + Date.now(),
      affiliateId: selectedAffiliate,
      type: walletAction,
      amount: walletAmount,
      description: walletDescription,
      status: 'completed',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    setAffiliateTransactions([...affiliateTransactions, transaction]);

    // به‌روزرسانی موجودی کیف پول
    const updatedAffiliates = affiliates.map(a => {
      if (a.id === selectedAffiliate) {
        const newBalance = walletAction === 'withdrawal' 
          ? a.walletBalance - walletAmount 
          : a.walletBalance + walletAmount;
        const newWithdrawn = walletAction === 'withdrawal' 
          ? a.totalWithdrawn + walletAmount 
          : a.totalWithdrawn;
        const newSpent = walletAction === 'expense' 
          ? a.totalSpent + walletAmount 
          : a.totalSpent;
        
        return {
          ...a,
          walletBalance: newBalance,
          totalWithdrawn: newWithdrawn,
          totalSpent: newSpent
        };
      }
      return a;
    });

    setAffiliates(updatedAffiliates);
    setShowWalletModal(false);
    setWalletAmount(0);
    setWalletDescription('');
  };

  const getAffiliateStats = (affiliateId: string) => {
    const orders = affiliateOrders.filter(o => o.affiliateId === affiliateId);
    const transactions = affiliateTransactions.filter(t => t.affiliateId === affiliateId);
    
    return {
      totalOrders: orders.length,
      completedOrders: orders.filter(o => o.status === 'completed').length,
      totalCommission: orders.reduce((sum, o) => sum + o.commissionAmount, 0),
      totalWithdrawn: transactions.filter(t => t.type === 'withdrawal' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
      totalSpent: transactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
    };
  };

  const filteredAffiliates = affiliates.filter(a => 
    a.name.includes(search) || a.phone.includes(search) || a.referralCode.includes(search)
  );

  const stats = {
    totalAffiliates: affiliates.length,
    activeAffiliates: affiliates.filter(a => a.status === 'active').length,
    totalEarnings: affiliates.reduce((sum, a) => sum + a.totalEarnings, 0),
    totalWalletBalance: affiliates.reduce((sum, a) => sum + a.walletBalance, 0),
    totalOrders: affiliateOrders.length,
    totalCommission: affiliateOrders.reduce((sum, o) => sum + o.commissionAmount, 0),
  };

  // داده‌های نمودار
  const monthlyData = [
    { name: 'فروردین', orders: 12, commission: 1200000 },
    { name: 'اردیبهشت', orders: 19, commission: 1900000 },
    { name: 'خرداد', orders: 15, commission: 1500000 },
    { name: 'تیر', orders: 22, commission: 2200000 },
    { name: 'مرداد', orders: 18, commission: 1800000 },
    { name: 'شهریور', orders: 25, commission: 2500000 },
  ];

  const orderTypeData = [
    { name: 'طراحی سایت', value: 35, color: '#3b82f6' },
    { name: 'ربات', value: 20, color: '#8b5cf6' },
    { name: 'اپلیکیشن', value: 15, color: '#ec4899' },
    { name: 'محصولات', value: 25, color: '#10b981' },
    { name: 'خدمات', value: 30, color: '#f59e0b' },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fade-in space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
              <Users size={28} className="text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              مدیریت همکاران
            </span>
          </h1>
          <p className={`text-sm mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            سیستم افیلیت مارکتینگ و مدیریت پورسانت همکاران
          </p>
        </div>
        <button 
          onClick={openNew}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Plus size={16} />
          همکار جدید
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <Users size={20} className="text-purple-600 mb-2" />
          <div className="text-2xl font-bold">{stats.totalAffiliates}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کل همکاران</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <CheckCircle size={20} className="text-green-600 mb-2" />
          <div className="text-2xl font-bold text-green-600">{stats.activeAffiliates}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>همکاران فعال</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <ShoppingCart size={20} className="text-blue-600 mb-2" />
          <div className="text-2xl font-bold text-blue-600">{stats.totalOrders}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>سفارشات ارجاعی</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <DollarSign size={20} className="text-green-600 mb-2" />
          <div className="text-2xl font-bold text-green-600">{stats.totalCommission.toLocaleString('fa-IR')}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کل پورسانت (تومان)</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <Wallet size={20} className="text-purple-600 mb-2" />
          <div className="text-2xl font-bold text-purple-600">{stats.totalWalletBalance.toLocaleString('fa-IR')}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>موجودی کل کیف پول</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <TrendingUp size={20} className="text-orange-600 mb-2" />
          <div className="text-2xl font-bold text-orange-600">{stats.totalEarnings.toLocaleString('fa-IR')}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کل درآمد همکاران</div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`rounded-xl border p-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {[
            { id: 'overview', label: 'نمای کلی', icon: TrendingUp },
            { id: 'affiliates', label: 'همکاران', icon: Users },
            { id: 'orders', label: 'سفارشات', icon: ShoppingCart },
            { id: 'transactions', label: 'تراکنش‌ها', icon: Wallet },
            { id: 'reports', label: 'گزارش‌ها', icon: Download },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : darkMode 
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                      : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                }`}
              >
                <Icon size={16} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Performance */}
            <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-purple-600" />
                عملکرد ماهانه
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e5e7eb'} />
                  <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#6b7280'} />
                  <YAxis stroke={darkMode ? '#94a3b8' : '#6b7280'} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1e293b' : '#fff',
                      border: darkMode ? '1px solid #334155' : '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="orders" fill="#8b5cf6" name="سفارشات" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="commission" fill="#ec4899" name="پورسانت" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Order Types */}
            <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ShoppingCart size={20} className="text-pink-600" />
                توزیع انواع سفارشات
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={orderTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {orderTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1e293b' : '#fff',
                      border: darkMode ? '1px solid #334155' : '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Affiliates */}
          <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users size={20} className="text-purple-600" />
              برترین همکاران
            </h3>
            <div className="space-y-3">
              {affiliates
                .sort((a, b) => b.totalEarnings - a.totalEarnings)
                .slice(0, 5)
                .map((affiliate, idx) => (
                  <div key={affiliate.id} className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                          idx === 0 ? 'bg-yellow-500' :
                          idx === 1 ? 'bg-gray-400' :
                          idx === 2 ? 'bg-orange-600' :
                          'bg-purple-500'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-bold">{affiliate.name}</p>
                          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {affiliate.phone}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-purple-600">{affiliate.totalEarnings.toLocaleString('fa-IR')} ت</p>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {getAffiliateStats(affiliate.id).totalOrders} سفارش
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Affiliates Tab */}
      {activeTab === 'affiliates' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="جستجو بر اساس نام، تلفن یا کد ارجاع..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full pr-10 pl-4 py-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' : 'bg-white border-gray-200 placeholder-gray-400'}`}
            />
          </div>

          {/* Affiliates List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAffiliates.map(affiliate => {
              const affiliateStats = getAffiliateStats(affiliate.id);
              return (
                <div key={affiliate.id} className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{affiliate.name}</h3>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{affiliate.phone}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      affiliate.status === 'active' ? 'bg-green-100 text-green-700' :
                      affiliate.status === 'inactive' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {affiliate.status === 'active' ? 'فعال' : affiliate.status === 'inactive' ? 'غیرفعال' : 'در انتظار'}
                    </span>
                  </div>

                  {/* Referral Code */}
                  <div className={`p-3 rounded-lg mb-3 ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کد ارجاع</p>
                        <p className="font-mono font-bold">{affiliate.referralCode}</p>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(affiliate.referralCode)}
                        className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className={`p-2 rounded-lg text-center ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                      <p className="text-xs text-slate-400">پورسانت</p>
                      <p className="font-bold text-purple-600">{affiliate.commissionRate}%</p>
                    </div>
                    <div className={`p-2 rounded-lg text-center ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                      <p className="text-xs text-slate-400">سفارشات</p>
                      <p className="font-bold text-blue-600">{affiliateStats.totalOrders}</p>
                    </div>
                    <div className={`p-2 rounded-lg text-center ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                      <p className="text-xs text-slate-400">کیف پول</p>
                      <p className="font-bold text-green-600">{affiliate.walletBalance.toLocaleString('fa-IR')}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setSelectedAffiliate(affiliate.id);
                        setWalletAction('withdrawal');
                        setShowWalletModal(true);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-green-600 text-white text-xs hover:bg-green-700 flex items-center justify-center gap-1"
                    >
                      <Wallet size={14} />
                      برداشت
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedAffiliate(affiliate.id);
                        setWalletAction('expense');
                        setShowWalletModal(true);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-700 flex items-center justify-center gap-1"
                    >
                      <ShoppingCart size={14} />
                      خرج
                    </button>
                    <button 
                      onClick={() => openEdit(affiliate)}
                      className="px-3 py-2 rounded-lg bg-gray-600 text-white text-xs hover:bg-gray-700"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => setAffiliates(affiliates.filter(x => x.id !== affiliate.id))}
                      className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs hover:bg-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAffiliates.length === 0 && (
            <div className="text-center py-12">
              <Users size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
              <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>همکاری ثبت نشده است</p>
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
                <tr>
                  <th className="text-right p-3">همکار</th>
                  <th className="text-right p-3">مشتری</th>
                  <th className="text-right p-3">نوع سفارش</th>
                  <th className="text-right p-3">مبلغ سفارش</th>
                  <th className="text-right p-3">پورسانت</th>
                  <th className="text-right p-3">وضعیت</th>
                  <th className="text-right p-3">تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {affiliateOrders.map(order => {
                  const affiliate = affiliates.find(a => a.id === order.affiliateId);
                  return (
                    <tr key={order.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                      <td className="p-3 font-medium">{affiliate?.name || '-'}</td>
                      <td className="p-3">{order.customerName}</td>
                      <td className="p-3">{order.orderType}</td>
                      <td className="p-3">{order.orderAmount.toLocaleString('fa-IR')} ت</td>
                      <td className="p-3 text-green-600 font-bold">{order.commissionAmount.toLocaleString('fa-IR')} ت</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          order.status === 'completed' ? 'bg-green-100 text-green-700' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {order.status === 'completed' ? 'تکمیل شده' : order.status === 'pending' ? 'در انتظار' : 'لغو شده'}
                        </span>
                      </td>
                      <td className="p-3 text-xs">{new Date(order.createdAt).toLocaleDateString('fa-IR')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {affiliateOrders.length === 0 && (
            <p className="text-center py-8 text-sm text-slate-400">سفارشی ثبت نشده است</p>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
                <tr>
                  <th className="text-right p-3">همکار</th>
                  <th className="text-right p-3">نوع</th>
                  <th className="text-right p-3">مبلغ</th>
                  <th className="text-right p-3">توضیحات</th>
                  <th className="text-right p-3">وضعیت</th>
                  <th className="text-right p-3">تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {affiliateTransactions.map(trans => {
                  const affiliate = affiliates.find(a => a.id === trans.affiliateId);
                  return (
                    <tr key={trans.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                      <td className="p-3 font-medium">{affiliate?.name || '-'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          trans.type === 'commission' ? 'bg-green-100 text-green-700' :
                          trans.type === 'withdrawal' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {trans.type === 'commission' ? 'پورسانت' : trans.type === 'withdrawal' ? 'برداشت' : 'خرج'}
                        </span>
                      </td>
                      <td className="p-3 font-bold">{trans.amount.toLocaleString('fa-IR')} ت</td>
                      <td className="p-3 text-xs">{trans.description}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          trans.status === 'completed' ? 'bg-green-100 text-green-700' :
                          trans.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {trans.status === 'completed' ? 'تکمیل شده' : trans.status === 'pending' ? 'در انتظار' : 'رد شده'}
                        </span>
                      </td>
                      <td className="p-3 text-xs">{new Date(trans.createdAt).toLocaleDateString('fa-IR')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {affiliateTransactions.length === 0 && (
            <p className="text-center py-8 text-sm text-slate-400">تراکنشی ثبت نشده است</p>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h3 className="text-lg font-bold mb-4">خروجی گزارش‌ها</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  const headers = ['نام', 'تلفن', 'کد ارجاع', 'نرخ پورسانت', 'موجودی کیف پول', 'کل درآمد', 'تعداد سفارشات'];
                  const rows = affiliates.map(a => [
                    a.name,
                    a.phone,
                    a.referralCode,
                    a.commissionRate + '%',
                    a.walletBalance.toLocaleString('fa-IR'),
                    a.totalEarnings.toLocaleString('fa-IR'),
                    getAffiliateStats(a.id).totalOrders.toString()
                  ]);
                  exportToExcel('affiliates-report', headers, rows, 'گزارش همکاران');
                }}
                className={`p-4 rounded-lg border text-right ${darkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Download size={20} className="text-purple-600" />
                  <span className="font-bold">گزارش همکاران</span>
                </div>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>خروجی اکسل از لیست همکاران</p>
              </button>

              <button 
                onClick={() => {
                  const headers = ['همکار', 'مشتری', 'نوع سفارش', 'مبلغ', 'پورسانت', 'وضعیت', 'تاریخ'];
                  const rows = affiliateOrders.map(o => {
                    const affiliate = affiliates.find(a => a.id === o.affiliateId);
                    return [
                      affiliate?.name || '-',
                      o.customerName,
                      o.orderType,
                      o.orderAmount.toLocaleString('fa-IR'),
                      o.commissionAmount.toLocaleString('fa-IR'),
                      o.status,
                      new Date(o.createdAt).toLocaleDateString('fa-IR')
                    ];
                  });
                  exportToExcel('affiliate-orders-report', headers, rows, 'گزارش سفارشات همکاران');
                }}
                className={`p-4 rounded-lg border text-right ${darkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <ShoppingCart size={20} className="text-blue-600" />
                  <span className="font-bold">گزارش سفارشات</span>
                </div>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>خروجی اکسل از سفارشات همکاران</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Affiliate Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className={`w-full max-w-md p-6 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editId ? 'ویرایش همکار' : 'همکار جدید'}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="نام *" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <input type="text" placeholder="تلفن *" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <input type="email" placeholder="ایمیل" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              {!editId && (
                <div>
                  <label className="text-sm font-medium block mb-1">کد ارجاع</label>
                  <input type="text" value={form.referralCode || ''} readOnly
                    className={`w-full px-3 py-2 rounded-lg border font-mono ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                </div>
              )}
              <div>
                <label className="text-sm font-medium block mb-1">نرخ پورسانت (%)</label>
                <input type="number" value={form.commissionRate || ''} onChange={e => setForm({...form, commissionRate: Number(e.target.value)})}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                <option value="active">فعال</option>
                <option value="inactive">غیرفعال</option>
                <option value="pending">در انتظار</option>
              </select>
              <textarea placeholder="یادداشت" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <button onClick={save} className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:shadow-lg">ذخیره</button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Action Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowWalletModal(false)}>
          <div className={`w-full max-w-md p-6 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                {walletAction === 'withdrawal' ? 'برداشت از کیف پول' : 'خرج از کیف پول'}
              </h3>
              <button onClick={() => setShowWalletModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">مبلغ (تومان)</label>
                <input type="number" value={walletAmount || ''} onChange={e => setWalletAmount(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">توضیحات</label>
                <textarea value={walletDescription} onChange={e => setWalletDescription(e.target.value)} rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <button onClick={handleWalletAction} className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:shadow-lg">
                {walletAction === 'withdrawal' ? 'برداشت' : 'ثبت خرج'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
