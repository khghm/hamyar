import { AuditLog } from '../store';

export function logActivity(
  user: string,
  action: string,
  details: string,
  module: string
): AuditLog {
  return {
    id: 'log' + Date.now() + Math.random(),
    user,
    action,
    details,
    date: new Date().toISOString(),
    ip: '127.0.0.1', // در حالت واقعی از API گرفته می‌شود
    module
  };
}

export const activityModules = [
  'سفارشات',
  'مشتریان',
  'محصولات',
  'مدیا',
  'خدمات',
  'پروژه‌ها',
  'مالی',
  'فاکتورها',
  'کارمندان',
  'تأمین‌کنندگان',
  'کمپین‌ها',
  'پیامک',
  'نظرات',
  'تیم محتوا',
  'دعوت‌ها',
  'تنظیمات',
  'RBAC',
  'یادداشت‌ها'
];

export const activityActions = [
  'ایجاد',
  'ویرایش',
  'حذف',
  'تغییر وضعیت',
  'ورود',
  'خروج',
  'ارسال',
  'دریافت',
  'تایید',
  'رد',
  'بکاپ',
  'بازیابی'
];
