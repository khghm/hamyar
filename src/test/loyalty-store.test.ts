import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      delete: vi.fn().mockReturnThis(),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

vi.mock('../api/loyalty', () => ({
  awardLoyalty: vi.fn().mockResolvedValue({ ok: true }),
  applyReferralBonus: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../api/sync', () => ({
  onSyncError: vi.fn(),
}));

// Mock authStore for cross-store access
vi.mock('../state/authStore', () => {
  const mockState = {
    currentUser: { id: 'user1', role: 'customer', loyaltyPoints: 0, totalEarnedPoints: 0, level: 'normal' as const },
    users: [{ id: 'user1', role: 'customer', loyaltyPoints: 0, totalEarnedPoints: 0, level: 'normal' as const }],
    setUsers: vi.fn(),
    setCurrentUser: vi.fn(),
  };
  return {
    useAuthStore: {
      getState: () => mockState,
    },
  };
});

// Mock crmStore
vi.mock('../state/crmStore', () => ({
  useCrmStore: {
    getState: () => ({ users: [] }),
  },
}));

// Mock orderStore
vi.mock('../state/orderStore', () => ({
  useOrderStore: {
    getState: () => ({ orders: [] }),
  },
}));

// Mock notificationStore
vi.mock('../state/notificationStore', () => ({
  useNotificationStore: {
    getState: () => ({ pushAuditLog: vi.fn() }),
  },
}));

import { useLoyaltyStore } from '../state/loyaltyStore';
import { applyReferralBonus } from '../api/loyalty';
import { DEFAULT_GAMIFICATION_CONFIG } from '../domains/types';

const createTestConfig = (overrides: Partial<typeof DEFAULT_GAMIFICATION_CONFIG> = {}) => ({
  ...DEFAULT_GAMIFICATION_CONFIG,
  ...overrides,
});

describe('loyaltyStore - actions + hydrate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.clearAllMocks();
    useLoyaltyStore.setState({
      loyaltyTx: [],
      gamificationConfig: createTestConfig(),
      hydrated: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('setGamificationConfig updates config', () => {
    const newConfig = createTestConfig({ enabled: false, pointsPerToman: 5000 });

    act(() => {
      useLoyaltyStore.getState().setGamificationConfig(newConfig);
    });

    expect(useLoyaltyStore.getState().gamificationConfig).toEqual(newConfig);
  });

  it('hydrate sets hydrated', async () => {
    await act(async () => {
      await useLoyaltyStore.getState().hydrate();
    });

    expect(useLoyaltyStore.getState().hydrated).toBe(true);
  });

  it('resetLoyaltyData clears transactions', () => {
    act(() => {
      useLoyaltyStore.getState().setGamificationConfig(createTestConfig());
    });

    // Add a transaction manually to state
    act(() => {
      useLoyaltyStore.setState({ loyaltyTx: [{ id: 'tx1', userId: 'u1', points: 100, reason: 'test', category: 'purchase', createdAt: new Date().toISOString() }] });
    });

    act(() => {
      useLoyaltyStore.getState().resetLoyaltyData();
    });

    expect(useLoyaltyStore.getState().loyaltyTx).toHaveLength(0);
  });

  it('getEarnedBadges calculates badge progress', () => {
    const config = createTestConfig({
      badges: [
        { id: 'b1', name: 'First Purchase', description: '', icon: '', metric: 'totalEarnedPoints', threshold: 100 },
      ],
    });

    act(() => {
      useLoyaltyStore.getState().setGamificationConfig(config);
    });

    // Mock user with enough points
    const mockUser = { id: 'user1', loyaltyPoints: 150, totalEarnedPoints: 150, level: 'normal' as const, invitedCount: 0, loginStreak: 0 };

    const badges = useLoyaltyStore.getState().getEarnedBadges(mockUser as any);
    expect(badges).toHaveLength(1);
    expect(badges[0].earned).toBe(true);
    expect(badges[0].progress).toBe(100);
  });
});