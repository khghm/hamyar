/**
 * Cloudflare Worker + static assets (dist).
 *
 * نکتهٔ مهم دربارهٔ نسخهٔ قبلی: در این فایل از `env.ASSETS.get(...)` استفاده شده
 * بود که متد معتبری نیست (`.get` مال R2 است؛ برای binding استاتیک متد
 * `fetch` است). نتیجه این بود که هر مسیری که فایل استاتیک نبود — یعنی هر
 * deep link مثل `/admin/orders` یا `/profile` — استثنا می‌داد، در catch بلعیده
 * می‌شد و کاربر «Not found» با کد ۴۰۴ می‌گرفت. حالا از `fetch` استفاده می‌شود
 * و fallback SPA درست کار می‌کند.
 *
 * کش:
 *   /assets/*  → فایل‌های هش‌دار، یک سال immutable (با هر دیپلوی اسم عوض می‌شود)
 *   HTML       → no-cache تا بعد از دیپلوی، هش‌های جدید فوراً دیده شوند
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (!env || !env.ASSETS) {
      return new Response("Assets binding is not configured", { status: 500 });
    }

    const asset = await env.ASSETS.fetch(request);

    if (asset.status !== 404) {
      const headers = new Headers(asset.headers);
      if (url.pathname.startsWith("/assets/")) {
        headers.set("cache-control", "public, max-age=31536000, immutable");
      } else if (url.pathname === "/" || url.pathname.endsWith(".html")) {
        headers.set("cache-control", "no-cache");
      }
      return new Response(asset.body, { status: asset.status, headers });
    }

    // SPA fallback فقط برای ناوبری مرورگر؛ درخواست فایل (مثل یک chunk گم‌شده)
    // باید همان ۴۰۴ را بگیرد تا مرورگر به‌جای HTML، خطای واقعی را ببیند.
    const acceptsHtml = (request.headers.get("accept") || "").includes("text/html");
    if (request.method !== "GET" || !acceptsHtml) {
      return asset;
    }

    const indexUrl = new URL("/index.html", url);
    const index = await env.ASSETS.fetch(
      new Request(indexUrl.toString(), { method: "GET", headers: request.headers }),
    );

    if (index.status === 404) {
      return new Response("Not found", { status: 404 });
    }

    const headers = new Headers(index.headers);
    headers.set("cache-control", "no-cache");
    return new Response(index.body, { status: 200, headers });
  },
};
