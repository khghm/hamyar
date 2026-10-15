import { describe, expect, it } from 'vitest';
import {
  normalizeHex,
  hexToRgb,
  rgba,
  brightness,
  isLightColor,
  contrastText,
  mixHex,
  lighten,
  darkenForDarkTheme,
  badgeStyle,
} from '../utils/color';

describe('normalizeHex', () => {
  it('expands the 3-digit form', () => {
    expect(normalizeHex('#abc')).toBe('#aabbcc');
  });

  it('adds a missing hash and lower-cases', () => {
    expect(normalizeHex('AABBCC')).toBe('#aabbcc');
  });

  it('falls back to the brand blue on garbage input', () => {
    // ادمین می‌تواند هر رشته‌ای در فرم رنگ بگذارد؛ نباید رندر را بشکند.
    expect(normalizeHex('not-a-color')).toBe('#2563eb');
    expect(normalizeHex('')).toBe('#2563eb');
    expect(normalizeHex('#12345')).toBe('#2563eb');
  });
});

describe('hexToRgb', () => {
  it('splits the channels correctly', () => {
    expect(hexToRgb('#ff8000')).toEqual({ r: 255, g: 128, b: 0 });
  });

  it('handles the extremes', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
  });
});

describe('rgba', () => {
  it('builds a translucent rgba string', () => {
    expect(rgba('#ff8000', 0.5)).toBe('rgba(255, 128, 0, 0.5)');
  });
});

describe('brightness / isLightColor', () => {
  it('ranks white as light and black as dark', () => {
    expect(isLightColor('#ffffff')).toBe(true);
    expect(isLightColor('#000000')).toBe(false);
  });

  it('treats yellow as light and navy as dark', () => {
    expect(isLightColor('#ffff00')).toBe(true);
    expect(isLightColor('#000080')).toBe(false);
  });

  it('keeps brightness inside the 0..255 range', () => {
    for (const hex of ['#000000', '#7f7f7f', '#ffffff', '#2563eb']) {
      const b = brightness(hex);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(255);
    }
  });
});

describe('contrastText', () => {
  it('puts dark text on a light background', () => {
    expect(contrastText('#ffffff')).toBe('#1e293b');
  });

  it('puts white text on a dark background in light mode', () => {
    expect(contrastText('#000000', false)).toBe('#ffffff');
  });

  it('uses a softer white on a dark background in dark mode', () => {
    expect(contrastText('#000000', true)).toBe('#f1f5f9');
  });

  it('never returns text the same shade as its own background', () => {
    // اگر متن و پس‌زمینه یکی شوند، برچسب اعلان ناخوانا می‌شود.
    for (const hex of ['#ffffff', '#000000', '#2563eb', '#ffff00']) {
      for (const dark of [true, false]) {
        expect(contrastText(hex, dark)).not.toBe(hex);
      }
    }
  });
});

describe('mixHex', () => {
  it('returns white when amount is 1', () => {
    expect(mixHex('#123456', '#ffffff', 1)).toBe('#ffffff');
  });

  it('returns black when amount is 1 toward black', () => {
    expect(mixHex('#123456', '#000000', 1)).toBe('#000000');
  });

  it('returns the source colour at amount 0', () => {
    expect(mixHex('#123456', '#ffffff', 0)).toBe('#123456');
  });

  it('always produces a 6-digit hex', () => {
    for (const amount of [0, 0.25, 0.5, 0.85, 1]) {
      expect(mixHex('#0a141e', '#ffffff', amount)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe('lighten / darkenForDarkTheme', () => {
  it('moves toward white and black respectively', () => {
    expect(brightness(lighten('#000000'))).toBeGreaterThan(brightness('#000000'));
    expect(brightness(darkenForDarkTheme('#ffffff'))).toBeLessThan(brightness('#ffffff'));
  });
});

describe('badgeStyle', () => {
  it('returns both a background and a text colour in light mode', () => {
    const style = badgeStyle('#2563eb', false);
    expect(style.backgroundColor).toMatch(/^#[0-9a-f]{6}$/);
    expect(style.color).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('never paints the badge text the same colour as its background', () => {
    for (const hex of ['#2563eb', '#ffffff', '#000000', '#eab308', '#16a34a']) {
      for (const dark of [true, false]) {
        const { backgroundColor, color } = badgeStyle(hex, dark);
        expect(color).not.toBe(backgroundColor);
      }
    }
  });

  it('survives an invalid admin-entered colour', () => {
    const style = badgeStyle('zzz', false);
    expect(style.backgroundColor).toMatch(/^#[0-9a-f]{6}$/);
  });
});