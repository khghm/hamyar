// تبدیل تاریخ میلادی به شمسی و برعکس
// الگوریتم Jalaali

function div(a: number, b: number) {
  return ~~(a / b);
}

function jalCal(jy: number) {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  const bl = breaks.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jump = 0;
  
  for (let i = 1; i < bl; i += 1) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) {
      const N = jy - jp;
      leapJ += div(N, 33) * 8 + div((N % 33) + 3, 4);
      if ((jump % 33) === 4 && (jump - N) === 4) leapJ += 1;
      break;
    }
    leapJ += div(jump, 33) * 8 + div((jump % 33) + 3, 4);
    jp = jm;
  }
  
  let leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  
  let N = jy - jp;
  if (jump - N < 6) N = N - jump + div(jump + 4, 33) * 33;
  let leap = ((((N + 1) % 33) - 1) % 4);
  if (leap === -1) leap = 4;
  
  return { leap, gy, march };
}

function j2d(jy: number, jm: number, jd: number) {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn: number) {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;
  
  if (k >= 0) {
    if (k <= 185) {
      const jm = 1 + div(k, 31);
      const jd = 1 + (k % 31);
      return { jy, jm, jd };
    } else {
      k -= 186;
    }
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  
  const jm = 7 + div(k, 30);
  const jd = 1 + (k % 30);
  return { jy, jm, jd };
}

function g2d(gy: number, gm: number, gd: number) {
  return div((gy + div(gm - 8, 6) + 100100) * 1461, 4)
    + div(153 * ((gm + 9) % 12) + 2, 5)
    + gd - 34840408;
}

function d2g(jdn: number) {
  let j = 4 * jdn + 139361631;
  j += 4 * div(div(4 * jdn + 183187720, 146097) * 3, 4) - 3908;
  const i = div((j % 1461), 4) * 5 + 308;
  const gd = div((i % 153), 5) + 1;
  const gm = ((div(i, 153)) % 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

// توابع اصلی
export function gregorianToJalali(date: Date): { jy: number; jm: number; jd: number } {
  return d2j(g2d(date.getFullYear(), date.getMonth() + 1, date.getDate()));
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  const g = d2g(j2d(jy, jm, jd));
  return new Date(g.gy, g.gm - 1, g.gd);
}

export function formatJalali(date: Date, format: string = 'yyyy/mm/dd'): string {
  const { jy, jm, jd } = gregorianToJalali(date);
  return format
    .replace('yyyy', jy.toString())
    .replace('mm', jm.toString().padStart(2, '0'))
    .replace('dd', jd.toString().padStart(2, '0'));
}

export function parseJalali(jalaliStr: string): Date | null {
  const parts = jalaliStr.split(/[/-]/);
  if (parts.length !== 3) return null;
  const jy = parseInt(parts[0]);
  const jm = parseInt(parts[1]);
  const jd = parseInt(parts[2]);
  if (isNaN(jy) || isNaN(jm) || isNaN(jd)) return null;
  return jalaliToGregorian(jy, jm, jd);
}

export function getTodayJalali(): string {
  return formatJalali(new Date());
}

export function getJalaliMonthName(month: number): string {
  const months = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];
  return months[month - 1] || '';
}

export function getJalaliDayName(date: Date): string {
  const days = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
  return days[date.getDay()];
}

export function isValidJalaliDate(jy: number, jm: number, jd: number): boolean {
  if (jy < 1 || jy > 3178) return false;
  if (jm < 1 || jm > 12) return false;
  if (jd < 1) return false;
  
  const maxDays = jm <= 6 ? 31 : jm <= 11 ? 30 : 30; // اسفند ۲۹ یا ۳۰ روز
  if (jd > maxDays) return false;
  
  return true;
}

// تبدیل تاریخ میلادی به رشته شمسی برای نمایش
export function toJalaliString(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return formatJalali(date);
}

// تبدیل رشته شمسی به تاریخ میلادی برای ذخیره
export function fromJalaliString(jalaliStr: string): string {
  const date = parseJalali(jalaliStr);
  if (!date) return '';
  return date.toISOString().split('T')[0];
}
