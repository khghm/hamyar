import React, { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { useThemeStore } from './state/themeStore';
import { useAuthStore } from './state/authStore';
import { useRbacStore } from './state/rbacStore';
import { useCatalogStore } from './state/catalogStore';
import { useOrderStore } from './state/orderStore';
import { useTicketStore } from './state/ticketStore';
import { useLoyaltyStore } from './state/loyaltyStore';
import { useNotificationStore } from './state/notificationStore';
import { useCrmStore } from './state/crmStore';
import { useFinanceStore } from './state/financeStore';
import { useContentStore } from './state/contentStore';
import { useMarketingStore } from './state/marketingStore';
import { useCartStore } from './state/cartStore';

import type {
  User, LoyaltyTransaction, GamificationConfig, GamificationBadgeDef,
  LoyaltyCategory,
  Product, MediaItem, Service, ProjectService,
  Order, OrderStatus,
  NewsItem, PortfolioItem, Expense, Project, Note, Review,
  Supplier, Employee, Campaign, SmsLog, AuditLog, FaqItem,
  TicketCategory, TicketPriority,
  SupportTicket,
  Invoice, OKR, KPI,
  Affiliate, AffiliateOrder, AffiliateTransaction, Persona,
  DigitalMarketingData,
  ContentProject, ContentComment, ContentAsset, ContentTemplate, ContentIdea,
  BrandBook, Permission, Role, SystemUser,
  NotificationType, NotificationPriority,
  AdminNotification, ResolvedNotificationMeta, NotificationSettings,
  NotificationTypeDef,
  AboutContent, CartItem,
} from './domains/types';

// Re-export types and constants from the single source of truth.
export * from './domains/types';

interface AppContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  currentUser: User | null;
  adminLoggedIn: boolean;
  login: (email: string, password: string, name: string, phone?: string, inviteCode?: string) => Promise<{ ok: boolean; error?: string; needsEmailConfirmation?: boolean }>;
  loginWithSession: (email: string) => Promise<{ ok: boolean; error?: string }>;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  products: Product[];
  setProducts: (p: Product[]) => void;
  mediaItems: MediaItem[];
  setMediaItems: (m: MediaItem[]) => void;
  services: Service[];
  setServices: (s: Service[]) => void;
  orders: Order[];
  setOrders: (o: Order[]) => void;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  deleteOrder: (id: string) => void;
  createServiceOrder: (input: {
    service: Service;
    quantity: number;
    urgent: boolean;
    formData: Record<string, string>;
    documents: NonNullable<Order['documents']>;
    paymentMethod: 'online' | 'wallet';
    gatewayRef?: string;
  }) => { ok: boolean; error?: string; order?: Order };
  createProjectOrder: (input: {
    projectService: ProjectService;
    quantity: number;
    urgent: boolean;
    formData: Record<string, string>;
    documents: NonNullable<Order['documents']>;
    paymentMethod: 'online' | 'wallet';
    gatewayRef?: string;
  }) => { ok: boolean; error?: string; order?: Order };
  createCatalogOrder: (input: {
    items: { productId?: string; mediaId?: string; name?: string; price?: number; quantity?: number; image?: string }[];
    paymentMethod: 'online' | 'wallet';
    gatewayRef?: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    customerNationalId?: string;
    couponCode?: string | null;
  }) => { ok: boolean; error?: string; order?: Order };
  news: NewsItem[];
  setNews: (n: NewsItem[]) => void;
  portfolio: PortfolioItem[];
  setPortfolio: (p: PortfolioItem[]) => void;
  expenses: Expense[];
  setExpenses: (e: Expense[]) => void;
  projects: Project[];
  setProjects: (p: Project[]) => void;
  users: User[];
  setUsers: (u: User[]) => void;
  addToFavorites: (mediaId: string) => void;
  selectMedia: (mediaId: string) => void;
  addToCart: (productId: string, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartItems: CartItem[];
  updateAvatar: (avatarUrl: string) => void;
  updateCustomerProfile: (patch: Partial<Pick<User, 'name' | 'phone' | 'birthDate'>>) => void;
  chargeWallet: (amount: number) => void;
  deductWallet: (amount: number) => boolean;
  aboutContent: AboutContent;
  setAboutContent: (a: AboutContent) => void;
  notes: Note[];
  setNotes: (n: Note[]) => void;
  reviews: Review[];
  setReviews: (r: Review[]) => void;
  suppliers: Supplier[];
  setSuppliers: (s: Supplier[]) => void;
  employees: Employee[];
  setEmployees: (e: Employee[]) => void;
  campaigns: Campaign[];
  setCampaigns: (c: Campaign[]) => void;
  smsLogs: SmsLog[];
  setSmsLogs: (s: SmsLog[]) => void;
  auditLogs: AuditLog[];
  setAuditLogs: (a: AuditLog[]) => void;
  faqs: FaqItem[];
  setFaqs: (f: FaqItem[]) => void;
  tickets: SupportTicket[];
  setTickets: (t: SupportTicket[]) => void;
  createTicket: (input: { subject: string; description: string; category: TicketCategory; priority: TicketPriority; orderId?: string }) => { ok: boolean; error?: string; ticket?: SupportTicket };
  replyTicket: (ticketId: string, text: string) => void;
  reopenTicket: (ticketId: string, text: string) => void;
  rateTicket: (ticketId: string, rating: number) => void;
  adminReplyTicket: (ticketId: string, text: string) => void;
  updateTicket: (id: string, patch: Partial<Pick<SupportTicket, 'status' | 'priority' | 'assignedTo'>>) => void;
  invoices: Invoice[];
  setInvoices: (i: Invoice[]) => void;
  loyaltyTx: LoyaltyTransaction[];
  gamificationConfig: GamificationConfig;
  setGamificationConfig: (c: GamificationConfig) => void;
  resetLoyaltyData: () => void;
  awardLoyaltyPoints: (userId: string, points: number, reason: string, opts?: { category?: LoyaltyCategory; autoLevelUp?: boolean }) => void;
  deductLoyaltyPointsForAdmin: (userId: string, points: number, reason: string) => boolean;
  awardReviewPoints: () => void;
  redeemLoyaltyReward: (userId: string, rewardId: string) => { ok: boolean; error?: string };
  setUserLevel: (userId: string, level: User['level']) => void;
  getEarnedBadges: (user: User) => { def: GamificationBadgeDef; earned: boolean; progress: number }[];
  contentProjects: ContentProject[];
  setContentProjects: (p: ContentProject[]) => void;
  contentComments: ContentComment[];
  setContentComments: (c: ContentComment[]) => void;
  contentAssets: ContentAsset[];
  setContentAssets: (a: ContentAsset[]) => void;
  contentTemplates: ContentTemplate[];
  setContentTemplates: (t: ContentTemplate[]) => void;
  contentIdeas: ContentIdea[];
  setContentIdeas: (i: ContentIdea[]) => void;
  brandBook: BrandBook;
  setBrandBook: (b: BrandBook) => void;
  permissions: Permission[];
  setPermissions: (p: Permission[]) => void;
  roles: Role[];
  setRoles: (r: Role[]) => void;
  systemUsers: SystemUser[];
  setSystemUsers: (u: SystemUser[]) => void;
  currentAdminId?: string;
  userPermissions?: string[];
  hasPermission: (permId: string) => boolean;
  canAccessPage: (permIds?: string[]) => boolean;
  createStaffUser: (data: { username: string; password: string; name: string; roleId: string; email?: string; phone?: string }) => Promise<{ ok: boolean; error?: string }>;
  establishAdminSession: (su: SystemUser, roleName: string, perms?: string[]) => void;
  clearAdminSession: () => void;
  okrs: OKR[];
  setOkrs: (o: OKR[]) => void;
  kpis: KPI[];
  setKpis: (k: KPI[]) => void;
  digitalMarketingData: DigitalMarketingData;
  setDigitalMarketingData: (d: DigitalMarketingData) => void;
  affiliates: Affiliate[];
  setAffiliates: (a: Affiliate[]) => void;
  affiliateOrders: AffiliateOrder[];
  setAffiliateOrders: (o: AffiliateOrder[]) => void;
  affiliateTransactions: AffiliateTransaction[];
  setAffiliateTransactions: (t: AffiliateTransaction[]) => void;
  personas: Persona[];
  setPersonas: (p: Persona[]) => void;
  notifications: AdminNotification[];
  setNotifications: (n: AdminNotification[]) => void;
  unreadNotificationsCount: number;
  pushNotification: (input: { type: NotificationType; title: string; message: string; link?: string; priority?: NotificationPriority; key?: string }) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  clearReadNotifications: () => void;
  getNotificationMeta: (type: NotificationType) => ResolvedNotificationMeta;
  notificationToasts: AdminNotification[];
  dismissNotificationToast: (id: string) => void;
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (patch: Partial<NotificationSettings>) => void;
  saveNotificationType: (input: Partial<NotificationTypeDef> & { id: string }) => void;
  deleteNotificationType: (id: string) => void;
  resetNotificationTypes: () => void;
  sendSystemNotification: (input: { title: string; message: string; typeId?: string; priority?: NotificationPriority; link?: string; audience: 'all' | string[] }) => void;
  pushAuditLog: (action: string, details: string, module: string) => void;
  pushSmsLog: (phone: string, message: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const darkMode = useThemeStore((s) => s.darkMode);
  const toggleDarkMode = useThemeStore((s) => s.toggleDarkMode);

  const currentUser = useAuthStore((s) => s.currentUser);
  const login = useAuthStore((s) => s.login);
  const loginWithSession = useAuthStore((s) => s.loginWithSession);
  const addToFavorites = useAuthStore((s) => s.addToFavorites);
  const selectMedia = useAuthStore((s) => s.selectMedia);
  const updateAvatar = useAuthStore((s) => s.updateAvatar);
  const updateCustomerProfile = useAuthStore((s) => s.updateCustomerProfile);
  const chargeWallet = useAuthStore((s) => s.chargeWallet);
  const deductWallet = useAuthStore((s) => s.deductWallet);
  const users = useAuthStore((s) => s.users);
  const setUsers = useAuthStore((s) => s.setUsers);
  const reviews = useAuthStore((s) => s.reviews);
  const setReviews = useAuthStore((s) => s.setReviews);
  const faqs = useAuthStore((s) => s.faqs);
  const setFaqs = useAuthStore((s) => s.setFaqs);
  const smsLogs = useAuthStore((s) => s.smsLogs);
  const setSmsLogs = useAuthStore((s) => s.setSmsLogs);
  const auditLogs = useAuthStore((s) => s.auditLogs);
  const setAuditLogs = useAuthStore((s) => s.setAuditLogs);

  const permissions = useRbacStore((s) => s.permissions);
  const setPermissions = useRbacStore((s) => s.setPermissions);
  const roles = useRbacStore((s) => s.roles);
  const setRoles = useRbacStore((s) => s.setRoles);
  const systemUsers = useRbacStore((s) => s.systemUsers);
  const setSystemUsers = useRbacStore((s) => s.setSystemUsers);
  const currentAdminId = useRbacStore((s) => s.currentAdminId);
  const userPermissions = useRbacStore((s) => s.userPermissions);
  const adminLoggedIn = useRbacStore((s) => s.adminLoggedIn);
  const hasPermission = useRbacStore((s) => s.hasPermission);
  const canAccessPage = useRbacStore((s) => s.canAccessPage);
  const establishAdminSession = useRbacStore((s) => s.establishAdminSession);
  const clearAdminSession = useRbacStore((s) => s.clearAdminSession);
  const rbacAdminLogin = useRbacStore((s) => s.adminLogin);
  const rbacCreateStaffUser = useRbacStore((s) => s.createStaffUser);

  const products = useCatalogStore((s) => s.products);
  const setProducts = useCatalogStore((s) => s.setProducts);
  const mediaItems = useCatalogStore((s) => s.mediaItems);
  const setMediaItems = useCatalogStore((s) => s.setMediaItems);
  const services = useCatalogStore((s) => s.services);
  const setServices = useCatalogStore((s) => s.setServices);
  const news = useCatalogStore((s) => s.news);
  const setNews = useCatalogStore((s) => s.setNews);
  const portfolio = useCatalogStore((s) => s.portfolio);
  const setPortfolio = useCatalogStore((s) => s.setPortfolio);
  const projects = useCatalogStore((s) => s.projects);
  const setProjects = useCatalogStore((s) => s.setProjects);
  const aboutContent = useCatalogStore((s) => s.aboutContent);
  const setAboutContent = useCatalogStore((s) => s.setAboutContent);

  const orders = useOrderStore((s) => s.orders);
  const setOrders = useOrderStore((s) => s.setOrders);
  const invoices = useOrderStore((s) => s.invoices);
  const setInvoices = useOrderStore((s) => s.setInvoices);
  const updateOrder = useOrderStore((s) => s.updateOrder);
  const updateOrderStatus = useOrderStore((s) => s.updateOrderStatus);
  const deleteOrder = useOrderStore((s) => s.deleteOrder);
  const createServiceOrder = useOrderStore((s) => s.createServiceOrder);
  const createProjectOrder = useOrderStore((s) => s.createProjectOrder);
  const createCatalogOrder = useOrderStore((s) => s.createCatalogOrder);

  const tickets = useTicketStore((s) => s.tickets);
  const setTickets = useTicketStore((s) => s.setTickets);
  const createTicket = useTicketStore((s) => s.createTicket);
  const replyTicket = useTicketStore((s) => s.replyTicket);
  const reopenTicket = useTicketStore((s) => s.reopenTicket);
  const rateTicket = useTicketStore((s) => s.rateTicket);
  const adminReplyTicket = useTicketStore((s) => s.adminReplyTicket);
  const updateTicket = useTicketStore((s) => s.updateTicket);

  const loyaltyTx = useLoyaltyStore((s) => s.loyaltyTx);
  const gamificationConfig = useLoyaltyStore((s) => s.gamificationConfig);
  const setGamificationConfig = useLoyaltyStore((s) => s.setGamificationConfig);
  const resetLoyaltyData = useLoyaltyStore((s) => s.resetLoyaltyData);
  const awardLoyaltyPoints = useLoyaltyStore((s) => s.awardLoyaltyPoints);
  const deductLoyaltyPointsForAdmin = useLoyaltyStore((s) => s.deductLoyaltyPointsForAdmin);
  const awardReviewPoints = useLoyaltyStore((s) => s.awardReviewPoints);
  const redeemLoyaltyReward = useLoyaltyStore((s) => s.redeemLoyaltyReward);
  const setUserLevel = useLoyaltyStore((s) => s.setUserLevel);
  const getEarnedBadges = useLoyaltyStore((s) => s.getEarnedBadges);

  const notifications = useNotificationStore((s) => s.notifications);
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const unreadNotificationsCount = useNotificationStore((s) => s.unreadNotificationsCount);
  const pushNotification = useNotificationStore((s) => s.pushNotification);
  const markNotificationRead = useNotificationStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useNotificationStore((s) => s.markAllNotificationsRead);
  const deleteNotification = useNotificationStore((s) => s.deleteNotification);
  const clearReadNotifications = useNotificationStore((s) => s.clearReadNotifications);
  const getNotificationMeta = useNotificationStore((s) => s.getNotificationMeta);
  const notificationToasts = useNotificationStore((s) => s.notificationToasts);
  const dismissNotificationToast = useNotificationStore((s) => s.dismissNotificationToast);
  const notificationSettings = useNotificationStore((s) => s.notificationSettings);
  const updateNotificationSettings = useNotificationStore((s) => s.updateNotificationSettings);
  const saveNotificationType = useNotificationStore((s) => s.saveNotificationType);
  const deleteNotificationType = useNotificationStore((s) => s.deleteNotificationType);
  const resetNotificationTypes = useNotificationStore((s) => s.resetNotificationTypes);
  const sendSystemNotification = useNotificationStore((s) => s.sendSystemNotification);
  const pushAuditLog = useNotificationStore((s) => s.pushAuditLog);
  const pushSmsLog = useNotificationStore((s) => s.pushSmsLog);

  const suppliers = useCrmStore((s) => s.suppliers);
  const setSuppliers = useCrmStore((s) => s.setSuppliers);
  const employees = useCrmStore((s) => s.employees);
  const setEmployees = useCrmStore((s) => s.setEmployees);
  const notes = useCrmStore((s) => s.notes);
  const setNotes = useCrmStore((s) => s.setNotes);

  const expenses = useFinanceStore((s) => s.expenses);
  const setExpenses = useFinanceStore((s) => s.setExpenses);
  const digitalMarketingData = useFinanceStore((s) => s.digitalMarketingData);
  const setDigitalMarketingData = useFinanceStore((s) => s.setDigitalMarketingData);

  const contentProjects = useContentStore((s) => s.contentProjects);
  const setContentProjects = useContentStore((s) => s.setContentProjects);
  const contentComments = useContentStore((s) => s.contentComments);
  const setContentComments = useContentStore((s) => s.setContentComments);
  const contentAssets = useContentStore((s) => s.contentAssets);
  const setContentAssets = useContentStore((s) => s.setContentAssets);
  const contentTemplates = useContentStore((s) => s.contentTemplates);
  const setContentTemplates = useContentStore((s) => s.setContentTemplates);
  const contentIdeas = useContentStore((s) => s.contentIdeas);
  const setContentIdeas = useContentStore((s) => s.setContentIdeas);
  const brandBook = useContentStore((s) => s.brandBook);
  const setBrandBook = useContentStore((s) => s.setBrandBook);

  const campaigns = useMarketingStore((s) => s.campaigns);
  const setCampaigns = useMarketingStore((s) => s.setCampaigns);
  const affiliates = useMarketingStore((s) => s.affiliates);
  const setAffiliates = useMarketingStore((s) => s.setAffiliates);
  const affiliateOrders = useMarketingStore((s) => s.affiliateOrders);
  const setAffiliateOrders = useMarketingStore((s) => s.setAffiliateOrders);
  const affiliateTransactions = useMarketingStore((s) => s.affiliateTransactions);
  const setAffiliateTransactions = useMarketingStore((s) => s.setAffiliateTransactions);
  const personas = useMarketingStore((s) => s.personas);
  const setPersonas = useMarketingStore((s) => s.setPersonas);
  const okrs = useMarketingStore((s) => s.okrs);
  const setOkrs = useMarketingStore((s) => s.setOkrs);
  const kpis = useMarketingStore((s) => s.kpis);
  const setKpis = useMarketingStore((s) => s.setKpis);

  const cartItems = useCartStore((s) => s.cartItems);
  const addToCart = useCartStore((s) => s.addToCart);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const updateCartQuantity = useCartStore((s) => s.updateCartQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    const ok = await rbacAdminLogin(email, password);
    if (!ok) return false;

    const rbac = useRbacStore.getState();
    const auth = useAuthStore.getState();
    const notif = useNotificationStore.getState();

    // Get the admin session info from rbacStore
    const currentAdminId = rbac.currentAdminId;
    const userPermissions = rbac.userPermissions;

    if (!currentAdminId) return false;

    // Find the staff user in local systemUsers (synced from staff_accounts)
    const su = rbac.systemUsers.find((x) => x.id === currentAdminId);
    if (!su) return false;

    const role = rbac.roles.find((r) => r.id === su.roleId);
    const perms = role?.permissions?.length
      ? rbac.permissions.filter((p) => role.permissions.includes(p.id)).map((p) => p.name)
      : [];

    const sessionUserId = `admin_${su.id}`;
    const sessionUser = {
      id: sessionUserId,
      username: su.username,
      password: su.password || '',
      email: su.email || `${su.username}@staff.local`,
      name: su.name || su.username,
      phone: su.phone || '',
      role: 'admin' as const,
      loyaltyPoints: 0,
      level: 'normal' as const,
      favorites: [],
      selectedMedia: [],
      createdAt: su.createdAt ? new Date(su.createdAt).toISOString() : new Date().toISOString(),
      currentAdminId: su.id,
      roleId: su.roleId,
      permissions: perms.length ? perms : userPermissions,
    } as User;

    const existingUsers = auth.users.filter((u) => u.id !== sessionUserId);
    useAuthStore.setState({
      currentUser: sessionUser,
      users: [...existingUsers, sessionUser],
    });

    notif.pushAuditLog?.('staff.login', `ورود به سیستم: ${su.username}`, 'auth');
    return true;
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    useRbacStore.getState().clearAdminSession();
    const authState = useAuthStore.getState();
    if (authState.logout) {
      try {
        await authState.logout();
      } catch {
          /* ignore */
      }
    }
    useAuthStore.setState({ currentUser: null });
    useCartStore.getState().clearCart();
  };
  
  const hydrationDoneRef = useRef(false);

  useEffect(() => {
    if (hydrationDoneRef.current) return;
    hydrationDoneRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const authPromise = useAuthStore.getState().hydrate?.();
        const rbacPromise = useRbacStore.getState().hydrate?.();
        const catalogPromise = useCatalogStore.getState().hydrate?.();
        const ticketPromise = useTicketStore.getState().hydrate?.();
        const loyaltyPromise = useLoyaltyStore.getState().hydrate?.();
        const notificationPromise = useNotificationStore.getState().hydrate?.();
        const crmPromise = useCrmStore.getState().hydrate?.();
        const financePromise = useFinanceStore.getState().hydrate?.();
        const contentPromise = useContentStore.getState().hydrate?.();
        const marketingPromise = useMarketingStore.getState().hydrate?.();
        const orderPromise = useOrderStore.getState().hydrate?.();
        await Promise.all([
          authPromise,
          rbacPromise,
          catalogPromise,
          ticketPromise,
          loyaltyPromise,
          notificationPromise,
          crmPromise,
          financePromise,
          contentPromise,
          marketingPromise,
          orderPromise,
        ]);
        if (cancelled) return;
        console.info('[AppProvider] hydration complete.');
      } catch (e: any) {
        console.warn('[AppProvider] hydration encountered errors (continuing with local data):', e?.message || e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isAuthenticated = !!currentUser || adminLoggedIn;

  useEffect(() => {
    useCatalogStore.getState().startRealtime();

    if (isAuthenticated) {
      useOrderStore.getState().startRealtime();
      useTicketStore.getState().startRealtime();
      useNotificationStore.getState().startRealtime();
      useContentStore.getState().startRealtime();
      useFinanceStore.getState().startRealtime();
    } else {
      useOrderStore.getState().stopRealtime();
      useTicketStore.getState().stopRealtime();
      useNotificationStore.getState().stopRealtime();
      useContentStore.getState().stopRealtime();
      useFinanceStore.getState().stopRealtime();
    }
    return () => {
      useCatalogStore.getState().stopRealtime();
      useOrderStore.getState().stopRealtime();
      useTicketStore.getState().stopRealtime();
      useNotificationStore.getState().stopRealtime();
      useContentStore.getState().stopRealtime();
      useFinanceStore.getState().stopRealtime();
    };
  }, [isAuthenticated]);

  return (
    <AppContext.Provider
      value={{
        darkMode,
        toggleDarkMode,
        currentUser,
        adminLoggedIn,
        login,
        loginWithSession,
        adminLogin,
        logout,
        users,
        setUsers,
        reviews,
        setReviews,
        faqs,
        setFaqs,
        smsLogs,
        setSmsLogs,
        auditLogs,
        setAuditLogs,
        addToFavorites,
        selectMedia,
        updateAvatar,
        updateCustomerProfile,
        chargeWallet,
        deductWallet,
        products,
        setProducts,
        mediaItems,
        setMediaItems,
        services,
        setServices,
        news,
        setNews,
        portfolio,
        setPortfolio,
        projects,
        setProjects,
        aboutContent,
        setAboutContent,
        orders,
        setOrders,
        invoices,
        setInvoices,
        updateOrder,
        updateOrderStatus,
        deleteOrder,
        createServiceOrder,
        createProjectOrder,
        createCatalogOrder,
        tickets,
        setTickets,
        createTicket,
        replyTicket,
        reopenTicket,
        rateTicket,
        adminReplyTicket,
        updateTicket,
        loyaltyTx,
        gamificationConfig,
        setGamificationConfig,
        resetLoyaltyData,
        awardLoyaltyPoints,
        deductLoyaltyPointsForAdmin,
        awardReviewPoints,
        redeemLoyaltyReward,
        setUserLevel,
        getEarnedBadges,
        notifications,
        setNotifications,
        unreadNotificationsCount,
        pushNotification,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        clearReadNotifications,
        getNotificationMeta,
        notificationToasts,
        dismissNotificationToast,
        notificationSettings,
        updateNotificationSettings,
        saveNotificationType,
        deleteNotificationType,
        resetNotificationTypes,
        sendSystemNotification,
        pushAuditLog,
        pushSmsLog,
        suppliers,
        setSuppliers,
        employees,
        setEmployees,
        notes,
        setNotes,
        expenses,
        setExpenses,
        digitalMarketingData,
        setDigitalMarketingData,
        contentProjects,
        setContentProjects,
        contentComments,
        setContentComments,
        contentAssets,
        setContentAssets,
        contentTemplates,
        setContentTemplates,
        contentIdeas,
        setContentIdeas,
        brandBook,
        setBrandBook,
        campaigns,
        setCampaigns,
        affiliates,
        setAffiliates,
        affiliateOrders,
        setAffiliateOrders,
        affiliateTransactions,
        setAffiliateTransactions,
        personas,
        setPersonas,
        okrs,
        setOkrs,
        kpis,
        setKpis,
        cartItems,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        permissions,
        setPermissions,
        roles,
        setRoles,
        systemUsers,
        setSystemUsers,
        currentAdminId,
        userPermissions,
        hasPermission,
        canAccessPage,
        establishAdminSession,
        clearAdminSession,
        createStaffUser: rbacCreateStaffUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
