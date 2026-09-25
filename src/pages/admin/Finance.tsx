import React, { useState } from 'react';
import { useApp, Expense } from '../../store';
import { Plus, X, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

export default function AdminFinance() {
  const { darkMode, expenses, setExpenses, orders } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Expense>>({ title: '', category: 'متفرقه', amount: 0, date: new Date().toISOString().split('T')[0], description: '' });

  const totalIncome = orders.reduce((s, o) => s + o.paid, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalIncome - totalExpense;

  const categories = ['اجاره', 'اینترنت', 'برق', 'حقوق', 'خرید کالا', 'دامنه/هاست', 'تعمیرات', 'متفرقه'];

  const save = () => {
    setExpenses([...expenses, { ...form, id: 'e' + Date.now() } as Expense]);
    setShowForm(false);
    setForm({ title: '', category: 'متفرقه', amount: 0, date: new Date().toISOString().split('T')[0], description: '' });
  };

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">حسابداری و مالی</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> ثبت هزینه
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={20} className="text-green-500" />
            <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>درآمد کل</span>
          </div>
          <div className="text-xl font-bold text-green-600">{totalIncome.toLocaleString('fa-IR')} تومان</div>
        </div>
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown size={20} className="text-red-500" />
            <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>هزینه‌ها</span>
          </div>
          <div className="text-xl font-bold text-red-600">{totalExpense.toLocaleString('fa-IR')} تومان</div>
        </div>
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={20} className="text-blue-500" />
            <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>سود خالص</span>
          </div>
          <div className={`text-xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{profit.toLocaleString('fa-IR')} تومان</div>
        </div>
      </div>

      {/* Expenses by Category */}
      <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <h3 className="font-bold mb-4">هزینه‌ها به تفکیک دسته</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categories.map(cat => {
            const catTotal = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
            return (
              <div key={cat} className={`p-3 rounded-lg text-center ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <div className="text-xs text-slate-400 mb-1">{cat}</div>
                <div className="font-bold text-sm">{catTotal.toLocaleString('fa-IR')}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expenses List */}
      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
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
            {expenses.map(e => (
              <tr key={e.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                <td className="p-3">{e.title}</td>
                <td className="p-3">{e.category}</td>
                <td className="p-3 text-red-500">{e.amount.toLocaleString('fa-IR')}</td>
                <td className="p-3 text-xs">{e.date}</td>
                <td className="p-3">
                  <button onClick={() => setExpenses(expenses.filter(x => x.id !== e.id))} className="text-red-500 text-xs hover:underline">حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && <p className="text-center py-8 text-sm text-slate-400">هزینه‌ای ثبت نشده</p>}
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
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
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
