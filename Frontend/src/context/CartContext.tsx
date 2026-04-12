/**
 * CartContext — manages cart state with single-canteen enforcement.
 *
 * Cart items are keyed by dish ID + canteen ID.
 * Adding an item from a different canteen clears the existing cart (with warning).
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import type { CartItem } from "../types";
import { toast } from "sonner";

interface CartContextType {
  items: CartItem[];
  canteenId: number | null;
  canteenName: string | null;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (dishId: number) => void;
  updateQuantity: (dishId: number, quantity: number) => void;
  clearCart: () => void;
  setCartItems: (items: CartItem[]) => void;
  getTotal: () => number;
  getItemCount: () => number;
  // Legacy compat for old pages during migration
  cart: CartItem[];
  addToCart: (item: any) => void;
  removeFromCart: (itemId: string) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isTrackOrderOpen: boolean;
  setIsTrackOrderOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("skipq-cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("skipq-cart", JSON.stringify(items));
  }, [items]);

  const canteenId = items.length > 0 ? items[0].canteenId : null;
  const canteenName = items.length > 0 ? items[0].canteenName : null;

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      // Enforce single-canteen cart
      if (prev.length > 0 && prev[0].canteenId !== item.canteenId) {
        toast.warning(
          `Cart cleared! You can only order from one canteen at a time.`,
          { duration: 3000 },
        );
        return [{ ...item, quantity: 1 }];
      }

      const existing = prev.find((i) => i.dishId === item.dishId);
      if (existing) {
        return prev.map((i) =>
          i.dishId === item.dishId ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (dishId: number) => {
    setItems((prev) => prev.filter((item) => item.dishId !== dishId));
  };

  const updateQuantity = (dishId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(dishId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.dishId === dishId ? { ...item, quantity } : item,
      ),
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Legacy compat wrappers for old page components during migration
  const addToCart = (item: any) => {
    addItem({
      dishId: typeof item.id === "number" ? item.id : parseInt(item.id, 10),
      name: item.name,
      price: typeof item.price === "number" ? item.price : parseFloat(item.price),
      photoUrl: item.photoUrl || item.photo_url || null,
      category: item.category || "",
      isVeg: item.isVeg ?? item.is_veg ?? true,
      canteenId: item.canteenId || 0,
      canteenName: item.canteenName || "",
    });
  };

  const removeFromCart = (itemId: string) => {
    removeItem(parseInt(itemId, 10) || 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        canteenId,
        canteenName,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setCartItems: setItems,
        getTotal,
        getItemCount,
        // Legacy compat
        cart: items,
        addToCart,
        removeFromCart,
        getTotalItems: getItemCount,
        getTotalPrice: getTotal,
        isCartOpen,
        setIsCartOpen,
        isTrackOrderOpen,
        setIsTrackOrderOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}