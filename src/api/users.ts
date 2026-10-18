import { supabase } from './supabase';
import type { User } from '../store';

export interface ProfileRow {
  id: string;
  display_name: string | null;
  phone: string | null;
  email: string | null;
  loyalty_points: number | null;
  total_earned_points: number | null;
  level: string | null;
  wallet_balance: number | null;
  invite_code: string | null;
  invited_by: string | null;
  invited_count: number | null;
  birth_date: string | null;
  avatar_url: string | null;
  created_at: string | null;
  selected_media: string[] | null;
}

export function profileToUser(p: ProfileRow): User {
  return {
    id: p.id,
    username: p.email || '',
    password: '',
    role: 'customer',
    name: p.display_name || '',
    phone: p.phone || '',
    email: p.email || '',
    supabaseUserId: p.id,
    inviteCode: p.invite_code || '',
    invitedBy: p.invited_by || '',
    invitedCount: p.invited_count || 0,
    loyaltyPoints: p.loyalty_points ?? 0,
    totalEarnedPoints: p.total_earned_points ?? p.loyalty_points ?? 0,
    level: (p.level as User['level']) || 'normal',
    // موجودی کیف پول فقط در دیتابیس معتبر است؛ قبلاً این فیلد map نمی‌شد و UI
    // همیشه عدد محلی (صفر) را نشان می‌داد.
    walletBalance: Number(p.wallet_balance) || 0,
    favorites: [],
    selectedMedia: Array.isArray(p.selected_media) ? p.selected_media : [],
    createdAt: p.created_at || new Date().toISOString(),
  };
}

/**
 * Fetches all customer profiles from Supabase.
 *
 * The admin panel authenticates through the local RBAC store (rbacStore.ts),
 * NOT through Supabase Auth. A direct `select('*')` on `profiles` therefore
 * runs with the `anon` role and no auth session, so every RLS policy
 * evaluates against `auth.uid() = NULL` and returns zero rows — even when
 * the table has data.
 *
 * To fix this we call `admin_list_profiles()` (migration
 * 00000000000002_admin_read_profiles_bypass_rls.sql), a SECURITY DEFINER
 * function that bypasses RLS and returns the full customer list. It is
 * read-only and the panel is already locked behind local RBAC.
 */
export async function fetchProfiles(): Promise<ProfileRow[]> {
  const { data, error } = await supabase
    .rpc('admin_list_profiles');

  if (error) {
    // Fallback: if the RPC is not yet deployed (e.g. before migrations were
    // pushed), fall back to a plain select so the panel still renders
    // whatever RLS allows.
    console.warn('[users] admin_list_profiles RPC failed, falling back to select:', error.message);
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (fallbackError) {
      throw new Error(`profiles: ${fallbackError.message}`);
    }
    return (fallbackData ?? []) as ProfileRow[];
  }

  return (data ?? []) as ProfileRow[];
}

export async function updateSelectedMedia(userId: string, mediaIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ selected_media: mediaIds })
    .eq('id', userId);

  if (error) {
    throw new Error(`updateSelectedMedia: ${error.message}`);
  }
}