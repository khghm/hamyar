import React, { useState, useEffect, useRef } from 'react';
import { formatJalali, parseJalali, getJalaliMonthName } from '../utils/jalali';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useApp } from '../store';

interface JalaliDatePickerProps {
  value: string; // تاریخ میلادی به فرمت YYYY-MM-DD
  onChange: (date: string) => void; // تاریخ میلادی را برمی‌گرداند
  label?: string;
  className?: string;
  placeholder?: string;
}

export default function JalaliDatePicker({ value, onChange, label, className = '', placeholder = 'انتخاب تاریخ' }: JalaliDatePickerProps) {
  const { darkMode } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [currentJy, setCurrentJy] = useState(1403);
  const [currentJm, setCurrentJm] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // تبدیل تاریخ میلادی به شمسی هنگام تغییر value
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const jalaliStr = formatJalali(date);
        setSelectedDate(jalaliStr);
        // استخراج سال و ماه از رشته شمسی
        const parts = jalaliStr.split('/');
        if (parts.length === 3) {
          setCurrentJy(parseInt(parts[0]));
          setCurrentJm(parseInt(parts[1]));
        }
      }
    } else {
      setSelectedDate('');
    }
  }, [value]);

  // محاسبه position dropdown
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 400; // تقریبی
      
      // اگر فضای کافی در پایین وجود ندارد، در بالا نمایش بده
      const showAbove = rect.bottom + dropdownHeight > viewportHeight;
      
      setDropdownPosition({
        top: showAbove ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
        left: rect.left
      });
    }
  }, [isOpen]);

  // بستن dropdown با کلیک بیرون
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (day: number) => {
    const jalaliStr = `${currentJy}/${currentJm.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
    setSelectedDate(jalaliStr);
    const gregorianDate = parseJalali(jalaliStr);
    if (gregorianDate) {
      onChange(gregorianDate.toISOString().split('T')[0]);
    }
    setIsOpen(false);
  };

  const prevMonth = () => {
    if (currentJm === 1) {
      setCurrentJm(12);
      setCurrentJy(currentJy - 1);
    } else {
      setCurrentJm(currentJm - 1);
    }
  };

  const nextMonth = () => {
    if (currentJm === 12) {
      setCurrentJm(1);
      setCurrentJy(currentJy + 1);
    } else {
      setCurrentJm(currentJm + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    const jalaliStr = formatJalali(today);
    setSelectedDate(jalaliStr);
    onChange(today.toISOString().split('T')[0]);
    const parts = jalaliStr.split('/');
    setCurrentJy(parseInt(parts[0]));
    setCurrentJm(parseInt(parts[1]));
    setIsOpen(false);
  };

  const getDaysInMonth = (jy: number, jm: number) => {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    // اسفند
    const isLeap = (((jy - (jy > 0 ? 474 : 473)) % 2820 + 474 + 38) * 682) % 2816 < 682;
    return isLeap ? 30 : 29;
  };

  const getFirstDayOfMonth = (jy: number, jm: number) => {
    const gregorianDate = parseJalali(`${jy}/${jm}/1`);
    if (!gregorianDate) return 0;
    return (gregorianDate.getDay() + 1) % 7; // 0 = شنبه
  };

  const daysInMonth = getDaysInMonth(currentJy, currentJm);
  const firstDay = getFirstDayOfMonth(currentJy, currentJm);

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-9"></div>);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const isSelected = selectedDate === `${currentJy}/${currentJm.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
    const isToday = (() => {
      const today = formatJalali(new Date());
      return today === `${currentJy}/${currentJm.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
    })();
    
    days.push(
      <button
        key={day}
        type="button"
        onClick={() => handleDateSelect(day)}
        className={`h-9 w-9 rounded-lg text-sm font-medium transition-all ${
          isSelected 
            ? 'bg-blue-600 text-white shadow-md' 
            : isToday
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold'
            : 'hover:bg-gray-100 dark:hover:bg-slate-700'
        }`}
      >
        {day}
      </button>
    );
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 rounded-lg border text-right flex items-center justify-between transition-all ${
          isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : ''
        } ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-slate-900'}`}
      >
        <span className={selectedDate ? '' : 'text-slate-400'}>
          {selectedDate || placeholder}
        </span>
        <Calendar size={18} className="text-slate-400" />
      </button>

      {isOpen && (
        <div 
          className="fixed z-[9999]"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: '320px'
          }}
        >
          <div className={`rounded-xl shadow-2xl border p-4 ${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
          }`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className={`p-2 rounded-lg transition-all ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
            >
              <ChevronRight size={20} />
            </button>
            <div className="flex items-center gap-2">
              {/* Month Selector */}
              <select
                value={currentJm}
                onChange={(e) => setCurrentJm(Number(e.target.value))}
                className={`px-2 py-1 rounded-lg text-sm font-bold border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-slate-900'
                }`}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{getJalaliMonthName(month)}</option>
                ))}
              </select>
              {/* Year Selector */}
              <select
                value={currentJy}
                onChange={(e) => setCurrentJy(Number(e.target.value))}
                className={`px-2 py-1 rounded-lg text-sm font-bold border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-slate-900'
                }`}
              >
                {Array.from({ length: 50 }, (_, i) => 1380 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className={`p-2 rounded-lg transition-all ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
            >
              <ChevronLeft size={20} />
            </button>
          </div>
            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(day => (
                <div key={day} className={`text-center text-xs font-bold py-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {days}
            </div>

            {/* Footer */}
            <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-slate-700">
              <button
                type="button"
                onClick={goToToday}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
              >
                امروز
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`flex-1 px-3 py-2 text-sm rounded-lg transition-all font-medium ${
                  darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
