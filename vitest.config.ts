import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// پیکربندی جدا از vite.config.js تا تنظیمات تست (jsdom، پوشش، جداسازی) وارد
// باندل production نشود.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // تست‌های DB به کانتینر Postgres نیاز دارند، پس ترتیب و تایم‌آوت صریح است.
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 30000,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/main.tsx",
        "src/App.tsx",
      ],
    },
  },
});