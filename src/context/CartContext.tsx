/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { CartItem, Product } from '../types';
import { useAuth } from './AuthContext';
import { getProductsByIds } from '../data/products';
import { fetchUserCartRows, replaceUserCartRows } from '../lib/cart';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | null>(null);
const GUEST_CART_KEY = 'lankacart_cart_guest';

const readCartFromStorage = (key: string): CartItem[] => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as CartItem[]) : [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isBootstrapping } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => readCartFromStorage(GUEST_CART_KEY));
  const [hydrated, setHydrated] = useState(false);
  const storageKey = user ? `lankacart_cart_${user.id}` : GUEST_CART_KEY;

  useEffect(() => {
    let cancelled = false;

    const hydrateCart = async () => {
      setHydrated(false);
      const localItems = readCartFromStorage(storageKey);
      if (!cancelled) setItems(localItems);

      if (!user) {
        if (!cancelled) setHydrated(true);
        return;
      }

      const rows = await fetchUserCartRows(user.id);
      if (rows.length === 0) {
        if (!cancelled) setHydrated(true);
        return;
      }

      const products = await getProductsByIds(rows.map((row) => row.product_external_id));
      if (cancelled) return;
      const productMap = new Map(products.map((p) => [p.id, p]));
      const restored: CartItem[] = rows
        .map((row) => {
          const product = productMap.get(String(row.product_external_id));
          if (!product) return null;
          return { product, quantity: Math.max(1, Math.floor(row.quantity)) };
        })
        .filter((item): item is CartItem => item !== null);

      setItems(restored);
      localStorage.setItem(storageKey, JSON.stringify(restored));
      setHydrated(true);
    };

    if (!isBootstrapping) {
      void hydrateCart();
    }

    return () => {
      cancelled = true;
    };
  }, [user, isBootstrapping, storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, hydrated, storageKey]);

  useEffect(() => {
    if (!user || !hydrated) return;
    void replaceUserCartRows(
      user.id,
      items.map((item) => ({
        product_external_id: item.product.id,
        quantity: item.quantity,
      }))
    );
  }, [items, user, hydrated]);

  const addToCart = (product: Product, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [...prev, { product, quantity: qty }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prev =>
      prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i)
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
