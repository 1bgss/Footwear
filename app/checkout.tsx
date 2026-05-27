import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import {
  scheduleOrderStatusNotifications,
  showOrderPlacedNotification,
} from "@/utils/notifications";

type PayMethod = "ewallet" | "credit" | "transfer";

export default function CheckoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cartItems, cartTotal, placeOrder, updateOrderStatus } = useApp();
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [payMethod, setPayMethod] = useState<PayMethod>("ewallet");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const shippingFee = 5;
  const total = cartTotal + shippingFee - discount;

  const applyPromo = () => {
    if (promoCode.toUpperCase() === "FOOTWEAR10") {
      setDiscount(10);
      setPromoApplied(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleCheckout = async () => {
    if (!address || !city) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((r) => setTimeout(r, 1200));
    const fullAddress = `${address}, ${city}${postal ? ` ${postal}` : ""}`;
    const order = placeOrder(fullAddress, payMethod, discount);
    setLoading(false);
    if (order) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await showOrderPlacedNotification(order.invoiceId);
      await scheduleOrderStatusNotifications(order.id, order.invoiceId, (status) => {
        updateOrderStatus(order.id, status);
      });
      router.replace(`/order-success?orderId=${order.id}`);
    }
  };

  const paymentOptions: { id: PayMethod; label: string; icon: any; desc: string }[] = [
    { id: "ewallet", label: "E-Wallet", icon: "phone-portrait-outline", desc: "GoPay, OVO, Dana" },
    { id: "credit", label: "Credit Card", icon: "card-outline", desc: "Visa, Mastercard" },
    { id: "transfer", label: "Bank Transfer", icon: "business-outline", desc: "All major banks" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(0,180,255,0.06)", "transparent"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: bottomPad + 140 }}
      >
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Order Summary</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {cartItems.map((item) => (
              <View key={item.id} style={[styles.itemRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                  {item.product.name}
                </Text>
                <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>
                  EU {item.size} ×{item.quantity}
                </Text>
                <Text style={[styles.itemPrice, { color: colors.foreground }]}>
                  ${item.product.price * item.quantity}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Shipping Address</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 12 }]}>
            <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Ionicons name="location-outline" size={16} color={colors.mutedForeground} />
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Street address"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground }]}
              />
            </View>
            <View style={styles.row}>
              <View style={[styles.inputWrap, { flex: 1, backgroundColor: colors.muted, borderColor: colors.border }]}>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.foreground }]}
                />
              </View>
              <View style={[styles.inputWrap, { width: 100, backgroundColor: colors.muted, borderColor: colors.border }]}>
                <TextInput
                  value={postal}
                  onChangeText={setPostal}
                  placeholder="ZIP"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  style={[styles.input, { color: colors.foreground }]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Payment Method</Text>
          <View style={styles.paymentOptions}>
            {paymentOptions.map((opt) => (
              <Pressable
                key={opt.id}
                onPress={() => setPayMethod(opt.id)}
                style={[
                  styles.payCard,
                  {
                    backgroundColor: payMethod === opt.id ? colors.primary + "15" : colors.card,
                    borderColor: payMethod === opt.id ? colors.primary : colors.border,
                  },
                ]}
              >
                {payMethod === opt.id && (
                  <LinearGradient
                    colors={[colors.primary + "15", "transparent"]}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Ionicons
                  name={opt.icon}
                  size={22}
                  color={payMethod === opt.id ? colors.primary : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.payLabel,
                    { color: payMethod === opt.id ? colors.primary : colors.foreground },
                  ]}
                >
                  {opt.label}
                </Text>
                <Text style={[styles.payDesc, { color: colors.mutedForeground }]}>{opt.desc}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Promo Code */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Promo Code</Text>
          <View style={styles.promoRow}>
            <View
              style={[
                styles.inputWrap,
                { flex: 1, backgroundColor: colors.card, borderColor: promoApplied ? colors.eco : colors.border },
              ]}
            >
              <Ionicons
                name="pricetag-outline"
                size={16}
                color={promoApplied ? colors.eco : colors.mutedForeground}
              />
              <TextInput
                value={promoCode}
                onChangeText={setPromoCode}
                placeholder="Enter promo code"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="characters"
                editable={!promoApplied}
                style={[styles.input, { color: colors.foreground }]}
              />
              {promoApplied && <Ionicons name="checkmark-circle" size={16} color={colors.eco} />}
            </View>
            {!promoApplied && (
              <Pressable
                onPress={applyPromo}
                style={[styles.applyBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.applyBtnText}>Apply</Text>
              </Pressable>
            )}
          </View>
          {promoApplied && (
            <Text style={[styles.promoSuccess, { color: colors.eco }]}>
              -$10 discount applied!
            </Text>
          )}
          <Text style={[styles.promoHint, { color: colors.mutedForeground }]}>
            Try: FOOTWEAR10
          </Text>
        </View>

        {/* Price Breakdown */}
        <View style={[styles.priceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Subtotal</Text>
            <Text style={[styles.priceVal, { color: colors.foreground }]}>${cartTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Shipping</Text>
            <Text style={[styles.priceVal, { color: colors.foreground }]}>${shippingFee}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: colors.eco }]}>Discount</Text>
              <Text style={[styles.priceVal, { color: colors.eco }]}>-${discount}</Text>
            </View>
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.priceRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
            <Text style={[styles.totalVal, { color: colors.primary }]}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Button */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: bottomPad + 16,
          },
        ]}
      >
        <Pressable onPress={handleCheckout} disabled={loading || !address || !city}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.checkoutBtn,
              (loading || !address || !city) && { opacity: 0.5 },
            ]}
          >
            {loading ? (
              <Text style={styles.checkoutBtnText}>Processing...</Text>
            ) : (
              <>
                <Ionicons name="lock-closed-outline" size={18} color="#000" />
                <Text style={styles.checkoutBtnText}>Place Order — ${total.toFixed(2)}</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 10 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  itemName: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  itemMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  itemPrice: { fontSize: 14, fontFamily: "Inter_700Bold", width: 56, textAlign: "right" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  input: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  row: { flexDirection: "row", gap: 10 },
  paymentOptions: { flexDirection: "row", gap: 10 },
  payCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    alignItems: "center",
    gap: 6,
    overflow: "hidden",
  },
  payLabel: { fontSize: 13, fontFamily: "Inter_700Bold" },
  payDesc: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  promoRow: { flexDirection: "row", gap: 10 },
  applyBtn: { paddingHorizontal: 20, borderRadius: 12, justifyContent: "center" },
  applyBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#000" },
  promoSuccess: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginTop: 6 },
  promoHint: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
  priceCard: {
    marginHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    marginBottom: 20,
  },
  priceRow: { flexDirection: "row", justifyContent: "space-between" },
  priceLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  priceVal: { fontSize: 14, fontFamily: "Inter_500Medium" },
  divider: { height: 1 },
  totalLabel: { fontSize: 16, fontFamily: "Inter_700Bold" },
  totalVal: { fontSize: 20, fontFamily: "Inter_700Bold" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
  checkoutBtn: { borderRadius: 16, paddingVertical: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  checkoutBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#000" },
});
