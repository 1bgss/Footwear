import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { useColors } from "@/hooks/useColors";
import { type OrderStatus, useApp } from "@/context/AppContext";
import { buildInvoiceHtml } from "@/utils/invoice";

function CheckmarkCircle() {
  const colors = useColors();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 180 }));
  }, []);
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  return (
    <Animated.View style={[styles.checkWrap, containerStyle]}>
      <LinearGradient colors={[colors.eco, "#00D084"]} style={styles.checkCircle}>
        <Ionicons name="checkmark" size={48} color="#000" />
      </LinearGradient>
      <View style={[styles.checkRing, { borderColor: colors.eco + "30" }]} />
      <View style={[styles.checkRing2, { borderColor: colors.eco + "15" }]} />
    </Animated.View>
  );
}

function Confetti() {
  const colors = useColors();
  const items = Array.from({ length: 12 }, (_, i) => ({
    x: (i / 12) * 100,
    color: [colors.primary, colors.eco, colors.gold, colors.accent][i % 4],
    delay: i * 60,
    size: 6 + (i % 4) * 3,
  }));
  return (
    <View style={styles.confettiContainer} pointerEvents="none">
      {items.map((item, i) => {
        const y = useSharedValue(-20);
        const opacity = useSharedValue(0);
        useEffect(() => {
          opacity.value = withDelay(item.delay, withTiming(1, { duration: 200 }));
          y.value = withDelay(
            item.delay,
            withSequence(
              withTiming(300 + Math.random() * 200, { duration: 1200 }),
              withTiming(600, { duration: 600 })
            )
          );
        }, []);
        const style = useAnimatedStyle(() => ({
          transform: [{ translateY: y.value }],
          opacity: opacity.value,
          left: `${item.x}%`,
        }));
        return (
          <Animated.View
            key={i}
            style={[
              styles.confettiPiece,
              { width: item.size, height: item.size, backgroundColor: item.color, borderRadius: item.size / 2 },
              style,
            ]}
          />
        );
      })}
    </View>
  );
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useSharedValue(0);
  const y = useSharedValue(20);
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
    y.value = withDelay(delay, withSpring(0));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: y.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

export default function OrderSuccessScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, user, rewardEcoPurchase, rewardInvoiceShare } = useApp();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [downloading, setDownloading] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const rewardedOrderRef = React.useRef<string | null>(null);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const order = orders.find((o) => o.id === orderId) ?? orders[orders.length - 1];
  const hasEcoReward = earnedPoints > 0;
  const statusRank: Record<OrderStatus, number> = {
    processing: 1,
    shipped: 2,
    out_for_delivery: 3,
    delivered: 4,
  };
  const currentStatusRank = order ? statusRank[order.status] : 1;

  const statusSteps = [
    { icon: "checkmark-circle" as const, label: "Order Placed", done: currentStatusRank >= 1 },
    { icon: "cube-outline" as const, label: "Shipped", done: currentStatusRank >= 2 },
    { icon: "car-outline" as const, label: "Out for Delivery", done: currentStatusRank >= 3 },
    { icon: "home-outline" as const, label: "Delivered", done: currentStatusRank >= 4 },
  ];

  useEffect(() => {
    if (!order || rewardedOrderRef.current === order.id) return;
    rewardedOrderRef.current = order.id;
    const points = rewardEcoPurchase(order);
    if (points > 0) {
      setEarnedPoints(points);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [order, rewardEcoPurchase]);

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setDownloading(true);
    try {
      const html = buildInvoiceHtml(order, user);
      const { uri } = await Print.printToFileAsync({ html });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Download Invoice",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Invoice Ready", "Your invoice PDF has been generated successfully.");
      }
    } catch {
      Alert.alert("Error", "Could not generate invoice. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleShareInvoice = async () => {
    if (!order) return;
    setDownloading(true);
    try {
      const html = buildInvoiceHtml(order, user);
      const { uri } = await Print.printToFileAsync({ html });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Share Invoice",
        });
      } else {
        Alert.alert("Share", `Invoice ID: ${order.invoiceId}\nTotal: $${order.total.toFixed(2)}\n\nShare this invoice from your Footwear app.`);
      }
      rewardInvoiceShare();
    } catch {
      Alert.alert("Error", "Could not share invoice. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.eco + "10", "transparent", "rgba(0,180,255,0.05)"]}
        style={StyleSheet.absoluteFill}
      />
      <Confetti />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topPad + 24, paddingBottom: bottomPad + 32, paddingHorizontal: 20, gap: 24 }}
      >
        <CheckmarkCircle />

        <FadeIn delay={400}>
          <View style={styles.titleBlock}>
            <Text style={[styles.titleMain, { color: colors.foreground }]}>Order Confirmed!</Text>
            <Text style={[styles.titleSub, { color: colors.mutedForeground }]}>Your shoes are on their way</Text>
          </View>
        </FadeIn>

        {hasEcoReward && (
          <FadeIn delay={520}>
            <View style={[styles.rewardPopup, { backgroundColor: colors.card, borderColor: colors.eco + "55" }]}>
              <LinearGradient
                colors={[colors.eco + "25", colors.gold + "12", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.rewardIcon, { backgroundColor: colors.eco }]}>
                <Ionicons name="leaf" size={20} color="#000" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rewardTitle, { color: colors.foreground }]}>Green Reward Earned</Text>
                <Text style={[styles.rewardDesc, { color: colors.eco }]}>+{earnedPoints} GP Added</Text>
              </View>
              <View style={[styles.rewardGlow, { borderColor: colors.eco + "35" }]} />
            </View>
          </FadeIn>
        )}

        {/* Invoice Card */}
        {order && (
          <FadeIn delay={600}>
            <View style={[styles.invoiceCard, { backgroundColor: colors.card, borderColor: colors.primary + "40" }]}>
              <LinearGradient colors={[colors.primary + "15", "transparent"]} style={StyleSheet.absoluteFill} />

              <View style={styles.invoiceHeader}>
                <Text style={[styles.invoiceLabel, { color: colors.mutedForeground }]}>INVOICE</Text>
                <Text style={[styles.invoiceId, { color: colors.primary }]}>{order.invoiceId}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {order.items.slice(0, 3).map((item, i) => (
                <View key={i} style={styles.invoiceRow}>
                  <Text style={[styles.invoiceName, { color: colors.foreground }]} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  {item.product.eco_friendly && (
                    <View style={[styles.ecoMini, { backgroundColor: colors.eco + "20" }]}>
                      <Text style={[styles.ecoMiniText, { color: colors.eco }]}>🌱</Text>
                    </View>
                  )}
                  <Text style={[styles.invoiceMeta, { color: colors.mutedForeground }]}>EU {item.size}</Text>
                  <Text style={[styles.invoicePrice, { color: colors.foreground }]}>${item.product.price}</Text>
                </View>
              ))}
              {order.items.length > 3 && (
                <Text style={[styles.moreItems, { color: colors.mutedForeground }]}>
                  +{order.items.length - 3} more items
                </Text>
              )}

              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
                <Text style={[styles.totalVal, { color: colors.primary }]}>${order.total.toFixed(2)}</Text>
              </View>
              <View style={styles.addrRow}>
                <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
                <Text style={[styles.addrText, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {order.address}
                </Text>
              </View>

              {/* QR Code section */}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.qrSection}>
                <View style={[styles.qrWrapper, { backgroundColor: "#111118", borderColor: colors.primary + "35", borderWidth: 1, borderRadius: 12 }]}>
                  <QRCode
                    value={order.invoiceId}
                    size={88}
                    color={colors.primary}
                    backgroundColor="#111118"
                  />
                </View>
                <View style={styles.qrInfo}>
                  <Text style={[styles.qrTitle, { color: colors.foreground }]}>Digital Receipt</Text>
                  <Text style={[styles.qrLabel, { color: colors.mutedForeground }]}>
                    Scan QR code to verify authenticity of this invoice
                  </Text>
                  <View style={[styles.verifiedChip, { backgroundColor: colors.eco + "18", borderColor: colors.eco + "35" }]}>
                    <Ionicons name="shield-checkmark-outline" size={12} color={colors.eco} />
                    <Text style={[styles.verifiedText, { color: colors.eco }]}>Verified Receipt</Text>
                  </View>
                </View>
              </View>

              {/* Invoice action buttons */}
              <View style={styles.invoiceActions}>
                <Pressable
                  onPress={handleDownloadInvoice}
                  disabled={downloading}
                  style={[styles.invoiceBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "35" }]}
                >
                  <Ionicons name={downloading ? "hourglass-outline" : "download-outline"} size={16} color={colors.primary} />
                  <Text style={[styles.invoiceBtnText, { color: colors.primary }]}>
                    {downloading ? "Generating…" : "Download PDF"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleShareInvoice}
                  disabled={downloading}
                  style={[styles.invoiceBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                >
                  <Ionicons name="share-outline" size={16} color={colors.foreground} />
                  <Text style={[styles.invoiceBtnText, { color: colors.foreground }]}>Share</Text>
                </Pressable>
              </View>
            </View>
          </FadeIn>
        )}

        {/* Tracking Steps */}
        <FadeIn delay={800}>
          <View style={[styles.trackCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.trackTitle, { color: colors.foreground }]}>Delivery Status</Text>
            <View style={styles.trackSteps}>
              {statusSteps.map((step, i) => (
                <View key={i} style={styles.trackStep}>
                  <View
                    style={[
                      styles.trackIcon,
                      { backgroundColor: step.done ? colors.eco : colors.muted, borderColor: step.done ? colors.eco : colors.border },
                    ]}
                  >
                    <Ionicons name={step.icon} size={18} color={step.done ? "#000" : colors.mutedForeground} />
                  </View>
                  {i < statusSteps.length - 1 && (
                    <View style={[styles.trackLine, { backgroundColor: step.done ? colors.eco + "40" : colors.border }]} />
                  )}
                  <Text style={[styles.trackLabel, { color: step.done ? colors.eco : colors.mutedForeground }]}>
                    {step.label}
                  </Text>
                </View>
              ))}
            </View>
            <View style={[styles.etaChip, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
              <Ionicons name="time-outline" size={14} color={colors.primary} />
              <Text style={[styles.etaText, { color: colors.primary }]}>Estimated delivery: 3–5 business days</Text>
            </View>
          </View>
        </FadeIn>

        {/* SDG card */}
        <FadeIn delay={1000}>
          <View style={[styles.sdgCard, { backgroundColor: colors.card, borderColor: colors.eco + "30" }]}>
            <LinearGradient colors={[colors.eco + "15", "transparent"]} style={StyleSheet.absoluteFill} />
            <View style={styles.sdgRow}>
              <View style={[styles.sdgBadge, { backgroundColor: colors.eco }]}>
                <Ionicons name="leaf" size={20} color="#000" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sdgTitle, { color: colors.foreground }]}>Carbon Offset</Text>
                <Text style={[styles.sdgDesc, { color: colors.mutedForeground }]}>
                  Your order contributes to SDG 12 — Responsible Consumption & Production. 5% of proceeds go to sustainability programs.
                </Text>
              </View>
            </View>
          </View>
        </FadeIn>

        {/* Actions */}
        <FadeIn delay={1200}>
          <View style={styles.actions}>
            <Pressable onPress={() => router.push("/(tabs)/profile")} style={{ flex: 1 }}>
              <View style={[styles.secondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="receipt-outline" size={18} color={colors.foreground} />
                <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>Order History</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => router.replace("/(tabs)")} style={{ flex: 1 }}>
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.primaryBtn}
              >
                <Ionicons name="home-outline" size={18} color="#000" />
                <Text style={styles.primaryBtnText}>Back to Home</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </FadeIn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  checkWrap: { alignItems: "center", justifyContent: "center", height: 140 },
  checkCircle: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", zIndex: 1 },
  checkRing: { position: "absolute", width: 110, height: 110, borderRadius: 55, borderWidth: 1.5 },
  checkRing2: { position: "absolute", width: 130, height: 130, borderRadius: 65, borderWidth: 1 },
  confettiContainer: { position: "absolute", top: 0, left: 0, right: 0, height: 400, overflow: "hidden" },
  confettiPiece: { position: "absolute", top: 0 },
  titleBlock: { alignItems: "center", gap: 6 },
  titleMain: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  titleSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  invoiceCard: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 10, overflow: "hidden" },
  invoiceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  invoiceLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  invoiceId: { fontSize: 14, fontFamily: "Inter_700Bold" },
  divider: { height: 1 },
  invoiceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  invoiceName: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  ecoMini: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5 },
  ecoMiniText: { fontSize: 10 },
  invoiceMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  invoicePrice: { fontSize: 13, fontFamily: "Inter_700Bold", width: 48, textAlign: "right" },
  moreItems: { fontSize: 12, fontFamily: "Inter_400Regular" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 16, fontFamily: "Inter_700Bold" },
  totalVal: { fontSize: 22, fontFamily: "Inter_700Bold" },
  addrRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  addrText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  qrSection: { flexDirection: "row", gap: 14, alignItems: "center" },
  qrWrapper: { padding: 10, alignItems: "center", justifyContent: "center" },
  qrInfo: { flex: 1, gap: 6 },
  qrTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  qrLabel: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  verifiedChip: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  verifiedText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  invoiceActions: { flexDirection: "row", gap: 10 },
  invoiceBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  invoiceBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  rewardPopup: { borderRadius: 18, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, overflow: "hidden" },
  rewardIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  rewardTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  rewardDesc: { fontSize: 13, fontFamily: "Inter_700Bold", marginTop: 2 },
  rewardGlow: { position: "absolute", right: -18, top: -18, width: 70, height: 70, borderRadius: 35, borderWidth: 1 },
  trackCard: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 16 },
  trackTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  trackSteps: { flexDirection: "row", alignItems: "flex-start" },
  trackStep: { flex: 1, alignItems: "center", gap: 6, position: "relative" },
  trackIcon: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  trackLine: { position: "absolute", top: 22, left: "50%", right: "-50%", height: 2, zIndex: -1 },
  trackLabel: { fontSize: 10, fontFamily: "Inter_500Medium", textAlign: "center" },
  etaChip: { flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 10, borderWidth: 1, gap: 6 },
  etaText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  sdgCard: { borderRadius: 20, borderWidth: 1, padding: 16, overflow: "hidden" },
  sdgRow: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  sdgBadge: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sdgTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 6 },
  sdgDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  actions: { flexDirection: "row", gap: 12 },
  primaryBtn: { paddingVertical: 16, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#000" },
  secondaryBtn: { paddingVertical: 16, borderRadius: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  secondaryBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
