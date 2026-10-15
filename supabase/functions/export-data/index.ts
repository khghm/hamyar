// export-data — server-side backup. Returns a JSON dump of the business tables
// (the admin panel's «پشتیبان‌گیری» section downloads this file instead of
// serialising the browser's localStorage, which is no longer the source of
// truth). Restoring is intentionally a CLI/operator action:
//
//   supabase db dump --data-only -f backup.sql
//   psql "$DATABASE_URL" -f backup.sql
//
// Caller must be staff with the «پشتیبان‌گیری» permission (perm33).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, preflight } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function callerClient(jwt: string) {
  return createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// Business tables in dependency order. `staff_accounts` is skipped on purpose:
// it holds no credentials, but the dump must not be able to re-link accounts.
const TABLES = [
  'profiles',
  'roles',
  'permissions',
  'products',
  'media_items',
  'services',
  'project_services',
  'portfolio',
  'news',
  'faqs',
  'site_settings',
  'about_content',
  'orders',
  'order_items',
  'order_status_history',
  'order_documents',
  'invoices',
  'invoice_items',
  'payments',
  'wallet_transactions',
  'expenses',
  'expense_categories',
  'suppliers',
  'employees',
  'loyalty_transactions',
  'gamification_settings',
  'content_projects',
  'content_comments',
  'content_assets',
  'content_templates',
  'content_ideas',
  'brand_book',
  'campaigns',
  'sms_logs',
  'reviews',
  'affiliates',
  'affiliate_orders',
  'affiliate_transactions',
  'personas',
  'digital_marketing',
  'okrs',
  'key_results',
  'kpis',
  'notes',
  'tickets',
  'projects',
  'training_sites',
  'notifications',
  'notification_settings',
  'audit_logs',
]

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight(req)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return json({ ok: false, error: 'Method not allowed' }, 405)
  }

  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) return json({ ok: false, error: 'وارد حساب کاربری شوید' }, 401)

  const { data: { user }, error: userErr } = await admin.auth.getUser(jwt)
  if (userErr || !user) return json({ ok: false, error: 'نشست معتبر نیست' }, 401)

  const caller = callerClient(jwt)
  const { data: permOk, error: permErr } = await caller.rpc('has_permission', { p: 'perm33' })
  if (permErr || permOk !== true) {
    return json({ ok: false, error: 'دسترسی لازم برای تهیهٔ بکاپ را ندارید' }, 403)
  }

  const tables: Record<string, unknown[]> = {}
  const failed: Record<string, string> = {}

  for (const table of TABLES) {
    const { data, error } = await admin.from(table).select('*')
    if (error) {
      failed[table] = error.message
      continue
    }
    tables[table] = data ?? []
  }

  const startedAt = new Date().toISOString()
  const rowCount = Object.values(tables).reduce((sum, rows) => sum + rows.length, 0)

  await admin.rpc('log_audit', {
    p_action: 'بکاپ',
    p_details: `تهیهٔ نسخهٔ پشتیبان از پایگاه‌داده — ${rowCount} ردیف در ${Object.keys(tables).length} جدول`,
    p_module: 'بکاپ',
    p_admin: true,
  })

  return json({
    ok: true,
    meta: {
      generated_at: startedAt,
      generated_by: user.id,
      row_count: rowCount,
      table_count: Object.keys(tables).length,
      failed_tables: failed,
      restore_hint: 'supabase db dump --data-only -f backup.sql && psql "$DATABASE_URL" -f backup.sql',
    },
    tables,
  })
})
