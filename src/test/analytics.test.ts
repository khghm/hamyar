import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { growthRate, countByType } from '../utils/analytics';
import type { AnalyticsEvent } from '../utils/analytics';

const DAY = 864e5;

const ev = (type: string, daysAgo: number): AnalyticsEvent =>
  ({ type, date: new Date(Date.now() - daysAgo * DAY).toISOString() }) as AnalyticsEvent;

describe('countByType', () => {
  it('counts matching events only', () => {
    const events = [ev('page_view', 1), ev('page_view', 2), ev('click', 3)];
    expect(countByType(events, 'page_view')).toBe(2);
    expect(countByType(events, 'click')).toBe(1);
  });

  it('returns 0 for an unknown type', () => {
    expect(countByType([ev('click', 1)], 'nope')).toBe(0);
  });
});

describe('growthRate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports 100% when there is activity this month and none last month', () => {
    expect(growthRate([ev('page_view', 5)], 'page_view')).toBe(100);
  });

  it('reports 0% when both windows are empty', () => {
    expect(growthRate([], 'page_view')).toBe(0);
  });

  it('computes the percentage change between the two 30-day windows', () => {
    const events = [
      ...Array.from({ length: 6 }, () => ev('page_view', 10)),   // 30 روز اخیر
      ...Array.from({ length: 3 }, () => ev('page_view', 40)),   // 30 روز قبل
    ];
    expect(growthRate(events, 'page_view')).toBe(100);
  });

  it('reports a decline when the recent window is smaller', () => {
    const events = [
      ...Array.from({ length: 1 }, () => ev('page_view', 10)),
      ...Array.from({ length: 4 }, () => ev('page_view', 40)),
    ];
    expect(growthRate(events, 'page_view')).toBe(-75);
  });

  it('excludes events older than 60 days entirely', () => {
    const events = Array.from({ length: 5 }, () => ev('page_view', 90));
    expect(growthRate(events, 'page_view')).toBe(0);
  });

  it('with type=null aggregates every event type', () => {
    const events = [ev('page_view', 5), ev('click', 5)];
    expect(growthRate(events, null)).toBe(100);
    expect(countByType(events, 'page_view')).toBe(1);
  });
});