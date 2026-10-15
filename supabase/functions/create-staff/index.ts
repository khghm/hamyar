// create-staff — provisions a staff account (Supabase Auth user + staff_accounts
// row). The caller must be an authenticated staff member with the RBAC
// permission «مدیریت نقش‌ها» (perm35); the service_role key stays server-side.
//
// Flow: verify caller -> resolve the role by its business key -> create the auth
// user with email+password -> attach the staff_accounts row. If the second step
// fails the auth user is removed again so no half-provisioned account remains.
//
// چرا ایمیل و نه شمارهٔ موبایل: ارائه‌دهندهٔ Phone در Supabase برای فعال‌شدن به
// اعتبارنامهٔ یک شرکت پیامک نیاز دارد، و روی این پروژه خاموش است؛ Email فعال است
// و هیچ اعتبارنامهٔ بیرونی نمی‌خواهد. شمارهٔ موبایل دادهٔ پروفایل است و با قالب
// محلی `09xxxxxxxxx` به `create_staff_account` می‌رود، چون قید CHECK دیتابیس
// همان را می‌خواهد.
//
// نکته: قبلاً همین تابع شمارهٔ محلی را مستقیم به `auth.admin.createUser`
// می‌داد و GoTrue آن را رد می‌کرد («Invalid phone number format (E.164
// required)») — یعنی ساخت کارمند از پنل RBAC همیشه شکست می‌خورد.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, preflight } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// Read-only client bound to the CALLER's token, used for the permission check so
// RLS decides — never the service_role key.
function callerClient(jwt: string) {
  return createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

interface CreateStaffBody {
  /** کلید ورود. */
  email: string
  /** دادهٔ پروفایل، قالب محلی `09xxxxxxxxx`. */
  phone: string
  password: string
  name: string
  /** Role name (e.g. 'مدیر فروش') or role uuid. */
  role: string
  username?: string
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight(req)
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)

  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) return json({ ok: false, error: 'وارد حساب کاربری شوید' }, 401)

  const { data: { user }, error: userErr } = await admin.auth.getUser(jwt)
  if (userErr || !user) return json({ ok: false, error: 'نشست معتبر نیست' }, 401)

  // Authorization: the caller must hold the RBAC permission perm35.
  const caller = callerClient(jwt)
  const { data: permOk, error: permErr } = await caller.rpc('has_permission', { p: 'perm35' })
  if (permErr || permOk !== true) {
    return json({ ok: false, error: 'دسترسی لازم برای ایجاد کارمند را ندارید' }, 403)
  }

  let body: CreateStaffBody
  try {
    body = await req.json()
  } catch {
    return json({ ok: false, error: 'بدنهٔ درخواست نامعتبر است' }, 400)
  }

  const email = (body.email ?? '').trim().toLowerCase()
  const phone = (body.phone ?? '').replace(/\D/g, '')
  const password = body.password ?? ''
  const name = (body.name ?? '').trim()
  const roleRef = (body.role ?? '').trim()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ ok: false, error: 'ایمیل معتبر نیست' }, 400)
  if (!/^09[0-9]{9}$/.test(phone)) return json({ ok: false, error: 'شماره موبایل معتبر نیست' }, 400)
  if (password.length < 6) return json({ ok: false, error: 'رمز عبور باید حداقل ۶ کاراکتر باشد' }, 400)
  if (!name) return json({ ok: false, error: 'نام کامل را وارد کنید' }, 400)
  if (!roleRef) return json({ ok: false, error: 'یک نقش را انتخاب کنید' }, 400)

  // Resolve the role: business key (name) or uuid.
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  let roleQuery = admin.from('roles').select('id, name')
  roleQuery = uuidPattern.test(roleRef) ? roleQuery.eq('id', roleRef) : roleQuery.eq('name', roleRef)
  const { data: role, error: roleErr } = await roleQuery.maybeSingle()
  if (roleErr || !role) return json({ ok: false, error: 'نقش انتخابی یافت نشد' }, 400)

  // 1. Create the auth user (email + password, already confirmed by an admin).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: name, phone },
  })
  if (createErr || !created?.user) {
    const msg = createErr?.message ?? ''
    if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('registered')) {
      return json({ ok: false, error: 'این ایمیل قبلاً ثبت شده است' }, 409)
    }
    return json({ ok: false, error: 'ساخت حساب کاربری ناموفق بود' }, 500)
  }

  // 2. Attach the staff profile. Roll the auth user back if this fails.
  const { data: staffId, error: staffErr } = await admin.rpc('create_staff_account', {
    p_auth_uid: created.user.id,
    p_phone: phone,
    p_display_name: name,
    p_role_id: role.id,
    p_username: (body.username ?? name).trim(),
    p_email: email,
  })

  if (staffErr || !staffId) {
    await admin.auth.admin.deleteUser(created.user.id)
    return json({ ok: false, error: 'ثبت اطلاعات کارمند ناموفق بود' }, 500)
  }

  await admin.rpc('log_audit', {
    p_action: 'ایجاد',
    p_details: `کارمند «${name}» (${phone}) با نقش «${role.name}» ایجاد شد`,
    p_module: 'RBAC',
    p_actor: name,
    p_admin: true,
  })

  return json({
    ok: true,
    staffId,
    role: role.name,
    message: `حساب کارمندی برای ${email} ساخته شد`,
  })
})
