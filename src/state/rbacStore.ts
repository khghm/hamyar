import { create } from 'zustand';
import { persist, type StateStorage } from 'zustand/middleware';
import { fetchPermissions, fetchRoles, fetchStaffAccounts, syncRoles } from '../api/rbac';
import { supabase } from '../lib/supabase';

const rbacStorage: StateStorage = {
  getItem: (_name) => {
    const p = localStorage.getItem('hamyar_permissions');
    const r = localStorage.getItem('hamyar_roles');
    const u = localStorage.getItem('hamyar_system_users');
    if (!p && !r && !u) return null;
    const obj: Record<string, unknown> = {};
    if (p) obj.permissions = JSON.parse(p);
    if (r) obj.roles = JSON.parse(r);
    if (u) obj.systemUsers = JSON.parse(u);
    return JSON.stringify(obj);
  },
  setItem: (_name, value) => {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (parsed.permissions !== undefined) {
      localStorage.setItem('hamyar_permissions', JSON.stringify(parsed.permissions));
    }
    if (parsed.roles !== undefined) {
      localStorage.setItem('hamyar_roles', JSON.stringify(parsed.roles));
    }
    if (parsed.systemUsers !== undefined) {
      localStorage.setItem('hamyar_system_users', JSON.stringify(parsed.systemUsers));
    }
  },
  removeItem: (_name) => {
    localStorage.removeItem('hamyar_permissions');
    localStorage.removeItem('hamyar_roles');
    localStorage.removeItem('hamyar_system_users');
  },
};

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isDefault: boolean;
  createdAt: string;
}

export interface SystemUser {
  id: string;
  username: string;
  password: string;
  name: string;
  email?: string;
  phone?: string;
  roleId: string;
  active: boolean;
  lastLogin?: string;
  createdAt: string;
}

const DEFAULT_PERMISSIONS: Permission[] = [
  { id: 'perm1', name: 'مشاهده سفارشات', description: 'مشاهده لیست سفارشات', module: 'سفارشات' },
  { id: 'perm2', name: 'مدیریت سفارشات', description: 'ایجاد، ویرایش و حذف سفارشات', module: 'سفارشات' },
  { id: 'perm3', name: 'مشاهده مشتریان', description: 'مشاهده لیست مشتریان', module: 'مشتریان' },
  { id: 'perm4', name: 'مدیریت مشتریان', description: 'ایجاد، ویرایش و حذف مشتریان', module: 'مشتریان' },
  { id: 'perm5', name: 'مشاهده محصولات', description: 'مشاهده لیست محصولات', module: 'محصولات' },
  { id: 'perm6', name: 'مدیریت محصولات', description: 'ایجاد، ویرایش و حذف محصولات', module: 'محصولات' },
  { id: 'perm7', name: 'مشاهده مدیا', description: 'مشاهده لیست فیلم و سریال', module: 'مدیا' },
  { id: 'perm8', name: 'مدیریت مدیا', description: 'ایجاد، ویرایش و حذف مدیا', module: 'مدیا' },
  { id: 'perm9', name: 'مشاهده خدمات', description: 'مشاهده لیست خدمات', module: 'خدمات' },
  { id: 'perm10', name: 'مدیریت خدمات', description: 'ایجاد، ویرایش و حذف خدمات', module: 'خدمات' },
  { id: 'perm11', name: 'مشاهده پروژه‌ها', description: 'مشاهده لیست پروژه‌ها', module: 'پروژه‌ها' },
  { id: 'perm12', name: 'مدیریت پروژه‌ها', description: 'ایجاد، ویرایش و حذف پروژه‌ها', module: 'پروژه‌ها' },
  { id: 'perm13', name: 'مشاهده مالی', description: 'مشاهده گزارشات مالی', module: 'مالی' },
  { id: 'perm14', name: 'مدیریت مالی', description: 'ثبت درآمد و هزینه', module: 'مالی' },
  { id: 'perm15', name: 'مشاهده کارمندان', description: 'مشاهده لیست کارمندان', module: 'کارمندان' },
  { id: 'perm16', name: 'مدیریت کارمندان', description: 'ایجاد، ویرایش و حذف کارمندان', module: 'کارمندان' },
  { id: 'perm17', name: 'مشاهده تامین‌کنندگان', description: 'مشاهده لیست تامین‌کنندگان', module: 'تامین‌کنندگان' },
  { id: 'perm18', name: 'مدیریت تامین‌کنندگان', description: 'ایجاد، ویرایش و حذف تامین‌کنندگان', module: 'تامین‌کنندگان' },
  { id: 'perm19', name: 'مشاهده کمپین‌ها', description: 'مشاهده لیست کمپین‌ها', module: 'کمپین‌ها' },
  { id: 'perm20', name: 'مدیریت کمپین‌ها', description: 'ایجاد، ویرایش و حذف کمپین‌ها', module: 'کمپین‌ها' },
  { id: 'perm21', name: 'مشاهده پیامک', description: 'مشاهده پنل پیامک', module: 'پیامک' },
  { id: 'perm22', name: 'ارسال پیامک', description: 'ارسال پیامک انبوه', module: 'پیامک' },
  { id: 'perm23', name: 'مشاهده نظرات', description: 'مشاهده نظرات کاربران', module: 'نظرات' },
  { id: 'perm24', name: 'مدیریت نظرات', description: 'تایید و حذف نظرات', module: 'نظرات' },
  { id: 'perm25', name: 'مشاهده FAQ', description: 'مشاهده سوالات متداول', module: 'FAQ' },
  { id: 'perm26', name: 'مدیریت FAQ', description: 'ایجاد، ویرایش و حذف FAQ', module: 'FAQ' },
  { id: 'perm27', name: 'مشاهده تیم محتوا', description: 'مشاهده پروژه‌های تولید محتوا', module: 'تیم محتوا' },
  { id: 'perm28', name: 'مدیریت تیم محتوا', description: 'ایجاد، ویرایش و حذف پروژه‌های محتوا', module: 'تیم محتوا' },
  { id: 'perm29', name: 'مشاهده دعوت‌ها', description: 'مشاهده کدهای دعوت', module: 'دعوت‌ها' },
  { id: 'perm30', name: 'مشاهده تنظیمات', description: 'مشاهده تنظیمات سایت', module: 'تنظیمات' },
  { id: 'perm31', name: 'مدیریت تنظیمات', description: 'ویرایش تنظیمات سایت', module: 'تنظیمات' },
  { id: 'perm32', name: 'مشاهده لاگ فعالیت', description: 'مشاهده لاگ فعالیت‌ها', module: 'لاگ' },
  { id: 'perm33', name: 'پشتیبان‌گیری', description: 'ایجاد و بازیابی بکاپ', module: 'بکاپ' },
  { id: 'perm34', name: 'مشاهده تحلیل', description: 'مشاهده داشبورد تحلیلی', module: 'تحلیل' },
  { id: 'perm35', name: 'مدیریت نقش‌ها', description: 'ایجاد و ویرایش نقش‌ها و دسترسی‌ها', module: 'RBAC' },
  { id: 'perm36', name: 'مشاهده همکاران', description: 'مشاهده لیست همکاران', module: 'همکاران' },
  { id: 'perm37', name: 'مدیریت همکاران', description: 'ایجاد، ویرایش و حذف همکاران', module: 'همکاران' },
  { id: 'perm38', name: 'مشاهده سفارشات همکار', description: 'مشاهده سفارشات ارجاعی همکاران', module: 'همکاران' },
  { id: 'perm39', name: 'مدیریت کیف پول', description: 'مدیریت تراکنش‌های کیف پول همکاران', module: 'همکاران' },
  { id: 'perm40', name: 'گزارش‌های همکاران', description: 'مشاهده گزارش‌های عملکرد همکاران', module: 'همکاران' },
  { id: 'perm41', name: 'مشاهده تیکت‌ها', description: 'مشاهده تیکت‌های پشتیبانی مشتریان', module: 'پشتیبانی' },
  { id: 'perm42', name: 'مدیریت تیکت‌ها', description: 'پاسخ‌دهی، تغییر وضعیت و اولویت تیکت‌ها', module: 'پشتیبانی' },
];

const DEFAULT_ROLES: Role[] = [
  {
    id: 'role1',
    name: 'مدیر کل',
    description: 'دسترسی کامل به تمام بخش‌ها',
    permissions: DEFAULT_PERMISSIONS.map(p => p.id),
    isDefault: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'role2',
    name: 'مدیر فروش',
    description: 'دسترسی به سفارشات، محصولات، مشتریان و گزارشات فروش',
    permissions: ['perm1', 'perm2', 'perm3', 'perm4', 'perm5', 'perm6', 'perm13', 'perm34'],
    isDefault: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'role3',
    name: 'اپراتور خدمات',
    description: 'دسترسی به سفارشات و خدمات کافی‌نت',
    permissions: ['perm1', 'perm2', 'perm9', 'perm10'],
    isDefault: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'role4',
    name: 'مدیر محتوا',
    description: 'دسترسی به مدیا، تیم محتوا و نظرات',
    permissions: ['perm7', 'perm8', 'perm23', 'perm24', 'perm27', 'perm28'],
    isDefault: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'role5',
    name: 'حسابدار',
    description: 'دسترسی به بخش مالی و گزارشات',
    permissions: ['perm13', 'perm14', 'perm34'],
    isDefault: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'role6',
    name: 'همکار',
    description: 'دسترسی به پنل همکاران و مشاهده پورسانت‌ها',
    permissions: ['perm36', 'perm38'],
    isDefault: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'role7',
    name: 'کارشناس پشتیبانی',
    description: 'پاسخ‌دهی و رسیدگی به تیکت‌های مشتریان',
    permissions: ['perm41', 'perm42', 'perm1', 'perm21'],
    isDefault: false,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_SYSTEM_USERS: SystemUser[] = [
  {
    id: 'sysuser1',
    username: 'admin',
    password: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
    name: 'مدیر سیستم',
    email: 'admin@hamyar.ir',
    phone: '09913911880',
    roleId: 'role1',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sysuser2',
    username: 'testadmin',
    password: '3b6c63885232db861df75e283a581947267a0aa3ce5d3229aca7423baabdc697',
    name: 'مدیر تست',
    email: 'testadmin@hamyar.ir',
    phone: '09913911881',
    roleId: 'role1',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export async function hashPassword(password: string): Promise<string> {
  try {
    const data = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let h = 0;
    for (let i = 0; i < password.length; i++) {
      h = ((h << 5) - h + password.charCodeAt(i)) | 0;
    }
    return 'fb_' + Math.abs(h).toString(16).padStart(8, '0');
  }
}

interface RbacState {
  permissions: Permission[];
  setPermissions: (p: Permission[]) => void;
  roles: Role[];
  setRoles: (r: Role[]) => void;
  systemUsers: SystemUser[];
  setSystemUsers: (u: SystemUser[]) => void;
  currentAdminId?: string;
  userPermissions?: string[];
  adminLoggedIn: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  hasPermission: (permId: string) => boolean;
  canAccessPage: (permIds?: string[]) => boolean;
  establishAdminSession: (su: SystemUser, roleName: string, perms?: string[]) => void;
  clearAdminSession: () => void;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  createStaffUser: (data: { username: string; password: string; name: string; roleId: string; email?: string; phone?: string }) => Promise<{ ok: boolean; error?: string }>;
}

export const useRbacStore = create<RbacState>()(
  persist(
    (set, get) => ({
      permissions: DEFAULT_PERMISSIONS,
      setPermissions: (p) => set({ permissions: p }),

      roles: DEFAULT_ROLES,
      setRoles: (nextRoles) => {
        const prev = get().roles;
        set({ roles: nextRoles });
        if (get().hydrated) {
          syncRoles(nextRoles, prev).then(result => {
            if (result.ok && result.roles) set({ roles: result.roles });
          }).catch(() => {});
        }
      },

      systemUsers: DEFAULT_SYSTEM_USERS,
      setSystemUsers: (u) => set({ systemUsers: u }),

      currentAdminId: undefined,
      userPermissions: undefined,
      adminLoggedIn: false,
      hydrated: false,
      hydrate: async () => {
        if (get().hydrated) return;
        try {
          const [perms, rolesArr, staff] = await Promise.all([
            fetchPermissions().catch(() => null),
            fetchRoles().catch(() => null),
            fetchStaffAccounts().catch(() => null),
          ]);
          const curr = get();

          let mergedStaff: SystemUser[];
          if (staff && staff.length) {
            mergedStaff = staff.map(su => {
              const localMatch = curr.systemUsers.find(
                l => (l.username && su.username && l.username.toLowerCase() === su.username.toLowerCase()) || l.id === su.id
              );
              return {
                ...su,
                password: (su.password && su.password.trim() !== '') ? su.password : (localMatch?.password || su.password || ''),
                email: su.email || localMatch?.email,
                phone: su.phone || localMatch?.phone,
                name: su.name || localMatch?.name || su.username,
              };
            });
            for (const local of curr.systemUsers) {
              if (!mergedStaff.some(m => m.username.toLowerCase() === local.username.toLowerCase() || m.id === local.id)) {
                mergedStaff.push(local);
              }
            }
          } else {
            mergedStaff = curr.systemUsers;
          }

          set({
            permissions: perms && perms.length ? perms : curr.permissions,
            roles: rolesArr && rolesArr.length ? rolesArr : curr.roles,
            systemUsers: mergedStaff,
            hydrated: true,
          });
        } catch (e) { console.warn('[rbac] hydrate failed:', e); }
      },

      hasPermission: (permId) => {
        const s = get();
        if (!s.adminLoggedIn) return false;
        if (!s.currentAdminId) return true;
        if (s.userPermissions === undefined) return true;
        return s.userPermissions.includes(permId);
      },

      canAccessPage: (permIds) => {
        const s = get();
        if (!s.adminLoggedIn) return false;
        if (!permIds || permIds.length === 0) return true;
        if (!s.currentAdminId) return true;
        if (s.userPermissions === undefined) return true;
        return permIds.some(p => s.userPermissions!.includes(p));
      },

      establishAdminSession: (su, _roleName, perms) => {
        set({
          adminLoggedIn: true,
          currentAdminId: su.id,
          userPermissions: perms,
          systemUsers: get().systemUsers.map(s =>
            s.id === su.id ? { ...s, lastLogin: new Date().toISOString() } : s
          ),
        });
      },

      clearAdminSession: () => {
        set({
          adminLoggedIn: false,
          currentAdminId: undefined,
          userPermissions: undefined,
        });
      },

      adminLogin: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) return false;

        // Check staff_accounts for this auth user
        const { data: staff, error: staffErr } = await supabase
          .from('staff_accounts')
          .select('id, role_id, display_name, username, active')
          .eq('auth_uid', data.user.id)
          .maybeSingle();

        if (staffErr || !staff || !staff.active) {
          await supabase.auth.signOut();
          return false;
        }

        // Fetch role permissions (permission IDs)
        const { data: role, error: roleErr } = await supabase
          .from('roles')
          .select('name, permissions')
          .eq('id', staff.role_id)
          .maybeSingle();

        if (roleErr || !role) {
          await supabase.auth.signOut();
          return false;
        }

        // Update last_login
        await supabase
          .from('staff_accounts')
          .update({ last_login: new Date().toISOString() })
          .eq('id', staff.id);

        // role.permissions is already an array of permission IDs (e.g., ['perm1', 'perm2', ...])
        const permIds = role.permissions || [];

        // Get establishAdminSession from store
        const { establishAdminSession } = get();
        // Create minimal SystemUser-compatible object
        const su = {
          id: staff.id,
          username: staff.username || '',
          password: '',
          name: staff.display_name || '',
          email: '',
          phone: '',
          roleId: staff.role_id,
          active: true,
          createdAt: new Date().toISOString(),
        };
        establishAdminSession(su, role.name, permIds);
        return true;
      },

      createStaffUser: async (data) => {
        const uname = (data.username || '').trim();
        if (!uname) return { ok: false, error: 'نام کاربری را وارد کنید' };
        if (!(data.password || '')) return { ok: false, error: 'رمز عبور را وارد کنید' };
        if (!data.roleId) return { ok: false, error: 'یک نقش را انتخاب کنید' };

        // Get current session for authorization
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return { ok: false, error: 'نشست معتبر نیست، دوباره وارد شوید' };

        // Call create-staff Edge Function
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-staff`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email: data.email || `${uname}@staff.local`,
            phone: data.phone || '',
            password: data.password,
            name: data.name || uname,
            role: data.roleId, // role ID
            username: uname,
          }),
        });

        const result = await response.json();
        if (!result.ok) {
          return { ok: false, error: result.error || 'ایجاد کارمند ناموفق بود' };
        }

        // Refresh staff list from server
        const staff = await fetchStaffAccounts();
        if (staff) {
          set({ systemUsers: staff.map(su => ({
            id: su.id,
            username: su.username || '',
            password: '', // not stored locally
            name: su.name || '',
            email: su.email,
            phone: su.phone,
            roleId: su.roleId,
            active: su.active,
            createdAt: su.createdAt,
          })) });
        }

        return { ok: true };
      },
    }),
    {
      name: 'hamyar_rbac',
      partialize: state => ({
        permissions: state.permissions,
        roles: state.roles,
        systemUsers: state.systemUsers,
        currentAdminId: state.currentAdminId,
        userPermissions: state.userPermissions,
        adminLoggedIn: state.adminLoggedIn,
      }),
    },
  ),
);
