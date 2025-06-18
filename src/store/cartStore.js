import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0,

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(item => item.id === product.id);
          const items = existingItem
            ? state.items.map(item =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              )
            : [...state.items, { ...product, quantity }];

          const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          const tax = subtotal * 0.1; // 10% tax
          const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
          const total = subtotal + tax + shipping;

          return { items, subtotal, tax, shipping, total };
        });
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return get().removeItem(productId);
          }

          const items = state.items.map(item =>
            item.id === productId ? { ...item, quantity } : item
          );

          const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          const tax = subtotal * 0.1;
          const shipping = subtotal > 100 ? 0 : 10;
          const total = subtotal + tax + shipping;

          return { items, subtotal, tax, shipping, total };
        });
      },

      removeItem: (productId) => {
        set((state) => {
          const items = state.items.filter(item => item.id !== productId);
          const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          const tax = subtotal * 0.1;
          const shipping = subtotal > 100 ? 0 : 10;
          const total = subtotal + tax + shipping;

          return { items, subtotal, tax, shipping, total };
        });
      },

      clearCart: () => {
        set({ items: [], subtotal: 0, tax: 0, shipping: 0, total: 0 });
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);

export default useCartStore;