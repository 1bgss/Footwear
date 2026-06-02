import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { router } from "expo-router";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { type OrderStatus, useApp } from "@/context/AppContext";
import { buildInvoiceHtml } from "@/utils/invoice";
import { getAllProducts } from "@/data/products";

const ECO_BADGE_CATALOG = [
  { name: "Eco Explorer", icon: "leaf-outline" as const, color: "#00C878" },
  { name: "Green Shopper", icon: "bag-check-outline" as const, color: "#00E5FF" },
  { name: "Sustainable Supporter", icon: "earth-outline" as const, color: "#FFB800" },
  { name: "Carbon Saver", icon: "cloud-outline" as const, color: "#00B4FF" },
  { name: "Eco Trendsetter", icon: "share-social-outline" as const, color: "#7C3AED" },
  { name: "Conscious Walker", icon: "footsteps-outline" as const, color: "#00C878" },
];

function getNextEcoTarget(points: number) {
  if (points < 100) return { label: "Eco Explorer", target: 100, previous: 0 };
  if (points < 250) return { label: "Green Shopper", target: 250, previous: 100 };
  if (points < 500) return { label: "Sustainable Supporter", target: 500, previous: 250 };
  if (points < 1000) return { label: "Eco Champion", target: 1000, previous: 500 };
  return { label: "Eco Champion", target: points, previous: 1000 };
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useSharedValue(0);
  const y = useSharedValue(18);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 450 });
    y.value = withSpring(0, { damping: 14, stiffness: 140 });
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: delay ? opacity.value : opacity.value,
    transform: [{ translateY: y.value }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

function AnimatedMenuItem({
  item,
  isLast,
  colors,
}: {
  item: { icon: keyof typeof Ionicons.glyphMap; label: string; desc: string; onPress: () => void };
  isLast: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: `rgba(0, 180, 255, ${glow.value * 0.08})`,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          item.onPress();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 14, stiffness: 220 });
          glow.value = withTiming(1, { duration: 120 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 220 });
          glow.value = withTiming(0, { duration: 220 });
        }}
        style={[
          styles.menuItem,
          !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
        ]}
      >
        <View style={[styles.menuIcon, { backgroundColor: colors.muted }]}>
          <Ionicons name={item.icon} size={18} color={colors.primary} />
        </View>
        <View style={styles.menuText}>
          <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
          <Text style={[styles.menuDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
      </Pressable>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    user,
    orders,
    footScanResult,
    logout,
    reorderItems,
    greenPoints,
    ecoBadges,
    ecoLevel,
    ecoStats,
    rewardEcoReorder,
    sellerStores,
    sellerProducts,
  } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, Platform.OS === "android" ? 24 : 0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [reorderedId, setReorderedId] = useState<string | null>(null);
  const nextEcoTarget = getNextEcoTarget(greenPoints);
  const ecoProgress =
    nextEcoTarget.target === greenPoints
      ? 1
      : Math.min(1, (greenPoints - nextEcoTarget.previous) / (nextEcoTarget.target - nextEcoTarget.previous));
  const ecoFeed = [
    ecoStats.ecoPurchases > 0 ? "Purchased eco-friendly sneakers" : "Eco wallet activated",
    `Earned ${greenPoints} Green Points`,
    ecoBadges.length > 0 ? `Unlocked ${ecoBadges[ecoBadges.length - 1]} Badge` : "Badges ready to unlock",
    `Saved estimated ${ecoStats.co2Saved}kg CO2`,
  ];

  // Get seller store for current user
  const sellerStore = sellerStores.find((s) => s.ownerUserId === user?.id);
  const storeProducts = sellerProducts.filter((p) => p.storeId === sellerStore?.id);

  const statusColors: Record<OrderStatus, string> = {
    delivered: "#00C878",
    out_for_delivery: "#00E5FF",
    shipped: "#00B4FF",
    processing: "#FFB800",
  };
  const statusLabels: Record<OrderStatus, string> = {
    processing: "processing",
    shipped: "shipped",
    out_for_delivery: "out for delivery",
    delivered: "delivered",
  };

  const menuItems = [
    {
      icon: "scan-outline" as const,
      label: "SmartFit Profile",
      desc: footScanResult ? `${footScanResult.footType} foot detected` : "Scan your foot",
      onPress: () => router.push("/foot-scan"),
    },
    {
      icon: "leaf-outline" as const,
      label: "Eco Collection",
      desc: "SDG 12 sustainable shoes",
      onPress: () => router.push("/eco"),
    },
    {
      icon: "sparkles-outline" as const,
      label: "Shoepedia",
      desc: "AI shoe encyclopedia",
      onPress: () => router.push("/shoepedia" as any),
    },
    {
      icon: "storefront-outline" as const,
      label: user?.isSeller ? "Seller Dashboard" : "Become a Seller",
      desc: user?.isSeller ? "Manage your store" : "Open your store today",
      onPress: () => user?.isSeller ? router.push("/(tabs)/explore") : router.push("/become-seller"),
    },
    {
      icon: "settings-outline" as const,
      label: "Settings",
      desc: "Preferences & notifications",
      onPress: () => router.push("/settings" as any),
    },
    {
      icon: "help-circle-outline" as const,
      label: "Help & Support",
      desc: "FAQ & contact us",
      onPress: () => router.push("/help" as any),
    },
  ];

  const handleReorder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    reorderItems(order.items);
    rewardEcoReorder(order.items);
    setReorderedId(orderId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setReorderedId(null), 2500);
    Alert.alert(
      "Added to Cart! 🛒",
      `${order.items.length} item${order.items.length > 1 ? "s" : ""} have been added back to your cart.`,
      [
        { text: "View Cart", onPress: () => router.push("/(tabs)/cart") },
        { text: "OK" },
      ]
    );
  };

  const handleRedownload = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    setDownloadingId(orderId);
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
        Alert.alert("Invoice Ready", `Invoice ${order.invoiceId} has been generated.`);
      }
    } catch {
      Alert.alert("Error", "Could not generate invoice. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: bottomPad + 90 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <LinearGradient
          colors={[colors.primary + "30", colors.accent + "10"]}
          style={[styles.avatarBg, { borderColor: colors.primary + "50" }]}
        >
          <Text style={[styles.avatarLetter, { color: colors.primary }]}>
            {(user?.name ?? "U")[0].toUpperCase()}
          </Text>
        </LinearGradient>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.foreground }]}>{user?.name ?? "User"}</Text>
          <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>{user?.email}</Text>
          <View
            style={[
              styles.roleBadge,
              {
                backgroundColor: user?.role === "seller" ? colors.gold + "20" : colors.primary + "20",
                borderColor: user?.role === "seller" ? colors.gold + "40" : colors.primary + "40",
              },
            ]}
          >
            <Ionicons
              name={user?.role === "seller" ? "storefront-outline" : "bag-outline"}
              size={12}
              color={user?.role === "seller" ? colors.gold : colors.primary}
            />
            <Text
              style={[
                styles.roleText,
                { color: user?.role === "seller" ? colors.gold : colors.primary },
              ]}
            >
              {user?.role === "seller" ? "Seller" : "Buyer"}
            </Text>
          </View>
        </View>
      </View>

      {/* Green Wallet */}
      <FadeIn>
        <View style={[styles.greenWallet, { backgroundColor: colors.card, borderColor: colors.eco + "45" }]}>
          <LinearGradient
            colors={[colors.eco + "22", colors.primary + "10", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.walletTop}>
            <View style={[styles.walletIcon, { backgroundColor: colors.eco }]}>
              <Ionicons name="leaf" size={22} color="#000" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.walletLabel, { color: colors.mutedForeground }]}>GREEN WALLET</Text>
              <Text style={[styles.walletLevel, { color: colors.foreground }]}>{ecoLevel}</Text>
            </View>
            <Text style={[styles.walletPoints, { color: colors.eco }]}>{greenPoints} GP</Text>
          </View>
          <View style={[styles.walletProgressTrack, { backgroundColor: colors.muted }]}>
            <View style={[styles.walletProgressFill, { width: `${ecoProgress * 100}%`, backgroundColor: colors.eco }]} />
          </View>
          <Text style={[styles.walletHint, { color: colors.mutedForeground }]}>
            {nextEcoTarget.target === greenPoints
              ? "Top level reached"
              : `${Math.max(0, nextEcoTarget.target - greenPoints)} points until ${nextEcoTarget.label}`}
          </Text>
          <View style={[styles.walletGlow, { borderColor: colors.eco + "25" }]} />
        </View>
      </FadeIn>

      {/* Eco Badges */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Eco Badge Collection</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeList}>
          {ECO_BADGE_CATALOG.map((badge) => {
            const unlocked = ecoBadges.includes(badge.name);
            return (
              <View
                key={badge.name}
                style={[
                  styles.badgeCard,
                  {
                    backgroundColor: unlocked ? badge.color + "18" : colors.card,
                    borderColor: unlocked ? badge.color + "65" : colors.border,
                    opacity: unlocked ? 1 : 0.45,
                  },
                ]}
              >
                <LinearGradient
                  colors={[unlocked ? badge.color + "25" : "transparent", "transparent"]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.badgeIcon, { backgroundColor: unlocked ? badge.color : colors.muted }]}>
                  <Ionicons name={badge.icon} size={24} color={unlocked ? "#000" : colors.mutedForeground} />
                </View>
                <Text style={[styles.badgeName, { color: unlocked ? colors.foreground : colors.mutedForeground }]}>
                  {badge.name}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Eco Activity */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Eco Activity Feed</Text>
        <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {ecoFeed.map((item, i) => (
            <View key={i} style={styles.activityRow}>
              <View style={[styles.activityDot, { backgroundColor: i === 0 ? colors.eco : colors.primary }]} />
              <Text style={[styles.activityText, { color: colors.foreground }]}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* SmartFit status */}
      {footScanResult && (
        <Pressable
          onPress={() => router.push("/foot-scan")}
          style={[styles.fitCard, { backgroundColor: colors.card, borderColor: colors.primary + "40" }]}
        >
          <LinearGradient colors={[colors.primary + "15", "transparent"]} style={StyleSheet.absoluteFill} />
          <View style={styles.fitRow}>
            <Ionicons name="scan" size={22} color={colors.primary} />
            <View style={styles.fitInfo}>
              <Text style={[styles.fitLabel, { color: colors.mutedForeground }]}>SmartFit Profile</Text>
              <Text style={[styles.fitValue, { color: colors.foreground }]}>
                {footScanResult.footType.charAt(0).toUpperCase() + footScanResult.footType.slice(1)} Foot
              </Text>
            </View>
            <View style={[styles.fitScore, { backgroundColor: colors.primary }]}>
              <Text style={styles.fitScoreText}>Active</Text>
            </View>
          </View>
        </Pressable>
      )}

      {/* Seller Dashboard */}
      {user?.role === "seller" && sellerStore && (
        <FadeIn>
          <View style={[styles.sellerCard, { backgroundColor: colors.card, borderColor: colors.gold + "40" }]}>
            <LinearGradient
              colors={[colors.gold + "18", colors.primary + "10", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.sellerHeader}>
              <View style={[styles.sellerIcon, { backgroundColor: colors.gold }]}>
                <Ionicons name="storefront" size={24} color="#000" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sellerTitle, { color: colors.foreground }]}>Your Store</Text>
                <Text style={[styles.sellerName, { color: colors.gold }]}>{sellerStore.name}</Text>
              </View>
            </View>
            <View style={styles.sellerStats}>
              <View style={styles.sellerStat}>
                <Text style={[styles.sellerStatValue, { color: colors.foreground }]}>{storeProducts.length}</Text>
                <Text style={[styles.sellerStatLabel, { color: colors.mutedForeground }]}>Products</Text>
              </View>
              <View style={[styles.sellerStatDivider, { backgroundColor: colors.border }]} />
              <View style={styles.sellerStat}>
                <Text style={[styles.sellerStatValue, { color: colors.foreground }]}>{sellerStore.totalSales}</Text>
                <Text style={[styles.sellerStatLabel, { color: colors.mutedForeground }]}>Sales</Text>
              </View>
              <View style={[styles.sellerStatDivider, { backgroundColor: colors.border }]} />
              <View style={styles.sellerStat}>
                <Text style={[styles.sellerStatValue, { color: colors.foreground }]}>{sellerStore.rating}</Text>
                <Text style={[styles.sellerStatLabel, { color: colors.mutedForeground }]}>Rating</Text>
              </View>
            </View>
            <View style={styles.sellerActions}>
              <Pressable
                onPress={() => router.push("/upload-product")}
                style={[styles.sellerActionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}
              >
                <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
                <Text style={[styles.sellerActionText, { color: colors.primary }]}>Upload Product</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push(`/store/${sellerStore.id}` as any)}
                style={[styles.sellerActionBtn, { backgroundColor: colors.gold + "15", borderColor: colors.gold + "30" }]}
              >
                <Ionicons name="storefront-outline" size={18} color={colors.gold} />
                <Text style={[styles.sellerActionText, { color: colors.gold }]}>View Storefront</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/become-seller")}
                style={[styles.sellerActionBtn, { backgroundColor: colors.eco + "15", borderColor: colors.eco + "30" }]}
              >
                <Ionicons name="settings-outline" size={18} color={colors.eco} />
                <Text style={[styles.sellerActionText, { color: colors.eco }]}>Manage Store</Text>
              </Pressable>
            </View>
          </View>
        </FadeIn>
      )}

      {/* Order History */}
      {orders.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Order History</Text>
          {orders.slice(0, 4).map((order) => (
            <View key={order.id} style={[styles.orderCardWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Order header row */}
              <Pressable
                onPress={() => router.push(`/order-success?orderId=${order.id}`)}
                style={styles.orderRow}
              >
                <View style={styles.orderLeft}>
                  <Text style={[styles.orderId, { color: colors.primary }]}>{order.invoiceId}</Text>
                  <Text style={[styles.orderItems, { color: colors.foreground }]}>
                    {order.items[0]?.product.name ?? "Order"}
                    {order.items.length > 1 ? ` +${order.items.length - 1} more` : ""}
                  </Text>
                  <Text style={[styles.orderDate, { color: colors.mutedForeground }]}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={[styles.orderTotal, { color: colors.primary }]}>${order.total.toFixed(2)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: (statusColors[order.status] ?? colors.primary) + "20" }]}>
                    <Text style={[styles.statusText, { color: statusColors[order.status] ?? colors.primary }]}>
                      {statusLabels[order.status] ?? order.status}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
                </View>
              </Pressable>

              {/* Action buttons */}
              <View style={[styles.orderActions, { borderTopColor: colors.border }]}>
                <Pressable
                  onPress={() => handleReorder(order.id)}
                  style={[
                    styles.orderActionBtn,
                    {
                      backgroundColor: reorderedId === order.id ? colors.eco + "20" : colors.muted,
                      borderColor: reorderedId === order.id ? colors.eco + "40" : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={reorderedId === order.id ? "checkmark-circle-outline" : "refresh-outline"}
                    size={14}
                    color={reorderedId === order.id ? colors.eco : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.orderActionText,
                      { color: reorderedId === order.id ? colors.eco : colors.mutedForeground },
                    ]}
                  >
                    {reorderedId === order.id ? "Added to Cart!" : "Reorder"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleRedownload(order.id)}
                  disabled={downloadingId === order.id}
                  style={[
                    styles.orderActionBtn,
                    { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" },
                  ]}
                >
                  <Ionicons
                    name={downloadingId === order.id ? "hourglass-outline" : "download-outline"}
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={[styles.orderActionText, { color: colors.primary }]}>
                    {downloadingId === order.id ? "Generating…" : "Download Invoice"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Menu */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Account</Text>
        <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {menuItems.map((item, i) => (
            <AnimatedMenuItem
              key={i}
              item={item}
              isLast={i === menuItems.length - 1}
              colors={colors}
            />
          ))}
        </View>
      </View>

      {/* Logout */}
      <Pressable
        onPress={async () => { await logout(); router.replace("/auth"); }}
        style={[styles.logoutBtn, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "30" }]}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 20, gap: 16 },
  avatarBg: { width: 72, height: 72, borderRadius: 22, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  avatarLetter: { fontSize: 28, fontFamily: "Inter_700Bold" },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 22, fontFamily: "Inter_700Bold" },
  profileEmail: { fontSize: 13, fontFamily: "Inter_400Regular" },
  roleBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, gap: 4, marginTop: 4 },
  roleText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  fitCard: { marginHorizontal: 20, borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 24, overflow: "hidden" },
  fitRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  fitInfo: { flex: 1 },
  fitLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  fitValue: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  fitScore: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  fitScoreText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#000" },
  sellerCard: { marginHorizontal: 20, borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 24, overflow: "hidden" },
  sellerHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  sellerIcon: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sellerTitle: { fontSize: 14, fontFamily: "Inter_400Regular" },
  sellerName: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 2 },
  sellerStats: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  sellerStat: { flex: 1, alignItems: "center" },
  sellerStatValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  sellerStatLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  sellerStatDivider: { width: 1, height: 32 },
  sellerActions: { gap: 8 },
  sellerActionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 12, borderWidth: 1, gap: 8 },
  sellerActionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 12 },
  orderCardWrap: { borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: "hidden" },
  orderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 },
  orderLeft: { flex: 1, gap: 3 },
  orderId: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  orderItems: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  orderDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  orderRight: { alignItems: "flex-end", gap: 4 },
  orderTotal: { fontSize: 16, fontFamily: "Inter_700Bold" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  orderActions: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  orderActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 9, borderWidth: 1 },
  orderActionText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  menuCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  menuIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  menuDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  logoutBtn: { marginHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 14, borderWidth: 1, gap: 8 },
  logoutText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  greenWallet: { marginHorizontal: 20, borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 24, gap: 14, overflow: "hidden" },
  walletTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  walletIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  walletLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.2 },
  walletLevel: { fontSize: 17, fontFamily: "Inter_700Bold", marginTop: 2 },
  walletPoints: { fontSize: 24, fontFamily: "Inter_700Bold" },
  walletProgressTrack: { height: 9, borderRadius: 9, overflow: "hidden" },
  walletProgressFill: { height: "100%", borderRadius: 9 },
  walletHint: { fontSize: 12, fontFamily: "Inter_500Medium" },
  walletGlow: { position: "absolute", right: -24, top: -24, width: 90, height: 90, borderRadius: 45, borderWidth: 1 },
  badgeList: { gap: 10, paddingRight: 20 },
  badgeCard: { width: 112, borderRadius: 16, borderWidth: 1, padding: 12, alignItems: "center", gap: 8, overflow: "hidden" },
  badgeIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  badgeName: { fontSize: 11, fontFamily: "Inter_700Bold", textAlign: "center", minHeight: 28 },
  activityCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 12 },
  activityRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  activityDot: { width: 9, height: 9, borderRadius: 5 },
  activityText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
});
