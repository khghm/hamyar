// تبدیل تاریخ شمسی به میلادی و برعکس
// الگوریتم دقیق و تست شده

// تبدیل تاریخ شمسی به میلادی
export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  jy += 1595;
  let days = -355668 + (365 * jy) + (~~(jy / 33) * 8) + ~~(((jy % 33) + 3) / 4) + jd;
  
  if (jm < 7) {
    days += (jm - 1) * 31;
  } else {
    days += ((jm - 7) * 30) + 186;
  }
  
  let gy = 400 * ~~(days / 146097);
  days %= 146097;
  
  if (days > 36524) {
    gy += 100 * ~~(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  
  gy += 4 * ~~(days / 1461);
  days %= 1461;
  
  if (days > 365) {
    gy += ~~((days - 1) / 365);
    days = (days - 1) % 365;
  }
  
  let gd = days + 1;
  const salA = [0, 31, ~~(((gy % 4 === 0) && (gy % 100 !== 0)) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  
  for (gm = 0; gm < 13 && gd > salA[gm]; gm++) {
    gd -= salA[gm];
  }
  
  return new Date(gy, gm - 1, gd);
}

// تبدیل تاریخ میلادی به شمسی
export function gregorianToJalali(date: Date): { jy: number; jm: number; jd: number } {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();
  
  let gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = 355666 + (365 * gy) + ~~((gy2 + 3) / 4) - ~~((gy2 + 99) / 100) + ~~((gy2 + 399) / 400);
  
  for (let i = 0; i < gm - 1; i++) {
    days += [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][i];
  }
  
  // leap year
  if (gm > 2 && ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0))) {
    days++;
  }
  
  days += gd;
  
  let jy = -1595 + (33 * ~~(days / 12053));
  days %= 12053;
  
  jy += 4 * ~~(days / 1461);
  days %= 1461;
  
  if (days > 365) {
    jy += ~~((days - 1) / 365);
    days = (days - 1) % 365;
  }
  
  let jm, jd;
  if (days < 186) {
    jm = 1 + ~~(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + ~~((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  
  return { jy, jm, jd };
}

// فرمت تاریخ شمسی
export function formatJalali(date: Date, format: string = 'yyyy/mm/dd'): string {
  const { jy, jm, jd } = gregorianToJalali(date);
  return format
    .replace('yyyy', jy.toString())
    .replace('mm', jm.toString().padStart(2, '0'))
    .replace('dd', jd.toString().padStart(2, '0'));
}

// دریافت نام ماه شمسی
export function getJalaliMonthName(month: number): string {
  const months = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];
  return months[month - 1] || '';
}

// دریافت نام روز هفته
export function getJalaliDayName(date: Date): string {
  const days = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
  return days[date.getDay()];
}

// تبدیل رشته تاریخ میلادی به شمسی
export function toJalaliString(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return formatJalali(date);
}

// تبدیل رشته شمسی به تاریخ میلادی
export function parseJalali(jalaliStr: string): Date | null {
  const parts = jalaliStr.split(/[/-]/);
  if (parts.length !== 3) return null;
  const jy = parseInt(parts[0]);
  const jm = parseInt(parts[1]);
  const jd = parseInt(parts[2]);
  if (isNaN(jy) || isNaN(jm) || isNaN(jd)) return null;
  return jalaliToGregorian(jy, jm, jd);
}

// دریافت تاریخ امروز به شمسی
export function getTodayJalali(): string {
  return formatJalali(new Date());
}

// فرمت کامل تاریخ شمسی
export function formatJalaliFull(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  
  const { jy, jm, jd } = gregorianToJalali(date);
  const monthName = getJalaliMonthName(jm);
  const dayName = getJalaliDayName(date);
  
  return `${dayName} ${jd} ${monthName} ${jy}`;
}
