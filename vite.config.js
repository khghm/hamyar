import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000,
    },
    proxy: {
      '/functions/v1': {
        target: 'https://rcimwpsnekxsxeivpivm.supabase.co',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    // ---------------------------------------------------------------------
    // Chunking.
    //
    // قبلاً کل برنامه در یک فایل ۲.۱ مگابایتی بود؛ روی اتصال‌های ناپایدار یک
    // قطعی در میانهٔ دانلود، سایت را کامل سفید می‌کرد. دو کار انجام شده:
    //   1) مسیرها lazy شدند (App.tsx) تا هر صفحه chunk خودش را داشته باشد؛
    //   2) کتابخانه‌های سنگین و مشترک در chunkهای جدا و کش‌شدنی می‌روند تا با
    //      هر دیپلوی دوباره دانلود نشوند.
    // اسم فایل‌ها هش‌دار است، پس می‌توان با خیال راحت immutable کش کرد
    // (src/index.js همین هدر را برای /assets/* می‌گذارد).
    // ---------------------------------------------------------------------
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("recharts") || id.includes("/d3-")) return "vendor-charts";
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("@dnd-kit")) return "vendor-dnd";
          if (id.includes("react-router") || id.includes("@remix-run")) return "vendor-router";
          if (id.includes("/react-dom/") || id.includes("/react/") || id.includes("/scheduler/")) {
            return "vendor-react";
          }
          return "vendor";
        },
      },
    },
  },
});
