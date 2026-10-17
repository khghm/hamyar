# گزارش تحلیل و بررسی پروژهٔ «همیار»

تاریخ: ۲۰۲۶-۱۰-۱۷ · دامنهٔ بررسی: کل مخزن (کد فرانت‌اند، مهاجرت‌های SQL، Edge Functions، تست‌ها، CI، پیکربندی)
روش: خواندن کد + اجرای واقعی typecheck / build / test روی همین مخزن.

---

## ۱) شناسنامهٔ پروژه

| مورد | مقدار |
|---|---|
| نوع محصول | SPA فارسی (RTL) برای «کافی‌نت همیار»: فروشگاه، خدمات، کپی مدیا، سفارش پروژه، و یک پنل مدیریت بسیار بزرگ |
| پشته | React 18 + TypeScript 5.7 + Vite 6 + Tailwind 4 + Zustand 5 + React Router 6 |
| بک‌اند | Supabase (Postgres + RLS + RPC + Storage + Realtime) و ۴ Edge Function به زبان Deno |
| میزبانی | Cloudflare Workers + Assets روی `hamyar.pardismms.workers.dev` |
| کد فرانت (بدون تست) | ۱۱۶ فایل · ۳۵٬۶۴۰ خط |
| کل کد (با SQL/اسکریپت/تست) | ۱۹۹ فایل · ۴۸٬۳۵۴ خط |
| دیتابیس | ۴۱ فایل مهاجرت + seed + ۲ مجموعهٔ تست SQL |
| تست | ۱۳ فایل، ۲۰۷ تست (همه پاس) + ۱ فایل E2E پلی‌رایت |
| صفحه/مسیر | ۲۰ مسیر عمومی، ۲۹ مسیر پنل مدیریت، ۴۹ کامپوننت صفحه |
| وضعیت مخزن | ۱۵٬۵۲۵ فایل ردیابی‌شده که **۱۵٬۲۵۷ فایل آن `node_modules` است** |

### وضعیت اجرایی (اندازه‌گیری‌شده، نه حدس)

| بررسی | نتیجه |
|---|---|
| `npm run typecheck` | ✅ پاس (strict روشن، بدون خطا) |
| `npm run build` | ✅ موفق — یک chunk ۲٬۱۴۷ KB (۵۱۲ KB gzip) *قبل از اصلاحات بخش ۷* |
| `npx vitest run` | ✅ ۲۰۷ تست / ۱۳ فایل، همه پاس |
| `npm run lint` | ❌ اسکریپت وجود ندارد |
| `npm test` | ❌ اسکریپت وجود ندارد (ولی CI صدایش می‌زند) |
| نشت سکرت در باندل | ✅ سالم — `service_role`، `sbp_` و پسورد DB در build نیستند (فقط URL و کلید عمومی) |

---

## ۲) یافته‌های بحرانی (P0)

### P0-1 · توابع `SECURITY DEFINER` بدون هیچ احراز هویتی، برای نقش `anon` باز هستند

فایل‌های `supabase/migrations/00000000000002..04` نُه تابع می‌سازند که RLS را دور می‌زنند و **به `anon` گرنت شده‌اند، بدون هیچ بررسی `auth.uid()` یا `is_staff()`**:

```
admin_list_profiles            -- تمام پروفایل‌ها (نام، موبایل، ایمیل، کیف پول، امتیاز)
admin_list_orders              -- تمام سفارش‌های همهٔ مشتریان
admin_list_order_items
admin_list_order_status_history
admin_list_tickets             -- تمام تیکت‌های پشتیبانی
admin_list_ticket_messages
admin_list_roles
admin_list_staff_accounts
admin_list_permissions
```

استدلال کامنت‌ها این است: «پنل پشت RBAC محلی است، پس امن است». این استدلال از پایه غلط است — RBAC محلی در `localStorage` مرورگر است و هیچ اثری روی PostgREST ندارد. کلید عمومی (`sb_publishable_…`) در باندل تولیدی است و هر کسی می‌تواند:

```
POST https://<project>.supabase.co/rest/v1/rpc/admin_list_profiles
apikey: <publishable key>
Content-Type: application/json
{}
```

و کل دیتابیس مشتریان را بردارد. این تنها «نشت نظری» نیست؛ مسیر عمومی و بی‌درز است.

**نکتهٔ مهم:** حالا که `adminLogin` از `signInWithPassword` استفاده می‌کند، ادمین واقعاً نشست Supabase دارد؛ پس محدودکردن این توابع به `is_staff()` هیچ چیزی را در پنل نمی‌شکند.

**اصلاح:**
```sql
revoke execute on function admin_list_profiles() from anon, public;
grant  execute on function admin_list_profiles() to authenticated;
-- و در بدنهٔ تابع:
if not is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
```
برای هر تابع، مجوز دقیق خودش (`perm3` برای مشتریان، `perm41` برای تیکت‌ها و…) بهتر است. بعد از اصلاح، کلیدها را rotate کنید (پایین را ببینید).

### P0-2 · سکرت‌های واقعی در فایل `.env` کنار مخزن

`D:\Works\hamyar\.env` شامل این‌هاست: `SUPABASE_SERVICE_ROLE_KEY` (JWT با نقش service_role)، `SUPABASE_DB_PASSWORD` و `SUPABASE_ACCESS_TOKEN` (توکن مدیریت حساب Supabase). فایل در `.gitignore` هست و در Git ردیابی نمی‌شود (بررسی شد) — یعنی فعلاً منتشر نشده. اما:

* این توکن‌ها **کلید طلایی** کل زیرساخت هستند؛ یک اسنپ‌شات از پوشه، یک zip، یا یک `git add -f` کافی است.
* `AGENTS.md`/ابزارهای AI داخل پروژه هم به همین پوشه دسترسی دارند.

**اقدام فوری و بی‌قید‌و‌شرط:** هر سه مقدار را rotate کنید (Supabase → Settings → API و Access Tokens)، سپس `.env` را با الگوی `.env.local` (خارج از مخزن) بازسازی کنید و یک اسکنر سکرت (gitleaks/trufflehog) روی تاریخچه بزنید.

### P0-3 · رمز عبور واقعی ادمین داخل مخزن، در یک ریپوی عمومی

`e2e/full-flow.test.ts`:

```ts
const ADMIN_EMAIL = 'admin@hamyar.ir';
const ADMIN_PASSWORD = '123456789';
const CUSTOMER_EMAIL = 'kafinet.hamyar@gmail.com';
const CUSTOMER_PASSWORD = '123456789';
```

مخزن روی GitHub عمومی است (`github.com/khghm/hamyar`)، پس این اعتبارنامه‌ها را منتشرشده فرض کنید. رمز را عوض کنید و تست را به `process.env.E2E_ADMIN_EMAIL` منتقل کنید.

### P0-4 · کیف پول، دو منبع حقیقتِ متناقض دارد (عملاً کار نمی‌کند)

* `profileToUser()` در `src/api/users.ts` فیلد `wallet_balance` دیتابیس را **map نمی‌کند**؛ پس موجودی کیف پول کاربر در UI همیشه از `localStorage` می‌آید.
* `chargeWallet()` در `authStore` فقط عدد را در `localStorage` زیاد می‌کند؛ هیچ مسیر سروری برای شارژ وجود ندارد.
* `orderStore` هنگام پرداخت با کیف پول، موجودی را **سمت کلاینت** کم می‌کند و `paidAmount = total` می‌گذارد، بعد `place_order` هم همان مبلغ را از دیتابیس کم می‌کند. دو دفترِ جدا که هرگز با هم آشتی نمی‌کنند (هیچ‌جا `wallet_balance` دوباره از سرور خوانده نمی‌شود).
* نتیجهٔ عملی: مشتری با موجودی واقعی صفر نمی‌تواند با کیف پول بخرد، و مشتری‌ای که موجودی دیتابیس دارد در UI «۰ تومان» می‌بیند.

**اصلاح:** `wallet_balance` را در mapper بخوانید، بعد از هر سفارش از پروفایل/`wallet_transactions` بازخوانی کنید، و شارژ را از طریق درگاه + تریگر سرور انجام دهید (نه `chargeWallet` محلی).

### P0-5 · وضعیت «پرداخت‌شده» پیش از تأیید درگاه

در `createServiceOrder` / `createProjectOrder` / `createCatalogOrder`:

```ts
} else {
  paidAmount = total;          // روش آنلاین
}
...
status: 'paid'                 // فاکتور محلی
```

سفارش و فاکتور «پرداخت‌شده» در استور محلی ساخته می‌شوند و بعد Edge Function صدا زده می‌شود. مسیر UI هم هیچ‌وقت `create-payment-intent` یا `verify-payment` را صدا نمی‌زند — یعنی «درگاه اینتاپ» در عمل شبیه‌سازی است.

**اصلاح:** پرداخت آنلاین باید جریان سه‌مرحله‌ای باشد: ایجاد intent → ریدایرکت به درگاه → تأیید سمت سرور → سپس نمایش «پرداخت شد».

---

## ۳) یافته‌های مهم (P1)

| # | مورد | توضیح |
|---|---|---|
| 1 | `adminLogin` در `localStorage` قابل جعل است | `adminLoggedIn`, `currentAdminId`, `userPermissions` در `hamyar_rbac` ذخیره می‌شوند. |
| 2 | fallbackهای «allow» در RBAC | `hasPermission`/`canAccessPage` وقتی مقدار نامشخص باشد `return true` می‌کنند. پیش‌فرض باید deny باشد. |
| 3 | CI شکسته | `.github/workflows/ci.yml` دستورهای `npm run lint` و `npm test` را اجرا می‌کند که در `package.json` وجود ندارند. `eslint` و پلاگین‌هایش هم نصب نیستند. |
| 4 | Husky/lint-staged مرده | `.husky/pre-commit` به eslint نصب‌نشده وابسته است؛ husky در devDependencies نیست. |
| 5 | `playwright.config.ts` غیرقابل اجرا روی CI | `executablePath` ویندوزی هاردکد شده؛ تست به `/shop` می‌رود که مسیرش وجود ندارد (`/store` درست است). |
| 6 | فراخوانی‌های نسبی Edge Function | `api/rbac.ts`, `api/payments.ts`, `api/orders.ts` از `fetch('/functions/v1/...')` استفاده می‌کنند؛ فقط با proxy ویت کار می‌کند و روی هاست استاتیک ۴۰۴ می‌دهد. |
| 7 | جریان تأیید ایمیل/بازیابی رمز ناقص | `detectSessionInUrl: false` و نبود `exchangeCodeForSession`؛ لینک `?code=` هیچ نشستی نمی‌سازد. |
| 8 | دادهٔ دمو داخل کد تولید | ۶۲ محصول، فیلم/سریال، ۶ FAQ، ۳ ریویو و ۲۰ لاگ تقلبی با IP جعلی در استورها هاردکد شده‌اند. |
| 9 | refresh بلادرنگ مرده | `debouncedCatalogRefresh` → `hydrate()` که با `if (get().hydrated) return;` فوراً برمی‌گردد. |
| 10 | `Guarded` داخل کامپوننت | هر رندر یک نوع جدید می‌سازد → remount کل صفحهٔ ادمین. *(اصلاح شد، بخش ۷)* |
| 11 | باندل تک‌تکه | ۲.۱۵ MB JS بدون code splitting. *(اصلاح شد، بخش ۷)* |
| 12 | React Query بی‌استفاده | نصب و Provider شده ولی هیچ‌جا `useQuery/useMutation` نیست. |
| 13 | تایپ‌های دیتابیس دستی | هیچ type تولیدشده از Supabase نیست؛ ۱٬۶۵۱ خط تایپ دستی + mapperهای `Record<string, any>`. |
| 14 | `node_modules` و `dist` کامیت شده‌اند | ۱۵٬۲۵۷ فایل از ۱۵٬۵۲۵؛ `.dbg/`, `.kilo/`, `.trae/`, `Continue/`, `test-results/` هم داخل مخزن‌اند. |

---

## ۴) معماری و کیفیت کد (P2)

**اندازه‌ها:** `pages/admin/Training.tsx` ۲٬۲۹۷ خط، `domains/types.ts` ۱٬۶۵۱، `ContentTeam.tsx` ۱٬۴۸۹، `orderStore.ts` ۱٬۲۴۳، `Personas.tsx` ۹۹۸، `Customers.tsx` ۹۲۹.

**God context:** `src/store.tsx` (۶۱۷ خط) دوازده استور zustand را در یک `AppContext` با بیش از ۱۰۰ فیلد ادغام می‌کند و ۶۲ نقطه در کد `useApp()` را کامل مصرف می‌کند؛ هر تغییر، کل درخت را رندر می‌کند.

**الگوی نوشتن خوش‌بینانه بدون آشتی:** تقریباً همهٔ `setX`ها اول state محلی را عوض می‌کنند و بعد fire-and-forget به `syncCollection` می‌سپارند؛ هیچ reconcile/refetch وجود ندارد.

**خطاهای بلعیده‌شده:** ۱۳۱ فراخوانی `console.*` و ۲۷ بلوک `catch {}` خالی.

**نوع‌ها:** ۹۲ مورد `: any` و ۸۱ مورد `as any`؛ عمدتاً در مرز mapperها.

**نقاط قوت واقعی:** RLS جدی (تفکیک read/write، ستون‌به‌ستون برای `profiles`، `revoke` روی ستون‌های حساس، تریگر به‌عنوان تنها نویسندهٔ کیف پول) · `place_order` تراکنشی با قیمت از دیتابیس · `verify-payment` با HMAC و مقایسهٔ زمان‌ثابت و بررسی مالکیت · تست‌های واحد معنادار (`rls-coverage`) · کامنت‌های «چرامحور» فارسی.

---

## ۵) برنامهٔ اقدام پیشنهادی

### امروز
1. `revoke ... from anon` روی ۹ تابع `admin_list_*` + گارد `is_staff()`؛ سپس rotate کلیدها.
2. تغییر رمز ادمین/مشتری نمونه و حذف اعتبارنامه از E2E.
3. انتقال `.env` به `.env.local`.
4. برگرداندن اسکریپت‌های `lint`/`test` و نصب eslint.

### این هفته
5. یک‌منبعی‌کردن کیف پول (خواندن `wallet_balance` + بازخوانی بعد از تراکنش).
6. جریان واقعی پرداخت (intent → callback → verify).
7. `fetch('/functions/v1/...')` را absolute کنید.
8. `exchangeCodeForSession` + صفحهٔ «رمز جدید».

### این ماه
9. حذف دادهٔ دمو از مسیر تولید و شکستن فایل‌های غول.
10. تولید تایپ از Supabase و حذف تدریجی `any` در mapperها.
11. `git rm -r --cached node_modules dist test-results` + پاک‌سازی `.dbg/.kilo/.trae/Continue`.
12. حذف `DEFAULT_SYSTEM_USERS` و `hashPassword` مرده.

---

## ۶) محدودیت‌های این بررسی

* به دیتابیس زندهٔ Supabase وصل نشدم و توابع `admin_list_*` را واقعاً صدا نزدم (این کار داده‌های مشتریان را بیرون می‌کشد). شدت P0-1 از روی تعریف مهاجرت‌ها و گرنت‌هاست و قطعی است.
* اجرای E2E پلی‌رایت انجام نشد (نیازمند Chrome ویندوزی، سرور dev و اعتبارنامهٔ واقعی).
* پوشش تست SQL (`scripts/db-test.ps1`) نیازمند کانتینر Postgres بود و اجرا نشد.

---

## ۷) اصلاحات اعمال‌شده (۱۴۰۵/۰۷/۲۵)

هدف: قطع‌شدن دانلود باندل با `ERR_CONNECTION_RESET` روی `hamyar.pardismms.workers.dev`. اندازه‌گیری‌ها روی همین مخزن انجام شده است.

| # | تغییر | فایل | اثر |
|---|---|---|---|
| ۱ | Code splitting در سطح مسیر (۴۹ صفحه با `React.lazy`) | [src/App.tsx](../src/App.tsx) | JS اولیه از **۲٬۱۴۸ KB به ۹۴۴ KB** (gzip: ۵۱۲ → ۲۶۸) |
| ۲ | تفکیک chunkهای وابستگی | [vite.config.js](../vite.config.js) | ۵۶ chunk؛ نمودارها (۳۶۰ KB) فقط در صفحهٔ تحلیل |
| ۳ | `lazyRoute` با ترمیم خطای شبکه | [src/utils/lazyRoute.ts](../src/utils/lazyRoute.ts) | شکست دانلود یک chunk → یک reload خودکار (نه صفحهٔ سفید) |
| ۴ | `Suspense` داخل Layoutها | [PublicLayout](../src/components/PublicLayout.tsx) / [AdminLayout](../src/components/AdminLayout.tsx) | نوار و فوتر هنگام بارگذاری صفحه حذف نمی‌شوند |
| ۵ | اصلاح `env.ASSETS.get` → `fetch` + fallback درست SPA | [src/index.js](../src/index.js) | رفرش روی `/admin/orders` دیگر ۴۰۴ نمی‌دهد |
| ۶ | هدرهای کش (`immutable` برای `/assets/*`، `no-cache` برای HTML) | [public/_headers](../public/_headers) | بازدید دوم عملاً بدون دانلود باندل |
| ۷ | حذف FontAwesome (cdnjs) و `@import` فونت | [index.html](../index.html) | حذف دو درخواست render-blocking خارجی |
| ۸ | فاوآیکون درون‌خطی + اسپینر CSS | [index.html](../index.html) | حذف ۴۰۴ فاوآیکون و صفحهٔ سفید تا اجرای React |

**اعتبارسنجی:** `tsc --noEmit` پاس · `vitest` ۲۰۷/۲۰۷ پاس · `vite build` موفق · تست دود مرورگر (Chrome headless) روی ۱۱ مسیر: صفر خطای کنسول (قبلاً یک ۴۰۴ داشت).

### گام‌های استقرار

```powershell
npm run build
npx wrangler deploy
```

سپس یک **Custom Domain** به Worker وصل کنید (توضیح در wrangler.toml). تا وقتی سایت روی `*.workers.dev` است، برخی اپراتورها همچنان اتصال را ریست می‌کنند؛ این تنها بخشی است که باید از داشبورد Cloudflare انجام شود.

### موارد بازِ باقی‌مانده

* تصاویر بعضی محصولات/مدیا روی `image.qwenlm.ai` هاست شده‌اند (هاست موقت تولید تصویر) و در مرورگر با `ERR_BLOCKED_BY_ORB` رد می‌شوند. باید در باکت `images` سوپابیس آپلود و آدرس‌ها به‌روزرسانی شوند.
* موارد P0 گزارش (توابع `admin_list_*`، سکرت‌ها، رمز ادمین در E2E، کیف پول دو‌منبعی) هنوز باز هستند.
