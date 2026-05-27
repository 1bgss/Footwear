import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Product, SellerStore, SellerProduct } from "@/data/products";

export type UserRole = "buyer" | "seller";
export type OrderStatus = "processing" | "shipped" | "out_for_delivery" | "delivered";

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
  status: OrderStatus;
  createdAt: string;
}

export interface FootScanResult {
  footLength: number;
  footWidth: number;
  widthRatio: number;
  footType: "narrow" | "normal" | "wide";
  imageUri?: string;
}

export interface EcoStats {
  ecoPurchases: number;
  co2Saved: number;
  ecoScans: number;
  ecoCollectionVisits: number;
}

interface AppContextType {
  isOnboarded: boolean;
  user: User | null;
  cartItems: CartItem[];
  orders: Order[];
  footScanResult: FootScanResult | null;
  greenPoints: number;
  ecoBadges: string[];
  ecoLevel: string;
  ecoStats: EcoStats;
  sellerStores: SellerStore[];
  sellerProducts: SellerProduct[];
  completeOnboarding: () => void;
  login: (name: string, email: string, role: UserRole) => void;
  logout: () => void;
  upgradeToSeller: () => Promise<void>;
  addToCart: (product: Product, size: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  reorderItems: (items: CartItem[]) => void;
  placeOrder: (address: string, paymentMethod: string, discount?: number) => Order | null;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  saveFootScanResult: (result: FootScanResult) => void;
  addGreenPoints: (points: number) => void;
  unlockEcoBadge: (badge: string) => void;
  calculateEcoLevel: () => string;
  recordEcoCollectionOpen: () => void;
  rewardEcoPurchase: (order: Order) => number;
  rewardInvoiceShare: () => void;
  rewardFootScan: () => void;
  rewardEcoReorder: (items: CartItem[]) => void;
  createSellerStore: (storeData: Omit<SellerStore, "id" | "createdAt" | "totalProducts" | "totalSales" | "rating">) => Promise<SellerStore>;
  uploadSellerProduct: (productData: Omit<SellerProduct, "id" | "isSellerProduct">) => Promise<SellerProduct>;
  getSellerStoreByUserId: (userId: string) => SellerStore | null;
  cartTotal: number;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  ONBOARDED: "fw_onboarded",
  USER: "fw_user",
  CART: "fw_cart",
  ORDERS: "fw_orders",
  FOOT_SCAN: "fw_foot_scan",
  GREEN_POINTS: "fw_green_points",
  ECO_BADGES: "fw_eco_badges",
  ECO_STATS: "fw_eco_stats",
  ECO_REWARDED_ORDERS: "fw_eco_rewarded_orders",
  SELLER_STORES: "fw_seller_stores",
  SELLER_PRODUCTS: "fw_seller_products",
};

const INITIAL_ECO_STATS: EcoStats = {
  ecoPurchases: 0,
  co2Saved: 0,
  ecoScans: 0,
  ecoCollectionVisits: 0,
};

function getEcoLevel(points: number): string {
  if (points >= 1000) return "Eco Champion";
  if (points >= 500) return "Sustainable Supporter";
  if (points >= 250) return "Green Shopper";
  if (points >= 100) return "Eco Explorer";
  return "Eco Beginner";
}

function isOrderStatus(status: unknown): status is OrderStatus {
  return (
    status === "processing" ||
    status === "shipped" ||
    status === "out_for_delivery" ||
    status === "delivered"
  );
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [footScanResult, setFootScanResult] = useState<FootScanResult | null>(null);
  const [greenPoints, setGreenPoints] = useState(0);
  const [ecoBadges, setEcoBadges] = useState<string[]>([]);
  const [ecoLevel, setEcoLevel] = useState(getEcoLevel(0));
  const [ecoStats, setEcoStats] = useState<EcoStats>(INITIAL_ECO_STATS);
  const [rewardedEcoOrders, setRewardedEcoOrders] = useState<string[]>([]);
  const [sellerStores, setSellerStores] = useState<SellerStore[]>([]);
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  const persistOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders((prev) => {
      const updated = prev.map((order) =>
        order.id === orderId ? { ...order, status } : order
      );
      AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [
          onboarded,
          userData,
          cartData,
          ordersData,
          footData,
          storedGreenPoints,
          storedEcoBadges,
          storedEcoStats,
          storedRewardedEcoOrders,
          storedSellerStores,
          storedSellerProducts,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.ONBOARDED),
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.CART),
          AsyncStorage.getItem(STORAGE_KEYS.ORDERS),
          AsyncStorage.getItem(STORAGE_KEYS.FOOT_SCAN),
          AsyncStorage.getItem(STORAGE_KEYS.GREEN_POINTS),
          AsyncStorage.getItem(STORAGE_KEYS.ECO_BADGES),
          AsyncStorage.getItem(STORAGE_KEYS.ECO_STATS),
          AsyncStorage.getItem(STORAGE_KEYS.ECO_REWARDED_ORDERS),
          AsyncStorage.getItem(STORAGE_KEYS.SELLER_STORES),
          AsyncStorage.getItem(STORAGE_KEYS.SELLER_PRODUCTS),
        ]);
        if (onboarded) setIsOnboarded(true);
        if (userData) setUser(JSON.parse(userData));
        if (cartData) setCartItems(JSON.parse(cartData));
        if (ordersData) setOrders(JSON.parse(ordersData));
        if (footData) setFootScanResult(JSON.parse(footData));
        if (storedGreenPoints) {
          const parsedPoints = Number(storedGreenPoints);
          setGreenPoints(parsedPoints);
          setEcoLevel(getEcoLevel(parsedPoints));
        }
        if (storedEcoBadges) setEcoBadges(JSON.parse(storedEcoBadges));
        if (storedEcoStats) {
          setEcoStats({ ...INITIAL_ECO_STATS, ...JSON.parse(storedEcoStats) });
        }
        if (storedRewardedEcoOrders) setRewardedEcoOrders(JSON.parse(storedRewardedEcoOrders));
        if (storedSellerStores) setSellerStores(JSON.parse(storedSellerStores));
        if (storedSellerProducts) setSellerProducts(JSON.parse(storedSellerProducts));
      } catch {}
      setLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    const syncNotificationStatus = (data: Record<string, unknown>) => {
      const orderId = typeof data.orderId === "string" ? data.orderId : null;
      const status = data.status;
      if (orderId && isOrderStatus(status)) {
        persistOrderStatus(orderId, status);
      }
    };

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      syncNotificationStatus(notification.request.content.data);
    });
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      syncNotificationStatus(response.notification.request.content.data);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [persistOrderStatus]);

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

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    persistOrderStatus(orderId, status);
  }, [persistOrderStatus]);

  const addGreenPoints = useCallback((points: number) => {
    if (points <= 0) return;
    setGreenPoints((prev) => {
      const updated = prev + points;
      const updatedLevel = getEcoLevel(updated);
      setEcoLevel(updatedLevel);
      AsyncStorage.setItem(STORAGE_KEYS.GREEN_POINTS, String(updated));
      return updated;
    });
  }, []);

  const unlockEcoBadge = useCallback((badge: string) => {
    setEcoBadges((prev) => {
      if (prev.includes(badge)) return prev;
      const updated = [...prev, badge];
      AsyncStorage.setItem(STORAGE_KEYS.ECO_BADGES, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const calculateEcoLevel = useCallback(() => getEcoLevel(greenPoints), [greenPoints]);

  const updateEcoStats = useCallback((updater: (stats: EcoStats) => EcoStats) => {
    setEcoStats((prev) => {
      const updated = updater(prev);
      AsyncStorage.setItem(STORAGE_KEYS.ECO_STATS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const recordEcoCollectionOpen = useCallback(() => {
    addGreenPoints(10);
    updateEcoStats((prev) => {
      const updatedVisits = prev.ecoCollectionVisits + 1;
      if (updatedVisits >= 10) unlockEcoBadge("Conscious Walker");
      return { ...prev, ecoCollectionVisits: updatedVisits };
    });
  }, [addGreenPoints, unlockEcoBadge, updateEcoStats]);

  const rewardEcoPurchase = useCallback((order: Order) => {
    if (rewardedEcoOrders.includes(order.id)) return 0;

    const ecoQuantity = order.items.reduce(
      (sum, item) => sum + (item.product.eco_friendly ? item.quantity : 0),
      0
    );
    if (ecoQuantity === 0) return 0;

    const points = ecoQuantity * 50;
    const co2Saved = ecoQuantity * 12;
    addGreenPoints(points);
    updateEcoStats((prev) => {
      const updated = {
        ...prev,
        ecoPurchases: prev.ecoPurchases + ecoQuantity,
        co2Saved: prev.co2Saved + co2Saved,
      };
      if (updated.ecoPurchases >= 1) unlockEcoBadge("Eco Explorer");
      if (updated.ecoPurchases >= 3) unlockEcoBadge("Green Shopper");
      if (updated.ecoPurchases >= 5) unlockEcoBadge("Sustainable Supporter");
      if (updated.co2Saved >= 100) unlockEcoBadge("Carbon Saver");
      return updated;
    });
    setRewardedEcoOrders((prev) => {
      const updated = [...prev, order.id];
      AsyncStorage.setItem(STORAGE_KEYS.ECO_REWARDED_ORDERS, JSON.stringify(updated));
      return updated;
    });
    return points;
  }, [addGreenPoints, rewardedEcoOrders, unlockEcoBadge, updateEcoStats]);

  const rewardInvoiceShare = useCallback(() => {
    addGreenPoints(20);
    unlockEcoBadge("Eco Trendsetter");
  }, [addGreenPoints, unlockEcoBadge]);

  const rewardFootScan = useCallback(() => {
    addGreenPoints(15);
    updateEcoStats((prev) => ({ ...prev, ecoScans: prev.ecoScans + 1 }));
  }, [addGreenPoints, updateEcoStats]);

  const rewardEcoReorder = useCallback((items: CartItem[]) => {
    const hasEcoItem = items.some((item) => item.product.eco_friendly);
    if (!hasEcoItem) return;
    addGreenPoints(30);
  }, [addGreenPoints]);

  const saveFootScanResult = useCallback(async (result: FootScanResult) => {
    setFootScanResult(result);
    await AsyncStorage.setItem(STORAGE_KEYS.FOOT_SCAN, JSON.stringify(result));
  }, []);

  const createSellerStore = useCallback(async (storeData: Omit<SellerStore, "id" | "createdAt" | "totalProducts" | "totalSales" | "rating">): Promise<SellerStore> => {
    const newStore: SellerStore = {
      ...storeData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      totalProducts: 0,
      totalSales: 0,
      rating: 4.5,
    };
    setSellerStores((prev) => {
      const updated = [...prev, newStore];
      AsyncStorage.setItem(STORAGE_KEYS.SELLER_STORES, JSON.stringify(updated));
      return updated;
    });
    return newStore;
  }, []);

  const uploadSellerProduct = useCallback(async (productData: Omit<SellerProduct, "id" | "isSellerProduct">): Promise<SellerProduct> => {
    const newProduct: SellerProduct = {
      ...productData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      isSellerProduct: true,
    };
    setSellerProducts((prev) => {
      const updated = [...prev, newProduct];
      AsyncStorage.setItem(STORAGE_KEYS.SELLER_PRODUCTS, JSON.stringify(updated));
      
      // Update store's total product count
      setSellerStores((stores) => {
        const updatedStores = stores.map((store) =>
          store.id === newProduct.storeId
            ? { ...store, totalProducts: store.totalProducts + 1 }
            : store
        );
        AsyncStorage.setItem(STORAGE_KEYS.SELLER_STORES, JSON.stringify(updatedStores));
        return updatedStores;
      });
      
      return updated;
    });
    return newProduct;
  }, []);

  const getSellerStoreByUserId = useCallback((userId: string): SellerStore | null => {
    return sellerStores.find((store) => store.ownerUserId === userId) || null;
  }, [sellerStores]);

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
        greenPoints,
        ecoBadges,
        ecoLevel,
        ecoStats,
        sellerStores,
        sellerProducts,
        completeOnboarding,
        login,
        logout,
        upgradeToSeller,
        addToCart,
        removeFromCart,
        clearCart,
        reorderItems,
        placeOrder,
        updateOrderStatus,
        saveFootScanResult,
        addGreenPoints,
        unlockEcoBadge,
        calculateEcoLevel,
        recordEcoCollectionOpen,
        rewardEcoPurchase,
        rewardInvoiceShare,
        rewardFootScan,
        rewardEcoReorder,
        createSellerStore,
        uploadSellerProduct,
        getSellerStoreByUserId,
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
