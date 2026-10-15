import { supabase } from './supabase'

export interface BackupMeta {
  generated_at: string
  generated_by: string
  row_count: number
  table_count: number
  failed_tables: Record<string, string>
  restore_hint: string
}

export interface BackupResult {
  ok: boolean
  error?: string
  meta?: BackupMeta
  filename?: string
  /** Triggers the browser download of the dump. */
  download?: () => void
}

/**
 * Server-side backup: asks the `export-data` Edge Function for a JSON dump of
 * the database and offers it as a download. Replacing the old localStorage
 * export matters — localStorage is no longer the source of truth, so a "backup"
 * taken from the browser would miss everything written server-side.
 */
export async function createServerBackup(): Promise<BackupResult> {
  const jwt = (await supabase.auth.getSession()).data.session?.access_token
  if (!jwt) return { ok: false, error: 'وارد حساب کاربری شوید' }

  let res: Response
  try {
    res = await fetch('/functions/v1/export-data', {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt}` },
    })
  } catch {
    return { ok: false, error: 'خطای شبکه؛ اتصال را بررسی کنید' }
  }

  const payload = await res.json().catch(() => null)
  if (!res.ok || !payload || payload.error) {
    return { ok: false, error: payload?.error ?? 'تهیهٔ نسخهٔ پشتیبان ناموفق بود' }
  }

  const stamp = new Date(payload.meta.generated_at)
    .toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, 19)
  const filename = `hamyar-backup-${stamp}.json`

  const download = () => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return { ok: true, meta: payload.meta, filename, download }
}
