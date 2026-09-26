import React, { useState, useEffect } from 'react';
import { formatJalali, parseJalali, getJalaliMonthName } from '../utils/jalali';

interface JalaliDatePickerProps {
  value: string; // تاریخ میلادی به فرمت YYYY-MM-DD
  onChange: (date: string) => void; // تاریخ میلادی را برمی‌گرداند
  label?: string;
  className?: string;
  placeholder?: string;
}

export default function JalaliDatePicker({ value, onChange, label, className = '', placeholder = '۱۴۰۳/۰۱/۰۱' }: JalaliDatePickerProps) {
  const [jalaliInput, setJalaliInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [currentJy, setCurrentJy] = useState(1403);
  const [currentJm, setCurrentJm] = useState(1);

  // تبدیل تاریخ میلادی به شمسی هنگام تغییر value
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const jalaliStr = formatJalali(date);
        setJalaliInput(jalaliStr);
        // استخراج سال و ماه از رشته شمسی
        const parts = jalaliStr.split('/');
        if (parts.length === 3) {
          setCurrentJy(parseInt(parts[0]));
          setCurrentJm(parseInt(parts[1]));
        }
      }
    } else {
      setJalaliInput('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setJalaliInput(input);

    // اگر فرمت کامل است (YYYY/MM/DD یا YYYY-MM-DD)
    const parts = input.split(/[/-]/);
    if (parts.length === 3) {
      const jy = parseInt(parts[0]);
      const jm = parseInt(parts[1]);
      const jd = parseInt(parts[2]);
      
      if (!isNaN(jy) && !isNaN(jm) && !isNaN(jd)) {
        const gregorianDate = new Date(jy + 621, jm - 1, jd); // تقریبی
        // تبدیل دقیق‌تر
        const jalaliDate = parseJalali(input);
        if (jalaliDate) {
          onChange(jalaliDate.toISOString().split('T')[0]);
        }
      }
    }
  };

  const handleDateSelect = (day: number) => {
    const jalaliStr = `${currentJy}/${currentJm.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
    setJalaliInput(jalaliStr);
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

  const getDaysInMonth = (jy: number, jm: number) => {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    // اسفند
    const isLeap = (((jy - (jy > 0 ? 474 : 473)) % 2820 + 474 + 38) * 682) % 2816 < 682;
    return isLeap ? 30 : 29;
  };

  const getFirstDayOfMonth = (jy: number, jm: number) => {
    const firstDay = new Date(jy + 621, jm - 1, 1);
    return (firstDay.getDay() + 1) % 7; // 0 = شنبه
  };

  const daysInMonth = getDaysInMonth(currentJy, currentJm);
  const firstDay = getFirstDayOfMonth(currentJy, currentJm);

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-8"></div>);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const isSelected = jalaliInput === `${currentJy}/${currentJm.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
    days.push(
      <button
        key={day}
        type="button"
        onClick={() => handleDateSelect(day)}
        className={`h-8 w-8 rounded text-sm hover:bg-blue-100 dark:hover:bg-blue-900 ${
          isSelected ? 'bg-blue-600 text-white' : ''
        }`}
      >
        {day}
      </button>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <div className="relative">
        <input
          type="text"
          value={jalaliInput}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 rounded-lg border ${
            isOpen ? 'border-blue-500' : ''
          }`}
          dir="ltr"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg p-3 w-72">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center">
              <div className="font-bold">{getJalaliMonthName(currentJm)} {currentJy}</div>
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-gray-500 dark:text-gray-400 h-8 flex items-center justify-center">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const jalaliStr = formatJalali(today);
                setJalaliInput(jalaliStr);
                onChange(today.toISOString().split('T')[0]);
                setIsOpen(false);
              }}
              className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              امروز
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-3 py-1 text-sm bg-gray-200 dark:bg-slate-700 rounded hover:bg-gray-300 dark:hover:bg-slate-600"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
