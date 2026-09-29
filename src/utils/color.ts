// ---------------------------------------------------------------------------
// Small color helpers used by the admin notification settings (تنظیمات اعلان).
// The notification-type palette is fully admin-manageable, so badge classes
// are generated at runtime from a single hex color instead of being hard-coded
// Tailwind strings. These functions derive readable text colors and translucent
// variants from that hex value.
// ---------------------------------------------------------------------------

export function normalizeHex(hex: string): string {
  let h = (hex || '').trim();
  if (!h.startsWith('#')) h = '#' + h;
  // #rgb -> #rrggbb
  if (/^#[0-9a-fA-F]{3}$/.test(h)) {
    h = '#' + h.slice(1).split('').map(c => c + c).join('');
  }
  return /^#[0-9a-fA-F]{6}$/.test(h) ? h.toLowerCase() : '#2563eb';
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = normalizeHex(hex).slice(1);
  const num = parseInt(m, 16);
  if (Number.isNaN(num)) return null;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function rgba(hex: string, alpha: number): string {
  const c = hexToRgb(hex);
  if (!c) return hex;
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
}

// Perceived luminance (W3C relative-luminance approximation), 0..255.
export function brightness(hex: string): number {
  const c = hexToRgb(hex);
  if (!c) return 128;
  return (c.r * 299 + c.g * 587 + c.b * 114) / 1000;
}

export function isLightColor(hex: string): boolean {
  return brightness(hex) > 155;
}

// Readable text color on top of `bg` (used for inline-styled badges/dots).
export function contrastText(hex: string, darkMode = false): string {
  if (isLightColor(hex)) return '#1e293b'; // slate-800 – dark text on light bg
  return darkMode ? '#f1f5f9' : '#ffffff'; // light text on dark bg
}

// Mix a color toward white / black by `amount` (0..1). Used to build the soft
// badge background for light and dark themes from one admin-picked hex.
export function mixHex(hex: string, target: '#ffffff' | '#000000', amount: number): string {
  const c = hexToRgb(hex);
  const t = hexToRgb(target)!;
  if (!c) return hex;
  const ch = (a: number, b: number) => Math.round(a + (b - a) * amount);
  const to2 = (n: number) => n.toString(16).padStart(2, '0');
  return `#${to2(ch(c.r, t.r))}${to2(ch(c.g, t.g))}${to2(ch(c.b, t.b))}`;
}

export function lighten(hex: string, amount = 0.85): string {
  return mixHex(hex, '#ffffff', amount);
}

export function darkenForDarkTheme(hex: string, amount = 0.68): string {
  return mixHex(hex, '#000000', amount);
}

// Badge background/text pair derived from the type's own color.
export function badgeStyle(hex: string, darkMode: boolean): { backgroundColor: string; color: string } {
  const h = normalizeHex(hex);
  if (darkMode) {
    const lightBg = brightness(h) > 155;
    return {
      backgroundColor: lightBg ? darkenForDarkTheme(h, 0.45) : darkenForDarkTheme(h, 0.68),
      color: lightBg ? darkenForDarkTheme(h, 0.12) : lighten(h, 0.55),
    };
  }
  return { backgroundColor: lighten(h, 0.85), color: darkenForDarkTheme(h, 0.28) };
}
