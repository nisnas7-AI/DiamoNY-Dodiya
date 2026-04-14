// @stable — do not modify without architectural review
import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from "react";

export interface CartItem {
  lineItemId: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  slug: string;
}

interface CartContextType {
  items: CartItem[];
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addToCart: (item: Omit<CartItem, "quantity" | "lineItemId">, quantity?: number) => void;
  removeFromCart: (lineItemId: string) => void;
  updateQuantity: (lineItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const STORAGE_KEY = "diamony_cart";

/** Generate a stable composite key from product + variant selections */
const buildLineItemId = (productId: string, size?: string, color?: string) =>
  [productId, size ?? "", color ?? ""].join("||");

const loadCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    // Migrate legacy items that lack lineItemId
    return parsed.map((item) => ({
      ...item,
      lineItemId: item.lineItemId || buildLineItemId(item.productId, item.selectedSize, item.selectedColor),
    }));
  } catch {
    return [];
  }
};

const saveCart = (items: CartItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* quota exceeded – silently ignore */ }
};

const CartContext = createContext<CartContextType>({
  items: [],
  isDrawerOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  subtotal: 0,
});

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Persist to localStorage on every change
  useEffect(() => {
    saveCart(items);
  }, [items]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const addToCart = useCallback((item: Omit<CartItem, "quantity" | "lineItemId">, quantity = 1) => {
    const id = buildLineItemId(item.productId, item.selectedSize, item.selectedColor);
    setItems((prev) => {
      const existing = prev.find((i) => i.lineItemId === id);
      if (existing) {
        return prev.map((i) => i.lineItemId === id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { ...item, lineItemId: id, quantity }];
    });
    setIsDrawerOpen(true);
  }, []);

  const removeFromCart = useCallback((lineItemId: string) => {
    setItems((prev) => prev.filter((i) => i.lineItemId !== lineItemId));
  }, []);

  const updateQuantity = useCallback((lineItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.lineItemId !== lineItemId));
      return;
    }
    setItems((prev) => prev.map((i) => (i.lineItemId === lineItemId ? { ...i, quantity } : i)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  // C-2 fix: memoize derived values so drawer open/close doesn't recompute
  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, isDrawerOpen, openDrawer, closeDrawer, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
};
