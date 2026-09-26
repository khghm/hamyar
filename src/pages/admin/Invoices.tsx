import React, { useState } from 'react';
import { useApp, Invoice, InvoiceItem } from '../../store';
import { Plus, X, Edit, Trash2, Eye, Printer, FileText, Download, Search, Filter } from 'lucide-react';
import { printInvoice, exportToExcel } from '../../utils/export';
import JalaliDatePicker from '../../components/JalaliDatePicker';

export default function AdminInvoices() {
  const { darkMode, invoices, setInvoices, orders, products, services } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState<Partial<Invoice>>({
    invoiceNumber: '',
    type: 'service',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerNationalId: '',
    items: [{ name: '', quantity: 1, unit: 'عدد', price: 0 }],
    subtotal: 0,
    discount: 0,
    discountType: 'percent',
    discountAmount: 0,
    tax: 0,
    taxAmount: 0,
    total: 0,
    note: '',
    status: 'issued'
  });

  const typeLabels: Record<string, string> = {
    service: 'خدمات',
    product: 'محصولات',
    webdesign: 'طراحی سایت',
    combined: 'ترکیبی',
    media: 'مدیا'
  };

  const statusLabels: Record<string, string> = {
    draft: 'پیش‌نویس',
    issued: 'صادر شده',
    paid: 'پرداخت شده',
    cancelled: 'لغو شده'
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    issued: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  };

  const filtered = invoices.filter(inv => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    if (search && !inv.invoiceNumber.includes(search) && !inv.customerName.includes(search)) return false;
    return true;
  });

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const count = invoices.length + 1;
    return `INV-${year}${count.toString().padStart(4, '0')}`;
  };

  const calculateTotals = () => {
    const items = form.items || [];
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let discountAmount = 0;
    if (form.discountType === 'percent') {
      discountAmount = (subtotal * (form.discount || 0)) / 100;
    } else {
      discountAmount = form.discount || 0;
    }
    
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * (form.tax || 0)) / 100;
    const total = afterDiscount + taxAmount;
    
    setForm({
      ...form,
      subtotal,
      discountAmount,
      taxAmount,
      total
    });
  };

  const openNew = () => {
    setForm({
      invoiceNumber: generateInvoiceNumber(),
      type: 'service',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      customerNationalId: '',
      items: [{ name: '', quantity: 1, unit: 'عدد', price: 0 }],
      subtotal: 0,
      discount: 0,
      discountType: 'percent',
      discountAmount: 0,
      tax: 0,
      taxAmount: 0,
      total: 0,
      note: '',
      status: 'issued'
    });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (inv: Invoice) => {
    setForm(inv);
    setEditId(inv.id);
    setShowForm(true);
  };

  const save = () => {
    if (editId) {
      setInvoices(invoices.map(inv => inv.id === editId ? { ...inv, ...form } as Invoice : inv));
    } else {
      setInvoices([...invoices, { ...form, id: 'inv' + Date.now(), createdAt: new Date().toISOString() } as Invoice]);
    }
    setShowForm(false);
  };

  const addItem = () => {
    const items = form.items || [];
    setForm({ ...form, items: [...items, { name: '', quantity: 1, unit: 'عدد', price: 0 }] });
  };

  const removeItem = (index: number) => {
    const items = form.items || [];
    setForm({ ...form, items: items.filter((_, i) => i !== index) });
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const items = form.items || [];
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, items: updated });
  };

  const loadFromOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const items: InvoiceItem[] = order.items && order.items.length > 0 
      ? order.items.map((item: any) => ({
          name: item.name || 'آیتم سفارش',
          quantity: item.quantity || 1,
          unit: 'عدد',
          price: item.price || 0
        }))
      : [{ name: order.description || 'سفارش', quantity: 1, unit: 'مورد', price: order.total }];
    
    setForm({
      ...form,
      customerName: order.customerName,
      items,
      type: order.type as any
    });
  };

  const exportInvoices = () => {
    const headers = ['شماره فاکتور', 'تاریخ', 'مشتری', 'نوع', 'مبلغ کل', 'وضعیت'];
    const rows = filtered.map(inv => [
      inv.invoiceNumber,
      inv.date,
      inv.customerName,
      typeLabels[inv.type],
      inv.total.toLocaleString('fa-IR'),
      statusLabels[inv.status]
    ]);
    exportToExcel('invoices-report', headers, rows, 'گزارش فاکتورها');
  };

  const stats = {
    total: invoices.length,
    issued: invoices.filter(i => i.status === 'issued').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    totalAmount: invoices.reduce((s, i) => s + i.total, 0),
    paidAmount: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0),
    pendingAmount: invoices.filter(i => i.status === 'issued').reduce((s, i) => s + i.total, 0),
  };

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText size={28} className="text-blue-600" />
          مدیریت فاکتورها
        </h1>
        <div className="flex gap-2">
          <button onClick={exportInvoices} className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 flex items-center gap-2">
            <Download size={16} /> خروجی اکسل
          </button>
          <button onClick={openNew} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 flex items-center gap-2">
            <Plus size={16} /> فاکتور جدید
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کل فاکتورها</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-blue-600">{stats.issued}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>صادر شده</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>پرداخت شده</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold">{stats.totalAmount.toLocaleString('fa-IR')}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>مبلغ کل (تومان)</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-green-600">{stats.paidAmount.toLocaleString('fa-IR')}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>دریافتی (تومان)</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-orange-600">{stats.pendingAmount.toLocaleString('fa-IR')}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>معوق (تومان)</div>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="جستجوی شماره فاکتور یا نام مشتری..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className={`w-full pr-10 pl-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} 
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
            <option value="all">همه وضعیت‌ها</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Invoices List */}
      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
              <tr>
                <th className="text-right p-3">شماره فاکتور</th>
                <th className="text-right p-3">تاریخ</th>
                <th className="text-right p-3">مشتری</th>
                <th className="text-right p-3">نوع</th>
                <th className="text-right p-3">مبلغ کل</th>
                <th className="text-right p-3">وضعیت</th>
                <th className="text-right p-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                  <td className="p-3 font-mono text-xs">{inv.invoiceNumber}</td>
                  <td className="p-3">{inv.date}</td>
                  <td className="p-3 font-medium">{inv.customerName}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                      {typeLabels[inv.type]}
                    </span>
                  </td>
                  <td className="p-3 font-bold">{inv.total.toLocaleString('fa-IR')}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${statusColors[inv.status]}`}>
                      {statusLabels[inv.status]}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => printInvoice(inv)} className="text-blue-600 hover:underline text-xs flex items-center gap-1">
                      <Printer size={12} /> چاپ
                    </button>
                    <button onClick={() => openEdit(inv)} className="text-green-600 hover:underline text-xs">ویرایش</button>
                    <button onClick={() => setInvoices(invoices.filter(x => x.id !== inv.id))} className="text-red-500 hover:underline text-xs">حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-center py-8 text-sm text-slate-400">فاکتوری یافت نشد</p>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className={`w-full max-w-4xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editId ? 'ویرایش فاکتور' : 'صدور فاکتور جدید'}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            
            <div className="space-y-4">
              {/* Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">شماره فاکتور</label>
                  <input type="text" value={form.invoiceNumber} onChange={e => setForm({...form, invoiceNumber: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border font-mono ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">تاریخ صدور</label>
                  <JalaliDatePicker value={form.date || ''} onChange={date => setForm({...form, date})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">نوع فاکتور</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                    {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              {/* Customer Info */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <h4 className="font-bold mb-3">اطلاعات مشتری</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" placeholder="نام مشتری *" value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})}
                    className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`} />
                  <input type="text" placeholder="تلفن" value={form.customerPhone} onChange={e => setForm({...form, customerPhone: e.target.value})}
                    className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`} />
                  <input type="text" placeholder="کد ملی / شناسه ملی" value={form.customerNationalId} onChange={e => setForm({...form, customerNationalId: e.target.value})}
                    className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`} />
                  <JalaliDatePicker value={form.dueDate || ''} onChange={date => setForm({...form, dueDate: date})}
                    placeholder="مهلت پرداخت"
                    className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`} />
                  <input type="text" placeholder="آدرس" value={form.customerAddress} onChange={e => setForm({...form, customerAddress: e.target.value})}
                    className={`md:col-span-2 px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`} />
                </div>
              </div>

              {/* Load from Order */}
              {orders.length > 0 && (
                <div>
                  <label className="text-sm font-medium block mb-1">بارگذاری از سفارش (اختیاری)</label>
                  <select onChange={e => { if (e.target.value) loadFromOrder(e.target.value); e.target.value = ''; }}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                    <option value="">انتخاب سفارش...</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>{o.trackingCode} - {o.customerName}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold">اقلام فاکتور</h4>
                  <button onClick={addItem} className="text-blue-600 text-sm flex items-center gap-1 hover:underline">
                    <Plus size={14} /> افزودن آیتم
                  </button>
                </div>
                <div className="space-y-2">
                  {(form.items || []).map((item, idx) => (
                    <div key={idx} className={`p-3 rounded-lg grid grid-cols-12 gap-2 ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                      <input type="text" placeholder="شرح" value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)}
                        className={`col-span-5 px-2 py-1 rounded border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`} />
                      <input type="number" placeholder="تعداد" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                        className={`col-span-2 px-2 py-1 rounded border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`} />
                      <input type="text" placeholder="واحد" value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)}
                        className={`col-span-1 px-2 py-1 rounded border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`} />
                      <input type="number" placeholder="قیمت" value={item.price} onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                        className={`col-span-3 px-2 py-1 rounded border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`} />
                      <button onClick={() => removeItem(idx)} className="col-span-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                        <Trash2 size={16} className="mx-auto" />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={calculateTotals} className="mt-3 w-full py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700">
                  محاسبه مبالغ
                </button>
              </div>

              {/* Totals */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <h4 className="font-bold mb-3">محاسبات</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs block mb-1">جمع کل</label>
                    <input type="number" value={form.subtotal || 0} readOnly
                      className={`w-full px-3 py-2 rounded-lg border bg-gray-100 dark:bg-slate-600 ${darkMode ? 'border-slate-600 text-white' : 'border-gray-200'}`} />
                  </div>
                  <div>
                    <label className="text-xs block mb-1">تخفیف</label>
                    <div className="flex gap-1">
                      <input type="number" value={form.discount || 0} onChange={e => setForm({...form, discount: Number(e.target.value)})}
                        className={`flex-1 px-2 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`} />
                      <select value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value as any})}
                        className={`px-2 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}>
                        <option value="percent">%</option>
                        <option value="fixed">تومان</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs block mb-1">مالیات (%)</label>
                    <input type="number" value={form.tax || 0} onChange={e => setForm({...form, tax: Number(e.target.value)})}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`} />
                  </div>
                  <div>
                    <label className="text-xs block mb-1">مبلغ نهایی</label>
                    <input type="number" value={form.total || 0} readOnly
                      className={`w-full px-3 py-2 rounded-lg border bg-blue-100 dark:bg-blue-900/30 font-bold ${darkMode ? 'border-blue-600 text-blue-300' : 'border-blue-300 text-blue-700'}`} />
                  </div>
                </div>
              </div>

              {/* Status & Note */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">وضعیت</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                    {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">یادداشت</label>
                  <input type="text" value={form.note} onChange={e => setForm({...form, note: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={save} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">ذخیره فاکتور</button>
                <button onClick={() => { save(); setTimeout(() => printInvoice(form), 100); }} className="px-6 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 flex items-center gap-2">
                  <Printer size={16} /> ذخیره و چاپ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
