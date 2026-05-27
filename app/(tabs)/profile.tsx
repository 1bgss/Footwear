import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { router } from "expo-router";
import React, { useState } from "react";
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
import { useApp } from "@/context/AppContext";
import { buildInvoiceHtml } from "@/utils/invoice";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, orders, footScanResult, logout, reorderItems } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [reorderedId, setReorderedId] = useState<string | null>(null);

  const statusColors: Record<string, string> = {
    delivered: "#00C878",
    shipped: "#00B4FF",
    processing: "#FFB800",
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
      icon: "storefront-outline" as const,
      label: user?.isSeller ? "Seller Dashboard" : "Become a Seller",
      desc: user?.isSeller ? "Manage your store" : "Open your store today",
      onPress: () => user?.isSeller ? router.push("/(tabs)/explore") : router.push("/become-seller"),
    },
    {
      icon: "settings-outline" as const,
      label: "Settings",
      desc: "Preferences & notifications",
      onPress: () => {},
    },
    {
      icon: "help-circle-outline" as const,
      label: "Help & Support",
      desc: "FAQ & contact us",
      onPress: () => {},
    },
  ];

  const handleReorder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    reorderItems(order.items);
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
                      {order.status}
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
            <Pressable
              key={i}
              onPress={item.onPress}
              style={[
                styles.menuItem,
                i < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
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
});
