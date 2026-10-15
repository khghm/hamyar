import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { json, preflight } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { db: { schema: 'public' }, auth: { persistSession: false } }
)

interface VerifyPaymentBody {
  gatewayRef: string
  success: boolean
  trace?: string
}

/**
 * Gateway callback authentication.
 *
 * This endpoint settles money, so it must accept exactly two kinds of caller:
 *
 *   1. The bank's webhook — carries no Supabase JWT, but signs the payload with
 *      the shared gateway secret (`PAYMENT_GATEWAY_SECRET`) in
 *      `x-gateway-signature` (hex HMAC-SHA256 over the raw request body).
 *   2. The signed-in customer returning from a redirect — carries a valid JWT
 *      and may only confirm a payment that belongs to *their own* uid.
 *
 * Previously there was no check at all beyond "some valid JWT", so any
 * authenticated user could flip any payment to paid and trigger a loyalty award
 * by guessing a `gateway_ref`. `verify_payment` is service_role-only, but this
 * function holds the service role key and calls it on the caller's behalf —
 * that indirection is exactly what needed a gate here.
 */
function gatewaySecret(): string | null {
  const secret = Deno.env.get('PAYMENT_GATEWAY_SECRET')
  return secret && secret.length >= 32 ? secret : null
}

/** Constant-time hex comparison, so a mismatch does not leak its position. */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function hasValidSignature(rawBody: string, provided: string | null): Promise<boolean> {
  const secret = gatewaySecret()
  if (!secret || !provided) return false
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  const expected = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return timingSafeEqualHex(expected, provided.trim().toLowerCase())
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight(req)
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  // Read the body once: it is needed both for parsing and for the signature.
  const rawBody = await req.text()
  const body: VerifyPaymentBody = rawBody ? JSON.parse(rawBody) : {}
  const { gatewayRef, success, trace } = body
  if (!gatewayRef) {
    return json({ error: 'gatewayRef الزامی است' }, 400)
  }

  // 1. A signed gateway callback is authoritative and needs no user context.
  const signature = req.headers.get('x-gateway-signature')
  const fromGateway = await hasValidSignature(rawBody, signature)

  // 2. Otherwise the caller must be the signed-in owner of this payment.
  let callerUid: string | null = null
  if (!fromGateway) {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!jwt) {
      return json(
        { error: 'درخواست نامعتبر: نه امضای درگاه و نه نشست معتبر ارسال نشده است' },
        401,
      )
    }
    const { data: { user }, error: userErr } = await supabase.auth.getUser(jwt)
    if (userErr || !user) {
      return json({ error: 'Unauthorized' }, 401)
    }
    callerUid = user.id

    // A customer may only confirm their own payment. Enforced here as well as
    // in the RPC because this function uses the service role and would
    // otherwise bypass RLS entirely.
    const { data: owned, error: ownErr } = await supabase
      .from('payments')
      .select('user_id')
      .eq('gateway_ref', gatewayRef)
      .maybeSingle()
    if (ownErr) {
      return json({ error: ownErr.message }, 500)
    }
    if (!owned || owned.user_id !== callerUid) {
      return json({ error: 'این پرداخت متعلق به شما نیست' }, 403)
    }
  }

  const { data: result, error } = await supabase.rpc('verify_payment', {
    p_gateway_ref: gatewayRef,
    p_success: !!success,
    p_trace: trace ?? '',
  })

  if (error) {
    return json({ ok: false, error: error.message }, 500)
  }

  // The RPC's OUT columns are prefixed `out_` because unprefixed names would
  // shadow the `payments` columns inside the function body (see the migration).
  const row = result?.[0]
  return json({
    ok: true,
    paymentId: row?.out_payment_id,
    orderId: row?.out_order_id,
    status: row?.out_status,
  }, 200)
})