import React, { useState, useMemo } from 'react';
import { useApp, Expense } from '../../store';
import { Plus, X, DollarSign, TrendingUp, TrendingDown, Calendar, Filter, Download, PieChart, BarChart3 } from 'lucide-react';
import { exportToExcel } from '../../utils/export';
import JalaliDatePicker from '../../components/JalaliDatePicker';
import { toJalaliString } from '../../utils/jalali';

export default function AdminFinance() {
  const { darkMode, expenses, setExpenses, orders } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [form, setForm] = useState<Partial<Expense>>({ title: '', category: 'متفرقه', amount: 0, date: new Date().toISOString().split('T')[0], description: '' });
  const defaultDate = new Date().toISOString().split('T')[0];

  const categories = ['اجاره', 'اینترنت', 'برق', 'حقوق', 'خرید کالا', 'دامنه/هاست', 'تعمیرات', 'مالیات', 'بیمه', 'تبلیغات', 'متفرقه'];

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (filter !== 'all' && e.category !== filter) return false;
      if (dateRange.from && new Date(e.date) < new Date(dateRange.from)) return false;
      if (dateRange.to && new Date(e.date) > new Date(dateRange.to)) return false;
      return true;
    });
  }, [expenses, filter, dateRange]);

  const totalIncome = orders.reduce((s, o) => s + o.paid, 0);
  const totalExpense = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalIncome - totalExpense;

  // آمار به تفکیک دسته
  const expensesByCategory = useMemo(() => {
    const result: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      result[e.category] = (result[e.category] || 0) + e.amount;
    });
    return Object.entries(result).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  // درآمد به تفکیک جریان
  const incomeByType = useMemo(() => ({
    service: orders.filter(o => o.type === 'service').reduce((s, o) => s + o.paid, 0),
    media: orders.filter(o => o.type === 'media').reduce((s, o) => s + o.paid, 0),
    product: orders.filter(o => o.type === 'product').reduce((s, o) => s + o.paid, 0),
    webdesign: orders.filter(o => o.type === 'webdesign').reduce((s, o) => s + o.paid, 0),
  }), [orders]);

  // آمار ماهانه
  const monthlyStats = useMemo(() => {
    const months: Record<string, { income: number; expense: number }> = {};
    orders.forEach(o => {
      const month = new Date(o.createdAt).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' });
      if (!months[month]) months[month] = { income: 0, expense: 0 };
      months[month].income += o.paid;
    });
    expenses.forEach(e => {
      const month = new Date(e.date).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' });
      if (!months[month]) months[month] = { income: 0, expense: 0 };
      months[month].expense += e.amount;
    });
    return Object.entries(months).slice(-6).reverse();
  }, [orders, expenses]);

  const save = () => {
    setExpenses([...expenses, { ...form, id: 'e' + Date.now() } as Expense]);
    setShowForm(false);
    setForm({ title: '', category: 'متفرقه', amount: 0, date: new Date().toISOString().split('T')[0], description: '' });
  };

  const exportReport = () => {
    const headers = ['تاریخ', 'دسته', 'عنوان', 'مبلغ (تومان)', 'توضیحات'];
    const rows = filteredExpenses.map(e => [
      e.date,
      e.category,
      e.title,
      e.amount.toLocaleString('fa-IR'),
      e.description || ''
    ]);
    exportToExcel('finance-report', headers, rows, 'گزارش مالی');
  };

  const maxExpense = Math.max(...expensesByCategory.map(([, v]) => v), 1);

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">حسابداری و مالی</h1>
        <div className="flex gap-2">
          <button onClick={exportReport} className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 flex items-center gap-2">
            <Download size={16} /> خروجی گزارش
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> ثبت هزینه
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <TrendingUp size={20} className="text-green-500" />
            </div>
          </div>
          <div className="text-xl font-bold text-green-600">{totalIncome.toLocaleString('fa-IR')}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>درآمد کل (تومان)</div>
        </div>
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <TrendingDown size={20} className="text-red-500" />
            </div>
          </div>
          <div className="text-xl font-bold text-red-600">{totalExpense.toLocaleString('fa-IR')}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>هزینه‌ها (تومان)</div>
        </div>
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <DollarSign size={20} className="text-blue-500" />
            </div>
          </div>
          <div className={`text-xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{profit.toLocaleString('fa-IR')}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>سود خالص (تومان)</div>
        </div>
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <PieChart size={20} className="text-purple-500" />
            </div>
          </div>
          <div className="text-xl font-bold text-purple-600">{totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0}%</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>نسبت هزینه به درآمد</div>
        </div>
      </div>

      {/* Income by Type */}
      <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 size={18} /> درآمد به تفکیک جریان</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'خدمات', value: incomeByType.service, color: 'bg-blue-500' },
            { label: 'کپی مدیا', value: incomeByType.media, color: 'bg-purple-500' },
            { label: 'فروش کالا', value: incomeByType.product, color: 'bg-green-500' },
            { label: 'طراحی سایت', value: incomeByType.webdesign, color: 'bg-orange-500' },
          ].map((item, i) => (
            <div key={i} className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
              <div className={`w-3 h-3 rounded-full ${item.color} mb-2`}></div>
              <div className="font-bold">{item.value.toLocaleString('fa-IR')}</div>
              <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Expenses by Category Chart */}
      <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <h3 className="font-bold mb-4 flex items-center gap-2"><PieChart size={18} /> هزینه‌ها به تفکیک دسته</h3>
        {expensesByCategory.length > 0 ? (
          <div className="space-y-3">
            {expensesByCategory.map(([cat, amount]) => (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{cat}</span>
                  <span className="font-bold">{amount.toLocaleString('fa-IR')} تومان</span>
                </div>
                <div className={`h-3 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                  <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${(amount / maxExpense) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-sm text-center py-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>هزینه‌ای ثبت نشده</p>
        )}
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
            <option value="all">همه دسته‌ها</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <JalaliDatePicker value={dateRange.from} onChange={date => setDateRange({...dateRange, from: date})}
            className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
          <JalaliDatePicker value={dateRange.to} onChange={date => setDateRange({...dateRange, to: date})}
            className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
        </div>
      </div>

      {/* Monthly Stats */}
      {monthlyStats.length > 0 && (
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold mb-4 flex items-center gap-2"><Calendar size={18} /> آمار ماهانه (۶ ماه اخیر)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
                <tr>
                  <th className="text-right p-3">ماه</th>
                  <th className="text-right p-3">درآمد</th>
                  <th className="text-right p-3">هزینه</th>
                  <th className="text-right p-3">سود/زیان</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStats.map(([month, data]) => (
                  <tr key={month} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                    <td className="p-3 font-medium">{month}</td>
                    <td className="p-3 text-green-600">{data.income.toLocaleString('fa-IR')}</td>
                    <td className="p-3 text-red-600">{data.expense.toLocaleString('fa-IR')}</td>
                    <td className={`p-3 font-bold ${data.income - data.expense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(data.income - data.expense).toLocaleString('fa-IR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
              <tr>
                <th className="text-right p-3">عنوان</th>
                <th className="text-right p-3">دسته</th>
                <th className="text-right p-3">مبلغ</th>
                <th className="text-right p-3">تاریخ</th>
                <th className="text-right p-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(e => (
                <tr key={e.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                  <td className="p-3">{e.title}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>
                      {e.category}
                    </span>
                  </td>
                  <td className="p-3 text-red-500 font-bold">{e.amount.toLocaleString('fa-IR')}</td>
                  <td className="p-3 text-xs">{toJalaliString(e.date)}</td>
                  <td className="p-3">
                    <button onClick={() => setExpenses(expenses.filter(x => x.id !== e.id))} className="text-red-500 text-xs hover:underline">حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredExpenses.length === 0 && <p className="text-center py-8 text-sm text-slate-400">هزینه‌ای یافت نشد</p>}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className={`w-full max-w-md p-6 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">ثبت هزینه جدید</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="عنوان هزینه" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
              <input type="number" placeholder="مبلغ (تومان)" value={form.amount || ''} onChange={e => setForm({...form, amount: Number(e.target.value)})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <JalaliDatePicker value={form.date || defaultDate} onChange={date => setForm({...form, date})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              <textarea placeholder="توضیحات" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} rows={2} />
              <button onClick={save} className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">ثبت هزینه</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
