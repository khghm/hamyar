// ---------------------------------------------------------------------------
// فاز ۱ – زیرساخت جمع‌آوری داده (Data Collection Layer)
//
// یک پایشگر داخلی سبک (بدون نیاز به سرویس خارجی) که:
//   • هر بازدید صفحه را با شناسهٔ منحصربه‌فرد کاربر (visitorId در localStorage)
//     و عمق اسکرول ثبت می‌کند
//   • رویدادهای کلیدی کسب‌وکار (کلیک تماس، چت، سبد خرید، فیلتر/جستجو، کلیک
//     نماد اعتماد، آیکون شبکه‌های اجتماعی، دد-کلیک، کوییک‌بک، خطای 404 …) را
//     ضبط می‌کند
//   • پارامترهای کمپین (utm_source / utm_medium / utm_campaign / coupon) را از
//     URL استخراج و برای انتساب منبع ترافیک ذخیره می‌کند
//   • همه را در localStorage نگه می‌دارد تا داشبورد دیجیتال مارکتینگ شاخص‌های
//     «خودکار» را از داده واقعی محاسبه کند.
//
// هوک React `useAnalytics()` این لایه را به کامپوننت‌ها وصل می‌کند.
// ---------------------------------------------------------------------------

import { useEffect } from 'react';

export interface AnalyticsEvent {
  id: string;
  type: string;            // pageview | scroll | click_call | chat_open | ...
  path: string;            // مسیر سایت هنگام رویداد
  visitorId: string;       // شناسه یکتای مرورگر
  sessionId: string;       // شناسه سشن (تعویض با هر بار ورود به سایت)
  meta?: Record<string, string | number>;
  date: string;            // ISO
}

export interface TrafficAttribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  coupon?: string;
  referrer?: string;
  isDirect: boolean;
  isPaid: boolean;         // دارای utm_medium پولی (cpc/paid/social-paid)
  isOrganic: boolean;      // google/bing/eraghep... یا utm_medium=organic
  isSocial: boolean;
  isReferral: boolean;
}

const EVENTS_KEY = 'hamyar_analytics_events';
const VISITOR_KEY = 'hamyar_visitor_id';
const SESSION_KEY = 'hamyar_session_id';
const ATTRIBUTION_KEY = 'hamyar_attribution';
const MAX_EVENTS = 20000; // سقف حلقوی برای جلوگیری از پر شدن localStorage

const PAID_MEDIUMS = ['cpc', 'ppc', 'paid', 'display', 'paid-social', 'ad', 'ads'];
const ORGANIC_SOURCES = ['google', 'bing', 'yahoo', 'duckduckgo', 'eraghtes', 'faraz', 'organic'];
const SOCIAL_SOURCES = ['instagram', 'telegram', 'eitaa', 'rubika', 'ble', 'youtube', 'linkedin', 'twitter', 'facebook', 'aparat', 'social'];

function uid(prefix: string): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function getVisitorId(): string {
  let v = localStorage.getItem(VISITOR_KEY);
  if (!v) { v = uid('v'); localStorage.setItem(VISITOR_KEY, v); }
  return v;
}

export function getSessionId(): string {
  let s = sessionStorage.getItem(SESSION_KEY);
  if (!s) { s = uid('s'); sessionStorage.setItem(SESSION_KEY, s); }
  return s;
}

// ---- UTM / attribution -----------------------------------------------------

/** اگر لینک وارداتی پارامتر کمپین داشته باشد، همان لحظه ذخیره می‌شود */
export function captureAttributionFromUrl(): void {
  try {
    const url = new URL(window.location.href);
    const src = url.searchParams.get('utm_source') || undefined;
    const med = url.searchParams.get('utm_medium') || undefined;
    const cmp = url.searchParams.get('utm_campaign') || undefined;
    const cpn = url.searchParams.get('coupon') || url.searchParams.get('campaign_code') || undefined;
    if (src || med || cmp || cpn) {
      const prev = readAttributionRaw();
      localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify({
        ...prev,
        utmSource: src || prev?.utmSource,
        utmMedium: med || prev?.utmMedium,
        utmCampaign: cmp || prev?.utmCampaign,
        coupon: cpn || prev?.coupon,
        capturedAt: new Date().toISOString(),
      }));
    } else if (!readAttributionRaw()) {
      // ورود دایرکت بدون UTM
      localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify({ isDirectEntry: true, capturedAt: new Date().toISOString() }));
    }
  } catch { /* noop */ }
}

function readAttributionRaw(): any {
  try { return JSON.parse(localStorage.getItem(ATTRIBUTION_KEY) || '{}'); } catch { return {}; }
}

export function getAttribution(): TrafficAttribution {
  const raw = readAttributionRaw();
  const medium = String(raw.utmMedium || '').toLowerCase();
  const source = String(raw.utmSource || '').toLowerCase();
  const referrer = document.referrer || '';
  const refHost = (() => { try { return referrer ? new URL(referrer).hostname : ''; } catch { return ''; } })();
  const ownHost = window.location.hostname;
  const externalRef = !!refHost && !refHost.includes(ownHost);

  const isPaid = PAID_MEDIUMS.some(m => medium.includes(m));
  const isOrganic = medium === 'organic' || ORGANIC_SOURCES.some(s => source.includes(s) || refHost.includes(s));
  const isSocial = SOCIAL_SOURCES.some(s => source.includes(s) || refHost.includes(s)) || medium.includes('social');
  const isDirect = !source && !medium && !externalRef;

  return {
    utmSource: raw.utmSource, utmMedium: raw.utmMedium, utmCampaign: raw.utmCampaign,
    coupon: raw.coupon, referrer: referrer || undefined,
    isDirect, isPaid, isOrganic, isSocial, isReferral: externalRef && !isOrganic && !isSocial,
  };
}

// ---- event store ------------------------------------------------------------

export function track(type: string, meta?: Record<string, string | number>): void {
  try {
    const events = getEvents();
    events.push({
      id: uid('ev'),
      type,
      path: window.location.pathname,
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      meta,
      date: new Date().toISOString(),
    });
    const trimmed = events.length > MAX_EVENTS ? events.slice(events.length - MAX_EVENTS) : events;
    localStorage.setItem(EVENTS_KEY, JSON.stringify(trimmed));
  } catch { /* quota – ignore silently */ }
}

export function getEvents(): AnalyticsEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function clearEvents(): void {
  localStorage.removeItem(EVENTS_KEY);
}

export function countByType(events: AnalyticsEvent[], type: string): number {
  return events.filter(e => e.type === type).length;
}

/** رشد نسبت ۳۰ روز اخیر به ۳۰ روز قبل‌تر (٪) */
export function growthRate(events: AnalyticsEvent[], type: string | null): number {
  const now = Date.now();
  const cur = events.filter(e => (!type || e.type === type) && now - new Date(e.date).getTime() <= 30 * 864e5).length;
  const prev = events.filter(e => {
    const age = now - new Date(e.date).getTime();
    return (!type || e.type === type) && age > 30 * 864e5 && age <= 60 * 864e5;
  }).length;
  if (prev === 0) return cur > 0 ? 100 : 0;
  return ((cur - prev) / prev) * 100;
}

// ---- React glue --------------------------------------------------------------

/** ثبت خودکار بازدید صفحه در هر تغییر مسیر (SPA router) */
export function usePageTracking(): void {
  useEffect(() => {
    captureAttributionFromUrl();
    const fire = () => {
      track('pageview', { title: document.title });
      // عمق اسکرول – میانگین آن در داشبورد محاسبه می‌شود
      let maxScroll = 0;
      const onScroll = () => {
        const h = document.documentElement;
        const pct = Math.min(100, Math.round(((h.scrollTop || document.body.scrollTop) /
          ((h.scrollHeight || document.body.scrollHeight) - h.clientHeight)) * 100 || 0));
        if (pct > maxScroll) maxScroll = pct;
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      const unload = () => {
        window.removeEventListener('scroll', onScroll);
        if (maxScroll > 0) track('scroll_depth', { depth: maxScroll });
      };
      window.addEventListener('beforeunload', unload, { once: true });
    };
    fire();
    const origPush = window.history.pushState.bind(window.history);
    const origReplace = window.history.replaceState.bind(window.history);
    (window.history as any).pushState = (...a: any[]) => { origPush(...a); fire(); };
    (window.history as any).replaceState = (...a: any[]) => { origReplace(...a); fire(); };
    window.addEventListener('popstate', fire);
    return () => {
      window.removeEventListener('popstate', fire);
      (window.history as any).pushState = origPush;
      (window.history as any).replaceState = origReplace;
    };
  }, []);
}

/** delegation روی body: دد-کلیک و کوییک‌بک (برگشت سریع با دکمه عقب) */
export function useBehaviorTracking(): void {
  useEffect(() => {
    let lastPath = window.location.pathname;
    let lastEnterTs = Date.now();
    const onClick = (ev: MouseEvent) => {
      const t = ev.target as HTMLElement | null;
      if (!t) return;
      // دد کلیک: کلیکی که هیچ لینک/دکمه/اینپوتی را هدف نگرفته است
      const interactive = t.closest('a, button, input, select, textarea, label, [role="button"], [data-track]');
      if (!interactive) track('dead_click', {});
    };
    const onNav = () => {
      const now = Date.now();
      const back = lastPath !== window.location.pathname;
      if (back && now - lastEnterTs < 10000) track('quick_back', { to: window.location.pathname });
      lastPath = window.location.pathname;
      lastEnterTs = now;
    };
    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onNav);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onNav);
    };
  }, []);
}

/** helper برای تزریق دستی رویدادها در کامپوننت‌ها */
export function useAnalytics() {
  return { track, getVisitorId, getSessionId, getAttribution };
}
