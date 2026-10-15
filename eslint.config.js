import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'coverage',
      // worktreeهای ابزار داخل ریپو نباید لینت شوند؛ dist و node_modules خودشان را دارند.
      '.kilo/',
      'scripts/.seed-bundle.mjs',
    ],
  },

  // قواعد پایهٔ JS فقط برای فایل‌های واقعاً جاوااسکریپت. اگر این‌ها روی
  // .ts/.tsx هم اعمال شوند، no-unused-expressions / no-func-assign / no-undef
  // روی سینتکس تایپ‌اسکریپت (مثلاً تایپ‌کست یا optional chaining) خطای کاذب
  // می‌دهند؛ کامپایلر تایپ‌اسکریپت این موارد را بهتر پوشش می‌دهد.
  {
    ...js.configs.recommended,
    files: ['**/*.{js,mjs,cjs}'],
  },
  ...tseslint.configs.recommended,

  // ---------------------------------------------------------------- React
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // این دو قانون مهم‌ترین سیگنال کیفیت در یک اپ React هستند:
      // وابستگی ناقص در useEffect باعث stale closure و باگهای ظاهراً تصادفی می‌شود.
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
    },
  },

  // ---------------------------------------------------------------- TS
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // سیاست رَتچت: قواعد صحت‌محور خطا هستند، قواعد «سبک‌نویسی/سخت‌گیری نوع»
      // هشدار. این‌ها با گذر زمان باید کم شوند، ولی خطا کردنشان یعنی ۳۰۰+
      // خطای پراکنده و غیرقابل‌بازبینی در یک commit.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-non-null-assertion': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // ---------------------------------------------------------------- تست
  {
    files: ['src/test/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // ------------------------------------------------- اسکریپت‌های Node
  {
    files: ['scripts/**/*.{js,mjs,ts}', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
    rules: { 'no-console': 'off' },
  },
);