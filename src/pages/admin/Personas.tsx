import React, { useState } from 'react';
import { useApp, Persona } from '../../store';
import { 
  Users, Plus, X, Edit, Trash2, Eye, UserCheck, 
  TrendingUp, DollarSign, Heart, Target, MessageCircle
} from 'lucide-react';

export default function AdminPersonas() {
  const { darkMode, personas, setPersonas, users } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  
  const [form, setForm] = useState<Partial<Persona>>({
    name: '',
    avatar: '👤',
    tagline: '',
    demographics: {
      ageRange: '',
      gender: 'mixed',
      location: '',
      education: '',
      occupation: '',
      incomeLevel: 'medium'
    },
    psychographics: {
      personality: [],
      values: [],
      interests: [],
      lifestyle: ''
    },
    behavior: {
      buyingHabits: '',
      preferredChannels: [],
      decisionFactors: [],
      painPoints: [],
      goals: []
    },
    services: {
      primaryServices: [],
      frequency: 'monthly',
      avgSpending: 0,
      preferredPayment: ''
    },
    scenario: {
      typicalDay: '',
      challenges: [],
      solutions: [],
      touchpoints: []
    },
    quote: '',
    notes: ''
  });

  const openNew = () => {
    setForm({
      name: '',
      avatar: '👤',
      tagline: '',
      demographics: {
        ageRange: '',
        gender: 'mixed',
        location: '',
        education: '',
        occupation: '',
        incomeLevel: 'medium'
      },
      psychographics: {
        personality: [],
        values: [],
        interests: [],
        lifestyle: ''
      },
      behavior: {
        buyingHabits: '',
        preferredChannels: [],
        decisionFactors: [],
        painPoints: [],
        goals: []
      },
      services: {
        primaryServices: [],
        frequency: 'monthly',
        avgSpending: 0,
        preferredPayment: ''
      },
      scenario: {
        typicalDay: '',
        challenges: [],
        solutions: [],
        touchpoints: []
      },
      quote: '',
      notes: ''
    });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (persona: Persona) => {
    setForm(persona);
    setEditId(persona.id);
    setShowForm(true);
  };

  const save = () => {
    const now = new Date().toISOString();
    if (editId) {
      setPersonas(personas.map(p => p.id === editId ? { ...p, ...form, updatedAt: now } as Persona : p));
    } else {
      setPersonas([...personas, { ...form, id: 'persona' + Date.now(), createdAt: now, updatedAt: now } as Persona]);
    }
    setShowForm(false);
  };

  const getCustomersWithPersona = (personaId: string) => {
    return users.filter(u => u.role === 'customer' && u.personaIds?.includes(personaId));
  };

  const avatarOptions = ['👤', '👨', '👩', '👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓', '👴', '👵', '🧑', '👦', '👧', '🎓', '💼', '🏢', '🛒', '🎮', '🎨', '🎵', '📱'];

  const incomeLabels: Record<string, string> = {
    low: 'کم',
    medium: 'متوسط',
    high: 'بالا',
    'very-high': 'خیلی بالا'
  };

  const frequencyLabels: Record<string, string> = {
    daily: 'روزانه',
    weekly: 'هفتگی',
    monthly: 'ماهانه',
    occasionally: 'گاهی اوقات'
  };

  const genderLabels: Record<string, string> = {
    male: 'مرد',
    female: 'زن',
    mixed: 'ترکیبی'
  };

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
              <Users size={28} className="text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              مدیریت پرسونای مخاطب
            </span>
          </h1>
          <p className={`text-sm mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            تعریف و مدیریت پرسوناهای مخاطبان هدف
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
            <button 
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-purple-600 text-white' : darkMode ? 'bg-slate-800' : 'bg-white'}`}
            >
              شبکه‌ای
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-purple-600 text-white' : darkMode ? 'bg-slate-800' : 'bg-white'}`}
            >
              لیست
            </button>
          </div>
          <button 
            onClick={openNew}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            پرسونای جدید
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <Users size={20} className="text-purple-600 mb-2" />
          <div className="text-2xl font-bold">{personas.length}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کل پرسوناها</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <UserCheck size={20} className="text-blue-600 mb-2" />
          <div className="text-2xl font-bold">
            {users.filter(u => u.role === 'customer' && u.personaIds && u.personaIds.length > 0).length}
          </div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>مشتریان با پرسونا</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <DollarSign size={20} className="text-green-600 mb-2" />
          <div className="text-2xl font-bold">
            {Math.round(personas.reduce((sum, p) => sum + (p.services.avgSpending || 0), 0) / (personas.length || 1)).toLocaleString('fa-IR')}
          </div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>میانگین هزینه (تومان)</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <TrendingUp size={20} className="text-orange-600 mb-2" />
          <div className="text-2xl font-bold">{personas.filter(p => p.services.frequency === 'daily' || p.services.frequency === 'weekly').length}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>پرسوناهای فعال</div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas.map(persona => {
            const customers = getCustomersWithPersona(persona.id);
            return (
              <div 
                key={persona.id}
                className={`p-5 rounded-xl border transition-all hover:shadow-xl cursor-pointer ${
                  darkMode ? 'bg-slate-800 border-slate-700 hover:border-purple-500' : 'bg-white border-gray-200 hover:border-purple-300'
                }`}
                onClick={() => setSelectedPersona(persona.id)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{persona.avatar}</div>
                    <div>
                      <h3 className="font-bold text-lg">{persona.name}</h3>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {persona.demographics.ageRange} سال | {persona.demographics.occupation}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEdit(persona); }}
                      className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setPersonas(personas.filter(p => p.id !== persona.id)); }}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Tagline */}
                <p className={`text-sm mb-3 italic ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  "{persona.tagline}"
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className={`p-2 rounded-lg text-center ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                    <div className="text-xs text-slate-400">مشتریان</div>
                    <div className="font-bold text-blue-600">{customers.length}</div>
                  </div>
                  <div className={`p-2 rounded-lg text-center ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                    <div className="text-xs text-slate-400">تکرار</div>
                    <div className="font-bold text-green-600">{frequencyLabels[persona.services.frequency]}</div>
                  </div>
                  <div className={`p-2 rounded-lg text-center ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                    <div className="text-xs text-slate-400">میانگین</div>
                    <div className="font-bold text-purple-600">{persona.services.avgSpending.toLocaleString('fa-IR')}</div>
                  </div>
                </div>

                {/* Services */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {persona.services.primaryServices.slice(0, 3).map((service, idx) => (
                    <span key={idx} className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                      {service}
                    </span>
                  ))}
                  {persona.services.primaryServices.length > 3 && (
                    <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>
                      +{persona.services.primaryServices.length - 3}
                    </span>
                  )}
                </div>

                {/* Quote */}
                {persona.quote && (
                  <div className={`p-2 rounded-lg text-xs italic ${darkMode ? 'bg-slate-700/50 text-slate-300' : 'bg-gray-50 text-slate-600'}`}>
                    "{persona.quote}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
                <tr>
                  <th className="text-right p-3">پرسونا</th>
                  <th className="text-right p-3">سن</th>
                  <th className="text-right p-3">شغل</th>
                  <th className="text-right p-3">درآمد</th>
                  <th className="text-right p-3">مشتریان</th>
                  <th className="text-right p-3">خدمات اصلی</th>
                  <th className="text-right p-3">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {personas.map(persona => {
                  const customers = getCustomersWithPersona(persona.id);
                  return (
                    <tr key={persona.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{persona.avatar}</span>
                          <div>
                            <p className="font-bold">{persona.name}</p>
                            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{persona.tagline}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">{persona.demographics.ageRange}</td>
                      <td className="p-3">{persona.demographics.occupation}</td>
                      <td className="p-3">{incomeLabels[persona.demographics.incomeLevel]}</td>
                      <td className="p-3 font-bold text-blue-600">{customers.length}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {persona.services.primaryServices.slice(0, 2).map((service, idx) => (
                            <span key={idx} className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                              {service}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 flex gap-2">
                        <button onClick={() => setSelectedPersona(persona.id)} className="text-blue-600 text-xs hover:underline">مشاهده</button>
                        <button onClick={() => openEdit(persona)} className="text-green-600 text-xs hover:underline">ویرایش</button>
                        <button onClick={() => setPersonas(personas.filter(p => p.id !== persona.id))} className="text-red-500 text-xs hover:underline">حذف</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {personas.length === 0 && (
        <div className="text-center py-12">
          <Users size={48} className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
          <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>پرسونایی تعریف نشده است</p>
        </div>
      )}

      {/* Persona Detail Modal */}
      {selectedPersona && (() => {
        const persona = personas.find(p => p.id === selectedPersona);
        if (!persona) return null;
        const customers = getCustomersWithPersona(persona.id);
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedPersona(null)}>
            <div 
              className={`w-full max-w-4xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`} 
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{persona.avatar}</div>
                  <div>
                    <h2 className="text-2xl font-bold">{persona.name}</h2>
                    <p className={`text-sm italic ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{persona.tagline}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedPersona(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                  <X size={20} />
                </button>
              </div>

              {/* Quote */}
              {persona.quote && (
                <div className={`p-4 rounded-xl mb-6 ${darkMode ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50 border border-purple-200'}`}>
                  <MessageCircle size={20} className="text-purple-600 mb-2" />
                  <p className="text-lg italic">"{persona.quote}"</p>
                </div>
              )}

              {/* Tabs Content */}
              <div className="space-y-6">
                {/* Demographics */}
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Users size={18} className="text-blue-600" />
                    مشخصات جمعیت‌شناختی
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>سن</p>
                      <p className="font-bold">{persona.demographics.ageRange}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>جنسیت</p>
                      <p className="font-bold">{genderLabels[persona.demographics.gender]}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>موقعیت</p>
                      <p className="font-bold">{persona.demographics.location}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>تحصیلات</p>
                      <p className="font-bold">{persona.demographics.education}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>شغل</p>
                      <p className="font-bold">{persona.demographics.occupation}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>درآمد</p>
                      <p className="font-bold">{incomeLabels[persona.demographics.incomeLevel]}</p>
                    </div>
                  </div>
                </div>

                {/* Psychographics */}
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Heart size={18} className="text-pink-600" />
                    روان‌شناختی
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className={`text-xs mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>شخصیت</p>
                      <div className="flex flex-wrap gap-1">
                        {persona.psychographics.personality.map((item, idx) => (
                          <span key={idx} className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-pink-900/30 text-pink-300' : 'bg-pink-100 text-pink-700'}`}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className={`text-xs mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>ارزش‌ها</p>
                      <div className="flex flex-wrap gap-1">
                        {persona.psychographics.values.map((item, idx) => (
                          <span key={idx} className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className={`text-xs mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>علایق</p>
                      <div className="flex flex-wrap gap-1">
                        {persona.psychographics.interests.map((item, idx) => (
                          <span key={idx} className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className={`text-xs mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>سبک زندگی</p>
                      <p className="text-sm">{persona.psychographics.lifestyle}</p>
                    </div>
                  </div>
                </div>

                {/* Behavior */}
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Target size={18} className="text-orange-600" />
                    رفتار و عادات
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className={`text-xs mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>عادات خرید</p>
                      <p className="text-sm">{persona.behavior.buyingHabits}</p>
                    </div>
                    <div>
                      <p className={`text-xs mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کانال‌های ترجیحی</p>
                      <div className="flex flex-wrap gap-1">
                        {persona.behavior.preferredChannels.map((item, idx) => (
                          <span key={idx} className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className={`text-xs mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>نقاط درد</p>
                      <div className="flex flex-wrap gap-1">
                        {persona.behavior.painPoints.map((item, idx) => (
                          <span key={idx} className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'}`}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className={`text-xs mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>اهداف</p>
                      <div className="flex flex-wrap gap-1">
                        {persona.behavior.goals.map((item, idx) => (
                          <span key={idx} className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'}`}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <DollarSign size={18} className="text-green-600" />
                    خدمات و هزینه
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className={`text-xs mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>خدمات اصلی</p>
                      <div className="flex flex-wrap gap-1">
                        {persona.services.primaryServices.map((item, idx) => (
                          <span key={idx} className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'}`}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className={`text-xs mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>تکرار خرید</p>
                      <p className="font-bold">{frequencyLabels[persona.services.frequency]}</p>
                    </div>
                    <div>
                      <p className={`text-xs mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>میانگین هزینه</p>
                      <p className="font-bold text-green-600">{persona.services.avgSpending.toLocaleString('fa-IR')} تومان</p>
                    </div>
                    <div>
                      <p className={`text-xs mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>روش پرداخت</p>
                      <p className="font-bold">{persona.services.preferredPayment}</p>
                    </div>
                  </div>
                </div>

                {/* Customers */}
                {customers.length > 0 && (
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <UserCheck size={18} className="text-blue-600" />
                      مشتریان با این پرسونا ({customers.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {customers.map(customer => (
                        <div key={customer.id} className={`p-3 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                          <p className="font-bold text-sm">{customer.name}</p>
                          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{customer.phone}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {persona.notes && (
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <h3 className="font-bold mb-2">یادداشت‌ها</h3>
                    <p className="text-sm">{persona.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <button 
                  onClick={() => { setSelectedPersona(null); openEdit(persona); }}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
                >
                  ویرایش
                </button>
                <button 
                  onClick={() => setSelectedPersona(null)}
                  className={`flex-1 py-2.5 rounded-lg border ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div 
            className={`w-full max-w-3xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`} 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editId ? 'ویرایش پرسونا' : 'ایجاد پرسونای جدید'}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            
            <div className="space-y-4">
              {/* Basic Info */}
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <h4 className="font-bold mb-3">اطلاعات پایه</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">نام پرسونا *</label>
                    <input 
                      type="text" 
                      value={form.name} 
                      onChange={e => setForm({...form, name: e.target.value})}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                      placeholder="مثال: دانشجوی فعال"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">آواتار</label>
                    <div className="flex flex-wrap gap-2">
                      {avatarOptions.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setForm({...form, avatar: emoji})}
                          className={`text-2xl p-2 rounded-lg ${form.avatar === emoji ? 'bg-blue-600' : darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-white hover:bg-gray-100'}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium block mb-1">شعار کوتاه</label>
                    <input 
                      type="text" 
                      value={form.tagline} 
                      onChange={e => setForm({...form, tagline: e.target.value})}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                      placeholder="مثال: دنبال خدمات سریع و ارزان"
                    />
                  </div>
                </div>
              </div>

              {/* Demographics */}
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <h4 className="font-bold mb-3">مشخصات جمعیت‌شناختی</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">محدوده سنی</label>
                    <input 
                      type="text" 
                      value={form.demographics?.ageRange || ''} 
                      onChange={e => setForm({...form, demographics: {...form.demographics!, ageRange: e.target.value}})}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                      placeholder="مثال: 25-35"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">جنسیت</label>
                    <select 
                      value={form.demographics?.gender || 'mixed'} 
                      onChange={e => setForm({...form, demographics: {...form.demographics!, gender: e.target.value as any}})}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                    >
                      <option value="male">مرد</option>
                      <option value="female">زن</option>
                      <option value="mixed">ترکیبی</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">موقعیت جغرافیایی</label>
                    <input 
                      type="text" 
                      value={form.demographics?.location || ''} 
                      onChange={e => setForm({...form, demographics: {...form.demographics!, location: e.target.value}})}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                      placeholder="مثال: تهران"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">تحصیلات</label>
                    <input 
                      type="text" 
                      value={form.demographics?.education || ''} 
                      onChange={e => setForm({...form, demographics: {...form.demographics!, education: e.target.value}})}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                      placeholder="مثال: لیسانس"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">شغل</label>
                    <input 
                      type="text" 
                      value={form.demographics?.occupation || ''} 
                      onChange={e => setForm({...form, demographics: {...form.demographics!, occupation: e.target.value}})}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                      placeholder="مثال: دانشجو"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">سطح درآمد</label>
                    <select 
                      value={form.demographics?.incomeLevel || 'medium'} 
                      onChange={e => setForm({...form, demographics: {...form.demographics!, incomeLevel: e.target.value as any}})}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                    >
                      <option value="low">کم</option>
                      <option value="medium">متوسط</option>
                      <option value="high">بالا</option>
                      <option value="very-high">خیلی بالا</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Psychographics */}
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <h4 className="font-bold mb-3">روان‌شناختی</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">ویژگی‌های شخصیتی (با کاما جدا کنید)</label>
                    <input 
                      type="text" 
                      value={(form.psychographics?.personality || []).join(', ')} 
                      onChange={e => setForm({...form, psychographics: {...form.psychographics!, personality: e.target.value.split(',').map(s => s.trim()).filter(s => s)}})}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                      placeholder="مثال: کنجکاو, صرفه‌جو"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">ارزش‌ها (با کاما جدا کنید)</label>
                    <input 
                      type="text" 
                      value={(form.psychographics?.values || []).join(', ')} 
                      onChange={e => setForm({...form, psychographics: {...form.psychographics!, values: e.target.value.split(',').map(s => s.trim()).filter(s => s)}})}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                      placeholder="مثال: سرعت, کیفیت"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">علایق (با کاما جدا کنید)</label>
                    <input 
                      type="text" 
                      value={(form.psychographics?.interests || []).join(', ')} 
                      onChange={e => setForm({...form, psychographics: {...form.psychographics!, interests: e.target.value.split(',').map(s => s.trim()).filter(s => s)}})}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                      placeholder="مثال: تکنولوژی, فیلم"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">سبک زندگی</label>
                    <textarea 
                      value={form.psychographics?.lifestyle || ''} 
                      onChange={e => setForm({...form, psychographics: {...form.psychographics!, lifestyle: e.target.value}})}
                      rows={2}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                      placeholder="توضیح سبک زندگی..."
                    />
                  </div>
                </div>
              </div>

              {/* Behavior */}
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <h4 className="font-bold mb-3">رفتار و عادات</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">عادات خرید</label>
                    <textarea 
                      value={form.behavior?.buyingHabits || ''} 
                      onChange={e => setForm({...form, behavior: {...form.behavior!, buyingHabits: e.target.value}})}
                      rows={2}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                      placeholder="توضیح عادات خرید..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">کانال‌های ترجیحی (با کاما جدا کنید)</label>
                    <input 
                      type="text" 
                      value={(form.behavior?.preferredChannels || []).join(', ')} 
                      onChange={e => setForm({...form, behavior: {...form.behavior!, preferredChannels: e.target.value.split(',').map(s => s.trim()).filter(s => s)}})}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                      placeholder="مثال: اینستاگرام, تلگرام"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">عوامل تصمیم‌گیری (با کاما جدا کنید)</label>
                    <input 
                      type="text" 
                      value={(form.behavior?.decisionFactors || []).join(', ')} 
                      onChange={e => setForm({...form, behavior: {...form.behavior!, decisionFactors: e.target.value.split(',').map(s => s.trim()).filter(s => s)}})}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                      placeholder="مثال: قیمت, کیفیت"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">نقاط درد (با کاما جدا کنید)</label>
                    <input 
                      type="text" 
                      value={(form.behavior?.painPoints || []).join(', ')} 
                      onChange={e => setForm({...form, behavior: {...form.behavior!, painPoints: e.target.value.split(',').map(s => s.trim()).filter(s => s)}})}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                      placeholder="مثال: بودجه محدود, کمبود وقت"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">اهداف (با کاما جدا کنید)</label>
                    <input 
                      type="text" 
                      value={(form.behavior?.goals || []).join(', ')} 
                      onChange={e => setForm({...form, behavior: {...form.behavior!, goals: e.target.value.split(',').map(s => s.trim()).filter(s => s)}})}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                      placeholder="مثال: یادگیری, ارتقای شغلی"
                    />
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <h4 className="font-bold mb-3">خدمات و هزینه</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium block mb-1">خدمات اصلی (با کاما جدا کنید)</label>
                    <input 
                      type="text" 
                      value={(form.services?.primaryServices || []).join(', ')} 
                      onChange={e => setForm({...form, services: {...form.services!, primaryServices: e.target.value.split(',').map(s => s.trim()).filter(s => s)}})}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                      placeholder="مثال: پرینت, ترجمه"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">تکرار خرید</label>
                    <select 
                      value={form.services?.frequency || 'monthly'} 
                      onChange={e => setForm({...form, services: {...form.services!, frequency: e.target.value as any}})}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                    >
                      <option value="daily">روزانه</option>
                      <option value="weekly">هفتگی</option>
                      <option value="monthly">ماهانه</option>
                      <option value="occasionally">گاهی اوقات</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">میانگین هزینه (تومان)</label>
                    <input 
                      type="number" 
                      value={form.services?.avgSpending || ''} 
                      onChange={e => setForm({...form, services: {...form.services!, avgSpending: Number(e.target.value)}})}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium block mb-1">روش پرداخت ترجیحی</label>
                    <input 
                      type="text" 
                      value={form.services?.preferredPayment || ''} 
                      onChange={e => setForm({...form, services: {...form.services!, preferredPayment: e.target.value}})}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                      placeholder="مثال: کارت به کارت"
                    />
                  </div>
                </div>
              </div>

              {/* Scenario */}
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <h4 className="font-bold mb-3">سناریو</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">یک روز معمولی</label>
                    <textarea 
                      value={form.scenario?.typicalDay || ''} 
                      onChange={e => setForm({...form, scenario: {...form.scenario!, typicalDay: e.target.value}})}
                      rows={2}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                      placeholder="توضیح یک روز معمولی..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">چالش‌ها (با کاما جدا کنید)</label>
                    <input 
                      type="text" 
                      value={(form.scenario?.challenges || []).join(', ')} 
                      onChange={e => setForm({...form, scenario: {...form.scenario!, challenges: e.target.value.split(',').map(s => s.trim()).filter(s => s)}})}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                      placeholder="مثال: بودجه محدود, کمبود وقت"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">راه‌حل‌های ما (با کاما جدا کنید)</label>
                    <input 
                      type="text" 
                      value={(form.scenario?.solutions || []).join(', ')} 
                      onChange={e => setForm({...form, scenario: {...form.scenario!, solutions: e.target.value.split(',').map(s => s.trim()).filter(s => s)}})}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                      placeholder="مثال: قیمت‌های ویژه, خدمات سریع"
                    />
                  </div>
                </div>
              </div>

              {/* Quote & Notes */}
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <h4 className="font-bold mb-3">نقل قول و یادداشت‌ها</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">نقل قول نمونه</label>
                    <textarea 
                      value={form.quote || ''} 
                      onChange={e => setForm({...form, quote: e.target.value})}
                      rows={2}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                      placeholder="مثال: من به دنبال خدماتی هستم که..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">یادداشت‌ها</label>
                    <textarea 
                      value={form.notes || ''} 
                      onChange={e => setForm({...form, notes: e.target.value})}
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                      placeholder="یادداشت‌های اضافی..."
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={save} 
                className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:shadow-lg"
              >
                {editId ? 'بروزرسانی پرسونا' : 'ایجاد پرسونا'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
