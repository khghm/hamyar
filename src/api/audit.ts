import { supabase } from './supabase'

/**
 * Sends an audit entry through the `log_audit` RPC so the row's `ip` and
 * `user_agent` come from the request headers on the server instead of a value
 * the browser could fabricate. Fire-and-forget: the UI already shows the entry
 * optimistically, and a failed write must never break the action that logged it.
 */
export function writeAuditLog(params: {
  action: string
  details: string
  module: string
  actor?: string
  isAdmin?: boolean
}): void {
  void supabase.rpc('log_audit', {
    p_action: params.action,
    p_details: params.details,
    p_module: params.module,
    p_actor: params.actor ?? null,
    p_admin: params.isAdmin ?? false,
  }).then(({ error }) => {
    if (error) console.warn('[audit] server write failed:', error.message)
  })
}

export async function fetchAuditLogs(limit = 200): Promise<{
  ok: boolean
  error?: string
  rows: {
    id: string
    actor: string
    action: string
    details: string
    module: string
    ip: string | null
    userAgent: string | null
    date: string
  }[]
}> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, actor, action, details, module, ip, user_agent, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { ok: false, error: error.message, rows: [] }

  return {
    ok: true,
    rows: (data ?? []).map(r => ({
      id: r.id,
      actor: r.actor ?? '',
      action: r.action,
      details: r.details ?? '',
      module: r.module ?? '',
      ip: r.ip,
      userAgent: r.user_agent,
      date: r.created_at,
    })),
  }
}
