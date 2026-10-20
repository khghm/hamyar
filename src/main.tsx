import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { useThemeStore } from "./state/themeStore";

/**
 * همگام‌سازی کلاس `dark` روی <html> با وضعیت اپ.
 *
 * Tailwind v4 به‌صورت پیش‌فرض `dark:` را بر اساس تنظیم سیستم‌عامل اعمال می‌کند؛
 * اما این اپ حالت تاریک را با دکمهٔ خودش کنترل می‌کند. با این اشتراک، هم
 * کلاس‌های `dark:` و هم استایل‌های سراسری با یک منبع حقیقت هم‌خوان می‌شوند.
 */
function syncDarkClass(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}
syncDarkClass(useThemeStore.getState().darkMode);
useThemeStore.subscribe((state) => syncDarkClass(state.darkMode));

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
