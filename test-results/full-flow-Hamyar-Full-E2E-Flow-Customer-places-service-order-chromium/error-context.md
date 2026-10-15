# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full-flow.test.ts >> Hamyar Full E2E Flow >> Customer places service order
- Location: e2e\full-flow.test.ts:58:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('.service-card, [data-testid="service-card"], button:has-text("سفارش")') to be visible

```

# Page snapshot

```yaml
- generic [ref=f1e2]:
  - generic [ref=f1e3]:
    - navigation [ref=f1e4]:
      - generic [ref=f1e6]:
        - link "H کافی نت همیار" [ref=f1e7] [cursor=pointer]:
          - /url: /
          - generic [ref=f1e8]: H
          - generic [ref=f1e9]: کافی نت همیار
        - generic [ref=f1e10]:
          - link "صفحه اصلی" [ref=f1e11] [cursor=pointer]:
            - /url: /
          - link "خدمات کافی‌نت" [ref=f1e12] [cursor=pointer]:
            - /url: /services
          - link "کالکشن فیلم و سریال" [ref=f1e13] [cursor=pointer]:
            - /url: /media
          - link "فروشگاه" [ref=f1e14] [cursor=pointer]:
            - /url: /store
          - link "طراحی سایت" [ref=f1e15] [cursor=pointer]:
            - /url: /webdesign
          - link "تولید محتوا" [ref=f1e16] [cursor=pointer]:
            - /url: /content
          - link "اینترنت آسیاتک" [ref=f1e17] [cursor=pointer]:
            - /url: /asiatech
          - link "پیگیری سفارش" [ref=f1e18] [cursor=pointer]:
            - /url: /track
          - link "سوالات متداول" [ref=f1e19] [cursor=pointer]:
            - /url: /faq
          - link "اخبار" [ref=f1e20] [cursor=pointer]:
            - /url: /news
          - link "درباره ما" [ref=f1e21] [cursor=pointer]:
            - /url: /about
          - link "تماس با ما" [ref=f1e22] [cursor=pointer]:
            - /url: /contact
        - generic [ref=f1e23]:
          - button [ref=f1e24]
          - link "ورود / ثبت‌نام" [ref=f1e27] [cursor=pointer]:
            - /url: /auth
    - main [ref=f1e28]:
      - generic [ref=f1e29]:
        - generic [ref=f1e30]:
          - img "خدمات کافی‌نت همیار" [ref=f1e31]
          - generic [ref=f1e33]:
            - heading "خدمات کافی‌نت همیار" [level=1] [ref=f1e34]
            - paragraph [ref=f1e35]: لیست کامل خدمات و تعرفه‌ها
        - generic [ref=f1e36]:
          - generic [ref=f1e37]:
            - textbox "جستجو در خدمات..." [ref=f1e42]
            - combobox [ref=f1e43]:
              - option "مرتب‌سازی" [selected]
              - option "ارزان‌ترین"
              - option "گران‌ترین"
              - option "نام خدمت"
            - button "فیلترها" [ref=f1e44]
          - paragraph [ref=f1e47]: 61 خدمت یافت شد
          - generic [ref=f1e48]:
            - generic [ref=f1e49]:
              - generic [ref=f1e50]:
                - generic [ref=f1e51]:
                  - generic [ref=f1e52]: 🖨️
                  - heading "پرینت سیاه و سفید A4" [level=3] [ref=f1e53]
                - generic [ref=f1e54]: پرینت
              - paragraph [ref=f1e55]: پرینت سیاه و سفید روی کاغذ A4
              - generic [ref=f1e56]:
                - generic [ref=f1e57]:
                  - text: ۲٬۰۰۰ تومان
                  - generic [ref=f1e58]: / برگ
                - link "ثبت سفارش" [ref=f1e59] [cursor=pointer]:
                  - /url: /services/s1
            - generic [ref=f1e62]:
              - generic [ref=f1e63]:
                - generic [ref=f1e64]:
                  - generic [ref=f1e65]: 🖨️
                  - heading "پرینت رنگی A4" [level=3] [ref=f1e66]
                - generic [ref=f1e67]: پرینت
              - paragraph [ref=f1e68]: پرینت رنگی با کیفیت بالا
              - generic [ref=f1e69]:
                - generic [ref=f1e70]:
                  - text: ۵٬۰۰۰ تومان
                  - generic [ref=f1e71]: / برگ
                - link "ثبت سفارش" [ref=f1e72] [cursor=pointer]:
                  - /url: /services/s2
            - generic [ref=f1e75]:
              - generic [ref=f1e76]:
                - generic [ref=f1e77]:
                  - generic [ref=f1e78]: 🖨️
                  - heading "پرینت عکس ۱۰×۱۵" [level=3] [ref=f1e79]
                - generic [ref=f1e80]: پرینت
              - paragraph [ref=f1e81]: چاپ عکس در ابعاد ۱۰ در ۱۵
              - generic [ref=f1e82]:
                - generic [ref=f1e83]:
                  - text: ۸٬۰۰۰ تومان
                  - generic [ref=f1e84]: / عدد
                - link "ثبت سفارش" [ref=f1e85] [cursor=pointer]:
                  - /url: /services/s3
            - generic [ref=f1e88]:
              - generic [ref=f1e89]:
                - generic [ref=f1e90]:
                  - generic [ref=f1e91]: 📄
                  - heading "اسکن سند" [level=3] [ref=f1e92]
                - generic [ref=f1e93]: اسکن
              - paragraph [ref=f1e94]: اسکن با کیفیت ۳۰۰ DPI
              - generic [ref=f1e95]:
                - generic [ref=f1e96]:
                  - text: ۵٬۰۰۰ تومان
                  - generic [ref=f1e97]: / برگ
                - link "ثبت سفارش" [ref=f1e98] [cursor=pointer]:
                  - /url: /services/s4
            - generic [ref=f1e101]:
              - generic [ref=f1e102]:
                - generic [ref=f1e103]:
                  - generic [ref=f1e104]: 📄
                  - heading "اسکن عکس" [level=3] [ref=f1e105]
                - generic [ref=f1e106]: اسکن
              - paragraph [ref=f1e107]: اسکن عکس با کیفیت بالا
              - generic [ref=f1e108]:
                - generic [ref=f1e109]:
                  - text: ۱۰٬۰۰۰ تومان
                  - generic [ref=f1e110]: / عدد
                - link "ثبت سفارش" [ref=f1e111] [cursor=pointer]:
                  - /url: /services/s5
            - generic [ref=f1e114]:
              - generic [ref=f1e115]:
                - generic [ref=f1e116]:
                  - generic [ref=f1e117]: ⌨️
                  - heading "تایپ فارسی" [level=3] [ref=f1e118]
                - generic [ref=f1e119]: تایپ
              - paragraph [ref=f1e120]: تایپ متن فارسی در Word
              - generic [ref=f1e121]:
                - generic [ref=f1e122]:
                  - text: ۱۵٬۰۰۰ تومان
                  - generic [ref=f1e123]: / صفحه
                - link "ثبت سفارش" [ref=f1e124] [cursor=pointer]:
                  - /url: /services/s6
            - generic [ref=f1e127]:
              - generic [ref=f1e128]:
                - generic [ref=f1e129]:
                  - generic [ref=f1e130]: ⌨️
                  - heading "تایپ انگلیسی" [level=3] [ref=f1e131]
                - generic [ref=f1e132]: تایپ
              - paragraph [ref=f1e133]: تایپ متن انگلیسی
              - generic [ref=f1e134]:
                - generic [ref=f1e135]:
                  - text: ۲۰٬۰۰۰ تومان
                  - generic [ref=f1e136]: / صفحه
                - link "ثبت سفارش" [ref=f1e137] [cursor=pointer]:
                  - /url: /services/s7
            - generic [ref=f1e140]:
              - generic [ref=f1e141]:
                - generic [ref=f1e142]:
                  - generic [ref=f1e143]: 🌐
                  - heading "ترجمه فارسی به انگلیسی" [level=3] [ref=f1e144]
                - generic [ref=f1e145]: ترجمه
              - paragraph [ref=f1e146]: ترجمه تخصصی فارسی به انگلیسی
              - generic [ref=f1e147]:
                - generic [ref=f1e148]:
                  - text: ۵۰٬۰۰۰ تومان
                  - generic [ref=f1e149]: / صفحه
                - link "ثبت سفارش" [ref=f1e150] [cursor=pointer]:
                  - /url: /services/s8
            - generic [ref=f1e153]:
              - generic [ref=f1e154]:
                - generic [ref=f1e155]:
                  - generic [ref=f1e156]: 🌐
                  - heading "ترجمه انگلیسی به فارسی" [level=3] [ref=f1e157]
                - generic [ref=f1e158]: ترجمه
              - paragraph [ref=f1e159]: ترجمه تخصصی انگلیسی به فارسی
              - generic [ref=f1e160]:
                - generic [ref=f1e161]:
                  - text: ۴۵٬۰۰۰ تومان
                  - generic [ref=f1e162]: / صفحه
                - link "ثبت سفارش" [ref=f1e163] [cursor=pointer]:
                  - /url: /services/s9
            - generic [ref=f1e166]:
              - generic [ref=f1e167]:
                - generic [ref=f1e168]:
                  - generic [ref=f1e169]: 📝
                  - heading "ثبت‌نام اینترنتی" [level=3] [ref=f1e170]
                - generic [ref=f1e171]: ثبت‌نام
              - paragraph [ref=f1e172]: ثبت‌نام در سایت‌های دولتی و دانشگاهی
              - generic [ref=f1e173]:
                - generic [ref=f1e174]:
                  - text: ۳۰٬۰۰۰ تومان
                  - generic [ref=f1e175]: / مورد
                - link "ثبت سفارش" [ref=f1e176] [cursor=pointer]:
                  - /url: /services/s10
            - generic [ref=f1e179]:
              - generic [ref=f1e180]:
                - generic [ref=f1e181]:
                  - generic [ref=f1e182]: 📋
                  - heading "طراحی رزومه" [level=3] [ref=f1e183]
                - generic [ref=f1e184]: رزومه
              - paragraph [ref=f1e185]: طراحی رزومه حرفه‌ای
              - generic [ref=f1e186]:
                - generic [ref=f1e187]:
                  - text: ۸۰٬۰۰۰ تومان
                  - generic [ref=f1e188]: / مورد
                - link "ثبت سفارش" [ref=f1e189] [cursor=pointer]:
                  - /url: /services/s11
            - generic [ref=f1e192]:
              - generic [ref=f1e193]:
                - generic [ref=f1e194]:
                  - generic [ref=f1e195]: 📋
                  - heading "ویرایش رزومه" [level=3] [ref=f1e196]
                - generic [ref=f1e197]: رزومه
              - paragraph [ref=f1e198]: ویرایش و بهینه‌سازی رزومه
              - generic [ref=f1e199]:
                - generic [ref=f1e200]:
                  - text: ۴۰٬۰۰۰ تومان
                  - generic [ref=f1e201]: / مورد
                - link "ثبت سفارش" [ref=f1e202] [cursor=pointer]:
                  - /url: /services/s12
            - generic [ref=f1e205]:
              - generic [ref=f1e206]:
                - generic [ref=f1e207]:
                  - generic [ref=f1e208]: 📑
                  - heading "کپی فایل روی فلش" [level=3] [ref=f1e209]
                - generic [ref=f1e210]: کپی
              - paragraph [ref=f1e211]: کپی فایل‌ها روی فلش مموری
              - generic [ref=f1e212]:
                - generic [ref=f1e213]:
                  - text: ۱۰٬۰۰۰ تومان
                  - generic [ref=f1e214]: / فایل
                - link "ثبت سفارش" [ref=f1e215] [cursor=pointer]:
                  - /url: /services/s13
            - generic [ref=f1e218]:
              - generic [ref=f1e219]:
                - generic [ref=f1e220]:
                  - generic [ref=f1e221]: 💿
                  - heading "نصب ویندوز" [level=3] [ref=f1e222]
                - generic [ref=f1e223]: نصب
              - paragraph [ref=f1e224]: نصب ویندوز ۱۰ یا ۱۱
              - generic [ref=f1e225]:
                - generic [ref=f1e226]:
                  - text: ۱۰۰٬۰۰۰ تومان
                  - generic [ref=f1e227]: / مورد
                - link "ثبت سفارش" [ref=f1e228] [cursor=pointer]:
                  - /url: /services/s14
            - generic [ref=f1e231]:
              - generic [ref=f1e232]:
                - generic [ref=f1e233]:
                  - generic [ref=f1e234]: 💿
                  - heading "نصب نرم‌افزار" [level=3] [ref=f1e235]
                - generic [ref=f1e236]: نصب
              - paragraph [ref=f1e237]: نصب نرم‌افزارهای کاربردی
              - generic [ref=f1e238]:
                - generic [ref=f1e239]:
                  - text: ۳۰٬۰۰۰ تومان
                  - generic [ref=f1e240]: / نرم‌افزار
                - link "ثبت سفارش" [ref=f1e241] [cursor=pointer]:
                  - /url: /services/s15
            - generic [ref=f1e244]:
              - generic [ref=f1e245]:
                - generic [ref=f1e246]:
                  - generic [ref=f1e247]: 📑
                  - heading "فتوکپی" [level=3] [ref=f1e248]
                - generic [ref=f1e249]: کپی
              - paragraph [ref=f1e250]: فتوکپی اسناد و مدارک
              - generic [ref=f1e251]:
                - generic [ref=f1e252]:
                  - text: ۳٬۰۰۰ تومان
                  - generic [ref=f1e253]: / برگ
                - link "ثبت سفارش" [ref=f1e254] [cursor=pointer]:
                  - /url: /services/s16
            - generic [ref=f1e257]:
              - generic [ref=f1e258]:
                - generic [ref=f1e259]:
                  - generic [ref=f1e260]: 📃
                  - heading "لمینت A4" [level=3] [ref=f1e261]
                - generic [ref=f1e262]: لمینت
              - paragraph [ref=f1e263]: لمینت کردن اسناد A4
              - generic [ref=f1e264]:
                - generic [ref=f1e265]:
                  - text: ۱۵٬۰۰۰ تومان
                  - generic [ref=f1e266]: / برگ
                - link "ثبت سفارش" [ref=f1e267] [cursor=pointer]:
                  - /url: /services/s17
            - generic [ref=f1e270]:
              - generic [ref=f1e271]:
                - generic [ref=f1e272]:
                  - generic [ref=f1e273]: 📚
                  - heading "صحافی" [level=3] [ref=f1e274]
                - generic [ref=f1e275]: صحافی
              - paragraph [ref=f1e276]: صحافی پایان‌نامه و جزوه
              - generic [ref=f1e277]:
                - generic [ref=f1e278]:
                  - text: ۲۵٬۰۰۰ تومان
                  - generic [ref=f1e279]: / مورد
                - link "ثبت سفارش" [ref=f1e280] [cursor=pointer]:
                  - /url: /services/s18
            - generic [ref=f1e283]:
              - generic [ref=f1e284]:
                - generic [ref=f1e285]:
                  - generic [ref=f1e286]: 📊
                  - heading "ساخت پاورپوینت" [level=3] [ref=f1e287]
                - generic [ref=f1e288]: ارائه
              - paragraph [ref=f1e289]: طراحی اسلاید حرفه‌ای
              - generic [ref=f1e290]:
                - generic [ref=f1e291]:
                  - text: ۶۰٬۰۰۰ تومان
                  - generic [ref=f1e292]: / اسلاید
                - link "ثبت سفارش" [ref=f1e293] [cursor=pointer]:
                  - /url: /services/s19
            - generic [ref=f1e296]:
              - generic [ref=f1e297]:
                - generic [ref=f1e298]:
                  - generic [ref=f1e299]: 🔄
                  - heading "تبدیل فرمت فایل" [level=3] [ref=f1e300]
                - generic [ref=f1e301]: تبدیل
              - paragraph [ref=f1e302]: تبدیل فرمت فایل‌های مختلف
              - generic [ref=f1e303]:
                - generic [ref=f1e304]:
                  - text: ۱۰٬۰۰۰ تومان
                  - generic [ref=f1e305]: / فایل
                - link "ثبت سفارش" [ref=f1e306] [cursor=pointer]:
                  - /url: /services/s20
            - generic [ref=f1e309]:
              - generic [ref=f1e310]:
                - generic [ref=f1e311]:
                  - generic [ref=f1e312]: 📝
                  - heading "ثبت‌نام آزمون سراسری" [level=3] [ref=f1e313]
                - generic [ref=f1e314]: ثبت‌نام
              - paragraph [ref=f1e315]: ثبت‌نام آنلاین در آزمون‌های سراسری، ارشد و دکتری
              - generic [ref=f1e316]:
                - generic [ref=f1e317]:
                  - text: ۵۰٬۰۰۰ تومان
                  - generic [ref=f1e318]: / مورد
                - link "ثبت سفارش" [ref=f1e319] [cursor=pointer]:
                  - /url: /services/s21
            - generic [ref=f1e322]:
              - generic [ref=f1e323]:
                - generic [ref=f1e324]:
                  - generic [ref=f1e325]: 🎖️
                  - heading "خدمات نظام وظیفه" [level=3] [ref=f1e326]
                - generic [ref=f1e327]: نظام وظیفه
              - paragraph [ref=f1e328]: ثبت درخواست، تعیین وضعیت و پیگیری امور نظام وظیفه
              - generic [ref=f1e329]:
                - generic [ref=f1e330]:
                  - text: ۳۵٬۰۰۰ تومان
                  - generic [ref=f1e331]: / مورد
                - link "ثبت سفارش" [ref=f1e332] [cursor=pointer]:
                  - /url: /services/s22
            - generic [ref=f1e335]:
              - generic [ref=f1e336]:
                - generic [ref=f1e337]:
                  - generic [ref=f1e338]: 📝
                  - heading "ثبت‌نام کنکور" [level=3] [ref=f1e339]
                - generic [ref=f1e340]: ثبت‌نام
              - paragraph [ref=f1e341]: ثبت‌نام و ویرایش اطلاعات کنکور سراسری
              - generic [ref=f1e342]:
                - generic [ref=f1e343]:
                  - text: ۶۰٬۰۰۰ تومان
                  - generic [ref=f1e344]: / مورد
                - link "ثبت سفارش" [ref=f1e345] [cursor=pointer]:
                  - /url: /services/s23
            - generic [ref=f1e348]:
              - generic [ref=f1e349]:
                - generic [ref=f1e350]:
                  - generic [ref=f1e351]: ⚖️
                  - heading "خدمات ثنا (قوه قضاییه)" [level=3] [ref=f1e352]
                - generic [ref=f1e353]: قوه قضاییه
              - paragraph [ref=f1e354]: ثبت‌نام و احراز هویت در سامانه ثنا
              - generic [ref=f1e355]:
                - generic [ref=f1e356]:
                  - text: ۴۵٬۰۰۰ تومان
                  - generic [ref=f1e357]: / مورد
                - link "ثبت سفارش" [ref=f1e358] [cursor=pointer]:
                  - /url: /services/s24
            - generic [ref=f1e361]:
              - generic [ref=f1e362]:
                - generic [ref=f1e363]:
                  - generic [ref=f1e364]: 🖨️
                  - heading "پرینت و اسکن اسناد" [level=3] [ref=f1e365]
                - generic [ref=f1e366]: پرینت
              - paragraph [ref=f1e367]: پرینت رنگی و سیاه‌وسفید، اسکن با کیفیت بالا
              - generic [ref=f1e368]:
                - generic [ref=f1e369]:
                  - text: ۵٬۰۰۰ تومان
                  - generic [ref=f1e370]: / برگ
                - link "ثبت سفارش" [ref=f1e371] [cursor=pointer]:
                  - /url: /services/s25
            - generic [ref=f1e374]:
              - generic [ref=f1e375]:
                - generic [ref=f1e376]:
                  - generic [ref=f1e377]: 🌐
                  - heading "ترجمه رسمی" [level=3] [ref=f1e378]
                - generic [ref=f1e379]: ترجمه
              - paragraph [ref=f1e380]: ترجمه رسمی اسناد با مهر مترجم
              - generic [ref=f1e381]:
                - generic [ref=f1e382]:
                  - text: ۱۵۰٬۰۰۰ تومان
                  - generic [ref=f1e383]: / صفحه
                - link "ثبت سفارش" [ref=f1e384] [cursor=pointer]:
                  - /url: /services/s26
            - generic [ref=f1e387]:
              - generic [ref=f1e388]:
                - generic [ref=f1e389]:
                  - generic [ref=f1e390]: 💰
                  - heading "امور مالیاتی" [level=3] [ref=f1e391]
                - generic [ref=f1e392]: مالیاتی
              - paragraph [ref=f1e393]: تشکیل پرونده مالیاتی، ارسال اظهارنامه و پیگیری
              - generic [ref=f1e394]:
                - generic [ref=f1e395]:
                  - text: ۸۰٬۰۰۰ تومان
                  - generic [ref=f1e396]: / مورد
                - link "ثبت سفارش" [ref=f1e397] [cursor=pointer]:
                  - /url: /services/s27
            - generic [ref=f1e400]:
              - generic [ref=f1e401]:
                - generic [ref=f1e402]:
                  - generic [ref=f1e403]: 🛡️
                  - heading "بیمه شخص ثالث" [level=3] [ref=f1e404]
                - generic [ref=f1e405]: بیمه
              - paragraph [ref=f1e406]: صدور و تمدید بیمه‌نامه شخص ثالث خودرو
              - generic [ref=f1e407]:
                - generic [ref=f1e408]:
                  - text: ۴۰٬۰۰۰ تومان
                  - generic [ref=f1e409]: / مورد
                - link "ثبت سفارش" [ref=f1e410] [cursor=pointer]:
                  - /url: /services/s28
            - generic [ref=f1e413]:
              - generic [ref=f1e414]:
                - generic [ref=f1e415]:
                  - generic [ref=f1e416]: 📱
                  - heading "شارژ و بسته اینترنت" [level=3] [ref=f1e417]
                - generic [ref=f1e418]: شارژ
              - paragraph [ref=f1e419]: خرید شارژ و بسته اینترنت تمامی اپراتورها
              - generic [ref=f1e420]:
                - generic [ref=f1e421]:
                  - text: ۱۰٬۰۰۰ تومان
                  - generic [ref=f1e422]: / مورد
                - link "ثبت سفارش" [ref=f1e423] [cursor=pointer]:
                  - /url: /services/s29
            - generic [ref=f1e426]:
              - generic [ref=f1e427]:
                - generic [ref=f1e428]:
                  - generic [ref=f1e429]: 👮
                  - heading "پلیس +۱۰" [level=3] [ref=f1e430]
                - generic [ref=f1e431]: پلیس +۱۰
              - paragraph [ref=f1e432]: خدمات گذرنامه، گواهینامه و کارت پایان خدمت
              - generic [ref=f1e433]:
                - generic [ref=f1e434]:
                  - text: ۵۵٬۰۰۰ تومان
                  - generic [ref=f1e435]: / مورد
                - link "ثبت سفارش" [ref=f1e436] [cursor=pointer]:
                  - /url: /services/s30
            - generic [ref=f1e439]:
              - generic [ref=f1e440]:
                - generic [ref=f1e441]:
                  - generic [ref=f1e442]: ⌨️
                  - heading "تایپ و صفحه‌آرایی" [level=3] [ref=f1e443]
                - generic [ref=f1e444]: تایپ
              - paragraph [ref=f1e445]: تایپ حرفه‌ای متون، پایان‌نامه و صفحه‌آرایی
              - generic [ref=f1e446]:
                - generic [ref=f1e447]:
                  - text: ۱۰٬۰۰۰ تومان
                  - generic [ref=f1e448]: / صفحه
                - link "ثبت سفارش" [ref=f1e449] [cursor=pointer]:
                  - /url: /services/s31
            - generic [ref=f1e452]:
              - generic [ref=f1e453]:
                - generic [ref=f1e454]:
                  - generic [ref=f1e455]: 💵
                  - heading "سهام عدالت" [level=3] [ref=f1e456]
                - generic [ref=f1e457]: مالی
              - paragraph [ref=f1e458]: مشاهده، فروش و مدیریت سهام عدالت
              - generic [ref=f1e459]:
                - generic [ref=f1e460]:
                  - text: ۲۵٬۰۰۰ تومان
                  - generic [ref=f1e461]: / مورد
                - link "ثبت سفارش" [ref=f1e462] [cursor=pointer]:
                  - /url: /services/s32
            - generic [ref=f1e465]:
              - generic [ref=f1e466]:
                - generic [ref=f1e467]:
                  - generic [ref=f1e468]: 🏦
                  - heading "افتتاح حساب بانکی" [level=3] [ref=f1e469]
                - generic [ref=f1e470]: بانکی
              - paragraph [ref=f1e471]: افتتاح حساب آنلاین در بانک‌های مختلف
              - generic [ref=f1e472]:
                - generic [ref=f1e473]:
                  - text: ۳۰٬۰۰۰ تومان
                  - generic [ref=f1e474]: / مورد
                - link "ثبت سفارش" [ref=f1e475] [cursor=pointer]:
                  - /url: /services/s33
            - generic [ref=f1e478]:
              - generic [ref=f1e479]:
                - generic [ref=f1e480]:
                  - generic [ref=f1e481]: 🛡️
                  - heading "بیمه عمر و زندگی" [level=3] [ref=f1e482]
                - generic [ref=f1e483]: بیمه
              - paragraph [ref=f1e484]: صدور بیمه‌نامه عمر و زندگی
              - generic [ref=f1e485]:
                - generic [ref=f1e486]:
                  - text: ۵۰٬۰۰۰ تومان
                  - generic [ref=f1e487]: / مورد
                - link "ثبت سفارش" [ref=f1e488] [cursor=pointer]:
                  - /url: /services/s34
            - generic [ref=f1e491]:
              - generic [ref=f1e492]:
                - generic [ref=f1e493]:
                  - generic [ref=f1e494]: 🌐
                  - heading "ترجمه غیررسمی" [level=3] [ref=f1e495]
                - generic [ref=f1e496]: ترجمه
              - paragraph [ref=f1e497]: ترجمه متون و اسناد غیررسمی
              - generic [ref=f1e498]:
                - generic [ref=f1e499]:
                  - text: ۵۰٬۰۰۰ تومان
                  - generic [ref=f1e500]: / صفحه
                - link "ثبت سفارش" [ref=f1e501] [cursor=pointer]:
                  - /url: /services/s35
            - generic [ref=f1e504]:
              - generic [ref=f1e505]:
                - generic [ref=f1e506]:
                  - generic [ref=f1e507]: ⚖️
                  - heading "گواهی عدم سوءپیشینه" [level=3] [ref=f1e508]
                - generic [ref=f1e509]: قوه قضاییه
              - paragraph [ref=f1e510]: دریافت گواهی عدم سوءپیشینه کیفری
              - generic [ref=f1e511]:
                - generic [ref=f1e512]:
                  - text: ۶۰٬۰۰۰ تومان
                  - generic [ref=f1e513]: / مورد
                - link "ثبت سفارش" [ref=f1e514] [cursor=pointer]:
                  - /url: /services/s36
            - generic [ref=f1e517]:
              - generic [ref=f1e518]:
                - generic [ref=f1e519]:
                  - generic [ref=f1e520]: ⚖️
                  - heading "تنظیم قرارداد" [level=3] [ref=f1e521]
                - generic [ref=f1e522]: حقوقی
              - paragraph [ref=f1e523]: تنظیم و نگارش انواع قراردادها
              - generic [ref=f1e524]:
                - generic [ref=f1e525]:
                  - text: ۱۰۰٬۰۰۰ تومان
                  - generic [ref=f1e526]: / مورد
                - link "ثبت سفارش" [ref=f1e527] [cursor=pointer]:
                  - /url: /services/s37
            - generic [ref=f1e530]:
              - generic [ref=f1e531]:
                - generic [ref=f1e532]:
                  - generic [ref=f1e533]: 💳
                  - heading "پرداخت قبوض" [level=3] [ref=f1e534]
                - generic [ref=f1e535]: قبوض
              - paragraph [ref=f1e536]: پرداخت قبض آب، برق، گاز و تلفن
              - generic [ref=f1e537]:
                - generic [ref=f1e538]:
                  - text: ۵٬۰۰۰ تومان
                  - generic [ref=f1e539]: / قبض
                - link "ثبت سفارش" [ref=f1e540] [cursor=pointer]:
                  - /url: /services/s38
            - generic [ref=f1e543]:
              - generic [ref=f1e544]:
                - generic [ref=f1e545]:
                  - generic [ref=f1e546]: 💰
                  - heading "اظهارنامه مالیاتی" [level=3] [ref=f1e547]
                - generic [ref=f1e548]: مالیاتی
              - paragraph [ref=f1e549]: تنظیم و ارسال اظهارنامه مالیاتی
              - generic [ref=f1e550]:
                - generic [ref=f1e551]:
                  - text: ۱۵۰٬۰۰۰ تومان
                  - generic [ref=f1e552]: / مورد
                - link "ثبت سفارش" [ref=f1e553] [cursor=pointer]:
                  - /url: /services/s39
            - generic [ref=f1e556]:
              - generic [ref=f1e557]:
                - generic [ref=f1e558]:
                  - generic [ref=f1e559]: 📝
                  - heading "ثبت نام کارت سوخت" [level=3] [ref=f1e560]
                - generic [ref=f1e561]: ثبت‌نام
              - paragraph [ref=f1e562]: درخواست صدور کارت سوخت المثنی
              - generic [ref=f1e563]:
                - generic [ref=f1e564]:
                  - text: ۴۰٬۰۰۰ تومان
                  - generic [ref=f1e565]: / مورد
                - link "ثبت سفارش" [ref=f1e566] [cursor=pointer]:
                  - /url: /services/s40
            - generic [ref=f1e569]:
              - generic [ref=f1e570]:
                - generic [ref=f1e571]:
                  - generic [ref=f1e572]: 💡
                  - heading "انتخاب رشته کنکور" [level=3] [ref=f1e573]
                - generic [ref=f1e574]: مشاوره
              - paragraph [ref=f1e575]: مشاوره و انتخاب رشته دانشگاه
              - generic [ref=f1e576]:
                - generic [ref=f1e577]:
                  - text: ۸۰٬۰۰۰ تومان
                  - generic [ref=f1e578]: / مورد
                - link "ثبت سفارش" [ref=f1e579] [cursor=pointer]:
                  - /url: /services/s41
            - generic [ref=f1e582]:
              - generic [ref=f1e583]:
                - generic [ref=f1e584]:
                  - generic [ref=f1e585]: 🛡️
                  - heading "بیمه مسافرتی" [level=3] [ref=f1e586]
                - generic [ref=f1e587]: بیمه
              - paragraph [ref=f1e588]: صدور بیمه‌نامه مسافرتی خارجی
              - generic [ref=f1e589]:
                - generic [ref=f1e590]:
                  - text: ۳۵٬۰۰۰ تومان
                  - generic [ref=f1e591]: / مورد
                - link "ثبت سفارش" [ref=f1e592] [cursor=pointer]:
                  - /url: /services/s42
            - generic [ref=f1e595]:
              - generic [ref=f1e596]:
                - generic [ref=f1e597]:
                  - generic [ref=f1e598]: ⚖️
                  - heading "وکالت‌نامه رسمی" [level=3] [ref=f1e599]
                - generic [ref=f1e600]: حقوقی
              - paragraph [ref=f1e601]: تنظیم و ثبت وکالت‌نامه رسمی
              - generic [ref=f1e602]:
                - generic [ref=f1e603]:
                  - text: ۱۲۰٬۰۰۰ تومان
                  - generic [ref=f1e604]: / مورد
                - link "ثبت سفارش" [ref=f1e605] [cursor=pointer]:
                  - /url: /services/s43
            - generic [ref=f1e608]:
              - generic [ref=f1e609]:
                - generic [ref=f1e610]:
                  - generic [ref=f1e611]: 📡
                  - heading "سیم‌کارت دائمی" [level=3] [ref=f1e612]
                - generic [ref=f1e613]: مخابرات
              - paragraph [ref=f1e614]: خرید و انتقال سیم‌کارت دائمی
              - generic [ref=f1e615]:
                - generic [ref=f1e616]:
                  - text: ۴۵٬۰۰۰ تومان
                  - generic [ref=f1e617]: / مورد
                - link "ثبت سفارش" [ref=f1e618] [cursor=pointer]:
                  - /url: /services/s44
            - generic [ref=f1e621]:
              - generic [ref=f1e622]:
                - generic [ref=f1e623]:
                  - generic [ref=f1e624]: 💻
                  - heading "طراحی سایت" [level=3] [ref=f1e625]
                - generic [ref=f1e626]: طراحی
              - paragraph [ref=f1e627]: طراحی و راه‌اندازی وب‌سایت
              - generic [ref=f1e628]:
                - generic [ref=f1e629]:
                  - text: ۵۰۰٬۰۰۰ تومان
                  - generic [ref=f1e630]: / پروژه
                - link "ثبت سفارش" [ref=f1e631] [cursor=pointer]:
                  - /url: /services/s45
            - generic [ref=f1e634]:
              - generic [ref=f1e635]:
                - generic [ref=f1e636]:
                  - generic [ref=f1e637]: 📚
                  - heading "صحافی و شیرازه" [level=3] [ref=f1e638]
                - generic [ref=f1e639]: صحافی
              - paragraph [ref=f1e640]: صحافی پایان‌نامه، کتاب و اسناد
              - generic [ref=f1e641]:
                - generic [ref=f1e642]:
                  - text: ۲۰٬۰۰۰ تومان
                  - generic [ref=f1e643]: / مورد
                - link "ثبت سفارش" [ref=f1e644] [cursor=pointer]:
                  - /url: /services/s46
            - generic [ref=f1e647]:
              - generic [ref=f1e648]:
                - generic [ref=f1e649]:
                  - generic [ref=f1e650]: 📝
                  - heading "ثبت نام یارانه" [level=3] [ref=f1e651]
                - generic [ref=f1e652]: ثبت‌نام
              - paragraph [ref=f1e653]: ثبت‌نام و ویرایش اطلاعات یارانه
              - generic [ref=f1e654]:
                - generic [ref=f1e655]:
                  - text: ۲۰٬۰۰۰ تومان
                  - generic [ref=f1e656]: / مورد
                - link "ثبت سفارش" [ref=f1e657] [cursor=pointer]:
                  - /url: /services/s47
            - generic [ref=f1e660]:
              - generic [ref=f1e661]:
                - generic [ref=f1e662]:
                  - generic [ref=f1e663]: 🏦
                  - heading "وام بانکی" [level=3] [ref=f1e664]
                - generic [ref=f1e665]: بانکی
              - paragraph [ref=f1e666]: درخواست و پیگیری وام بانکی
              - generic [ref=f1e667]:
                - generic [ref=f1e668]:
                  - text: ۷۰٬۰۰۰ تومان
                  - generic [ref=f1e669]: / مورد
                - link "ثبت سفارش" [ref=f1e670] [cursor=pointer]:
                  - /url: /services/s48
            - generic [ref=f1e673]:
              - generic [ref=f1e674]:
                - generic [ref=f1e675]:
                  - generic [ref=f1e676]: 🛡️
                  - heading "بیمه آتش‌سوزی" [level=3] [ref=f1e677]
                - generic [ref=f1e678]: بیمه
              - paragraph [ref=f1e679]: صدور بیمه‌نامه آتش‌سوزی منزل و محل کار
              - generic [ref=f1e680]:
                - generic [ref=f1e681]:
                  - text: ۴۰٬۰۰۰ تومان
                  - generic [ref=f1e682]: / مورد
                - link "ثبت سفارش" [ref=f1e683] [cursor=pointer]:
                  - /url: /services/s49
            - generic [ref=f1e686]:
              - generic [ref=f1e687]:
                - generic [ref=f1e688]:
                  - generic [ref=f1e689]: 🌐
                  - heading "ترجمه فوری" [level=3] [ref=f1e690]
                - generic [ref=f1e691]: ترجمه
              - paragraph [ref=f1e692]: ترجمه فوری اسناد و متون
              - generic [ref=f1e693]:
                - generic [ref=f1e694]:
                  - text: ۲۰۰٬۰۰۰ تومان
                  - generic [ref=f1e695]: / صفحه
                - link "ثبت سفارش" [ref=f1e696] [cursor=pointer]:
                  - /url: /services/s50
            - generic [ref=f1e699]:
              - generic [ref=f1e700]:
                - generic [ref=f1e701]:
                  - generic [ref=f1e702]: ⚖️
                  - heading "گواهی حصر وراثت" [level=3] [ref=f1e703]
                - generic [ref=f1e704]: حقوقی
              - paragraph [ref=f1e705]: دریافت گواهی حصر وراثت
              - generic [ref=f1e706]:
                - generic [ref=f1e707]:
                  - text: ۹۰٬۰۰۰ تومان
                  - generic [ref=f1e708]: / مورد
                - link "ثبت سفارش" [ref=f1e709] [cursor=pointer]:
                  - /url: /services/s51
            - generic [ref=f1e712]:
              - generic [ref=f1e713]:
                - generic [ref=f1e714]:
                  - generic [ref=f1e715]: 📂
                  - heading "فرم‌های اداری" [level=3] [ref=f1e716]
                - generic [ref=f1e717]: اداری
              - paragraph [ref=f1e718]: تکمیل انواع فرم‌های اداری و دولتی
              - generic [ref=f1e719]:
                - generic [ref=f1e720]:
                  - text: ۱۵٬۰۰۰ تومان
                  - generic [ref=f1e721]: / فرم
                - link "ثبت سفارش" [ref=f1e722] [cursor=pointer]:
                  - /url: /services/s52
            - generic [ref=f1e725]:
              - generic [ref=f1e726]:
                - generic [ref=f1e727]:
                  - generic [ref=f1e728]: 💳
                  - heading "قبض موبایل" [level=3] [ref=f1e729]
                - generic [ref=f1e730]: قبوض
              - paragraph [ref=f1e731]: پرداخت قبض سیم‌کارت دائمی
              - generic [ref=f1e732]:
                - generic [ref=f1e733]:
                  - text: ۳٬۰۰۰ تومان
                  - generic [ref=f1e734]: / قبض
                - link "ثبت سفارش" [ref=f1e735] [cursor=pointer]:
                  - /url: /services/s53
            - generic [ref=f1e738]:
              - generic [ref=f1e739]:
                - generic [ref=f1e740]:
                  - generic [ref=f1e741]: 💰
                  - heading "مالیات بر ارزش افزوده" [level=3] [ref=f1e742]
                - generic [ref=f1e743]: مالیاتی
              - paragraph [ref=f1e744]: تنظیم و ارسال اظهارنامه ارزش افزوده
              - generic [ref=f1e745]:
                - generic [ref=f1e746]:
                  - text: ۱۲۰٬۰۰۰ تومان
                  - generic [ref=f1e747]: / مورد
                - link "ثبت سفارش" [ref=f1e748] [cursor=pointer]:
                  - /url: /services/s54
            - generic [ref=f1e751]:
              - generic [ref=f1e752]:
                - generic [ref=f1e753]:
                  - generic [ref=f1e754]: 📝
                  - heading "ثبت نام حج" [level=3] [ref=f1e755]
                - generic [ref=f1e756]: ثبت‌نام
              - paragraph [ref=f1e757]: ثبت‌نام کاروان‌های حج و زیارت
              - generic [ref=f1e758]:
                - generic [ref=f1e759]:
                  - text: ۵۰٬۰۰۰ تومان
                  - generic [ref=f1e760]: / مورد
                - link "ثبت سفارش" [ref=f1e761] [cursor=pointer]:
                  - /url: /services/s55
            - generic [ref=f1e764]:
              - generic [ref=f1e765]:
                - generic [ref=f1e766]:
                  - generic [ref=f1e767]: 📝
                  - heading "ثبت نام مدرسه" [level=3] [ref=f1e768]
                - generic [ref=f1e769]: ثبت‌نام
              - paragraph [ref=f1e770]: ثبت‌نام آنلاین مدارس
              - generic [ref=f1e771]:
                - generic [ref=f1e772]:
                  - text: ۲۵٬۰۰۰ تومان
                  - generic [ref=f1e773]: / مورد
                - link "ثبت سفارش" [ref=f1e774] [cursor=pointer]:
                  - /url: /services/s56
            - generic [ref=f1e777]:
              - generic [ref=f1e778]:
                - generic [ref=f1e779]:
                  - generic [ref=f1e780]: 🛡️
                  - heading "بیمه بدنه خودرو" [level=3] [ref=f1e781]
                - generic [ref=f1e782]: بیمه
              - paragraph [ref=f1e783]: صدور بیمه‌نامه بدنه خودرو
              - generic [ref=f1e784]:
                - generic [ref=f1e785]:
                  - text: ۴۵٬۰۰۰ تومان
                  - generic [ref=f1e786]: / مورد
                - link "ثبت سفارش" [ref=f1e787] [cursor=pointer]:
                  - /url: /services/s57
            - generic [ref=f1e790]:
              - generic [ref=f1e791]:
                - generic [ref=f1e792]:
                  - generic [ref=f1e793]: ⚖️
                  - heading "شکایت کیفری" [level=3] [ref=f1e794]
                - generic [ref=f1e795]: حقوقی
              - paragraph [ref=f1e796]: تنظیم و ثبت شکایت کیفری
              - generic [ref=f1e797]:
                - generic [ref=f1e798]:
                  - text: ۱۵۰٬۰۰۰ تومان
                  - generic [ref=f1e799]: / مورد
                - link "ثبت سفارش" [ref=f1e800] [cursor=pointer]:
                  - /url: /services/s58
            - generic [ref=f1e803]:
              - generic [ref=f1e804]:
                - generic [ref=f1e805]:
                  - generic [ref=f1e806]: 📡
                  - heading "اینترنت ADSL" [level=3] [ref=f1e807]
                - generic [ref=f1e808]: مخابرات
              - paragraph [ref=f1e809]: درخواست و راه‌اندازی اینترنت ADSL
              - generic [ref=f1e810]:
                - generic [ref=f1e811]:
                  - text: ۳۵٬۰۰۰ تومان
                  - generic [ref=f1e812]: / مورد
                - link "ثبت سفارش" [ref=f1e813] [cursor=pointer]:
                  - /url: /services/s59
            - generic [ref=f1e816]:
              - generic [ref=f1e817]:
                - generic [ref=f1e818]:
                  - generic [ref=f1e819]: 📡
                  - heading "ساخت ایمیل سازمانی" [level=3] [ref=f1e820]
                - generic [ref=f1e821]: مخابرات
              - paragraph [ref=f1e822]: ایجاد ایمیل حرفه‌ای با دامنه اختصاصی
              - generic [ref=f1e823]:
                - generic [ref=f1e824]:
                  - text: ۶۰٬۰۰۰ تومان
                  - generic [ref=f1e825]: / ایمیل
                - link "ثبت سفارش" [ref=f1e826] [cursor=pointer]:
                  - /url: /services/s60
            - generic [ref=f1e829]:
              - generic [ref=f1e830]:
                - generic [ref=f1e831]:
                  - generic [ref=f1e832]: 📡
                  - heading "ثبت‌نام سرویس اینترنت آسیاتک" [level=3] [ref=f1e833]
                - generic [ref=f1e834]: مخابرات
              - paragraph [ref=f1e835]: ثبت‌نام، فعال‌سازی و انتقال سرویس ADSL/VDSL/فیبر نوری آسیاتک
              - generic [ref=f1e836]:
                - generic [ref=f1e837]:
                  - text: ۵۰٬۰۰۰ تومان
                  - generic [ref=f1e838]: / مورد
                - link "ثبت سفارش" [ref=f1e839] [cursor=pointer]:
                  - /url: /services/s61
          - generic [ref=f1e842]:
            - heading "نکات مهم" [level=3] [ref=f1e843]
            - list [ref=f1e844]:
              - listitem [ref=f1e845]: "- روی دکمه «ثبت سفارش» هر خدمت کلیک کنید؛ اطلاعات لازم، بارگذاری مدارک و پرداخت در یک فرم سه‌مرحله‌ای انجام می‌شود"
              - listitem [ref=f1e846]: "- پرداخت از طریق درگاه اینترنتی یا کیف پول امکان‌پذیر است و پس از پرداخت، کد رهگیری سفارش صادر می‌شود"
              - listitem [ref=f1e847]: "- قیمت‌ها ممکن است بر اساس حجم، تعداد و فوری بودن تغییر کنند"
              - listitem [ref=f1e848]: "- برای سفارش خدمات فوری، ۵۰ درصد اضافه بر قیمت پایه محاسبه می‌شود"
              - listitem [ref=f1e849]: "- تمامی خدمات با ضمانت کیفیت ارائه می‌شوند"
    - contentinfo [ref=f1e850]:
      - generic [ref=f1e851]:
        - generic [ref=f1e852]:
          - generic [ref=f1e853]:
            - generic [ref=f1e854]:
              - generic [ref=f1e855]: H
              - generic [ref=f1e856]: کافی نت همیار
            - paragraph [ref=f1e857]: ارائه‌دهنده خدمات دیجیتال، فروش محصولات، کپی مدیا و طراحی وب‌سایت
          - generic [ref=f1e858]:
            - heading "دسترسی سریع" [level=4] [ref=f1e859]
            - generic [ref=f1e860]:
              - link "صفحه اصلی" [ref=f1e861] [cursor=pointer]:
                - /url: /
              - link "خدمات کافی‌نت" [ref=f1e862] [cursor=pointer]:
                - /url: /services
              - link "کالکشن فیلم و سریال" [ref=f1e863] [cursor=pointer]:
                - /url: /media
              - link "فروشگاه" [ref=f1e864] [cursor=pointer]:
                - /url: /store
              - link "طراحی سایت" [ref=f1e865] [cursor=pointer]:
                - /url: /webdesign
          - generic [ref=f1e866]:
            - heading "تماس با ما" [level=4] [ref=f1e867]
            - generic [ref=f1e868]:
              - paragraph [ref=f1e869]: "تلفن: 02136432665"
              - paragraph [ref=f1e870]: "موبایل: 09913911880"
              - paragraph [ref=f1e871]: "موبایل: 09204767001"
          - generic [ref=f1e872]:
            - heading "شبکه‌های اجتماعی" [level=4] [ref=f1e873]
            - generic [ref=f1e874]:
              - link "" [ref=f1e875] [cursor=pointer]:
                - /url: https://eitaa.com/@hamyar_service1
              - link "" [ref=f1e877] [cursor=pointer]:
                - /url: https://rubika.ir/hamyar_service1
              - link "" [ref=f1e879] [cursor=pointer]:
                - /url: https://ble.ir/hamyar_service1
              - link "" [ref=f1e881] [cursor=pointer]:
                - /url: https://t.me/hamyar_service1
              - link "" [ref=f1e883] [cursor=pointer]:
                - /url: https://instagram.com/hamyar_service1
            - paragraph [ref=f1e885]: "@hamyar_service1"
        - generic [ref=f1e886]:
          - paragraph [ref=f1e887]: تمامی حقوق محفوظ است - کافی نت همیار ۱۴۰۳
          - link "پنل مدیریت" [ref=f1e888] [cursor=pointer]:
            - /url: /admin
  - button "چت پشتیبانی" [ref=f1e889]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const ADMIN_EMAIL = 'admin@hamyar.ir';
  4   | const ADMIN_PASSWORD = '123456789';
  5   | const CUSTOMER_EMAIL = 'kafinet.hamyar@gmail.com';
  6   | const CUSTOMER_PASSWORD = '123456789';
  7   | 
  8   | async function login(page, email, password, isAdmin = false) {
  9   |   await page.goto('/auth');
  10  |   await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  11  |   
  12  |   if (isAdmin) {
  13  |     // Click admin tab
  14  |     await page.click('button:has-text("ورود مدیریت")');
  15  |     await page.waitForTimeout(300);
  16  |   }
  17  |   
  18  |   await page.fill('input[type="email"]', email);
  19  |   await page.fill('input[type="password"]', password);
  20  |   
  21  |   if (isAdmin) {
  22  |     await page.click('button:has-text("ورود به پنل مدیریت")');
  23  |   } else {
  24  |     await page.click('button:has-text("ورود"), button:has-text("ثبت‌نام")');
  25  |   }
  26  |   
  27  |   await page.waitForURL(isAdmin ? /\/admin/ : /\/profile|\//, { timeout: 15000 });
  28  | }
  29  | 
  30  | async function waitForRealtime(page, selector, timeout = 10000) {
> 31  |   await page.waitForSelector(selector, { state: 'visible', timeout });
      |              ^ TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
  32  | }
  33  | 
  34  | test.describe('Hamyar Full E2E Flow', () => {
  35  |   test.beforeEach(async ({ page }) => {
  36  |     page.on('console', msg => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`));
  37  |     page.on('pageerror', err => console.log(`[BROWSER ERROR] ${err.message}`));
  38  |   });
  39  | 
  40  |   test('Admin login and dashboard access', async ({ page }) => {
  41  |     await login(page, ADMIN_EMAIL, ADMIN_PASSWORD, true);
  42  |     await expect(page).toHaveURL(/\/admin/);
  43  |     await expect(page.locator('text=داشبورد ادمین, text=Admin Dashboard')).toBeVisible({ timeout: 10000 });
  44  |   });
  45  | 
  46  |   test('Customer login and dashboard access', async ({ page }) => {
  47  |     await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD, false);
  48  |     await expect(page).toHaveURL(/\/profile|\//);
  49  |   });
  50  | 
  51  |   test('Admin can see orders page', async ({ page }) => {
  52  |     await login(page, ADMIN_EMAIL, ADMIN_PASSWORD, true);
  53  |     await page.goto('/admin/orders');
  54  |     await waitForRealtime(page, 'table, .orders-list, [data-testid="orders-table"]');
  55  |     console.log('Admin orders page loaded');
  56  |   });
  57  | 
  58  |   test('Customer places service order', async ({ page }) => {
  59  |     await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
  60  |     await page.goto('/services');
  61  |     await waitForRealtime(page, '.service-card, [data-testid="service-card"], button:has-text("سفارش")', 15000);
  62  |     
  63  |     const orderButtons = page.locator('button:has-text("سفارش"), button:has-text("Order"), .order-btn');
  64  |     const count = await orderButtons.count();
  65  |     if (count > 0) {
  66  |       await orderButtons.first().click();
  67  |       await page.waitForSelector('.modal, .dialog, [role="dialog"]', { timeout: 5000 });
  68  |       await page.click('button:has-text("تایید"), button:has-text("Confirm"), button:has-text("ثبت")');
  69  |       await page.waitForSelector('text=موفق, text=Success, text=ثبت شد', { timeout: 10000 });
  70  |       console.log('Service order placed');
  71  |     } else {
  72  |       console.log('No services available to order');
  73  |     }
  74  |   });
  75  | 
  76  |   test('Customer places product order', async ({ page }) => {
  77  |     await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
  78  |     await page.goto('/shop');
  79  |     await waitForRealtime(page, '.product-card, [data-testid="product-card"], button:has-text("افزودن"), button:has-text("Add to cart")', 15000);
  80  |     
  81  |     const addButtons = page.locator('button:has-text("افزودن"), button:has-text("Add to cart"), .add-to-cart');
  82  |     const count = await addButtons.count();
  83  |     if (count > 0) {
  84  |       await addButtons.first().click();
  85  |       await page.waitForTimeout(1000);
  86  |       await page.goto('/cart');
  87  |       await waitForRealtime(page, 'button:has-text("تسویه"), button:has-text("Checkout")');
  88  |       await page.click('button:has-text("تسویه"), button:has-text("Checkout")');
  89  |       await page.waitForSelector('text=موفق, text=Success, text=ثبت شد', { timeout: 10000 });
  90  |       console.log('Product order placed');
  91  |     } else {
  92  |       console.log('No products available to order');
  93  |     }
  94  |   });
  95  | 
  96  |   test('Customer places media order', async ({ page }) => {
  97  |     await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
  98  |     await page.goto('/media');
  99  |     await waitForRealtime(page, '.media-card, [data-testid="media-card"], button:has-text("سفارش"), button:has-text("Order")', 15000);
  100 |     
  101 |     const orderButtons = page.locator('button:has-text("سفارش"), button:has-text("Order"), .order-btn');
  102 |     const count = await orderButtons.count();
  103 |     if (count > 0) {
  104 |       await orderButtons.first().click();
  105 |       await page.waitForSelector('.modal, .dialog, [role="dialog"]', { timeout: 5000 });
  106 |       await page.click('button:has-text("تایید"), button:has-text("Confirm"), button:has-text("ثبت")');
  107 |       await page.waitForSelector('text=موفق, text=Success, text=ثبت شد', { timeout: 10000 });
  108 |       console.log('Media order placed');
  109 |     } else {
  110 |       console.log('No media available to order');
  111 |     }
  112 |   });
  113 | 
  114 |   test('Customer creates webdesign project order', async ({ page }) => {
  115 |     await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
  116 |     await page.goto('/webdesign');
  117 |     await waitForRealtime(page, 'button:has-text("سفارش"), button:has-text("Order"), button:has-text("شروع"), button:has-text("Start")', 15000);
  118 |     
  119 |     const orderButtons = page.locator('button:has-text("سفارش"), button:has-text("Order"), button:has-text("شروع"), button:has-text("Start")');
  120 |     const count = await orderButtons.count();
  121 |     if (count > 0) {
  122 |       await orderButtons.first().click();
  123 |       await page.waitForSelector('.modal, .dialog, [role="dialog"], form', { timeout: 5000 });
  124 |       await page.fill('textarea, input[type="text"]', 'Test webdesign project from E2E test');
  125 |       await page.click('button:has-text("تایید"), button:has-text("Confirm"), button:has-text("ثبت"), button:has-text("Send")');
  126 |       await page.waitForSelector('text=موفق, text=Success, text=ثبت شد, text=Created', { timeout: 10000 });
  127 |       console.log('Webdesign project order placed');
  128 |     } else {
  129 |       console.log('No webdesign order option available');
  130 |     }
  131 |   });
```