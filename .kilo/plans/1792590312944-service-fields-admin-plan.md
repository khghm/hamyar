# بررسی تطابق اطلاعات صفحات جزئیات خدمات + پیشنهاد پیاده‌سازی

## ۱. مشکل شناسایی‌شده

بررسی کدمنبع نشان می‌دهد که تابع `getServiceFormFields` و `getServiceDocFields` در
`src/domains/types.ts:1598` بر اساس `category` هر خدمت، فیلدهای فرم ایجاد می‌کند. اما
کاتالوگ واقعی ۱۱۱ خدمتی (در `supabase/seed-services.sql`) حدود ۴۰ دسته‌بندی متفاوت
دارد، در حالی که `switch` فقط ۲۴ مورد خاص را پوشش می‌دهد. بقیه به `default` می‌ریزند.

### مشکلات اصلی:

- حدود ۷۰ خدمت (حدود ۶۳٪ کاتالوگ) به حالت پیش‌رضخورده می‌ریزند
- حالت `default` بسیار ساده‌انه است: فقط فیلدهای عمومی (نام، کد ملی، تلفن، تعداد، لینک فایل، توضیحات)
- فیلدهای مدارک در حالت `default` فقط کارت ملی را می‌خواهد
- برخی دسته‌بندی‌ها در `switch` وجود دارند اما با نام کاتالوگ مطابقت ندارند
- برچسب‌های دسته‌بندی در UI (`Services.tsx`) با داده واقعی ناهماهنگ (۲۷ آیکون برای ۴۰ دسته‌بندی)

## ۲. زیرساخت موجود

در `src/domains/types.ts:168` می‌بینی:

```typescript
export interface Service {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  unit: string;
  description: string;
  active: boolean;
  fields?: ServiceFormField[];   // ← همین حالا وجود داره
  docs?: ServiceDocField[];      // ← همین حالا وجود داره
}
```

و در `getServiceFormFields` (همون فایل، خط ۱۶۰۰):

```typescript
export function getServiceFormFields(service: Service): ServiceFormField[] {
  if (service.fields && service.fields.length > 0) return service.fields;
  // ... switch(category) برای پیش‌رضخورده‌ها
}
```

یعنی سیستم قبلاً طراحی کرده که اگه `service.fields` پر باشه، ازش استفاده کنه وگرنه از پیش‌رضخورده‌های category-based استفاده کنه. **تنها چیزی که وجود نداره، یک فرم ویرایشگر در پنل ادمینه که این فیلدها رو ویرایش کنه.**

## ۳. پیشنهاد اجرایی

در `src/pages/admin/Services.tsx` فرم ویرایش رو گسترش بده تا دو بخش اضافه کنه:

1. **فیلدهای فرم سفارش (Order Form Fields)** — یک لیست قابل تکرار برای اضافه/حذف فیلدهای `ServiceFormField` (key, label, type, required, placeholder, options برای select)
2. **فیلدهای مدارک (Document Fields)** — یک لیست قابل تکرار برای `ServiceDocField` (key, label, required, hint)

## ۴. چه چیزی حل می‌شه

با این کار:
- برای هر خدمت، فیلدهای واقعیِ مورد نیازِ آن سامانه رو تعریف می‌کنی
- مدارک واقعیِ مورد نیاز رو مشخص می‌کنی
- دیگه نیازی به وابستگی به `switch(category)` نیست، چون هر خدمت تنظیلات خودش رو داره
- برای خدمات جدید هم همین طریق عمل می‌کنه، دیگه لازم نیست هر بار کد تغییر کنی

## ۵. یک نکته تکمیلی

برای داده‌های موجود (۱۱۱ خدمت در `seed-services.sql`) بهتره یک میگریشن اضافه کنی که `fields` و `docs` هر خدمت رو بر اساس category پر کنه (مثلاً با همین منطق `switch` فعلی)، تا کاربرانی که از نسخه قبلی استفاده می‌کنن، داده‌شون از دست نرود. بعد از اون، ادمین می‌تونه هر خدمت رو سفارشی کنه.

## ۶. گام‌های پیشنهادی پیاده‌سازی

1. گسترش `Service`اینترفیس برای ذخیره `fields` و `docs` (Already exists)
2. به‌روزرسانی `serviceMapper` در `src/api/services.ts` برای ارسال `fields` و `docs` به دیتابیس (Already exists)
3. افزودن بخش تنظیمات فیلدهای فرم در فرم ادمین `Services.tsx`
4. افزودن بخش تنظیمات مدارک در فرم ادمین `Services.tsx`
5. افزودن میگریشن برای پر کردن `fields` و `docs` برای خدمات موجود بر اساس category
6. افزودن UI برای پیش‌نمایش فیلدهای تنظیم‌شده در صفحه جزئیات