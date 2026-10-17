import { supabase } from './supabase'
import { functionsUrl } from '../lib/supabase'

export interface VerifyPaymentResult {
  ok: boolean
  error?: string
  paymentId?: string
  orderId?: string
  status?: string
}

export async function verifyPayment(
  body: { gatewayRef: string; success?: boolean; trace?: string },
): Promise<VerifyPaymentResult> {
  const jwt = (await supabase.auth.getSession()).data.session?.access_token
  if (!jwt) return { ok: false, error: 'وارد حساب کاربری شوید' }

  const res = await fetch(functionsUrl('verify-payment'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const json = await res.json()
  if (!res.ok || json.error) {
    return { ok: false, error: json.error || res.statusText }
  }
  return {
    ok: true,
    paymentId: json.paymentId,
    orderId: json.orderId,
    status: json.status,
  }
}
