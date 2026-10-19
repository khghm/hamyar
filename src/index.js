/**
 * Cloudflare Worker: static assets (dist) + endpointهای پرداخت زرین‌پال.
 *
 * چرا endpointها روی همین Worker و نه Supabase Edge Function؟
 *   دامنهٔ `*.supabase.co` از شبکهٔ ایران در دسترس است، ولی استقرار Edge
 *   Function نیاز به دسترسی مدیریتی Supabase دارد؛ ضمن اینکه این‌طوری همه‌چیز
 *   روی همان دامنهٔ سایت و بدون CORS است.
 *
 * امنیت:
 *   - کلید service_role فقط به‌عنوان secret روی Worker ذخیره می‌شود و هرگز به
 *     مرورگر نمی‌رود.
 *   - هر درخواست باید JWT کاربر را داشته باشد؛ هویت با `/auth/v1/user` تأیید
 *     می‌شود و مالکیت سفارش/تراکنش بررسی می‌شود.
 *   - مبلغ از دیتابیس خوانده می‌شود، نه از بدنهٔ درخواست.
 *
 * حالت درگاه:
 *   ZARINPAL_MODE=sandbox  → sandbox.zarinpal.com (مرچنت تستی)
 *   ZARINPAL_MODE=live     → payment.zarinpal.com (مرچنت واقعی، بعداً)
 *   amount در زرین‌پال «ریال» است و در این سیستم «تومان» → ×۱۰
 */
const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });

function zarinpalConfig(env) {
  const mode = String(env.ZARINPAL_MODE || 'sandbox').toLowerCase();
  const sandbox = mode !== 'live';
  return {
    sandbox,
    base: sandbox ? 'https://sandbox.zarinpal.com' : 'https://payment.zarinpal.com',
    // مرچنت تستی زرین‌پال: هر رشتهٔ ۳۶ کاراکتری در sandbox پذیرفته می‌شود.
    merchant: env.ZARINPAL_MERCHANT_ID || 'x'.repeat(36),
  };
}

async function supabaseFetch(env, path, init = {}) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(`https://${env.SUPABASE_HOST}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      Prefer: 'return=representation',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const message = data && typeof data === 'object'
      ? (data.message || data.error_description || JSON.stringify(data))
      : String(data || res.statusText);
    throw new Error(message);
  }
  return data;
}

async function requireUser(env, request) {
  const jwt = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!jwt) return null;
  const res = await fetch(`https://${env.SUPABASE_HOST}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) return null;
  const user = await res.json().catch(() => null);
  return user && user.id ? user : null;
}

// --------------------------------------------------------- phone OTP login ---
/**
 * ورود مشتری با شماره موبایل (کد یک‌بارمصرف).
 *
 * جریان:
 *   1) POST /api/otp/request  { phone }      → کد ۶ رقمی ساخته، هش و ذخیره
 *      می‌شود و با کاوه‌نگار پیامک می‌شود.
 *   2) POST /api/otp/verify   { phone, code } → کد بررسی می‌شود، کاربر
 *      Supabase Auth (با ایمیل داخلی <phone>@phone.hamyar.local) پیدا/ساخته
 *      می‌شود و یک `token_hash` مجیک‌لینک برمی‌گردد تا کلاینت با
 *      `supabase.auth.verifyOtp` نشست واقعی بگیرد (RLS دست‌نخورده می‌ماند).
 *
 * چرا اینجا و نه Edge Function: استقرار Edge Function به دسترسی مدیریتی
 * Supabase نیاز دارد؛ Worker همین حالا کلید service_role را دارد.
 *
 * متغیرهای محیطی (wrangler):
 *   KAVENEGAR_API_KEY  ← secret؛ تا وقتی تنظیم نشده، پیامک ارسال نمی‌شود
 *   KAVENEGAR_SENDER   ← اختیاری، شمارهٔ فرستندهٔ خط خدماتی
 *   KAVENEGAR_TEMPLATE ← اختیاری، نام الگوی verify/lookup (پیشنهادی)
 *   OTP_DEV_MODE       ← "1" فقط برای تست: کد را در پاسخ برمی‌گرداند
 *   OTP_PEPPER         ← اختیاری، نمک هش کدها (پیش‌فرض: کلید service_role)
 */
const OTP_TTL_SECONDS = 120;
const OTP_RESEND_SECONDS = 60;
const OTP_MAX_PER_WINDOW = 3;
const OTP_WINDOW_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

const otpDevMode = (env) => String(env.OTP_DEV_MODE || '') === '1';

/** شمارهٔ ایرانی را به قالب محلی `09xxxxxxxxx` نرمال می‌کند. */
function normalizePhone(input) {
  let s = String(input == null ? '' : input).trim();
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  const ar = '٠١٢٣٤٥٦٧٨٩';
  s = s.replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)))
       .replace(/[٠-٩]/g, (d) => String(ar.indexOf(d)))
       .replace(/[^\d+]/g, '');
  if (s.startsWith('+98')) s = '0' + s.slice(3);
  else if (s.startsWith('0098')) s = '0' + s.slice(4);
  else if (s.startsWith('98') && s.length === 12) s = '0' + s.slice(2);
  else if (s.length === 10 && s.startsWith('9')) s = '0' + s;
  return /^09\d{9}$/.test(s) ? s : '';
}

async function hashOtp(env, phone, code) {
  const pepper = env.OTP_PEPPER || env.SUPABASE_SERVICE_ROLE_KEY || 'hamyar-otp';
  const data = new TextEncoder().encode(`${phone}:${code}:${pepper}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomOtp() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(100000 + (buf[0] % 900000));
}

/** ارسال پیامک با کاوه‌نگار (الگو در اولویت، وگرنه پیامک ساده). */
async function sendKavenegar(env, phone, code) {
  const key = String(env.KAVENEGAR_API_KEY || '').trim();
  if (!key) return { ok: false, missing: true };
  const base = `https://api.kavenegar.com/v1/${encodeURIComponent(key)}`;

  try {
    if (env.KAVENEGAR_TEMPLATE) {
      const url = `${base}/verify/lookup.json?receptor=${encodeURIComponent(phone)}&token=${encodeURIComponent(code)}&template=${encodeURIComponent(env.KAVENEGAR_TEMPLATE)}`;
      const res = await fetch(url);
      const body = await res.json().catch(() => ({}));
      const status = body && body.return ? Number(body.return.status) : 0;
      if (!res.ok || (status && status !== 200)) {
        return { ok: false, error: (body && body.return && body.return.message) || `HTTP ${res.status}` };
      }
      return { ok: true };
    }

    const message = `کد ورود شما به کافی نت همیار: ${code}\nاین کد را در اختیار دیگران قرار ندهید.`;
    let url = `${base}/sms/send.json?receptor=${encodeURIComponent(phone)}&message=${encodeURIComponent(message)}`;
    if (env.KAVENEGAR_SENDER) url += `&sender=${encodeURIComponent(env.KAVENEGAR_SENDER)}`;
    const res = await fetch(url);
    const body = await res.json().catch(() => ({}));
    const status = body && body.return ? Number(body.return.status) : 0;
    if (!res.ok || (status && status !== 200)) {
      return { ok: false, error: (body && body.return && body.return.message) || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e && e.message) || 'network error' };
  }
}

async function handleOtpRequest(env, request) {
  const body = await request.json().catch(() => ({}));
  const phone = normalizePhone(body.phone);
  if (!phone) return json({ ok: false, error: 'شماره موبایل معتبر نیست (مثال: 09121234567)' }, 400);

  const ip = request.headers.get('CF-Connecting-IP') || '';

  // محدودیت: ۳ درخواست در ۱۰ دقیقه برای هر شماره + فاصلهٔ ۶۰ ثانیه بین ارسال‌ها
  const since = new Date(Date.now() - OTP_WINDOW_MINUTES * 60 * 1000).toISOString();
  let recent = [];
  try {
    recent = await supabaseFetch(
      env,
      `/rest/v1/phone_otp_codes?phone=eq.${phone}&created_at=gte.${encodeURIComponent(since)}&select=id,created_at&order=created_at.desc`,
    );
  } catch {
    recent = [];
  }
  const list = Array.isArray(recent) ? recent : [];
  if (list.length >= OTP_MAX_PER_WINDOW) {
    return json({ ok: false, error: 'تعداد درخواست‌ها زیاد است؛ چند دقیقه بعد دوباره تلاش کنید', retryAfter: 300 }, 429);
  }
  if (list[0]) {
    const elapsed = (Date.now() - new Date(list[0].created_at).getTime()) / 1000;
    if (elapsed < OTP_RESEND_SECONDS) {
      const wait = Math.ceil(OTP_RESEND_SECONDS - elapsed);
      return json({ ok: false, error: `${wait} ثانیه دیگر می‌توانید کد جدید بگیرید`, retryAfter: wait }, 429);
    }
  }

  const code = randomOtp();
  const codeHash = await hashOtp(env, phone, code);
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString();

  const inserted = await supabaseFetch(env, '/rest/v1/phone_otp_codes', {
    method: 'POST',
    body: JSON.stringify({ phone, code_hash: codeHash, expires_at: expiresAt, ip }),
  }).catch(() => null);
  const rowId = Array.isArray(inserted) ? inserted[0]?.id : inserted?.id;

  const sms = await sendKavenegar(env, phone, code);
  if (sms.missing) {
    if (otpDevMode(env)) {
      return json({ ok: true, dev: true, code, expiresIn: OTP_TTL_SECONDS, resendIn: OTP_RESEND_SECONDS });
    }
    if (rowId) {
      await supabaseFetch(env, `/rest/v1/phone_otp_codes?id=eq.${rowId}`, { method: 'DELETE' }).catch(() => {});
    }
    return json({
      ok: false,
      error: 'سامانهٔ پیامک هنوز فعال نشده است. لطفاً با پشتیبانی تماس بگیرید یا با ایمیل وارد شوید.',
      code: 'sms_not_configured',
    }, 503);
  }
  if (!sms.ok) {
    if (rowId) {
      await supabaseFetch(env, `/rest/v1/phone_otp_codes?id=eq.${rowId}`, { method: 'DELETE' }).catch(() => {});
    }
    return json({ ok: false, error: 'ارسال پیامک ناموفق بود؛ دوباره تلاش کنید', code: 'sms_failed' }, 502);
  }

  return json({ ok: true, expiresIn: OTP_TTL_SECONDS, resendIn: OTP_RESEND_SECONDS });
}

/** کاربر Auth را با شماره پیدا می‌کند یا می‌سازد و پروفایلش را کامل می‌کند. */
async function findOrCreatePhoneUser(env, phone) {
  const profiles = await supabaseFetch(env, `/rest/v1/profiles?phone=eq.${phone}&select=id&limit=1`).catch(() => []);
  const existing = Array.isArray(profiles) ? profiles[0] : null;

  if (existing && existing.id) {
    const user = await supabaseFetch(env, `/auth/v1/admin/users/${existing.id}`).catch(() => null);
    if (user && user.email) return { uid: existing.id, email: user.email, isNew: false };
  }

  // ایمیل داخلی: کاربر هرگز آن را نمی‌بیند؛ فقط شناسهٔ Auth است.
  const internalEmail = `${phone}@phone.hamyar.local`;
  let created = null;
  try {
    created = await supabaseFetch(env, '/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email: internalEmail,
        password: crypto.randomUUID() + crypto.randomUUID(),
        email_confirm: true,
        user_metadata: { phone, display_name: phone, auth_method: 'phone' },
      }),
    });
  } catch (e) {
    // اگر قبلاً ساخته شده (مثلاً در تلاش قبلی)، همان را برمی‌داریم
    const again = await supabaseFetch(env, `/rest/v1/profiles?phone=eq.${phone}&select=id&limit=1`).catch(() => []);
    const row = Array.isArray(again) ? again[0] : null;
    if (!row) throw e;
    const user = await supabaseFetch(env, `/auth/v1/admin/users/${row.id}`).catch(() => null);
    if (!user || !user.email) throw e;
    return { uid: row.id, email: user.email, isNew: false };
  }

  const uid = created && created.id;
  if (!uid) throw new Error('ساخت حساب کاربری ناموفق بود');

  // پروفایل را با شماره کامل می‌کنیم (تريگر ممکن است نام/ایمیل را ساخته باشد)
  await supabaseFetch(env, `/rest/v1/profiles?id=eq.${uid}`, {
    method: 'PATCH',
    body: JSON.stringify({ phone, display_name: phone }),
  }).catch(() => {});

  return { uid, email: internalEmail, isNew: true };
}

async function handleOtpVerify(env, request) {
  const body = await request.json().catch(() => ({}));
  const phone = normalizePhone(body.phone);
  const code = String(body.code == null ? '' : body.code).replace(/\D/g, '');
  if (!phone) return json({ ok: false, error: 'شماره موبایل معتبر نیست' }, 400);
  if (code.length !== 6) return json({ ok: false, error: 'کد ۶ رقمی را کامل وارد کنید' }, 400);

  const rows = await supabaseFetch(
    env,
    `/rest/v1/phone_otp_codes?phone=eq.${phone}&consumed_at=is.null&select=id,code_hash,expires_at,attempts&order=created_at.desc&limit=1`,
  ).catch(() => []);
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return json({ ok: false, error: 'کدی برای این شماره صادر نشده است؛ دوباره درخواست دهید' }, 400);

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return json({ ok: false, error: 'کد منقضی شده است؛ کد جدید بگیرید' }, 400);
  }
  if (Number(row.attempts) >= OTP_MAX_ATTEMPTS) {
    return json({ ok: false, error: 'تعداد تلاش‌ها بیش از حد مجاز است؛ کد جدید بگیرید' }, 429);
  }

  const expected = await hashOtp(env, phone, code);
  if (expected !== row.code_hash) {
    await supabaseFetch(env, `/rest/v1/phone_otp_codes?id=eq.${row.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ attempts: Number(row.attempts) + 1 }),
    }).catch(() => {});
    return json({ ok: false, error: 'کد وارد شده درست نیست' }, 400);
  }

  await supabaseFetch(env, `/rest/v1/phone_otp_codes?id=eq.${row.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ consumed_at: new Date().toISOString() }),
  }).catch(() => {});

  const { email, isNew, uid } = await findOrCreatePhoneUser(env, phone);

  // مجیک‌لینک یک‌بارمصرف → کلاینت با verifyOtp نشست واقعی می‌گیرد
  const link = await supabaseFetch(env, '/auth/v1/admin/generate_link', {
    method: 'POST',
    body: JSON.stringify({ type: 'magiclink', email }),
  });
  const tokenHash = (link && link.properties && link.properties.hashed_token) || (link && link.hashed_token);
  if (!tokenHash) return json({ ok: false, error: 'ایجاد نشست ناموفق بود؛ دوباره تلاش کنید' }, 500);

  return json({ ok: true, token_hash: tokenHash, email, is_new: isNew, user_id: uid });
}

// ---------------------------------------------------------------- request ---
async function handleRequestPayment(env, request) {
  const user = await requireUser(env, request);
  if (!user) return json({ ok: false, error: 'برای پرداخت باید وارد حساب کاربری شوید' }, 401);

  const body = await request.json().catch(() => ({}));
  const orderId = String(body.orderId || '').trim();
  if (!orderId) return json({ ok: false, error: 'شناسهٔ سفارش لازم است' }, 400);

  const orders = await supabaseFetch(
    env,
    `/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&select=id,customer_id,total,paid,tracking_code,customer_name&limit=1`,
  );
  const order = Array.isArray(orders) ? orders[0] : null;
  if (!order) return json({ ok: false, error: 'سفارش یافت نشد' }, 404);
  if (order.customer_id !== user.id) return json({ ok: false, error: 'این سفارش متعلق به شما نیست' }, 403);

  const remainingToman = Number(order.total || 0) - Number(order.paid || 0);
  if (!Number.isFinite(remainingToman) || remainingToman <= 0) {
    return json({ ok: false, error: 'این سفارش قبلاً پرداخت شده است' }, 400);
  }
  const amountRial = Math.round(remainingToman * 10);

  const zp = zarinpalConfig(env);
  const origin = new URL(request.url).origin;
  const callbackUrl = `${origin}/payment/callback`;

  const zpRes = await fetch(`${zp.base}/pg/v4/payment/request.json`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      merchant_id: zp.merchant,
      amount: amountRial,
      callback_url: callbackUrl,
      description: `پرداخت سفارش ${order.tracking_code || order.id}`,
      metadata: { order_id: order.id },
    }),
  });
  const zpJson = await zpRes.json().catch(() => ({}));
  const authority = zpJson && zpJson.data && zpJson.data.authority;
  if (!authority || zpJson.data.code !== 100) {
    const message = (zpJson.errors && zpJson.errors.message) || 'ایجاد تراکنش در درگاه ناموفق بود';
    return json({ ok: false, error: message, code: zpJson.errors && zpJson.errors.code }, 502);
  }

  // ردیف پرداخت: اگر برای همین authority قبلاً رکوردی هست (تلاش دوباره) به‌روز می‌شود.
  const existing = await supabaseFetch(
    env,
    `/rest/v1/payments?gateway_ref=eq.${encodeURIComponent(authority)}&select=id&limit=1`,
  );
  if (Array.isArray(existing) && existing.length) {
    await supabaseFetch(env, `/rest/v1/payments?id=eq.${existing[0].id}`, {
      method: 'PATCH',
      body: JSON.stringify({ amount: remainingToman, status: 'pending', order_id: order.id }),
    });
  } else {
    await supabaseFetch(env, '/rest/v1/payments', {
      method: 'POST',
      body: JSON.stringify([{
        user_id: user.id,
        order_id: order.id,
        amount: remainingToman,
        payment_method: 'online',
        gateway_ref: authority,
        status: 'pending',
      }]),
    });
  }

  return json({
    ok: true,
    authority,
    startUrl: `${zp.base}/pg/StartPay/${authority}`,
    sandbox: zp.sandbox,
    amount: remainingToman,
  });
}

// ----------------------------------------------------------------- wallet ---
const WALLET_MIN = 10000;
const WALLET_MAX = 50000000;

async function handleWalletTopUp(env, request) {
  const user = await requireUser(env, request);
  if (!user) return json({ ok: false, error: 'برای شارژ کیف پول باید وارد حساب شوید' }, 401);

  const body = await request.json().catch(() => ({}));
  const amount = Math.round(Number(body.amount));
  if (!Number.isFinite(amount) || amount < WALLET_MIN || amount > WALLET_MAX) {
    return json({
      ok: false,
      error: `مبلغ شارژ باید بین ${WALLET_MIN.toLocaleString('fa-IR')} و ${WALLET_MAX.toLocaleString('fa-IR')} تومان باشد`,
    }, 400);
  }

  const zp = zarinpalConfig(env);
  const origin = new URL(request.url).origin;
  const zpRes = await fetch(`${zp.base}/pg/v4/payment/request.json`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      merchant_id: zp.merchant,
      amount: amount * 10, // ریال
      callback_url: `${origin}/payment/callback`,
      description: 'شارژ کیف پول همیار',
      metadata: { kind: 'wallet', user_id: user.id },
    }),
  });
  const zpJson = await zpRes.json().catch(() => ({}));
  const authority = zpJson && zpJson.data && zpJson.data.authority;
  if (!authority || zpJson.data.code !== 100) {
    return json({
      ok: false,
      error: (zpJson.errors && zpJson.errors.message) || 'ایجاد تراکنش در درگاه ناموفق بود',
    }, 502);
  }

  // order_id عمداً null است: این پرداخت به سفارش وصل نیست و در verify به‌عنوان
  // شارژ کیف پول شناسایی می‌شود.
  await supabaseFetch(env, '/rest/v1/payments', {
    method: 'POST',
    body: JSON.stringify([{
      user_id: user.id,
      order_id: null,
      amount,
      payment_method: 'online',
      gateway_ref: authority,
      status: 'pending',
    }]),
  });

  return json({
    ok: true,
    authority,
    startUrl: `${zp.base}/pg/StartPay/${authority}`,
    sandbox: zp.sandbox,
    amount,
  });
}

// ----------------------------------------------------------------- verify ---
async function handleVerifyPayment(env, request) {
  // تأیید پرداخت عمداً به نشست مرورگر گره نخورده است: اگر کاربر هنگام بازگشت
  // از درگاه نشستش منقضی/پاک شده باشد، نباید پولش گم شود. `authority` یک
  // شناسهٔ تصادفی ۳۶ کاراکتری وابسته به همان ردیف payments است و زرین‌پال
  // مرجع نهایی موفقیت تراکنش است؛ پس:
  //   - اگر JWT معتبر باشد → مالکیت بررسی می‌شود
  //   - اگر نباشد → فقط همان تراکنشِ مشخص تأیید می‌شود (idempotent و بی‌خطر)
  const user = await requireUser(env, request);

  const body = await request.json().catch(() => ({}));
  const authority = String(body.authority || '').trim();
  const status = String(body.status || '').trim().toUpperCase();
  if (!authority) return json({ ok: false, error: 'کد تراکنش (authority) لازم است' }, 400);

  const rows = await supabaseFetch(
    env,
    `/rest/v1/payments?gateway_ref=eq.${encodeURIComponent(authority)}&select=id,user_id,order_id,amount,status&limit=1`,
  );
  const payment = Array.isArray(rows) ? rows[0] : null;
  if (!payment) return json({ ok: false, error: 'تراکنش یافت نشد' }, 404);
  if (user && payment.user_id !== user.id) {
    return json({ ok: false, error: 'این تراکنش متعلق به شما نیست' }, 403);
  }

  const result = await settlePayment(env, payment, status, authority);
  return json(result, result.httpCode || 200);
}

/**
 * تسویهٔ یک ردیف پرداخت.
 *
 * idempotent است: اگر ردیف قبلاً `paid` شده باشد دوباره شارژ/تسویه نمی‌شود.
 * برای هر دو حالت استفاده می‌شود: بازگشت از درگاه (verify) و بازبینی
 * پرداخت‌های معلق (reconcile).
 */
async function settlePayment(env, payment, status, authority) {
  const isWallet = !payment.order_id;

  if (status && status !== 'OK') {
    await supabaseFetch(env, `/rest/v1/payments?id=eq.${payment.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'failed' }),
    });
    return { ok: false, error: 'پرداخت توسط شما لغو شد', cancelled: true };
  }

  if (payment.status === 'paid') {
    return {
      ok: true,
      alreadyVerified: true,
      kind: isWallet ? 'wallet' : 'order',
      orderId: payment.order_id,
      amount: Number(payment.amount),
    };
  }

  const zp = zarinpalConfig(env);
  const verifyRes = await fetch(`${zp.base}/pg/v4/payment/verify.json`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      merchant_id: zp.merchant,
      amount: Math.round(Number(payment.amount) * 10),
      authority,
    }),
  });
  const zj = await verifyRes.json().catch(() => ({}));
  const code = zj && zj.data && zj.data.code;

  if (code !== 100 && code !== 101) {
    await supabaseFetch(env, `/rest/v1/payments?id=eq.${payment.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'failed' }),
    });
    return {
      ok: false,
      error: (zj && zj.errors && zj.errors.message) || 'تأیید پرداخت ناموفق بود',
      code,
      httpCode: 402,
    };
  }

  const refId = String((zj && zj.data && zj.data.ref_id) || '');

  if (isWallet) {
    // شارژ کیف پول: `credit_wallet_payment` فقط برای service_role مجاز است (تابع
    // قدیمی `deposit_wallet` به هر کاربر اجازهٔ شارژ خودش را می‌داد و به همین
    // دلیل از دیتابیس حذف شده بود). تریگر `wallet_txn_trigger` موجودی را
    // به‌روز می‌کند.
    const balance = await supabaseFetch(env, '/rest/v1/rpc/credit_wallet_payment', {
      method: 'POST',
      body: JSON.stringify({
        p_user_id: payment.user_id,
        p_amount: Number(payment.amount),
        p_reason: refId ? `شارژ کیف پول — کد پیگیری ${refId}` : 'شارژ کیف پول از درگاه',
      }),
    });
    await supabaseFetch(env, `/rest/v1/payments?id=eq.${payment.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'paid', paid_at: new Date().toISOString() }),
    });
    return {
      ok: true,
      kind: 'wallet',
      refId,
      amount: Number(payment.amount),
      balance: typeof balance === 'number' ? balance : Number(balance),
      code,
    };
  }

  // `verify_payment` (service-role only) پرداخت را paid می‌کند، سفارش و فاکتور
  // را تسویه می‌کند و امتیاز وفاداری را می‌دهد.
  await supabaseFetch(env, '/rest/v1/rpc/verify_payment', {
    method: 'POST',
    body: JSON.stringify({ p_gateway_ref: authority, p_success: true, p_trace: refId }),
  });

  return {
    ok: true,
    kind: 'order',
    refId: refId || null,
    cardPan: zj && zj.data ? zj.data.card_pan : null,
    code,
    orderId: payment.order_id,
    alreadyVerified: code === 101,
  };
}

/**
 * بازبینی پرداخت‌های معلق کاربر.
 *
 * اگر کاربر بعد از پرداخت، قبل از رسیدن به صفحهٔ callback تب را ببندد یا شبکه
 * قطع شود، ردیف پرداخت `pending` می‌ماند و پول/سفارش تسویه نمی‌شود. این
 * endpoint هنگام ورود به پروفایل صدا زده می‌شود و هر پرداخت معلق را یک‌بار
 * با زرین‌پال تأیید می‌کند (اگر واقعاً پرداخت نشده باشد، failed می‌شود).
 */
async function handleReconcile(env, request) {
  const user = await requireUser(env, request);
  if (!user) return json({ ok: false, error: 'برای بازبینی پرداخت‌ها باید وارد شوید' }, 401);

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const rows = await supabaseFetch(
    env,
    `/rest/v1/payments?user_id=eq.${user.id}&status=eq.pending&created_at=gte.${encodeURIComponent(since)}` +
      `&select=id,user_id,order_id,amount,status,gateway_ref&order=created_at.desc&limit=10`,
  );

  let settled = 0;
  for (const p of Array.isArray(rows) ? rows : []) {
    try {
      const r = await settlePayment(env, p, 'OK', p.gateway_ref);
      if (r.ok && !r.alreadyVerified) settled += 1;
    } catch {
      /* یک تراکنش خراب نباید بقیه را متوقف کند */
    }
  }

  return json({ ok: true, checked: Array.isArray(rows) ? rows.length : 0, settled });
}

// ----------------------------------------------------------------- assets ---
async function handleAsset(request, env) {
  const url = new URL(request.url);
  const asset = await env.ASSETS.fetch(request);

  if (asset.status !== 404) {
    const headers = new Headers(asset.headers);
    const isHtml = (headers.get('content-type') || '').includes('text/html');
    // فایل هش‌دارِ ناموجود نباید HTML بگیرد؛ وگرنه مرورگر با خطای MIME متوقف
    // می‌شود و نسخهٔ کهنهٔ HTML هم برای یک سال کش می‌شود.
    if (url.pathname.startsWith('/assets/') && (isHtml || asset.status === 404)) {
      return new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } });
    }
    if (url.pathname.startsWith('/assets/')) {
      headers.set('cache-control', 'public, max-age=31536000, immutable');
    } else if (url.pathname === '/' || url.pathname.endsWith('.html')) {
      headers.set('cache-control', 'no-cache');
    }
    return new Response(asset.body, { status: asset.status, headers });
  }

  // SPA fallback برای ناوبری مرورگر؛ درخواست فایل باید همان ۴۰۴ را بگیرد.
  const acceptsHtml = (request.headers.get('accept') || '').includes('text/html');
  const looksLikeFile = url.pathname.startsWith('/assets/') || /\.[a-z0-9]{2,5}$/i.test(url.pathname);
  if (request.method !== 'GET' || !acceptsHtml || looksLikeFile) {
    if (asset.status === 404) {
      return new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } });
    }
    return asset;
  }

  const indexUrl = new URL('/index.html', url);
  const index = await env.ASSETS.fetch(new Request(indexUrl.toString(), {
    method: 'GET',
    headers: request.headers,
  }));
  if (index.status === 404) return new Response('Not found', { status: 404 });
  return new Response(index.body, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return new Response(null, { status: 204, headers: { 'access-control-allow-origin': url.origin } });
    }

    try {
      if (url.pathname === '/api/health') {
        const zp = zarinpalConfig(env);
        const sms = String(env.KAVENEGAR_API_KEY || '').trim();
        return json({
          ok: true,
          gateway: 'zarinpal',
          mode: zp.sandbox ? 'sandbox' : 'live',
          phoneAuth: sms ? 'configured' : (otpDevMode(env) ? 'dev' : 'not-configured'),
        });
      }
      if (url.pathname === '/api/otp/request' && request.method === 'POST') {
        return await handleOtpRequest(env, request);
      }
      if (url.pathname === '/api/otp/verify' && request.method === 'POST') {
        return await handleOtpVerify(env, request);
      }
      if (url.pathname === '/api/zarinpal/request' && request.method === 'POST') {
        return await handleRequestPayment(env, request);
      }
      if (url.pathname === '/api/zarinpal/wallet/request' && request.method === 'POST') {
        return await handleWalletTopUp(env, request);
      }
      if (url.pathname === '/api/zarinpal/verify' && request.method === 'POST') {
        return await handleVerifyPayment(env, request);
      }
      if (url.pathname === '/api/zarinpal/reconcile' && request.method === 'POST') {
        return await handleReconcile(env, request);
      }
      if (url.pathname.startsWith('/api/')) {
        return json({ ok: false, error: 'not found' }, 404);
      }
    } catch (e) {
      return json({ ok: false, error: (e && e.message) || 'خطای داخلی سرور پرداخت' }, 500);
    }

    if (!env || !env.ASSETS) {
      return new Response('Assets binding is not configured', { status: 500 });
    }
    return handleAsset(request, env);
  },
};
