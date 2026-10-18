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
        return json({ ok: true, gateway: 'zarinpal', mode: zp.sandbox ? 'sandbox' : 'live' });
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
