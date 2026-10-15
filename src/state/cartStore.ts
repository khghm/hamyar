import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  quantity: number;
}

/**
 * فاز ۲.۴ — سبد خرید در Zustand.
 *
 * سبد قبلاً داخل Context بود؛ هر «افزودن به سبد» کل Context را تغییر می‌داد و
 * همهٔ مصرف‌کننده‌های `useApp()` را دوباره رندر می‌کرد، در حالی که فقط سه صفحه
 * (سبد، هدر عمومی، جزئیات محصول) به آن نیاز دارند.
 *
 * سبد عمداً جدا از کاربر نگه داشته می‌شود: با ورود/خروج حساب نباید پاک شود، و
 * همان رفتار قبلی حفظ شده است (`hamyar_cart`).
 */
interface CartState {
  items: CartItem[];
  cartItems: CartItem[];
  add: (productId: string, quantity?: number) => void;
  addToCart: (productId: string, quantity?: number) => void;
  remove: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  clearCart: () => void;
}

const MAX_QTY = 99;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => {
      const commitItems = (items: CartItem[]) => set({ items, cartItems: items });

      return {
      items: [],
      cartItems: [],

      add: (productId, quantity = 1) => {
        const delta = Math.max(1, Math.floor(quantity) || 1);
        const state = get();
        const existing = state.items.find(item => item.productId === productId);
        if (existing) {
          commitItems(state.items.map(item =>
            item.productId === productId
              ? { ...item, quantity: Math.min(MAX_QTY, item.quantity + delta) }
              : item,
          ));
        } else {
          commitItems([...state.items, { productId, quantity: Math.min(MAX_QTY, delta) }]);
        }
      },
      addToCart: (productId, quantity) => get().add(productId, quantity),

      remove: (productId) => {
        commitItems(get().items.filter(item => item.productId !== productId));
      },
      removeFromCart: (productId) => get().remove(productId),

      setQuantity: (productId, quantity) => {
        const state = get();
        if (!quantity || quantity < 1) {
          commitItems(state.items.filter(item => item.productId !== productId));
          return;
        }
        commitItems(state.items.map(item =>
          item.productId === productId
            ? { ...item, quantity: Math.min(MAX_QTY, Math.floor(quantity)) }
            : item,
        ));
      },
      updateCartQuantity: (productId, quantity) => get().setQuantity(productId, quantity),

      clear: () => commitItems([]),
      clearCart: () => get().clear(),
    };
    },
    {
      name: 'hamyar_cart',
      partialize: state => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (state) state.cartItems = state.items;
      },
    },
  ),
);