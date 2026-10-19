import { supabase } from './supabase';
import { functionsUrl } from '../lib/supabase';
import type { Permission, Role, SystemUser } from '../store';

export interface CreateStaffResult {
  ok: boolean;
  error?: string;
  staffId?: string
  role?: string
  message?: string
}

export interface CreateStaffInput {
  /** کلید ورود کارمند — ایمیل. */
  email: string
  /** دادهٔ پروفایل؛ قید `^09[0-9]{9}$` دیتابیس این قالب را می‌خواهد. */
  phone: string
  password: string
  name: string
  /** Role name (business key) or role uuid. */
  role: string
  username?: string
}

/**
 * Creates a staff account: a Supabase Auth user (email + password) plus its
 * `staff_accounts` row with the RBAC role. The service_role key stays inside the
 * Edge Function — the browser only sends the caller's own JWT.
 *
 * چرا ایمیل و نه شماره: ارائه‌دهندهٔ Phone در Supabase به اعتبارنامهٔ یک شرکت
 * پیامک نیاز دارد و روی این پروژه فعال نیست، در حالی که Email از قبل فعال است.
 * شمارهٔ موبایل همچنان ذخیره می‌شود ولی دیگر کلید ورود نیست.
 */
export async function createStaffAccount(
  body: CreateStaffInput,
): Promise<CreateStaffResult> {
  const jwt = (await supabase.auth.getSession()).data.session?.access_token
  if (!jwt) return { ok: false, error: 'وارد حساب کاربری شوید' }

  const res = await fetch(functionsUrl('create-staff'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.error) {
    return { ok: false, error: json.error || 'ایجاد کارمند ناموفق بود' }
  }
  return { ok: true, staffId: json.staffId, role: json.role, message: json.message }
}

// --- reads (staff panel hydration) -------------------------------------------

const toPermission = (r: Record<string, any>): Permission => ({
  id: r.id,
  name: r.name,
  description: r.description ?? '',
  module: r.module,
});

const toRole = (r: Record<string, any>): Role => ({
  // Roles keep the familiar `roleN` key when the seed provides one, so existing
  // role references in the UI stay valid.
  id: r.sku ?? r.id,
  name: r.name,
  description: r.description ?? '',
  permissions: r.permissions ?? [],
  isDefault: r.is_default === true,
  createdAt: r.created_at,
});

export async function fetchPermissions(): Promise<Permission[]> {
  const { data, error } = await supabase.rpc('admin_list_permissions');
  if (error) {
    console.warn('[rbac] admin_list_permissions RPC failed, falling back to select:', error.message);
    const { data: fb, error: fbErr } = await supabase.from('permissions').select('*').order('id');
    if (fbErr) {
      console.warn('[rbac] permissions read failed:', fbErr.message);
      return [];
    }
    return (fb ?? []).map(toPermission);
  }
  return (data ?? []).map(toPermission);
}

export async function fetchRoles(): Promise<Role[]> {
  const { data, error } = await supabase.rpc('admin_list_roles');
  if (error) {
    console.warn('[rbac] admin_list_roles RPC failed, falling back to select:', error.message);
    const { data: fb, error: fbErr } = await supabase.from('roles').select('*').order('created_at');
    if (fbErr) {
      console.warn('[rbac] roles read failed:', fbErr.message);
      return [];
    }
    return (fb ?? []).map(toRole);
  }
  return (data ?? []).map(toRole);
}

const toSystemUser = (r: Record<string, any>): SystemUser => ({
  id: r.sku ?? r.id,
  username: r.username || r.display_name,
  password: r.password || '',
  name: r.display_name,
  email: r.email ?? undefined,
  phone: r.phone ?? undefined,
  roleId: r.role_id,
  active: r.active !== false,
  lastLogin: r.last_login ?? undefined,
  createdAt: r.created_at,
});

export async function fetchStaffAccounts(): Promise<SystemUser[]> {
  const { data, error } = await supabase.rpc('admin_list_staff_accounts');
  if (error) {
    console.warn('[rbac] admin_list_staff_accounts RPC failed, falling back to select:', error.message);
    const { data: fb, error: fbErr } = await supabase.from('staff_accounts').select('*').order('created_at');
    if (fbErr) {
      console.warn('[rbac] staff_accounts read failed:', fbErr.message);
      return [];
    }
    return (fb ?? []).map(toSystemUser);
  }
  return (data ?? []).map(toSystemUser);
}

export async function updateStaffAccount(
  staffId: string,
  patch: { display_name?: string; role_id?: string; active?: boolean; username?: string; phone?: string },
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('staff_accounts')
    .update(patch)
    .eq('id', staffId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Deletes a staff account server-side: the `staff_accounts` row and the
 * matching `auth.users` row. The server-side RPC (`delete_staff_account`,
 * migration 023) enforces the permission check, so the client never needs the
 * service_role key.
 */
export async function deleteStaffAccount(
  staffId: string,
): Promise<{ ok: boolean; error?: string; deleted?: boolean }> {
  const { data, error } = await supabase.rpc('delete_staff_account', {
    p_staff_id: staffId,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, deleted: data as boolean };
}

// --- role write-through ------------------------------------------------------

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
   * Reconciles the admin role list with Postgres.
   *
   * Roles are referenced by `staff_accounts.role_id`, so their id must stay the
   * database uuid. A role created in the UI gets a temporary local id
   * (`role<timestamp>`); it is inserted here and the temporary id is replaced by
   * the generated uuid in the returned list.
   *
   * Deletion is limited to roles that are neither default nor referenced by any
   * staff account, so the write-through can never drop a role that is still in use.
   *
   * The previous delete guard (`!serverIds.has(role.id)`) only deleted roles that
   * had never been written to the server — a role edited in the UI keeps its uuid,
   * so the guard skipped it and the deletion was silently lost. The guard is now
   * "is the role absent from `next`?", which is the actual signal that the admin
   * removed it from the panel.
   */
  export async function syncRoles(
  next: Role[],
  previous: Role[],
): Promise<{ ok: boolean; error?: string; roles: Role[] }> {
  const serverRoles = await fetchRoles();
  const serverIds = new Set(serverRoles.map(r => r.id));

  const toRow = (r: Role) => ({
    name: r.name,
    description: r.description ?? '',
    permissions: r.permissions ?? [],
    is_default: r.isDefault === true,
  });

  const resolved: Role[] = [];

  for (const role of next) {
    if (UUID_PATTERN.test(role.id)) {
      const before = previous.find(r => r.id === role.id);
      const server = serverRoles.find(r => r.id === role.id);
      if (server && before) {
        const changed =
          server.name !== role.name ||
          (server.description ?? '') !== (role.description ?? '') ||
          server.isDefault !== (role.isDefault === true) ||
          JSON.stringify([...(server.permissions ?? [])].sort()) !==
            JSON.stringify([...(role.permissions ?? [])].sort());
        if (changed) {
          const { error } = await supabase.from('roles').update(toRow(role)).eq('id', role.id);
          if (error) return { ok: false, error: error.message, roles: next };
        }
      }
      resolved.push(role);
      continue;
    }

    // New role: insert and adopt the generated uuid.
    const { data, error } = await supabase
      .from('roles')
      .insert(toRow(role))
      .select('id')
      .single();
    if (error || !data) {
      return { ok: false, error: error?.message ?? 'role insert failed', roles: next };
    }
    resolved.push({ ...role, id: data.id });
  }

  const nextIds = new Set(resolved.map(r => r.id));
  for (const role of previous) {
    // The admin removed this role from the panel: it is not in `next`.
    if (nextIds.has(role.id)) continue;
    if (role.isDefault) continue;
    // Only delete roles that actually exist on the server — a role that was
    // never written (e.g. a local-only temp id) has nothing to delete.
    if (!serverIds.has(role.id)) continue;
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', role.id)
      .is('is_default', false);
    if (error) return { ok: false, error: error.message, roles: resolved };
  }

  return { ok: true, roles: resolved };
}
