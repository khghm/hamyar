// تست الگوریتم تبدیل تاریخ
import { jalaliToGregorian, gregorianToJalali, formatJalali, parseJalali } from './jalali';

export function testJalaliConversion() {
  console.log('=== تست تبدیل تاریخ شمسی به میلادی ===');
  
  // تست 1: 1 فروردین 1403 باید 20 مارس 2024 باشد
  const test1 = jalaliToGregorian(1403, 1, 1);
  console.log('1403/1/1 ->', test1.toISOString().split('T')[0], '(انتظار: 2024-03-20)');
  
  // تست 2: 15 مهر 1403 باید 6 اکتبر 2024 باشد
  const test2 = jalaliToGregorian(1403, 7, 15);
  console.log('1403/7/15 ->', test2.toISOString().split('T')[0], '(انتظار: 2024-10-06)');
  
  // تست 3: 29 اسفند 1402 باید 19 مارس 2024 باشد
  const test3 = jalaliToGregorian(1402, 12, 29);
  console.log('1402/12/29 ->', test3.toISOString().split('T')[0], '(انتظار: 2024-03-19)');
  
  console.log('\n=== تست تبدیل تاریخ میلادی به شمسی ===');
  
  // تست 4: 20 مارس 2024 باید 1 فروردین 1403 باشد
  const test4 = gregorianToJalali(new Date(2024, 2, 20)); // ماه 0-indexed است
  console.log('2024-03-20 ->', `${test4.jy}/${test4.jm}/${test4.jd}`, '(انتظار: 1403/1/1)');
  
  // تست 5: 6 اکتبر 2024 باید 15 مهر 1403 باشد
  const test5 = gregorianToJalali(new Date(2024, 9, 6));
  console.log('2024-10-06 ->', `${test5.jy}/${test5.jm}/${test5.jd}`, '(انتظار: 1403/7/15)');
  
  console.log('\n=== تست فرمت تاریخ ===');
  
  // تست 6: فرمت تاریخ
  const test6 = formatJalali(new Date(2024, 2, 20));
  console.log('formatJalali(2024-03-20) ->', test6, '(انتظار: 1403/01/01)');
  
  console.log('\n=== تست parse ===');
  
  // تست 7: parse تاریخ شمسی
  const test7 = parseJalali('1403/07/15');
  console.log('parseJalali(1403/07/15) ->', test7?.toISOString().split('T')[0], '(انتظار: 2024-10-06)');
  
  console.log('\n=== تست گرد (round-trip) ===');
  
  // تست 8: تبدیل رفت و برگشت
  const original = new Date(2024, 5, 15); // 15 ژوئن 2024
  const jalali = gregorianToJalali(original);
  const backToGregorian = jalaliToGregorian(jalali.jy, jalali.jm, jalali.jd);
  console.log('Original:', original.toISOString().split('T')[0]);
  console.log('Jalali:', `${jalali.jy}/${jalali.jm}/${jalali.jd}`);
  console.log('Back to Gregorian:', backToGregorian.toISOString().split('T')[0]);
  console.log('Match:', original.toDateString() === backToGregorian.toDateString() ? '✅' : '❌');
}
