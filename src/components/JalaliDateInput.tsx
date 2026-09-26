import React, { useState, useEffect } from 'react';
import { formatJalali, parseJalali } from '../utils/jalali';

interface JalaliDateInputProps {
  value: string; // تاریخ میلادی به فرمت YYYY-MM-DD
  onChange: (date: string) => void; // تاریخ میلادی را برمی‌گرداند
  placeholder?: string;
  className?: string;
}

export default function JalaliDateInput({ value, onChange, placeholder = '۱۴۰۳/۰۱/۰۱', className = '' }: JalaliDateInputProps) {
  const [jalaliInput, setJalaliInput] = useState('');

  // تبدیل تاریخ میلادی به شمسی هنگام تغییر value
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setJalaliInput(formatJalali(date));
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
        const gregorianDate = parseJalali(input);
        if (gregorianDate) {
          onChange(gregorianDate.toISOString().split('T')[0]);
        }
      }
    }
  };

  return (
    <input
      type="text"
      value={jalaliInput}
      onChange={handleInputChange}
      placeholder={placeholder}
      className={className}
      dir="ltr"
    />
  );
}
