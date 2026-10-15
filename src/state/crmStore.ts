import { create } from 'zustand';
import { persist, StateStorage } from 'zustand/middleware';
import type { User, Supplier, Employee, Note } from '../domains/types';
import { fetchSuppliers, fetchEmployees, syncEmployees, syncSuppliers } from '../domains/finance/api';
import { fetchNotes, syncNotes } from '../domains/support/api';
import { onSyncError } from '../api/sync';

const DEFAULT_SUPPLIERS: Supplier[] = [
  { id: 'sup1', name: 'شرکت سامسونگ ایران', phone: '02188776655', email: 'info@samsung.ir', address: 'تهران، خیابان ولیعصر', products: ['فلش مموری', 'شارژر'], balance: 0 },
  { id: 'sup2', name: 'نمایندگی وسترن دیجیتال', phone: '02144556677', products: ['هارد', 'SSD'], balance: 500000 },
  { id: 'sup3', name: 'پخش لوازم جانبی پارسیان', phone: '09121234567', products: ['کابل', 'شارژر', 'لوازم جانبی'], balance: 0 },
];

const DEFAULT_EMPLOYEES: Employee[] = [
  { id: 'emp1', name: 'محمد رضایی', phone: '09121111111', role: 'seller', salary: 8000000, startDate: '1402/01/01', active: true, commission: 5 },
  { id: 'emp2', name: 'زهرا محمدی', phone: '09122222222', role: 'operator', salary: 7000000, startDate: '1402/03/15', active: true, commission: 3 },
  { id: 'emp3', name: 'امیر حسینی', phone: '09123333333', role: 'designer', salary: 12000000, startDate: '1402/05/01', active: true, commission: 10 },
];

interface CrmState {
  users: User[];
  setUsers: (u: User[]) => void;
  suppliers: Supplier[];
  setSuppliers: (s: Supplier[]) => void;
  employees: Employee[];
  setEmployees: (e: Employee[]) => void;
  notes: Note[];
  setNotes: (n: Note[]) => void;
  hydrated: boolean;
  hydrate: () => Promise<void>;
}

const crmStorage: StateStorage = {
  getItem: (_name) => {
    const usersRaw = localStorage.getItem('hamyar_users');
    const suppliersRaw = localStorage.getItem('hamyar_suppliers');
    const employeesRaw = localStorage.getItem('hamyar_employees');
    const notesRaw = localStorage.getItem('hamyar_notes');
    return JSON.stringify({
      state: {
        users: usersRaw ? JSON.parse(usersRaw) : [],
        suppliers: suppliersRaw ? JSON.parse(suppliersRaw) : DEFAULT_SUPPLIERS,
        employees: employeesRaw ? JSON.parse(employeesRaw) : DEFAULT_EMPLOYEES,
        notes: notesRaw ? JSON.parse(notesRaw) : [],
      },
      version: 0,
    });
  },
  setItem: (_name, value) => {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    const state = parsed.state ?? parsed;
    if (state.users !== undefined) localStorage.setItem('hamyar_users', JSON.stringify(state.users));
    if (state.suppliers !== undefined) localStorage.setItem('hamyar_suppliers', JSON.stringify(state.suppliers));
    if (state.employees !== undefined) localStorage.setItem('hamyar_employees', JSON.stringify(state.employees));
    if (state.notes !== undefined) localStorage.setItem('hamyar_notes', JSON.stringify(state.notes));
  },
  removeItem: (_name) => {
    localStorage.removeItem('hamyar_users');
    localStorage.removeItem('hamyar_suppliers');
    localStorage.removeItem('hamyar_employees');
    localStorage.removeItem('hamyar_notes');
  },
};

export const useCrmStore = create<CrmState>()(
  persist(
    (set, get): CrmState => ({
      hydrated: false,
      hydrate: async () => {
        if (get().hydrated) return;
        try {
          const [cloudSuppliers, cloudEmployees, cloudNotes] = await Promise.all([
            fetchSuppliers().catch(() => null),
            fetchEmployees().catch(() => null),
            fetchNotes().catch(() => null),
          ]);
          const local = get();
          set({
            suppliers: cloudSuppliers && cloudSuppliers.length ? cloudSuppliers : local.suppliers,
            employees: cloudEmployees && cloudEmployees.length ? cloudEmployees : local.employees,
            notes: cloudNotes && cloudNotes.length ? cloudNotes : local.notes,
            hydrated: true,
          });
        } catch (err) {
          console.warn('[crm] hydrate failed, using local data:', err);
          set({ hydrated: true });
        }
      },
      users: [],
      setUsers: (users) => set({ users }),
      suppliers: DEFAULT_SUPPLIERS,
      setSuppliers: (suppliers) => {
        const prev = get().suppliers;
        set({ suppliers });
        if (get().hydrated) {
          syncSuppliers(suppliers, prev).catch(() => {});
        }
      },
      employees: DEFAULT_EMPLOYEES,
      setEmployees: (employees) => {
        const prev = get().employees;
        set({ employees });
        if (get().hydrated) {
          syncEmployees(employees, prev).catch(() => {});
        }
      },
      notes: [],
      setNotes: (notes) => {
        const prev = get().notes;
        set({ notes });
        if (get().hydrated) {
          syncNotes(notes, prev).catch(() => {});
        }
      },
    }),
    {
      name: 'hamyar_crm',
      storage: crmStorage as any,
      partialize: (state: any) => ({
        users: state.users,
        suppliers: state.suppliers,
        employees: state.employees,
        notes: state.notes,
      }) as any,
    },
  ),
);

onSyncError((report) => {
  console.error(`[crm] sync error on ${report.table}:`, report.message, report.keys);
});
