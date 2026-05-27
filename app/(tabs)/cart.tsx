import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { SELLER_ANALYTICS } from "@/data/analytics";

function CartView() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cartItems, removeFromCart, cartTotal } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const shippingFee = 5;
  const total = cartTotal + shippingFee;

  if (cartItems.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Cart</Text>
        </View>
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
            <Ionicons name="bag-outline" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your cart is empty</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            Discover shoes and add them to your cart
          </Text>
          <Pressable onPress={() => router.push("/(tabs)/explore")} style={{ marginTop: 16 }}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.exploreBtn}
            >
              <Text style={styles.exploreBtnText}>Explore Shoes</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Cart</Text>
        <Text style={[styles.cartCount, { color: colors.mutedForeground }]}>
          {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
        </Text>
      </View>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        scrollEnabled={!!cartItems.length}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomPad + 220 }}
        renderItem={({ item }) => (
          <View style={[styles.cartItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image source={item.product.image} style={styles.cartImage} />
            <View style={styles.cartInfo}>
              <Text style={[styles.cartBrand, { color: colors.mutedForeground }]}>{item.product.brand}</Text>
              <Text style={[styles.cartName, { color: colors.foreground }]}>{item.product.name}</Text>
              <Text style={[styles.cartSize, { color: colors.mutedForeground }]}>Size: EU {item.size}</Text>
              <Text style={[styles.cartPrice, { color: colors.primary }]}>
                ${item.product.price * item.quantity}
              </Text>
            </View>
            <View style={styles.cartActions}>
              <Pressable onPress={() => removeFromCart(item.id)}>
                <Ionicons name="trash-outline" size={20} color={colors.destructive} />
              </Pressable>
              <View style={[styles.qtyBadge, { backgroundColor: colors.muted }]}>
                <Text style={[styles.qtyText, { color: colors.foreground }]}>×{item.quantity}</Text>
              </View>
            </View>
          </View>
        )}
      />

      <View
        style={[
          styles.checkout,
          { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: bottomPad + 80 },
        ]}
      >
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Subtotal</Text>
          <Text style={[styles.summaryValue, { color: colors.foreground }]}>${cartTotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Shipping</Text>
          <Text style={[styles.summaryValue, { color: colors.foreground }]}>${shippingFee}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryRow}>
          <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>${total.toFixed(2)}</Text>
        </View>
        <Pressable onPress={() => router.push("/checkout")} style={{ marginTop: 12 }}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.checkoutBtn}
          >
            <Ionicons name="card-outline" size={18} color="#000" />
            <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

function OrdersView() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const orders = SELLER_ANALYTICS.recentOrders;

  const statusColors: Record<string, string> = {
    delivered: "#00C878",
    shipped: "#00B4FF",
    processing: "#FFB800",
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Orders</Text>
        <Text style={[styles.cartCount, { color: colors.mutedForeground }]}>{orders.length} orders</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomPad + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {orders.map((order, i) => (
          <View
            key={i}
            style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.orderTop}>
              <Text style={[styles.orderId, { color: colors.primary }]}>{order.id}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColors[order.status] + "20" },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: statusColors[order.status] },
                  ]}
                />
                <Text style={[styles.statusText, { color: statusColors[order.status] }]}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Text>
              </View>
            </View>
            <Text style={[styles.orderProduct, { color: colors.foreground }]}>{order.product}</Text>
            <Text style={[styles.orderCustomer, { color: colors.mutedForeground }]}>
              {order.customer}
            </Text>
            <View style={styles.orderBottom}>
              <Text style={[styles.orderDate, { color: colors.mutedForeground }]}>{order.date}</Text>
              <Text style={[styles.orderTotal, { color: colors.primary }]}>${order.total}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export default function CartOrOrdersScreen() {
  const { user } = useApp();
  if (user?.role === "seller") return <OrdersView />;
  return <CartView />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  cartCount: { fontSize: 14, fontFamily: "Inter_400Regular" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  exploreBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  exploreBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#000" },
  cartItem: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 12,
    alignItems: "center",
  },
  cartImage: { width: 70, height: 70, borderRadius: 10, resizeMode: "cover" },
  cartInfo: { flex: 1, gap: 3 },
  cartBrand: { fontSize: 11, fontFamily: "Inter_400Regular" },
  cartName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  cartSize: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cartPrice: { fontSize: 16, fontFamily: "Inter_700Bold", marginTop: 2 },
  cartActions: { alignItems: "center", gap: 10 },
  qtyBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  qtyText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  checkout: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 10,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  summaryValue: { fontSize: 14, fontFamily: "Inter_500Medium" },
  divider: { height: 1 },
  totalLabel: { fontSize: 16, fontFamily: "Inter_700Bold" },
  totalValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  checkoutBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#000" },
  orderCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 6,
  },
  orderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  orderProduct: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  orderCustomer: { fontSize: 13, fontFamily: "Inter_400Regular" },
  orderBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  orderDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  orderTotal: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
