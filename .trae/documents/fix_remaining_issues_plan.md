# برنامهٔ رفع ایرادات باقی‌مانده پروژهٔ همیار

## تحقیقات انجام‌شده

پس از بررسی جامع کد و مهاجرت‌ها، ایرادات باقی‌مانده به ۵ دسته تقسیم می‌شوند:

### ۱. ناهماهنگی مدل `MediaItem` با دیتابیس
- مهاجرت `019` ستون `price bigint not null default 0` را به جدول `media_items` اضافه کرد.
- ولی مدل `MediaItem` در [types.ts](file:///d:/Works/hamyar/src/domains/types.ts#L133-L149) فیلد `price` ندارد.
- [mediaMapper](file:///d:/Works/hamyar/src/api/media.ts) هم `price` را neither `toRow` و neither `fromRow` map نمی‌کند.
- **نتیجه:** کلاینت از قیمت مدیا بی‌خبر است و قیمت‌ها هنگام sync گم می‌شوند.

### ۲. فیلد `password` در مدل `User`
- اینترفیس `User` در [types.ts](file:///d:/Works/hamyar/src/domains/types.ts#L15-L51) فیلد `password: string` دارد (اجباری).
- برای مشتریان این فیلد همیشه `''` تنظیم می‌شود (چون از Supabase Auth استفاده می‌کنند).
- در [authStore.ts](file:///d:/Works/hamyar/src/state/authStore.ts#L301) خط ۳۰۱، ۳۶۷ و ۴۱۸ مقدار `password: ''` داده می‌شود.
- این فیلد برای `SystemUser` (کارکنان) واقعی استفاده می‌شود ولی در مدل `User` مشتری بی‌معناست و ریسک نشت دارد.
- `normalizeUser` به `password` دست نمی‌زند، پس حذف/اختیاری‌کردن آن بی‌خطر است.

### ۳. Edge Functions مرده
کلاینت از `functions.invoke` استفاده نمی‌کند؛ بعضی توابع را مستقیماً با `fetch('/functions/v1/...')` صدا می‌زند و بعضی را با RPC مستقیم.

| Edge Function | وضعیت | دلیل |
|---|---|---|
| `place-order` | ✅ استفاده‌شده | [orders.ts:46](file:///d:/Works/hamyar/src/api/orders.ts#L46) |
| `create-payment-intent` | ✅ استفاده‌شده | [orders.ts:141](file:///d:/Works/hamyar/src/api/orders.ts#L141) |
| `export-data` | ✅ استفاده‌شده | [backup.ts:33](file:///d:/Works/hamyar/src/api/backup.ts#L33) |
| `verify-payment` | ✅ استفاده‌شده | [payments.ts:17](file:///d:/Works/hamyar/src/api/payments.ts#L17) |
| `create-staff` | ✅ استفاده‌شده | [rbacStore.ts:398](file:///d:/Works/hamyar/src/state/rbacStore.ts#L398) |
| `change-order-status` | ❌ مرده | کلاینت RPC `change_order_status` را مستقیم صدا می‌زند ([orders.ts:93](file:///d:/Works/hamyar/src/api/orders.ts#L93)) |
| `award-loyalty` | ❌ مرده | کلاینت RPC `award_loyalty_client` را صدا می‌زند ([loyalty.ts:31](file:///d:/Works/hamyar/src/api/loyalty.ts#L31)) |
| `apply-referral` | ❌ مرده | کلاینت RPC `apply_referral_bonuses` را صدا می‌زند ([loyalty.ts:75](file:///d:/Works/hamyar/src/api/loyalty.ts#L75)) |

### ۴. console.log های دیباگ در کد تولیدی
- [App.tsx:57](file:///d:/Works/hamyar/src/App.tsx#L57) — `[AppRoutes] currentUser: ...`
- [authStore.ts:283](file:///d:/Works/hamyar/src/state/authStore.ts#L283) — `[authStore] signIn failed:` (این یک خطاست، می‌تواند به `console.error` تبدیل شود یا حذف)
- [authStore.ts:289](file:///d:/Works/hamyar/src/state/authStore.ts#L289) — `[authStore] fetchCurrentProfile result:`
- [Auth.tsx:91](file:///d:/Works/hamyar/src/pages/Auth.tsx#L91) — `[Auth] login result:`
- [JalaliDatePicker.tsx:77](file:///d:/Works/hamyar/src/components/JalaliDatePicker.tsx#L77) — `Selected: ...`

console.log های در `jalali-test.ts` و `migrate-local-to-supabase.ts` مربوط به اسکریپت‌ها/تست‌ها هستند و حفظ می‌شوند.

### ۵. Edge Functions استفاده‌شده که ممکن است مستقر نباشند
کامنت در [orders.ts:88](file:///d:/Works/hamyar/src/api/orders.ts#L88) اشاره می‌کند که `change-order-status` مستقر نیست و ۴۰۴ می‌دهد. همین ممکن است برای توابع استفاده‌شده (`place-order`, `create-payment-intent`, `export-data`, `verify-payment`, `create-staff`) هم صادق باشد. این یک مسئلهٔ deployment است نه کد، ولی باید بررسی شود.

---

## فایل‌ها و ماژول‌های تحت تغییر

- `src/domains/types.ts` — افزودن `price` به `MediaItem`؛ اختیاری‌کردن `password` در `User`
- `src/api/media.ts` — map کردن `price` در `toRow` و `fromRow`
- `src/state/authStore.ts` — حذف `password: ''` از سه محل؛ تبدیل console.log های دیباگ
- `src/App.tsx` — حذف console.log دیباگ
- `src/pages/Auth.tsx` — حذف console.log دیباگ
- `src/components/JalaliDatePicker.tsx` — حذف console.log دیباگ
- `supabase/functions/change-order-status/` — حذف دایرکتوری
- `supabase/functions/award-loyalty/` — حذف دایرکتوری
- `supabase/functions/apply-referral/` — حذف دایرکتوری

---

## مراحل اجرا (به ترتیب وابستگی)

### مرحلهٔ ۱: افزودن `price` به مدل `MediaItem` و mapper
1. در `types.ts`، فیلد `price?: number` را به اینترفیس `MediaItem` اضافه کن.
2. در `media.ts`:
   - در `toRow`: `price: m.price ?? 0` اضافه کن.
   - در `fromRow`: `price: Number(r.price) || 0` اضافه کن.

### مرحلهٔ ۲: پاکسازی فیلد `password` در مدل `User`
1. در `types.ts`، `password: string` را به `password?: string` تغییر بده در اینترفیس `User`.
2. در `authStore.ts`، سه محل `password: ''` را حذف کن (خطوط ۳۰۱، ۳۶۷، ۴۱۸).
3. بررسی کن که هیچ‌جا `user.password` برای مشتریان خوانده نمی‌شود (جستجو تأیید کرد که فقط برای `SystemUser` در rbacStore استفاده می‌شود).

### مرحلهٔ ۳: حذف Edge Functions مرده
1. دایرکتوری `supabase/functions/change-order-status/` را حذف کن.
2. دایرکتوری `supabase/functions/award-loyalty/` را حذف کن.
3. دایرکتوری `supabase/functions/apply-referral/` را حذف کن.

### مرحلهٔ ۴: حذف console.log های دیباگ
1. `App.tsx:57` — حذف کل خط `console.log`.
2. `authStore.ts:283` — تبدیل `console.log` به `console.warn` (چون خطای signIn است) یا حذف.
3. `authStore.ts:289` — حذف `console.log`.
4. `Auth.tsx:91` — حذف `console.log`.
5. `JalaliDatePicker.tsx:77` — حذف `console.log`.

### مرحلهٔ ۵: اعتبارسنجی
1. اجرای `npm run typecheck` برای اطمینان از بدون‌خطا بودن TypeScript.
2. اجرای تست‌های موجود (`npx vitest run`) برای اطمینان از شکسته‌نشدن تست‌ها.
3. بررسی که `rls-coverage.test.ts` و `schemas.test.ts` پاس می‌شوند.

### مرحلهٔ ۶: بررسی Edge Functions مستقرشده (اختیاری، پس از تأیید)
1. با `supabase functions list` بررسی کن که کدام توابع مستقر هستند.
2. توابع استفاده‌شده را با `supabase functions deploy <name>` مستقر کن:
   - `place-order`, `create-payment-intent`, `export-data`, `verify-payment`, `create-staff`

---

## وابستگی‌ها و ملاحظات

- **`password` اختیاری شدن:** هیچ کد تولیدی به `user.password` برای مشتریان وابسته نیست؛ `SystemUser.password` جداگانه نگه داشته می‌شود. تغییر `User.password` به اختیاری بی‌خطر است.
- **حذف Edge Functions:** این ۳ تابع هیچ ارجاعی در کلاینت ندارند و RPC معادلشان مستقیماً صدا زده می‌شود. حذف آن‌ها بی‌خطر است.
- **`mediaMapper`:** تغییر `toRow` و `fromRow` باید با هم انجام شود تا داده‌ها round-trip شوند.
- **تست‌ها:** `rls-coverage.test.ts` مستقیماً migration ها را می‌خواند و policyها را بررسی می‌کند؛ این تغییرات روی آن اثر نمی‌گذارند.

---

## اعتبارسنجی پس از اجرا

- `npm run typecheck` باید بدون خطا عبور کند.
- `npx vitest run` باید بدون شکست پاس شود.
- بررسی دستی: `MediaItem` در کلاینت حالا `price` دارد و mapper آن را منتقل می‌کند.
- بررسی دستی: `User` دیگر `password` اجباری ندارد و هیچ خطای TypeScriptی تولید نمی‌شود.

---

## ریسک‌ها

- **ریسک:** تغییر `User.password` به اختیاری ممکن است در جایی که `password` به‌عنوان رشتهٔ اجباری استفاده می‌شود خطا بدهد.
  - **بررسی:** جستجو نشان داد که فقط `SystemUser.password` استفاده می‌شود، نه `User.password`.
- **ریسک:** حذف Edge Functions ممکن است در آینده نیاز شود.
  - **بررسی:** این توابع هیچ ارجاعی در کلاینت ندارند و در صورت نیاز می‌توانند از git بازیابی شوند.
- **ریسک:** اضافه کردن `price` به mapper ممکن است روی داده‌های موجود اثر بگذارد.
  - **بررسی:** `fromRow` مقدار پیش‌فرض `0` دارد و `toRow` هم `m.price ?? 0` استفاده می‌کند، پس داده‌های قدیمی (بدون price) به‌درستی ۰ می‌شوند.
