import { supabase } from './supabase'

export interface AwardLoyaltyResult {
  ok: boolean
  error?: string
  pointsAwarded?: number
  newTotal?: number
  newLevel?: string
  transactionId?: string
}

export interface AwardLoyaltyRequest {
  userId: string
  points: number
  reason: string
  category?: 'purchase' | 'invite' | 'review' | 'profile' | 'birthday' | 'login_streak' | 'redeem' | 'manual'
}

function humaniseLoyaltyError(message: string): string {
  if (/points must be positive/.test(message)) return 'امتیاز باید مثبت باشد'
  if (/permission denied/.test(message)) return 'دسترسی لازم را ندارید'
  return message
}

export async function awardLoyalty(
  body: AwardLoyaltyRequest,
): Promise<AwardLoyaltyResult> {
  const userId = (await supabase.auth.getUser()).data.user?.id
  if (!userId) return { ok: false, error: 'وارد حساب کاربری شوید' }

  const { data, error } = await supabase.rpc('award_loyalty_client', {
    p_user_id: body.userId,
    p_points: Math.round(body.points),
    p_reason: body.reason,
    p_category: body.category ?? 'manual',
  })

  if (error) return { ok: false, error: humaniseLoyaltyError(error.message) }

  const row = (Array.isArray(data) ? data[0] : data) as {
    points: number
    new_total: number
    new_level: string
    txn_id: string
  } | null
  if (!row) return { ok: false, error: 'پاسخ نامعتبر از سرور' }

  return {
    ok: true,
    pointsAwarded: row.points,
    newTotal: Number(row.new_total),
    newLevel: row.new_level,
    transactionId: row.txn_id,
  }
}

export interface ReferralResult {
  ok: boolean
  error?: string
  /** False when there is no referral, or it was already rewarded. */
  applied: boolean
  inviteePoints?: number
  inviterId?: string
}

/**
 * Applies the signup referral bonuses server-side. Idempotent: the RPC marks the
 * profile as rewarded, so repeat calls return `applied: false`.
 */
export async function applyReferralBonus(): Promise<ReferralResult> {
  const userId = (await supabase.auth.getUser()).data.user?.id
  if (!userId) return { ok: false, applied: false, error: 'وارد حساب کاربری شوید' }

  try {
    const { data, error } = await supabase.rpc('apply_referral_bonuses', {
      p_invitee: userId,
    })

    if (error) {
      return { ok: false, applied: false, error: humaniseLoyaltyError(error.message) }
    }

    const result = (data as {
      applied: boolean
      reason?: string
      invitee_points?: number
      inviter_points?: number
      inviter_id?: string
    } | null) ?? { applied: false }

    return {
      ok: true,
      applied: result.applied === true,
      inviteePoints: result.invitee_points,
      inviterId: result.inviter_id,
    }
  } catch {
    return { ok: false, applied: false, error: 'خطای شبکه؛ اتصال را بررسی کنید' }
  }
}
