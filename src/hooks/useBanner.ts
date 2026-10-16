import { useEffect, useState } from 'react';
import { fetchBanners } from '../api/settings';

export interface Banner {
  page: string;
  title: string;
  description: string;
  imageUrl: string;
}

const LEGACY_KEY = 'hamyar_banners';

/**
 * بنرها حالا در Supabase (سند `about_content/banners`) نگه‌داری می‌شوند تا برای
 * همهٔ بازدیدکننده‌ها و روی همهٔ مرورگرها یکسان باشند — نه فقط در localStorage
 * همان مرورگری که ادمین از آن آپلود کرده. چون سایت عمومی برای هر بازدیدکننده
 * دوباره mount می‌شود، یک کشِ سطح‌ماژول جلوی درخواست تکراری برای هر بنر را
 * می‌گیرد: یک fetch برای کل صفحه کافی است.
 *
 * localStorage فقط دو نقش دارد: (۱) نقاشیِ فوری قبل از رسیدن پاسخ شبکه، و
 * (۲) fallback وقتی درخواست شکست بخورد (مثلاً آفلاین).
 */
let cache: Banner[] | null = null;
let inflight: Promise<Banner[]> | null = null;

function readLegacy(): Banner[] {
  try {
    const saved = localStorage.getItem(LEGACY_KEY);
    return saved ? (JSON.parse(saved) as Banner[]) : [];
  } catch {
    return [];
  }
}

async function loadBanners(): Promise<Banner[]> {
  if (cache) return cache;
  if (!inflight) {
    inflight = fetchBanners<Banner[]>()
      .then((rows) => {
        cache = Array.isArray(rows) ? rows : [];
        return cache;
      })
      .catch(() => {
        cache = readLegacy();
        return cache;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/**
 * پس از ذخیرهٔ بنرها در پنل ادمین فراخوانی می‌شود تا کش پاک شود و صفحات عمومی
 * بدون نیاز به reload، نسخهٔ تازه را بگیرند.
 */
export function invalidateBanners(): void {
  cache = null;
  inflight = null;
}

export function useBanner(page: string): Banner | null {
  const [banner, setBanner] = useState<Banner | null>(
    () => cache?.find((b) => b.page === page) ?? readLegacy().find((b) => b.page === page) ?? null,
  );

  useEffect(() => {
    let cancelled = false;
    loadBanners().then((banners) => {
      if (cancelled) return;
      setBanner(banners.find((b) => b.page === page) ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [page]);

  return banner;
}
