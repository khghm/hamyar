import { describe, it, expect } from 'vitest';
import { normalizeIranPhone } from './otp';

describe('normalizeIranPhone', () => {
  it('accepts the local 09xxxxxxxxx format', () => {
    expect(normalizeIranPhone('09121234567')).toBe('09121234567');
  });

  it('accepts +98 and 0098 prefixes', () => {
    expect(normalizeIranPhone('+989121234567')).toBe('09121234567');
    expect(normalizeIranPhone('00989121234567')).toBe('09121234567');
    expect(normalizeIranPhone('989121234567')).toBe('09121234567');
  });

  it('adds the leading zero to a bare 9xxxxxxxxx number', () => {
    expect(normalizeIranPhone('9121234567')).toBe('09121234567');
  });

  it('converts Persian and Arabic digits', () => {
    expect(normalizeIranPhone('۰۹۱۲۱۲۳۴۵۶۷')).toBe('09121234567');
    expect(normalizeIranPhone('٠٩١٢١٢٣٤٥٦٧')).toBe('09121234567');
  });

  it('ignores spaces, dashes and parentheses', () => {
    expect(normalizeIranPhone('0912-123 4567')).toBe('09121234567');
    expect(normalizeIranPhone('(0912) 1234567')).toBe('09121234567');
  });

  it('rejects invalid numbers', () => {
    expect(normalizeIranPhone('')).toBe('');
    expect(normalizeIranPhone('12345')).toBe('');
    expect(normalizeIranPhone('08121234567')).toBe('');
    expect(normalizeIranPhone('0912123456')).toBe('');
    expect(normalizeIranPhone('091212345678')).toBe('');
  });
});
