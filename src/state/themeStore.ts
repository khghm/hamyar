import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * فاز ۲.۴ — وضعیت سبک رابط کاربری در Zustand به‌جای Context.
 *
 * «حالت تیره» قبلاً داخل `AppProvider` بود، یعنی هر تغییر در هر collection
 * (سفارش، محصول، مشتری …) کل Context را عوض می‌کرد و همهٔ ۵۲ مصرف‌کننده را دوباره
 * رندر می‌کرد — حتی اگر فقط پوسته عوض شده باشد. با Zustand فقط کامپوننت‌هایی
 * که واقعاً `darkMode` را می‌خوانند دوباره رندر می‌شوند.
 *
 * کلید ذخیره‌سازی عمداً `hamyar_dark` نگه داشته شده تا انتخاب کاربران قبلی حفظ شود.
 */
interface ThemeState {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      darkMode: false,
      toggleDarkMode: () => set({ darkMode: !get().darkMode }),
      setDarkMode: (value) => set({ darkMode: value }),
    }),
    {
      name: 'hamyar_dark',
      // کلید قدیمی مقدار رشته‌ای ('true'/'false') بود، نه JSON. تبدیل صریح
      // لازم است تا ذخیره‌سازی خودکار Zustand آن را درست بخواند.
      storage: {
        getItem: (name) => {
          const raw = localStorage.getItem(name);
          if (raw === null) return null;
          try {
            const parsed = JSON.parse(raw);
            return { state: { darkMode: parsed === true || parsed === 'true' }, version: 0 };
          } catch {
            return { state: { darkMode: raw === 'true' }, version: 0 };
          }
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value.state.darkMode)),
        removeItem: (name) => localStorage.removeItem(name),
      },
    },
  ),
);

/**
 * کلاس `dark` روی `<html>` باید همیشه با مقدار ذخیره‌شده هم‌خوان باشد، حتی پیش از
 * رندر اولین کامپوننت. این تابع یک‌بار در ریشه صدا زده می‌شود.
 */
export function applyThemeClass(darkMode: boolean) {
  if (darkMode) document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
}