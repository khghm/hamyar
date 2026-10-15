import { describe, expect, it } from 'vitest';
import {
  tomanAmountSchema,
  quantitySchema,
  paymentMethodSchema,
  orderStatusSchema,
  couponCodeSchema,
  loyaltyPointsSchema,
  firstErrorMessage,
  safeParse,
  phoneSchema,
  emailSchema,
  customerLoginSchema,
  staffLoginSchema,
  staffAccountSchema,
} from '../schemas/common';

describe('tomanAmountSchema', () => {
  it('accepts zero — a fully discounted order is legitimate', () => {
    expect(tomanAmountSchema.safeParse(0).success).toBe(true);
  });

  it('accepts large integer amounts', () => {
    expect(tomanAmountSchema.safeParse(60_000_000).success).toBe(true);
  });

  it('rejects a negative amount', () => {
    expect(tomanAmountSchema.safeParse(-1).success).toBe(false);
  });

  it('rejects a fractional amount — money is in whole tomans', () => {
    expect(tomanAmountSchema.safeParse(1000.5).success).toBe(false);
  });

  it('rejects NaN and Infinity', () => {
    // مهم: Zod به‌تنهایی Infinity را «عدد صحیح نامنفی» می‌پذیرد، چون
    // Number.isInteger(Infinity) === false ولی .int() روی Infinity خطا نمی‌دهد
    // در نسخه‌های قدیمی‌تر. این تست تضمین می‌کند مبلغ بی‌نهایت به سرور نرود.
    expect(tomanAmountSchema.safeParse(Number.NaN).success).toBe(false);
    expect(tomanAmountSchema.safeParse(Number.POSITIVE_INFINITY).success).toBe(false);
    expect(tomanAmountSchema.safeParse(Number.NEGATIVE_INFINITY).success).toBe(false);
  });

  it('rejects a numeric string — callers must convert first', () => {
    expect(tomanAmountSchema.safeParse('1000').success).toBe(false);
  });
});

describe('quantitySchema', () => {
  it('accepts the documented range 1..99', () => {
    expect(quantitySchema.safeParse(1).success).toBe(true);
    expect(quantitySchema.safeParse(50).success).toBe(true);
    expect(quantitySchema.safeParse(99).success).toBe(true);
  });

  it('rejects zero and negatives', () => {
    expect(quantitySchema.safeParse(0).success).toBe(false);
    expect(quantitySchema.safeParse(-3).success).toBe(false);
  });

  it('rejects anything above the cap, which the server would have to round', () => {
    expect(quantitySchema.safeParse(100).success).toBe(false);
  });
});

describe('paymentMethodSchema', () => {
  it('accepts only the two methods the DB enum allows', () => {
    expect(paymentMethodSchema.safeParse('online').success).toBe(true);
    expect(paymentMethodSchema.safeParse('wallet').success).toBe(true);
  });

  it('rejects anything else so the RPC never sees an invalid enum value', () => {
    expect(paymentMethodSchema.safeParse('card').success).toBe(false);
    expect(paymentMethodSchema.safeParse('').success).toBe(false);
  });
});

describe('orderStatusSchema', () => {
  it('accepts every value in the order_status_t enum', () => {
    for (const s of ['new', 'processing', 'ready', 'delivered', 'cancelled']) {
      expect(orderStatusSchema.safeParse(s).success).toBe(true);
    }
  });

  it('rejects a status outside the enum', () => {
    expect(orderStatusSchema.safeParse('shipped').success).toBe(false);
  });
});

describe('couponCodeSchema', () => {
  it('normalises to upper case and trims', () => {
    const res = couponCodeSchema.safeParse('  off20  ');
    expect(res.success).toBe(true);
    if (res.success) expect(res.data).toBe('OFF20');
  });

  it('rejects a code shorter than 3 characters', () => {
    expect(couponCodeSchema.safeParse('ab').success).toBe(false);
  });
});

describe('loyaltyPointsSchema', () => {
  it('requires a strictly positive award — zero is a no-op', () => {
    expect(loyaltyPointsSchema.safeParse(0).success).toBe(false);
    expect(loyaltyPointsSchema.safeParse(1).success).toBe(true);
  });
});

describe('phoneSchema', () => {
  it('accepts a valid Iranian mobile number', () => {
    expect(phoneSchema.safeParse('09121234567').success).toBe(true);
  });

  it('rejects a number that does not start with 09', () => {
    expect(phoneSchema.safeParse('12345678901').success).toBe(false);
  });

  it('rejects a short number', () => {
    expect(phoneSchema.safeParse('0912123456').success).toBe(false);
  });
});

describe('emailSchema', () => {
  // ایمیل کلید ورود است (ارائه‌دهندهٔ Phone روی پروژه خاموش است)، پس این قاعده
  // عملاً دروازهٔ ورود است و باید محکم باشد.

  it('accepts a normal address and lower-cases it', () => {
    const res = emailSchema.safeParse('  Ali.Reza@Example.COM ');
    expect(res.success).toBe(true);
    // کوچک‌سازی لازم است: Supabase ایمیل را case-insensitive می‌داند ولی اگر
    // خودمان کوچک نکنیم، جست‌وجوی «قبلاً ثبت‌نام شده» می‌تواند خطا بدهد.
    if (res.success) expect(res.data).toBe('ali.reza@example.com');
  });

  it('rejects an address with no @ or no dot in the domain', () => {
    for (const bad of ['ali', 'ali@', 'ali@example', '@example.com', 'a b@example.com']) {
      expect(emailSchema.safeParse(bad).success, bad).toBe(false);
    }
  });

  it('rejects an empty value', () => {
    expect(emailSchema.safeParse('').success).toBe(false);
    expect(emailSchema.safeParse('   ').success).toBe(false);
  });

  it('rejects a phone number — the old credential must not slip through', () => {
    // اگر این یکی رد نشود، یعنی کسی جایی هنوز شماره را به‌جای ایمیل می‌فرستد.
    expect(emailSchema.safeParse('09121234567').success).toBe(false);
  });
});

describe('customerLoginSchema', () => {
  it('accepts email + password with no phone (existing account signing in)', () => {
    const res = customerLoginSchema.safeParse({
      email: 'customer@example.com',
      password: 'secret1',
      phone: '',
    });
    expect(res.success).toBe(true);
  });

  it('accepts a phone alongside the email (fresh registration)', () => {
    const res = customerLoginSchema.safeParse({
      email: 'customer@example.com',
      password: 'secret1',
      phone: '09121234567',
    });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.phone).toBe('09121234567');
  });

  it('requires the email — password alone can never authenticate', () => {
    expect(customerLoginSchema.safeParse({ password: 'secret1', phone: '' }).success).toBe(false);
  });

  it('rejects an empty password', () => {
    expect(
      customerLoginSchema.safeParse({ email: 'customer@example.com', password: '' }).success,
    ).toBe(false);
  });

  it('rejects a malformed phone rather than silently dropping it', () => {
    const res = customerLoginSchema.safeParse({
      email: 'customer@example.com',
      password: 'secret1',
      phone: '12345',
    });
    expect(res.success).toBe(false);
  });
});

describe('staffLoginSchema', () => {
  it('needs no phone — the staff row is found by auth_uid', () => {
    const res = staffLoginSchema.safeParse({
      email: 'staff@example.com',
      password: 'secret1',
    });
    expect(res.success).toBe(true);
  });

  it('requires the email', () => {
    expect(staffLoginSchema.safeParse({ password: 'secret1' }).success).toBe(false);
  });
});

describe('staffAccountSchema', () => {
  const base = {
    username: 'operator',
    name: 'اپراتور تست',
    phone: '09121234567',
    password: 'secret1',
    roleId: 'role-1',
  };

  it('accepts an email on creation', () => {
    const res = staffAccountSchema.safeParse({ ...base, email: 'op@example.com' });
    expect(res.success).toBe(true);
  });

  it('tolerates a missing email so editing an existing staff row is not blocked', () => {
    // `staff_accounts` ستون ایمیل ندارد (هویت در auth.users است)، پس هنگام
    // ویرایش ایمیلی در دست نیست و نباید ذخیرهٔ تغییرات دیگر را رد کند.
    const res = staffAccountSchema.safeParse(base);
    expect(res.success).toBe(true);
  });

  it('rejects a malformed email instead of storing it as-is', () => {
    expect(staffAccountSchema.safeParse({ ...base, email: 'not-an-email' }).success).toBe(false);
  });
});

describe('firstErrorMessage', () => {
  it('returns a Persian message rather than an empty string', () => {
    const res = quantitySchema.safeParse(0);
    expect(res.success).toBe(false);
    if (!res.success) {
      const msg = firstErrorMessage(res.error);
      expect(msg.length).toBeGreaterThan(0);
      expect(msg).not.toBe('ورودی نامعتبر است');
    }
  });
});

describe('safeParse', () => {
  it('unwraps the value on success', () => {
    const res = safeParse(quantitySchema, 3);
    expect(res).toEqual({ ok: true, data: 3 });
  });

  it('returns only the first Persian message on failure', () => {
    const res = safeParse(quantitySchema, 0);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(typeof res.error).toBe('string');
  });
});
