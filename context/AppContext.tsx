import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Product } from "@/data/products";

export type UserRole = "buyer" | "seller";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isSeller: boolean;
}

export interface CartItem {
  id: string;
  product: Product;
  size: number;
  quantity: number;
}

export interface Order {
  id: string;
  invoiceId: string;
  items: CartItem[];
  total: number;
  shippingFee: number;
  discount: number;
  paymentMethod: string;
  address: string;
  status: "processing" | "shipped" | "delivered";
  createdAt: string;
}

export interface FootScanResult {
  footLength: number;
  footWidth: number;
  widthRatio: number;
  footType: "narrow" | "normal" | "wide";
  imageUri?: string;
}

interface AppContextType {
  isOnboarded: boolean;
  user: User | null;
  cartItems: CartItem[];
  orders: Order[];
  footScanResult: FootScanResult | null;
  completeOnboarding: () => void;
  login: (name: string, email: string, role: UserRole) => void;
  logout: () => void;
  upgradeToSeller: () => Promise<void>;
  addToCart: (product: Product, size: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  reorderItems: (items: CartItem[]) => void;
  placeOrder: (address: string, paymentMethod: string, discount?: number) => Order | null;
  saveFootScanResult: (result: FootScanResult) => void;
  cartTotal: number;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  ONBOARDED: "fw_onboarded",
  USER: "fw_user",
  CART: "fw_cart",
  ORDERS: "fw_orders",
  FOOT_SCAN: "fw_foot_scan",
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [footScanResult, setFootScanResult] = useState<FootScanResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [onboarded, userData, cartData, ordersData, footData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.ONBOARDED),
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.CART),
          AsyncStorage.getItem(STORAGE_KEYS.ORDERS),
          AsyncStorage.getItem(STORAGE_KEYS.FOOT_SCAN),
        ]);
        if (onboarded) setIsOnboarded(true);
        if (userData) setUser(JSON.parse(userData));
        if (cartData) setCartItems(JSON.parse(cartData));
        if (ordersData) setOrders(JSON.parse(ordersData));
        if (footData) setFootScanResult(JSON.parse(footData));
      } catch {}
      setLoaded(true);
    };
    load();
  }, []);

  const completeOnboarding = useCallback(async () => {
    setIsOnboarded(true);
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDED, "true");
  }, []);

  const login = useCallback(async (name: string, email: string, role: UserRole) => {
    const newUser: User = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name,
      email,
      role,
      isSeller: role === "seller",
    };
    setUser(newUser);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setCartItems([]);
    await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.CART]);
  }, []);

  const upgradeToSeller = useCallback(async () => {
    if (!user) return;
    const updatedUser: User = { ...user, role: "seller", isSeller: true };
    setUser(updatedUser);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
  }, [user]);

  const addToCart = useCallback(async (product: Product, size: number) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id && i.size === size);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map((i) =>
          i.product.id === product.id && i.size === size
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      } else {
        const newItem: CartItem = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          product,
          size,
          quantity: 1,
        };
        updated = [...prev, newItem];
      }
      AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromCart = useCallback(async (id: string) => {
    setCartItems((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearCart = useCallback(async () => {
    setCartItems([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.CART);
  }, []);

  const reorderItems = useCallback((items: CartItem[]) => {
    setCartItems((prev) => {
      const updated = [...prev];
      for (const item of items) {
        const existing = updated.find(
          (i) => i.product.id === item.product.id && i.size === item.size
        );
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          updated.push({
            ...item,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          });
        }
      }
      AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const placeOrder = useCallback((address: string, paymentMethod: string, discount = 0): Order | null => {
    if (cartItems.length === 0) return null;
    const total = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const shippingFee = 5;
    const finalTotal = total + shippingFee - discount;
    const newOrder: Order = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      invoiceId: `FW-2026-${String(Math.floor(Math.random() * 90000) + 10000)}`,
      items: [...cartItems],
      total: finalTotal,
      shippingFee,
      discount,
      paymentMethod,
      address,
      status: "processing",
      createdAt: new Date().toISOString(),
    };
    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      return updated;
    });
    setCartItems([]);
    AsyncStorage.removeItem(STORAGE_KEYS.CART);
    return newOrder;
  }, [cartItems]);

  const saveFootScanResult = useCallback(async (result: FootScanResult) => {
    setFootScanResult(result);
    await AsyncStorage.setItem(STORAGE_KEYS.FOOT_SCAN, JSON.stringify(result));
  }, []);

  const cartTotal = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  if (!loaded) return null;

  return (
    <AppContext.Provider
      value={{
        isOnboarded,
        user,
        cartItems,
        orders,
        footScanResult,
        completeOnboarding,
        login,
        logout,
        upgradeToSeller,
        addToCart,
        removeFromCart,
        clearCart,
        reorderItems,
        placeOrder,
        saveFootScanResult,
        cartTotal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
