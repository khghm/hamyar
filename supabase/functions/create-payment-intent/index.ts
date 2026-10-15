import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { json, preflight } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { db: { schema: 'public' }, auth: { persistSession: false } }
)

interface PaymentIntentBody {
  orderId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight(req)
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) {
    return json({ error: 'Unauthorized' }, 401)
  }
  const { data: { user }, error: userErr } = await supabase.auth.getUser(jwt)
  if (userErr || !user) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const body: PaymentIntentBody = await req.json().catch(() => ({}))
  const { orderId } = body
  if (!orderId) {
    return json({ error: 'orderId الزامی است' }, 400)
  }

  // Read order from DB — amount is SERVER-authoritative
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('total, paid, remaining')
    .eq('id', orderId)
    .eq('customer_id', user.id)  // customer can only pay their own order
    .single()

  if (orderErr || !order) {
    return json({ ok: false, error: 'سفارش یافت نشد' }, 404)
  }

  if (Number(order.paid) >= Number(order.total)) {
    return json({ ok: false, error: 'سفارش کاملاً پرداخت شده است' }, 400)
  }

  const amount = Number(order.total)

  // Create the payment record
  const { data: payResult, error: createErr } = await supabase.rpc('create_payment_record', {
    p_user_id: user.id,
    p_order_amount: amount,
    p_payment_method: 'online',
  })

  if (createErr || !payResult || payResult.length === 0) {
    return json({ ok: false, error: 'خطا در ایجاد پرداخت' }, 500)
  }

  const payment = payResult[0]
  const mockAuto = Deno.env.get('VITE_PAYMENT_MOCK_AUTO') === '1'

  if (mockAuto) {
    // Mock: auto-confirm payment. `verify_payment` returns the final status in
    // its OUT parameters, so we read it from the result instead of re-querying
    // the row — a second read could race a concurrent callback and report the
    // wrong status.
    const { data: verifyResult, error: verifyErr } = await supabase.rpc('verify_payment', {
      p_gateway_ref: payment.gateway_ref,
      p_success: true,
      p_trace: `mock-${payment.payment_id}`,
    })
    if (verifyErr) {
      console.error('verify_payment failed:', verifyErr.message)
    } else if (verifyResult && verifyResult.length > 0) {
      payment.status = verifyResult[0].out_status
    }
  }

  return json({
    ok: true,
    paymentId: payment.payment_id,
    gatewayRef: payment.gateway_ref,
    amount,
    status: payment.status,
    autoVerified: mockAuto,
  }, 200)
})
