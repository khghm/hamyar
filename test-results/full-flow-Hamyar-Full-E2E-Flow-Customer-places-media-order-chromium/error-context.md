# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full-flow.test.ts >> Hamyar Full E2E Flow >> Customer places media order
- Location: e2e\full-flow.test.ts:96:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('.media-card, [data-testid="media-card"], button:has-text("سفارش"), button:has-text("Order")') to be visible

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
          - img "کالکشن فیلم و سریال" [ref=f1e31]
          - generic [ref=f1e33]:
            - heading "کالکشن فیلم و سریال" [level=1] [ref=f1e34]
            - paragraph [ref=f1e35]: مجموعه‌ای کامل از فیلم، سریال، انیمیشن و انیمه با بهترین کیفیت
        - generic [ref=f1e36]:
          - generic [ref=f1e37]:
            - textbox "جستجوی عنوان فیلم، سریال..." [ref=f1e42]
            - button "فیلترها" [ref=f1e43]
            - combobox [ref=f1e45]:
              - option "امتیاز" [selected]
              - option "سال ساخت"
              - option "عنوان"
          - paragraph [ref=f1e47]: 50 عنوان یافت شد
          - generic [ref=f1e48]:
            - link "BluRay 9.5 سریال Breaking Bad 2008 | درام" [ref=f1e50] [cursor=pointer]:
              - /url: /media/m4
              - generic [ref=f1e51]:
                - generic [ref=f1e53]: BluRay
                - generic [ref=f1e54]: "9.5"
                - generic [ref=f1e57]: سریال
              - generic [ref=f1e58]:
                - heading "Breaking Bad" [level=3] [ref=f1e59]
                - generic [ref=f1e60]:
                  - generic [ref=f1e61]: "2008"
                  - generic [ref=f1e62]: "|"
                  - generic [ref=f1e63]: درام
            - link "4K 9.5 سریال Breaking Bad 2008 | درام" [ref=f1e65] [cursor=pointer]:
              - /url: /media/m31
              - generic [ref=f1e66]:
                - generic [ref=f1e68]: 4K
                - generic [ref=f1e69]: "9.5"
                - generic [ref=f1e72]: سریال
              - generic [ref=f1e73]:
                - heading "Breaking Bad" [level=3] [ref=f1e74]
                - generic [ref=f1e75]:
                  - generic [ref=f1e76]: "2008"
                  - generic [ref=f1e77]: "|"
                  - generic [ref=f1e78]: درام
            - link "BluRay 9.3 فیلم The Shawshank Redemption 1994 | درام" [ref=f1e80] [cursor=pointer]:
              - /url: /media/m2
              - generic [ref=f1e81]:
                - generic [ref=f1e83]: BluRay
                - generic [ref=f1e84]: "9.3"
                - generic [ref=f1e87]: فیلم
              - generic [ref=f1e88]:
                - heading "The Shawshank Redemption" [level=3] [ref=f1e89]
                - generic [ref=f1e90]:
                  - generic [ref=f1e91]: "1994"
                  - generic [ref=f1e92]: "|"
                  - generic [ref=f1e93]: درام
            - link "4K 9.2 سریال Game of Thrones 2011 | فانتزی" [ref=f1e95] [cursor=pointer]:
              - /url: /media/m5
              - generic [ref=f1e96]:
                - generic [ref=f1e98]: 4K
                - generic [ref=f1e99]: "9.2"
                - generic [ref=f1e102]: سریال
              - generic [ref=f1e103]:
                - heading "Game of Thrones" [level=3] [ref=f1e104]
                - generic [ref=f1e105]:
                  - generic [ref=f1e106]: "2011"
                  - generic [ref=f1e107]: "|"
                  - generic [ref=f1e108]: فانتزی
            - link "BluRay 9.2 فیلم The Godfather 1972 | جنایی" [ref=f1e110] [cursor=pointer]:
              - /url: /media/m22
              - generic [ref=f1e111]:
                - generic [ref=f1e113]: BluRay
                - generic [ref=f1e114]: "9.2"
                - generic [ref=f1e117]: فیلم
              - generic [ref=f1e118]:
                - heading "The Godfather" [level=3] [ref=f1e119]
                - generic [ref=f1e120]:
                  - generic [ref=f1e121]: "1972"
                  - generic [ref=f1e122]: "|"
                  - generic [ref=f1e123]: جنایی
            - link "BluRay 9.1 انیمه Steins;Gate 2011 | علمی‌تخیلی" [ref=f1e125] [cursor=pointer]:
              - /url: /media/m48
              - generic [ref=f1e126]:
                - generic [ref=f1e128]: BluRay
                - generic [ref=f1e129]: "9.1"
                - generic [ref=f1e132]: انیمه
              - generic [ref=f1e133]:
                - heading "Steins;Gate" [level=3] [ref=f1e134]
                - generic [ref=f1e135]:
                  - generic [ref=f1e136]: "2011"
                  - generic [ref=f1e137]: "|"
                  - generic [ref=f1e138]: علمی‌تخیلی
            - link "BluRay 9 انیمه Attack on Titan 2013 | اکشن" [ref=f1e140] [cursor=pointer]:
              - /url: /media/m7
              - generic [ref=f1e141]:
                - generic [ref=f1e143]: BluRay
                - generic [ref=f1e144]: "9"
                - generic [ref=f1e147]: انیمه
              - generic [ref=f1e148]:
                - heading "Attack on Titan" [level=3] [ref=f1e149]
                - generic [ref=f1e150]:
                  - generic [ref=f1e151]: "2013"
                  - generic [ref=f1e152]: "|"
                  - generic [ref=f1e153]: اکشن
            - link "BluRay 9 انیمه Death Note 2006 | جنایی" [ref=f1e155] [cursor=pointer]:
              - /url: /media/m8
              - generic [ref=f1e156]:
                - generic [ref=f1e158]: BluRay
                - generic [ref=f1e159]: "9"
                - generic [ref=f1e162]: انیمه
              - generic [ref=f1e163]:
                - heading "Death Note" [level=3] [ref=f1e164]
                - generic [ref=f1e165]:
                  - generic [ref=f1e166]: "2006"
                  - generic [ref=f1e167]: "|"
                  - generic [ref=f1e168]: جنایی
            - link "4K 9 فیلم The Dark Knight 2008 | اکشن" [ref=f1e170] [cursor=pointer]:
              - /url: /media/m10
              - generic [ref=f1e171]:
                - generic [ref=f1e173]: 4K
                - generic [ref=f1e174]: "9"
                - generic [ref=f1e177]: فیلم
              - generic [ref=f1e178]:
                - heading "The Dark Knight" [level=3] [ref=f1e179]
                - generic [ref=f1e180]:
                  - generic [ref=f1e181]: "2008"
                  - generic [ref=f1e182]: "|"
                  - generic [ref=f1e183]: اکشن
            - link "BluRay 9 سریال The Office 2005 | کمدی" [ref=f1e185] [cursor=pointer]:
              - /url: /media/m32
              - generic [ref=f1e186]:
                - generic [ref=f1e188]: BluRay
                - generic [ref=f1e189]: "9"
                - generic [ref=f1e192]: سریال
              - generic [ref=f1e193]:
                - heading "The Office" [level=3] [ref=f1e194]
                - generic [ref=f1e195]:
                  - generic [ref=f1e196]: "2005"
                  - generic [ref=f1e197]: "|"
                  - generic [ref=f1e198]: کمدی
            - link "BluRay 9 انیمه Hunter x Hunter 2011 | اکشن" [ref=f1e200] [cursor=pointer]:
              - /url: /media/m47
              - generic [ref=f1e201]:
                - generic [ref=f1e203]: BluRay
                - generic [ref=f1e204]: "9"
                - generic [ref=f1e207]: انیمه
              - generic [ref=f1e208]:
                - heading "Hunter x Hunter" [level=3] [ref=f1e209]
                - generic [ref=f1e210]:
                  - generic [ref=f1e211]: "2011"
                  - generic [ref=f1e212]: "|"
                  - generic [ref=f1e213]: اکشن
            - link "BluRay 8.9 فیلم Oppenheimer 2023 | درام" [ref=f1e215] [cursor=pointer]:
              - /url: /media/m1
              - generic [ref=f1e216]:
                - generic [ref=f1e218]: BluRay
                - generic [ref=f1e219]: "8.9"
                - generic [ref=f1e222]: فیلم
              - generic [ref=f1e223]:
                - heading "Oppenheimer" [level=3] [ref=f1e224]
                - generic [ref=f1e225]:
                  - generic [ref=f1e226]: "2023"
                  - generic [ref=f1e227]: "|"
                  - generic [ref=f1e228]: درام
            - link "BluRay 8.9 انیمه One Piece 1999 | ماجراجویی" [ref=f1e230] [cursor=pointer]:
              - /url: /media/m15
              - generic [ref=f1e231]:
                - generic [ref=f1e233]: BluRay
                - generic [ref=f1e234]: "8.9"
                - generic [ref=f1e237]: انیمه
              - generic [ref=f1e238]:
                - heading "One Piece" [level=3] [ref=f1e239]
                - generic [ref=f1e240]:
                  - generic [ref=f1e241]: "1999"
                  - generic [ref=f1e242]: "|"
                  - generic [ref=f1e243]: ماجراجویی
            - link "BluRay 8.9 فیلم Pulp Fiction 1994 | جنایی" [ref=f1e245] [cursor=pointer]:
              - /url: /media/m23
              - generic [ref=f1e246]:
                - generic [ref=f1e248]: BluRay
                - generic [ref=f1e249]: "8.9"
                - generic [ref=f1e252]: فیلم
              - generic [ref=f1e253]:
                - heading "Pulp Fiction" [level=3] [ref=f1e254]
                - generic [ref=f1e255]:
                  - generic [ref=f1e256]: "1994"
                  - generic [ref=f1e257]: "|"
                  - generic [ref=f1e258]: جنایی
            - link "BluRay 8.9 سریال Friends 1994 | کمدی" [ref=f1e260] [cursor=pointer]:
              - /url: /media/m33
              - generic [ref=f1e261]:
                - generic [ref=f1e263]: BluRay
                - generic [ref=f1e264]: "8.9"
                - generic [ref=f1e267]: سریال
              - generic [ref=f1e268]:
                - heading "Friends" [level=3] [ref=f1e269]
                - generic [ref=f1e270]:
                  - generic [ref=f1e271]: "1994"
                  - generic [ref=f1e272]: "|"
                  - generic [ref=f1e273]: کمدی
            - link "BluRay 8.9 انیمه Cowboy Bebop 1998 | اکشن" [ref=f1e275] [cursor=pointer]:
              - /url: /media/m50
              - generic [ref=f1e276]:
                - generic [ref=f1e278]: BluRay
                - generic [ref=f1e279]: "8.9"
                - generic [ref=f1e282]: انیمه
              - generic [ref=f1e283]:
                - heading "Cowboy Bebop" [level=3] [ref=f1e284]
                - generic [ref=f1e285]:
                  - generic [ref=f1e286]: "1998"
                  - generic [ref=f1e287]: "|"
                  - generic [ref=f1e288]: اکشن
            - link "4K 8.8 فیلم Inception 2010 | اکشن" [ref=f1e290] [cursor=pointer]:
              - /url: /media/m3
              - generic [ref=f1e291]:
                - generic [ref=f1e293]: 4K
                - generic [ref=f1e294]: "8.8"
                - generic [ref=f1e297]: فیلم
              - generic [ref=f1e298]:
                - heading "Inception" [level=3] [ref=f1e299]
                - generic [ref=f1e300]:
                  - generic [ref=f1e301]: "2010"
                  - generic [ref=f1e302]: "|"
                  - generic [ref=f1e303]: اکشن
            - link "BluRay 8.8 فیلم Fight Club 1999 | درام" [ref=f1e305] [cursor=pointer]:
              - /url: /media/m24
              - generic [ref=f1e306]:
                - generic [ref=f1e308]: BluRay
                - generic [ref=f1e309]: "8.8"
                - generic [ref=f1e312]: فیلم
              - generic [ref=f1e313]:
                - heading "Fight Club" [level=3] [ref=f1e314]
                - generic [ref=f1e315]:
                  - generic [ref=f1e316]: "1999"
                  - generic [ref=f1e317]: "|"
                  - generic [ref=f1e318]: درام
            - link "Forrest Gump BluRay 8.8 فیلم Forrest Gump 1994 | درام" [ref=f1e320] [cursor=pointer]:
              - /url: /media/m25
              - generic [ref=f1e321]:
                - img "Forrest Gump" [ref=f1e322]
                - generic [ref=f1e324]: BluRay
                - generic [ref=f1e325]: "8.8"
                - generic [ref=f1e328]: فیلم
              - generic [ref=f1e329]:
                - heading "Forrest Gump" [level=3] [ref=f1e330]
                - generic [ref=f1e331]:
                  - generic [ref=f1e332]: "1994"
                  - generic [ref=f1e333]: "|"
                  - generic [ref=f1e334]: درام
            - link "4K 8.8 فیلم The Lord of the Rings 2001 | فانتزی" [ref=f1e336] [cursor=pointer]:
              - /url: /media/m26
              - generic [ref=f1e337]:
                - generic [ref=f1e339]: 4K
                - generic [ref=f1e340]: "8.8"
                - generic [ref=f1e343]: فیلم
              - generic [ref=f1e344]:
                - heading "The Lord of the Rings" [level=3] [ref=f1e345]
                - generic [ref=f1e346]:
                  - generic [ref=f1e347]: "2001"
                  - generic [ref=f1e348]: "|"
                  - generic [ref=f1e349]: فانتزی
            - link "BluRay 8.8 سریال Peaky Blinders 2013 | جنایی" [ref=f1e351] [cursor=pointer]:
              - /url: /media/m35
              - generic [ref=f1e352]:
                - generic [ref=f1e354]: BluRay
                - generic [ref=f1e355]: "8.8"
                - generic [ref=f1e358]: سریال
              - generic [ref=f1e359]:
                - heading "Peaky Blinders" [level=3] [ref=f1e360]
                - generic [ref=f1e361]:
                  - generic [ref=f1e362]: "2013"
                  - generic [ref=f1e363]: "|"
                  - generic [ref=f1e364]: جنایی
            - link "BluRay 8.8 انیمه Dragon Ball Z 1989 | اکشن" [ref=f1e366] [cursor=pointer]:
              - /url: /media/m41
              - generic [ref=f1e367]:
                - generic [ref=f1e369]: BluRay
                - generic [ref=f1e370]: "8.8"
                - generic [ref=f1e373]: انیمه
              - generic [ref=f1e374]:
                - heading "Dragon Ball Z" [level=3] [ref=f1e375]
                - generic [ref=f1e376]:
                  - generic [ref=f1e377]: "1989"
                  - generic [ref=f1e378]: "|"
                  - generic [ref=f1e379]: اکشن
            - 'link "4K 8.7 انیمیشن Spider-Man: Across the Spider-Verse 2023 | انیمیشن" [ref=f1e381] [cursor=pointer]':
              - /url: /media/m6
              - generic [ref=f1e382]:
                - generic [ref=f1e384]: 4K
                - generic [ref=f1e385]: "8.7"
                - generic [ref=f1e388]: انیمیشن
              - generic [ref=f1e389]:
                - 'heading "Spider-Man: Across the Spider-Verse" [level=3] [ref=f1e390]'
                - generic [ref=f1e391]:
                  - generic [ref=f1e392]: "2023"
                  - generic [ref=f1e393]: "|"
                  - generic [ref=f1e394]: انیمیشن
            - link "4K 8.7 سریال Stranger Things 2016 | علمی‌تخیلی" [ref=f1e396] [cursor=pointer]:
              - /url: /media/m11
              - generic [ref=f1e397]:
                - generic [ref=f1e399]: 4K
                - generic [ref=f1e400]: "8.7"
                - generic [ref=f1e403]: سریال
              - generic [ref=f1e404]:
                - heading "Stranger Things" [level=3] [ref=f1e405]
                - generic [ref=f1e406]:
                  - generic [ref=f1e407]: "2016"
                  - generic [ref=f1e408]: "|"
                  - generic [ref=f1e409]: علمی‌تخیلی
            - link "4K 8.7 انیمه Demon Slayer 2019 | اکشن" [ref=f1e411] [cursor=pointer]:
              - /url: /media/m13
              - generic [ref=f1e412]:
                - generic [ref=f1e414]: 4K
                - generic [ref=f1e415]: "8.7"
                - generic [ref=f1e418]: انیمه
              - generic [ref=f1e419]:
                - heading "Demon Slayer" [level=3] [ref=f1e420]
                - generic [ref=f1e421]:
                  - generic [ref=f1e422]: "2019"
                  - generic [ref=f1e423]: "|"
                  - generic [ref=f1e424]: اکشن
            - link "BluRay 8.7 فیلم The Matrix 1999 | اکشن" [ref=f1e426] [cursor=pointer]:
              - /url: /media/m14
              - generic [ref=f1e427]:
                - generic [ref=f1e429]: BluRay
                - generic [ref=f1e430]: "8.7"
                - generic [ref=f1e433]: فیلم
              - generic [ref=f1e434]:
                - heading "The Matrix" [level=3] [ref=f1e435]
                - generic [ref=f1e436]:
                  - generic [ref=f1e437]: "1999"
                  - generic [ref=f1e438]: "|"
                  - generic [ref=f1e439]: اکشن
            - link "BluRay 8.7 انیمه Naruto Shippuden 2007 | اکشن" [ref=f1e441] [cursor=pointer]:
              - /url: /media/m20
              - generic [ref=f1e442]:
                - generic [ref=f1e444]: BluRay
                - generic [ref=f1e445]: "8.7"
                - generic [ref=f1e448]: انیمه
              - generic [ref=f1e449]:
                - heading "Naruto Shippuden" [level=3] [ref=f1e450]
                - generic [ref=f1e451]:
                  - generic [ref=f1e452]: "2007"
                  - generic [ref=f1e453]: "|"
                  - generic [ref=f1e454]: اکشن
            - link "BluRay 8.7 انیمه One Punch Man 2015 | اکشن" [ref=f1e456] [cursor=pointer]:
              - /url: /media/m44
              - generic [ref=f1e457]:
                - generic [ref=f1e459]: BluRay
                - generic [ref=f1e460]: "8.7"
                - generic [ref=f1e463]: انیمه
              - generic [ref=f1e464]:
                - heading "One Punch Man" [level=3] [ref=f1e465]
                - generic [ref=f1e466]:
                  - generic [ref=f1e467]: "2015"
                  - generic [ref=f1e468]: "|"
                  - generic [ref=f1e469]: اکشن
            - link "BluRay 8.7 انیمه Code Geass 2006 | اکشن" [ref=f1e471] [cursor=pointer]:
              - /url: /media/m49
              - generic [ref=f1e472]:
                - generic [ref=f1e474]: BluRay
                - generic [ref=f1e475]: "8.7"
                - generic [ref=f1e478]: انیمه
              - generic [ref=f1e479]:
                - heading "Code Geass" [level=3] [ref=f1e480]
                - generic [ref=f1e481]:
                  - generic [ref=f1e482]: "2006"
                  - generic [ref=f1e483]: "|"
                  - generic [ref=f1e484]: اکشن
            - link "4K 8.6 فیلم Interstellar 2014 | علمی‌تخیلی" [ref=f1e486] [cursor=pointer]:
              - /url: /media/m9
              - generic [ref=f1e487]:
                - generic [ref=f1e489]: 4K
                - generic [ref=f1e490]: "8.6"
                - generic [ref=f1e493]: فیلم
              - generic [ref=f1e494]:
                - heading "Interstellar" [level=3] [ref=f1e495]
                - generic [ref=f1e496]:
                  - generic [ref=f1e497]: "2014"
                  - generic [ref=f1e498]: "|"
                  - generic [ref=f1e499]: علمی‌تخیلی
            - link "4K 8.6 انیمه Jujutsu Kaisen 2020 | اکشن" [ref=f1e501] [cursor=pointer]:
              - /url: /media/m17
              - generic [ref=f1e502]:
                - generic [ref=f1e504]: 4K
                - generic [ref=f1e505]: "8.6"
                - generic [ref=f1e508]: انیمه
              - generic [ref=f1e509]:
                - heading "Jujutsu Kaisen" [level=3] [ref=f1e510]
                - generic [ref=f1e511]:
                  - generic [ref=f1e512]: "2020"
                  - generic [ref=f1e513]: "|"
                  - generic [ref=f1e514]: اکشن
            - link "BluRay 8.6 انیمیشن Spirited Away 2001 | انیمیشن" [ref=f1e516] [cursor=pointer]:
              - /url: /media/m36
              - generic [ref=f1e517]:
                - generic [ref=f1e519]: BluRay
                - generic [ref=f1e520]: "8.6"
                - generic [ref=f1e523]: انیمیشن
              - generic [ref=f1e524]:
                - heading "Spirited Away" [level=3] [ref=f1e525]
                - generic [ref=f1e526]:
                  - generic [ref=f1e527]: "2001"
                  - generic [ref=f1e528]: "|"
                  - generic [ref=f1e529]: انیمیشن
            - 'link "Dune: Part Two 4K 8.5 فیلم Dune: Part Two 2024 | علمی‌تخیلی" [ref=f1e531] [cursor=pointer]':
              - /url: /media/m21
              - generic [ref=f1e532]:
                - 'img "Dune: Part Two" [ref=f1e533]'
                - generic [ref=f1e535]: 4K
                - generic [ref=f1e536]: "8.5"
                - generic [ref=f1e539]: فیلم
              - generic [ref=f1e540]:
                - 'heading "Dune: Part Two" [level=3] [ref=f1e541]'
                - generic [ref=f1e542]:
                  - generic [ref=f1e543]: "2024"
                  - generic [ref=f1e544]: "|"
                  - generic [ref=f1e545]: علمی‌تخیلی
            - link "BluRay 8.5 فیلم Parasite 2019 | درام" [ref=f1e547] [cursor=pointer]:
              - /url: /media/m29
              - generic [ref=f1e548]:
                - generic [ref=f1e550]: BluRay
                - generic [ref=f1e551]: "8.5"
                - generic [ref=f1e554]: فیلم
              - generic [ref=f1e555]:
                - heading "Parasite" [level=3] [ref=f1e556]
                - generic [ref=f1e557]:
                  - generic [ref=f1e558]: "2019"
                  - generic [ref=f1e559]: "|"
                  - generic [ref=f1e560]: درام
            - link "BluRay 8.5 فیلم Whiplash 2014 | درام" [ref=f1e562] [cursor=pointer]:
              - /url: /media/m30
              - generic [ref=f1e563]:
                - generic [ref=f1e565]: BluRay
                - generic [ref=f1e566]: "8.5"
                - generic [ref=f1e569]: فیلم
              - generic [ref=f1e570]:
                - heading "Whiplash" [level=3] [ref=f1e571]
                - generic [ref=f1e572]:
                  - generic [ref=f1e573]: "2014"
                  - generic [ref=f1e574]: "|"
                  - generic [ref=f1e575]: درام
            - link "Fullmetal Alchemist BluRay 8.5 انیمه Fullmetal Alchemist 2003 | اکشن" [ref=f1e577] [cursor=pointer]:
              - /url: /media/m40
              - generic [ref=f1e578]:
                - img "Fullmetal Alchemist" [ref=f1e579]
                - generic [ref=f1e581]: BluRay
                - generic [ref=f1e582]: "8.5"
                - generic [ref=f1e585]: انیمه
              - generic [ref=f1e586]:
                - heading "Fullmetal Alchemist" [level=3] [ref=f1e587]
                - generic [ref=f1e588]:
                  - generic [ref=f1e589]: "2003"
                  - generic [ref=f1e590]: "|"
                  - generic [ref=f1e591]: اکشن
            - link "BluRay 8.4 انیمیشن Your Name 2016 | انیمیشن" [ref=f1e593] [cursor=pointer]:
              - /url: /media/m12
              - generic [ref=f1e594]:
                - generic [ref=f1e596]: BluRay
                - generic [ref=f1e597]: "8.4"
                - generic [ref=f1e600]: انیمیشن
              - generic [ref=f1e601]:
                - heading "Your Name" [level=3] [ref=f1e602]
                - generic [ref=f1e603]:
                  - generic [ref=f1e604]: "2016"
                  - generic [ref=f1e605]: "|"
                  - generic [ref=f1e606]: انیمیشن
            - link "4K 8.4 انیمیشن Coco 2017 | انیمیشن" [ref=f1e608] [cursor=pointer]:
              - /url: /media/m16
              - generic [ref=f1e609]:
                - generic [ref=f1e611]: 4K
                - generic [ref=f1e612]: "8.4"
                - generic [ref=f1e615]: انیمیشن
              - generic [ref=f1e616]:
                - heading "Coco" [level=3] [ref=f1e617]
                - generic [ref=f1e618]:
                  - generic [ref=f1e619]: "2017"
                  - generic [ref=f1e620]: "|"
                  - generic [ref=f1e621]: انیمیشن
            - link "4K 8.4 فیلم Joker 2019 | درام" [ref=f1e623] [cursor=pointer]:
              - /url: /media/m28
              - generic [ref=f1e624]:
                - generic [ref=f1e626]: 4K
                - generic [ref=f1e627]: "8.4"
                - generic [ref=f1e630]: فیلم
              - generic [ref=f1e631]:
                - heading "Joker" [level=3] [ref=f1e632]
                - generic [ref=f1e633]:
                  - generic [ref=f1e634]: "2019"
                  - generic [ref=f1e635]: "|"
                  - generic [ref=f1e636]: درام
            - link "4K 8.4 انیمه My Hero Academia 2016 | اکشن" [ref=f1e638] [cursor=pointer]:
              - /url: /media/m43
              - generic [ref=f1e639]:
                - generic [ref=f1e641]: 4K
                - generic [ref=f1e642]: "8.4"
                - generic [ref=f1e645]: انیمه
              - generic [ref=f1e646]:
                - heading "My Hero Academia" [level=3] [ref=f1e647]
                - generic [ref=f1e648]:
                  - generic [ref=f1e649]: "2016"
                  - generic [ref=f1e650]: "|"
                  - generic [ref=f1e651]: اکشن
            - link "BluRay 8.3 انیمیشن Toy Story 1995 | انیمیشن" [ref=f1e653] [cursor=pointer]:
              - /url: /media/m37
              - generic [ref=f1e654]:
                - generic [ref=f1e656]: BluRay
                - generic [ref=f1e657]: "8.3"
                - generic [ref=f1e660]: انیمیشن
              - generic [ref=f1e661]:
                - heading "Toy Story" [level=3] [ref=f1e662]
                - generic [ref=f1e663]:
                  - generic [ref=f1e664]: "1995"
                  - generic [ref=f1e665]: "|"
                  - generic [ref=f1e666]: انیمیشن
            - link "BluRay 8.2 سریال Money Heist 2017 | اکشن" [ref=f1e668] [cursor=pointer]:
              - /url: /media/m19
              - generic [ref=f1e669]:
                - generic [ref=f1e671]: BluRay
                - generic [ref=f1e672]: "8.2"
                - generic [ref=f1e675]: سریال
              - generic [ref=f1e676]:
                - heading "Money Heist" [level=3] [ref=f1e677]
                - generic [ref=f1e678]:
                  - generic [ref=f1e679]: "2017"
                  - generic [ref=f1e680]: "|"
                  - generic [ref=f1e681]: اکشن
            - link "4K 8.2 سریال The Witcher 2019 | فانتزی" [ref=f1e683] [cursor=pointer]:
              - /url: /media/m34
              - generic [ref=f1e684]:
                - generic [ref=f1e686]: 4K
                - generic [ref=f1e687]: "8.2"
                - generic [ref=f1e690]: سریال
              - generic [ref=f1e691]:
                - heading "The Witcher" [level=3] [ref=f1e692]
                - generic [ref=f1e693]:
                  - generic [ref=f1e694]: "2019"
                  - generic [ref=f1e695]: "|"
                  - generic [ref=f1e696]: فانتزی
            - link "BluRay 8.2 انیمه Bleach 2004 | اکشن" [ref=f1e698] [cursor=pointer]:
              - /url: /media/m42
              - generic [ref=f1e699]:
                - generic [ref=f1e701]: BluRay
                - generic [ref=f1e702]: "8.2"
                - generic [ref=f1e705]: انیمه
              - generic [ref=f1e706]:
                - heading "Bleach" [level=3] [ref=f1e707]
                - generic [ref=f1e708]:
                  - generic [ref=f1e709]: "2004"
                  - generic [ref=f1e710]: "|"
                  - generic [ref=f1e711]: اکشن
            - link "4K 8 فیلم The Avengers 2012 | اکشن" [ref=f1e713] [cursor=pointer]:
              - /url: /media/m27
              - generic [ref=f1e714]:
                - generic [ref=f1e716]: 4K
                - generic [ref=f1e717]: "8"
                - generic [ref=f1e720]: فیلم
              - generic [ref=f1e721]:
                - heading "The Avengers" [level=3] [ref=f1e722]
                - generic [ref=f1e723]:
                  - generic [ref=f1e724]: "2012"
                  - generic [ref=f1e725]: "|"
                  - generic [ref=f1e726]: اکشن
            - link "4K 8 انیمیشن Zootopia 2016 | انیمیشن" [ref=f1e728] [cursor=pointer]:
              - /url: /media/m39
              - generic [ref=f1e729]:
                - generic [ref=f1e731]: 4K
                - generic [ref=f1e732]: "8"
                - generic [ref=f1e735]: انیمیشن
              - generic [ref=f1e736]:
                - heading "Zootopia" [level=3] [ref=f1e737]
                - generic [ref=f1e738]:
                  - generic [ref=f1e739]: "2016"
                  - generic [ref=f1e740]: "|"
                  - generic [ref=f1e741]: انیمیشن
            - link "BluRay 7.8 انیمه Tokyo Ghoul 2014 | اکشن" [ref=f1e743] [cursor=pointer]:
              - /url: /media/m45
              - generic [ref=f1e744]:
                - generic [ref=f1e746]: BluRay
                - generic [ref=f1e747]: "7.8"
                - generic [ref=f1e750]: انیمه
              - generic [ref=f1e751]:
                - heading "Tokyo Ghoul" [level=3] [ref=f1e752]
                - generic [ref=f1e753]:
                  - generic [ref=f1e754]: "2014"
                  - generic [ref=f1e755]: "|"
                  - generic [ref=f1e756]: اکشن
            - link "BluRay 7.5 انیمه Sword Art Online 2012 | اکشن" [ref=f1e758] [cursor=pointer]:
              - /url: /media/m46
              - generic [ref=f1e759]:
                - generic [ref=f1e761]: BluRay
                - generic [ref=f1e762]: "7.5"
                - generic [ref=f1e765]: انیمه
              - generic [ref=f1e766]:
                - heading "Sword Art Online" [level=3] [ref=f1e767]
                - generic [ref=f1e768]:
                  - generic [ref=f1e769]: "2012"
                  - generic [ref=f1e770]: "|"
                  - generic [ref=f1e771]: اکشن
            - link "4K 7.4 انیمیشن Frozen 2013 | انیمیشن" [ref=f1e773] [cursor=pointer]:
              - /url: /media/m38
              - generic [ref=f1e774]:
                - generic [ref=f1e776]: 4K
                - generic [ref=f1e777]: "7.4"
                - generic [ref=f1e780]: انیمیشن
              - generic [ref=f1e781]:
                - heading "Frozen" [level=3] [ref=f1e782]
                - generic [ref=f1e783]:
                  - generic [ref=f1e784]: "2013"
                  - generic [ref=f1e785]: "|"
                  - generic [ref=f1e786]: انیمیشن
            - link "4K 6.9 انیمیشن The Lion King 2019 | انیمیشن" [ref=f1e788] [cursor=pointer]:
              - /url: /media/m18
              - generic [ref=f1e789]:
                - generic [ref=f1e791]: 4K
                - generic [ref=f1e792]: "6.9"
                - generic [ref=f1e795]: انیمیشن
              - generic [ref=f1e796]:
                - heading "The Lion King" [level=3] [ref=f1e797]
                - generic [ref=f1e798]:
                  - generic [ref=f1e799]: "2019"
                  - generic [ref=f1e800]: "|"
                  - generic [ref=f1e801]: انیمیشن
          - paragraph [ref=f1e803]:
            - text: برای انتخاب فیلم و سریال، ابتدا باید
            - link "وارد حساب کاربری" [ref=f1e804] [cursor=pointer]:
              - /url: /auth
            - text: خود شوید.
    - contentinfo [ref=f1e805]:
      - generic [ref=f1e806]:
        - generic [ref=f1e807]:
          - generic [ref=f1e808]:
            - generic [ref=f1e809]:
              - generic [ref=f1e810]: H
              - generic [ref=f1e811]: کافی نت همیار
            - paragraph [ref=f1e812]: ارائه‌دهنده خدمات دیجیتال، فروش محصولات، کپی مدیا و طراحی وب‌سایت
          - generic [ref=f1e813]:
            - heading "دسترسی سریع" [level=4] [ref=f1e814]
            - generic [ref=f1e815]:
              - link "صفحه اصلی" [ref=f1e816] [cursor=pointer]:
                - /url: /
              - link "خدمات کافی‌نت" [ref=f1e817] [cursor=pointer]:
                - /url: /services
              - link "کالکشن فیلم و سریال" [ref=f1e818] [cursor=pointer]:
                - /url: /media
              - link "فروشگاه" [ref=f1e819] [cursor=pointer]:
                - /url: /store
              - link "طراحی سایت" [ref=f1e820] [cursor=pointer]:
                - /url: /webdesign
          - generic [ref=f1e821]:
            - heading "تماس با ما" [level=4] [ref=f1e822]
            - generic [ref=f1e823]:
              - paragraph [ref=f1e824]: "تلفن: 02136432665"
              - paragraph [ref=f1e825]: "موبایل: 09913911880"
              - paragraph [ref=f1e826]: "موبایل: 09204767001"
          - generic [ref=f1e827]:
            - heading "شبکه‌های اجتماعی" [level=4] [ref=f1e828]
            - generic [ref=f1e829]:
              - link "" [ref=f1e830] [cursor=pointer]:
                - /url: https://eitaa.com/@hamyar_service1
              - link "" [ref=f1e832] [cursor=pointer]:
                - /url: https://rubika.ir/hamyar_service1
              - link "" [ref=f1e834] [cursor=pointer]:
                - /url: https://ble.ir/hamyar_service1
              - link "" [ref=f1e836] [cursor=pointer]:
                - /url: https://t.me/hamyar_service1
              - link "" [ref=f1e838] [cursor=pointer]:
                - /url: https://instagram.com/hamyar_service1
            - paragraph [ref=f1e840]: "@hamyar_service1"
        - generic [ref=f1e841]:
          - paragraph [ref=f1e842]: تمامی حقوق محفوظ است - کافی نت همیار ۱۴۰۳
          - link "پنل مدیریت" [ref=f1e843] [cursor=pointer]:
            - /url: /admin
  - button "چت پشتیبانی" [ref=f1e844]
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