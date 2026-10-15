import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { json, preflight } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { db: { schema: 'public' }, auth: { persistSession: false } }
)

interface PlaceOrderBody {
  serviceId: string
  quantity?: number
  urgent?: boolean
  formData?: Record<string, string>
  documents?: { key: string; name: string; size: number; storage_path: string }[]
  paymentMethod?: 'online' | 'wallet'
  useWallet?: boolean
}

// Set with `supabase secrets set PAYMENT_MOCK_AUTO=1` while the real gateway is
// not wired up yet. Once a real adapter lands this stays false by default.
function paymentMockAuto(): boolean {
  const raw = Deno.env.get('PAYMENT_MOCK_AUTO') ?? Deno.env.get('VITE_PAYMENT_MOCK_AUTO') ?? ''
  return raw === '1' || raw.toLowerCase() === 'true'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight(req)
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  // Authenticate caller
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) {
    return json({ error: 'Unauthorized' }, 401)
  }
  const { data: { user }, error: userErr } = await supabase.auth.getUser(jwt)
  if (userErr || !user) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const body: PlaceOrderBody = await req.json().catch(() => ({}))
  const { serviceId, quantity = 1, urgent = false, formData, documents, paymentMethod = 'online', useWallet = false } = body

  // 1. Resolve the service and read its price FROM THE DATABASE (never trust the
  // client). `serviceId` may be the uuid primary key or the business key (sku)
  // that the SPA uses — `resolve_service_ref` owns that mapping.
  const qty = Math.max(1, Number(quantity) || 1)
  const { data: serviceRows, error: svcErr } = await supabase
    .rpc('resolve_service_ref', { p_ref: String(serviceId) })

  const service = Array.isArray(serviceRows) ? serviceRows[0] : serviceRows

  if (svcErr || !service || !service.active) {
    return json({ ok: false, error: 'سرویس یافت نشد' }, 400)
  }

  const basePrice = Number(service.base_price)
  const multiplier = urgent ? 1.5 : 1
  const unitPrice = Math.round(basePrice * multiplier)
  const total = unitPrice * qty

  // 2. Resolve payment
  //
  // The wallet debit itself is NOT done here: `place_order` (which runs in a
  // single transaction and owns the money movement) performs it when
  // `p_payment_method = 'wallet'`. Debiting here as well would charge the
  // customer twice. This block only does the pre-flight affordability check so
  // an obviously-insufficient balance fails fast with a clear message, and
  // creates the pending payment record for the online path.
  let paidAmount = 0
  let gatewayRef: string | undefined

  if (useWallet || paymentMethod === 'wallet') {
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', user.id)
      .single()

    if (profErr || !profile) {
      return json({ ok: false, error: 'پروفایل یافت نشد' }, 400)
    }

    const balance = Number(profile.wallet_balance)
    if (balance < total) {
      return json({ ok: false, error: 'موجودی کیف پول کافی نیست' }, 400)
    }

    paidAmount = total
  } else {
    // Online gateway flow — create a payment record (see create-payment-intent fn)
    const { data: payData, error: payErr } = await supabase.rpc('create_payment_record', {
      p_user_id: user.id,
      p_order_amount: total,
      p_payment_method: 'online',
    }).select().single()

    if (payErr || !payData) {
      return json({ ok: false, error: 'خطا در ثبت پرداخت' }, 500)
    }
    gatewayRef = payData.gateway_ref
    // In mock-auto mode the payment is auto-confirmed; for real gateway the
    // verify-payment function marks it paid when the callback arrives.
    if (paymentMockAuto()) {
      paidAmount = total
    } else {
      paidAmount = 0 // remains pending until callback
    }
  }

  // 3-8. Transactional core (RPC handles: order + invoice + stock + notification + audit)
  const { data: result, error: placeErr } = await supabase.rpc('place_order', {
    p_customer_id: user.id,
    p_service_id: service.id,
    p_quantity: qty,
    p_urgent: urgent,
    p_total: total,
    p_paid: paidAmount,
    p_payment_method: paymentMethod === 'wallet' ? 'wallet' : 'online',
    p_gateway_ref: gatewayRef,
    p_form_data: formData ?? {},
    p_documents: documents ?? {},
  }).select().single()

  if (placeErr || !result) {
    // `place_order` is a single transaction: when it raises, the wallet debit it
    // performed is rolled back with it, so there is nothing to compensate here.
    //
    // The `create_payment_record` call above ran *before* the transaction, so a
    // dangling `payments` row with no order would otherwise remain. Roll it back
    // by matching on the gateway_ref we created.
    if (gatewayRef) {
      try {
        await supabase
          .from('payments')
          .delete()
          .eq('gateway_ref', gatewayRef)
          .is('order_id', null);
      } catch {
        /* best-effort cleanup */
      }
    }
    return json({
      ok: false,
      error: placeErr?.message || 'خطا در ثبت سفارش',
    }, 500)
  }

  return json({
    ok: true,
    orderId: result.order_id,
    trackingCode: result.tracking_code,
    invoiceId: result.invoice_id,
    total,
    paid: paidAmount,
  }, 200)
})