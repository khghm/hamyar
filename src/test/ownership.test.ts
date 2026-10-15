import { describe, expect, it } from 'vitest';
import { identityIdsOf, isTicketOwner, isOrderOwner } from '../store';
import type { User } from '../domains/types';

const customer = (
  over: Partial<User> & Pick<User, 'id'> & { role?: User['role'] },
): User => ({ role: 'customer', phone: '', ...over }) as User;

describe('identityIdsOf', () => {
  const users: User[] = [
    customer({ id: 'u-new', phone: '09120000001' }),
    customer({ id: 'u-old', phone: '09120000001' }),
    customer({ id: 'u-other', phone: '09120000002' }),
  ];

  it('always includes the user’s own id', () => {
    expect(identityIdsOf(customer({ id: 'u-new' }), users)).toContain('u-new');
  });

  it('includes legacy duplicate ids that share the same phone', () => {
    // یک مشتری ممکن است بعد از پاک‌کردن داده محلی، دو شناسه داشته باشد؛ هر دو
    // باید به او نسبت داده شوند وگرنه سفارش/تیکت قدیمی ناپدید می‌شود.
    const ids = identityIdsOf(customer({ id: 'u-new', phone: '09120000001' }), users);
    expect(ids).toEqual(expect.arrayContaining(['u-new', 'u-old']));
  });

  it('does not pull in a customer with a different phone', () => {
    const ids = identityIdsOf(customer({ id: 'u-new', phone: '09120000001' }), users);
    expect(ids).not.toContain('u-other');
  });

  it('returns only the own id when no phone is on file', () => {
    expect(identityIdsOf(customer({ id: 'u-solo' }), users)).toEqual(['u-solo']);
  });

  it('never matches a staff account that shares the phone', () => {
    const withStaff: User[] = [
      ...users,
      customer({ id: 'staff-1', role: 'admin', phone: '09120000001' }),
    ];
    const ids = identityIdsOf(customer({ id: 'u-new', phone: '09120000001' }), withStaff);
    expect(ids).not.toContain('staff-1');
  });
});

describe('isOrderOwner', () => {
  const users: User[] = [
    customer({ id: 'u-new', phone: '09120000001' }),
    customer({ id: 'u-old', phone: '09120000001' }),
    customer({ id: 'u-stranger', phone: '09120000009' }),
  ];

  it('accepts a direct id match', () => {
    expect(isOrderOwner({ customerId: 'u-new' }, customer({ id: 'u-new' }), users)).toBe(true);
  });

  it('accepts a legacy order that belongs to the same person by phone', () => {
    expect(
      isOrderOwner({ customerId: 'u-old' }, customer({ id: 'u-new', phone: '09120000001' }), users),
    ).toBe(true);
  });

  it('rejects an order belonging to someone else', () => {
    expect(
      isOrderOwner({ customerId: 'u-stranger' }, customer({ id: 'u-new', phone: '09120000001' }), users),
    ).toBe(false);
  });

  it('rejects an orphan order rather than assuming ownership', () => {
    // امنیت: شناسهٔ ناشناس نباید «تا وقتی ثابت نشده مال خودم» تلقی شود.
    expect(
      isOrderOwner({ customerId: 'deleted-user' }, customer({ id: 'u-new', phone: '09120000001' }), users),
    ).toBe(false);
  });
});

describe('isTicketOwner', () => {
  const users: User[] = [customer({ id: 'u-new', phone: '09120000001' })];

  it('accepts a match on id', () => {
    expect(
      isTicketOwner({ customerId: 'u-new', customerPhone: '' }, customer({ id: 'u-new' }), users),
    ).toBe(true);
  });

  it('accepts a match on the phone snapshot even when the id is orphaned', () => {
    expect(
      isTicketOwner({ customerId: 'gone', customerPhone: '09120000001' }, customer({ id: 'u-new', phone: '09120000001' }), users),
    ).toBe(true);
  });

  it('rejects a ticket from another customer', () => {
    expect(
      isTicketOwner({ customerId: 'u-x', customerPhone: '09120000009' }, customer({ id: 'u-new', phone: '09120000001' }), users),
    ).toBe(false);
  });
});