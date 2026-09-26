import React, { useState } from 'react';
import { useApp, Role, SystemUser } from '../../store';
import { Shield, Users, Key, Plus, X, Edit, Trash2, Check, Lock, Unlock, Eye, EyeOff } from 'lucide-react';

export default function AdminRBAC() {
  const { darkMode, permissions, roles, setRoles, systemUsers, setSystemUsers } = useApp();
  const [activeTab, setActiveTab] = useState<'roles' | 'users' | 'permissions'>('roles');
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [roleForm, setRoleForm] = useState<Partial<Role>>({ name: '', description: '', permissions: [], isDefault: false });
  const [userForm, setUserForm] = useState<Partial<SystemUser>>({ username: '', password: '', name: '', email: '', phone: '', roleId: '', active: true });
  const [showPassword, setShowPassword] = useState(false);

  const tabs = [
    { id: 'roles', label: 'نقش‌ها', icon: Shield },
    { id: 'users', label: 'کاربران سیستم', icon: Users },
    { id: 'permissions', label: 'دسترسی‌ها', icon: Key },
  ];

  const modules = Array.from(new Set(permissions.map(p => p.module)));

  const openNewRole = () => {
    setRoleForm({ name: '', description: '', permissions: [], isDefault: false });
    setEditRoleId(null);
    setShowRoleForm(true);
  };

  const openEditRole = (role: Role) => {
    setRoleForm(role);
    setEditRoleId(role.id);
    setShowRoleForm(true);
  };

  const saveRole = () => {
    if (editRoleId) {
      setRoles(roles.map(r => r.id === editRoleId ? { ...r, ...roleForm } as Role : r));
    } else {
      setRoles([...roles, { ...roleForm, id: 'role' + Date.now(), createdAt: new Date().toISOString() } as Role]);
    }
    setShowRoleForm(false);
  };

  const openNewUser = () => {
    setUserForm({ username: '', password: '', name: '', email: '', phone: '', roleId: roles[0]?.id || '', active: true });
    setEditUserId(null);
    setShowUserForm(true);
  };

  const openEditUser = (user: SystemUser) => {
    setUserForm(user);
    setEditUserId(user.id);
    setShowUserForm(true);
  };

  const saveUser = () => {
    if (editUserId) {
      setSystemUsers(systemUsers.map(u => u.id === editUserId ? { ...u, ...userForm } as SystemUser : u));
    } else {
      setSystemUsers([...systemUsers, { ...userForm, id: 'sysuser' + Date.now(), createdAt: new Date().toISOString() } as SystemUser]);
    }
    setShowUserForm(false);
  };

  const togglePermission = (permId: string) => {
    const perms = roleForm.permissions || [];
    if (perms.includes(permId)) {
      setRoleForm({ ...roleForm, permissions: perms.filter(p => p !== permId) });
    } else {
      setRoleForm({ ...roleForm, permissions: [...perms, permId] });
    }
  };

  const selectAllPermissions = () => {
    setRoleForm({ ...roleForm, permissions: permissions.map(p => p.id) });
  };

  const clearAllPermissions = () => {
    setRoleForm({ ...roleForm, permissions: [] });
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role?.name || 'نامشخص';
  };

  const stats = {
    totalRoles: roles.length,
    totalUsers: systemUsers.length,
    activeUsers: systemUsers.filter(u => u.active).length,
    totalPermissions: permissions.length,
  };

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield size={28} className="text-blue-600" />
          کنترل دسترسی مبتنی بر نقش (RBAC)
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Shield size={20} className="text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{stats.totalRoles}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>نقش‌ها</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Users size={20} className="text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کاربران سیستم</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Unlock size={20} className="text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{stats.activeUsers}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>کاربران فعال</div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Key size={20} className="text-orange-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{stats.totalPermissions}</div>
          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>دسترسی‌ها</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <button onClick={openNewRole} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
            <Plus size={16} /> نقش جدید
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map(role => (
              <div key={role.id} className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{role.name}</h3>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{role.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditRole(role)} className="text-blue-600 hover:underline text-xs">ویرایش</button>
                    {!role.isDefault && (
                      <button onClick={() => setRoles(roles.filter(r => r.id !== role.id))} className="text-red-500 hover:underline text-xs">حذف</button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-slate-600'}`}>
                    {role.permissions.length} دسترسی
                  </span>
                  {role.isDefault && (
                    <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700">پیش‌فرض</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <button onClick={openNewUser} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
            <Plus size={16} /> کاربر جدید
          </button>
          <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <table className="w-full text-sm">
              <thead className={darkMode ? 'bg-slate-700' : 'bg-gray-50'}>
                <tr>
                  <th className="text-right p-3">نام کاربری</th>
                  <th className="text-right p-3">نام</th>
                  <th className="text-right p-3">نقش</th>
                  <th className="text-right p-3">وضعیت</th>
                  <th className="text-right p-3">آخرین ورود</th>
                  <th className="text-right p-3">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {systemUsers.map(user => (
                  <tr key={user.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                    <td className="p-3 font-mono text-xs">{user.username}</td>
                    <td className="p-3 font-medium">{user.name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                        {getRoleName(user.roleId)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.active ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="p-3 text-xs">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fa-IR') : '-'}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => openEditUser(user)} className="text-blue-600 text-xs hover:underline">ویرایش</button>
                      {user.username !== 'admin' && (
                        <button onClick={() => setSystemUsers(systemUsers.filter(u => u.id !== user.id))} className="text-red-500 text-xs hover:underline">حذف</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            لیست تمام دسترسی‌های سیستم. این دسترسی‌ها به نقش‌ها اختصاص داده می‌شوند.
          </p>
          <div className="space-y-6">
            {modules.map(module => (
              <div key={module} className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <h3 className="font-bold mb-3 text-lg">{module}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {permissions.filter(p => p.module === module).map(perm => (
                    <div key={perm.id} className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                      <div className="font-medium text-sm">{perm.name}</div>
                      <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{perm.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Form Modal */}
      {showRoleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowRoleForm(false)}>
          <div className={`w-full max-w-3xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editRoleId ? 'ویرایش نقش' : 'نقش جدید'}</h3>
              <button onClick={() => setShowRoleForm(false)}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">نام نقش *</label>
                <input type="text" value={roleForm.name} onChange={e => setRoleForm({...roleForm, name: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">توضیحات</label>
                <textarea value={roleForm.description} onChange={e => setRoleForm({...roleForm, description: e.target.value})} rows={2}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={roleForm.isDefault} onChange={e => setRoleForm({...roleForm, isDefault: e.target.checked})} />
                  <span className="text-sm">نقش پیش‌فرض برای کاربران جدید</span>
                </label>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">دسترسی‌ها ({(roleForm.permissions || []).length} از {permissions.length})</label>
                  <div className="flex gap-2">
                    <button onClick={selectAllPermissions} className="text-xs text-blue-600 hover:underline">انتخاب همه</button>
                    <button onClick={clearAllPermissions} className="text-xs text-red-600 hover:underline">حذف همه</button>
                  </div>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {modules.map(module => (
                    <div key={module} className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                      <h4 className="font-bold text-sm mb-2">{module}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {permissions.filter(p => p.module === module).map(perm => (
                          <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={(roleForm.permissions || []).includes(perm.id)} onChange={() => togglePermission(perm.id)} />
                            <span className="text-sm">{perm.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={saveRole} className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">ذخیره</button>
            </div>
          </div>
        </div>
      )}

      {/* User Form Modal */}
      {showUserForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowUserForm(false)}>
          <div className={`w-full max-w-md p-6 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editUserId ? 'ویرایش کاربر' : 'کاربر جدید'}</h3>
              <button onClick={() => setShowUserForm(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">نام کاربری *</label>
                <input type="text" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">رمز عبور *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">نام کامل *</label>
                <input type="text" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">ایمیل</label>
                <input type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">تلفن</label>
                <input type="tel" value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">نقش *</label>
                <select value={userForm.roleId} onChange={e => setUserForm({...userForm, roleId: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                  {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={userForm.active} onChange={e => setUserForm({...userForm, active: e.target.checked})} />
                  <span className="text-sm">کاربر فعال</span>
                </label>
              </div>
              <button onClick={saveUser} className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">ذخیره</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
