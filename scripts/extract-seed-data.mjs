// استخراج ثابت‌های داده از src/store.tsx به JSON، بدون اجرای منطق React.
// esbuild کل ما�ول را bundle می‌کند و ما فقط مقادیر اکسپورت‌شده را می‌خوانیم.
import { build } from 'esbuild';
import { writeFileSync } from 'fs';

const result = await build({
  entryPoints: ['scripts/.seed-entry.ts'],
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  // کد از import.meta.env استفاده می‌کند که در Node وجود ندارد
  define: { 'import.meta.env': JSON.stringify({ MODE: 'development', DEV: false, PROD: false }) },
  external: ['react', 'react-dom', '@supabase/supabase-js'],
  logLevel: 'error',
});

const code = result.outputFiles[0].text;
writeFileSync('scripts/.seed-bundle.mjs', code);
const mod = await import('./.seed-bundle.mjs');

const out = {
  PROJECT_SERVICES: mod.PROJECT_SERVICES,
  INITIAL_ABOUT: mod.INITIAL_ABOUT,
  DEFAULT_NOTIFICATION_SETTINGS: mod.DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_NOTIFICATION_TYPES: mod.DEFAULT_NOTIFICATION_TYPES,
  DEFAULT_GAMIFICATION: mod.DEFAULT_GAMIFICATION_CONFIG,
  SOCIAL_MEDIA: mod.INITIAL_ABOUT?.socialMedia ?? null,
};

writeFileSync('scripts/.seed-data.json', JSON.stringify(out, null, 2));
console.log('extracted keys:', Object.keys(out).map(k => `${k}=${Array.isArray(out[k]) ? out[k].length : typeof out[k]}`).join(', '));