import { describe, expect, it } from 'vitest';
import {
  computeLevelFromPoints,
  DEFAULT_TIERS,
  SERVICE_URGENCY_MULTIPLIER,
  DEFAULT_REWARDS,
  DEFAULT_BADGES,
} from '../store';
import type { LoyaltyTierRule } from '../domains/types';

describe('computeLevelFromPoints', () => {
  const tiers = DEFAULT_TIERS as LoyaltyTierRule[];

  it('places a customer with no points in the base tier', () => {
    expect(computeLevelFromPoints(0, tiers)).toBe('normal');
  });

  it('promotes at exactly the documented threshold, not one point below', () => {
    expect(computeLevelFromPoints(99, tiers)).toBe('normal');
    expect(computeLevelFromPoints(100, tiers)).toBe('silver');
    expect(computeLevelFromPoints(499, tiers)).toBe('silver');
    expect(computeLevelFromPoints(500, tiers)).toBe('gold');
    expect(computeLevelFromPoints(999, tiers)).toBe('gold');
    expect(computeLevelFromPoints(1000, tiers)).toBe('vip');
  });

  it('never returns a level for a negative balance', () => {
    // امتیاز منفی یعنی کسر امتیاز؛ نباید مشتری را به سطحی ببرد.
    expect(computeLevelFromPoints(-50, tiers)).toBe('normal');
  });

  it('is order-independent — an unsorted tier list gives the same answer', () => {
    const shuffled = [...tiers].reverse();
    expect(computeLevelFromPoints(750, shuffled)).toBe(computeLevelFromPoints(750, tiers));
  });

  it('falls back to normal when no tier matches (all thresholds above the balance)', () => {
    const unreachable: LoyaltyTierRule[] = [
      { level: 'gold', label: 'طلایی', minPoints: 5000, discountPercent: 10, multiplier: 1.5, perks: [] },
    ];
    expect(computeLevelFromPoints(10, unreachable)).toBe('normal');
  });

  it('does not mutate the tier array it is given', () => {
    const original = [...tiers];
    computeLevelFromPoints(750, tiers);
    expect(tiers).toEqual(original);
  });
});

describe('SERVICE_URGENCY_MULTIPLIER', () => {
  it('matches the 1.5 the server applies in place_order', () => {
    // سرور در place_order قیمت را round(base * 1.5) می‌کند. اگر این ثابت
    // تغییر کند و هماهنگ نشود، قیمت نمایشی با قیمت ثبت‌شده فرق می‌کند.
    expect(SERVICE_URGENCY_MULTIPLIER).toBe(1.5);
  });
});

describe('loyalty catalogue integrity', () => {
  it('has strictly increasing, non-negative tier thresholds', () => {
    const sorted = [...DEFAULT_TIERS].sort((a, b) => a.minPoints - b.minPoints);
    sorted.forEach((tier, i) => {
      expect(tier.minPoints).toBeGreaterThanOrEqual(0);
      if (i > 0) {
        expect(tier.minPoints).toBeGreaterThan(sorted[i - 1]!.minPoints);
      }
    });
  });

  it('starts the base tier at zero points', () => {
    const base = [...DEFAULT_TIERS].sort((a, b) => a.minPoints - b.minPoints)[0];
    expect(base?.minPoints).toBe(0);
  });

  it('only uses rewards that are affordable from the first tier up', () => {
    // پاداشی با cost صفر یا منفی یعنی امتیاز رایگان — ورودی نامعتبر است.
    for (const reward of DEFAULT_REWARDS) {
      expect(reward.cost).toBeGreaterThan(0);
    }
  });

  it('uses unique reward and badge ids', () => {
    const rewardIds = DEFAULT_REWARDS.map((r) => r.id);
    const badgeIds = DEFAULT_BADGES.map((b) => b.id);
    expect(new Set(rewardIds).size).toBe(rewardIds.length);
    expect(new Set(badgeIds).size).toBe(badgeIds.length);
  });

  it('gives every badge a positive threshold', () => {
    for (const badge of DEFAULT_BADGES) {
      expect(badge.threshold).toBeGreaterThan(0);
    }
  });
});