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
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

const BENEFITS = [
  { icon: "trending-up-outline" as const, label: "Earn Revenue", desc: "Get paid instantly for every sale", color: "#00B4FF" },
  { icon: "analytics-outline" as const, label: "Live Analytics", desc: "Real-time dashboard & insights", color: "#7C3AED" },
  { icon: "scan-outline" as const, label: "SmartFit AI", desc: "AI drives 2.4× more conversions", color: "#00C878" },
  { icon: "leaf-outline" as const, label: "Eco Marketplace", desc: "Tap the growing eco-shopper market", color: "#00C878" },
];

const STATS = [
  { value: "5,200+", label: "Active Sellers" },
  { value: "$2.4M", label: "Monthly GMV" },
  { value: "94%", label: "Seller Satisfaction" },
];

export default function BecomeSellerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { upgradeToSeller } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, Platform.OS === "android" ? 24 : 0);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const handleOpenStore = async () => {
    if (loading || success) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    btnScale.value = withSequence(withTiming(0.94, { duration: 100 }), withSpring(1, { damping: 10 }));

    await new Promise((r) => setTimeout(r, 1600));
    await upgradeToSeller();
    setLoading(false);
    setSuccess(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await new Promise((r) => setTimeout(r, 2000));
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.gold + "12", "transparent", colors.primary + "08"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="close" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad + 32 }}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <LinearGradient
            colors={[colors.gold + "28", colors.primary + "18", "transparent"]}
            style={styles.heroBg}
          />
          <View style={[styles.heroIcon, { backgroundColor: colors.gold + "22", borderColor: colors.gold + "40" }]}>
            <Ionicons name="storefront" size={44} color={colors.gold} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>Become a Seller</Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            Join thousands of UMKM sellers growing their business on Footwear's smart marketplace
          </Text>

          <View style={styles.statsRow}>
            {STATS.map((s, i) => (
              <View key={i} style={[styles.statItem, i === 1 && { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border }]}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Why Sell on Footwear?</Text>
          <View style={styles.benefitsGrid}>
            {BENEFITS.map((b, i) => (
              <View key={i} style={[styles.benefitCard, { backgroundColor: colors.card, borderColor: b.color + "35" }]}>
                <LinearGradient colors={[b.color + "18", "transparent"]} style={StyleSheet.absoluteFill} />
                <View style={[styles.benefitIcon, { backgroundColor: b.color + "22" }]}>
                  <Ionicons name={b.icon} size={22} color={b.color} />
                </View>
                <Text style={[styles.benefitLabel, { color: colors.foreground }]}>{b.label}</Text>
                <Text style={[styles.benefitDesc, { color: colors.mutedForeground }]}>{b.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Analytics Preview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Future Dashboard</Text>
          <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <LinearGradient colors={[colors.primary + "12", "transparent"]} style={StyleSheet.absoluteFill} />

            <View style={styles.previewKpis}>
              {[
                { label: "Revenue", val: "$2.4k", color: colors.primary },
                { label: "Orders", val: "148", color: colors.eco },
                { label: "Conversion", val: "8.3%", color: colors.gold },
              ].map((k, i) => (
                <View key={i} style={[styles.previewKpi, { borderColor: k.color + "30", backgroundColor: k.color + "08" }]}>
                  <Text style={[styles.previewKpiVal, { color: k.color }]}>{k.val}</Text>
                  <Text style={[styles.previewKpiLabel, { color: colors.mutedForeground }]}>{k.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.previewChart}>
              {[35, 55, 45, 70, 60, 100].map((h, i) => (
                <View key={i} style={styles.previewBarWrap}>
                  <View
                    style={[styles.previewBar, { height: h * 0.65, backgroundColor: i === 5 ? colors.primary : colors.primary + "40" }]}
                  />
                </View>
              ))}
            </View>
            <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>Monthly Revenue — Last 6 months</Text>

            <View style={[styles.lockedOverlay, { backgroundColor: "rgba(10,10,15,0.58)" }]}>
              <View style={[styles.lockedBadge, { backgroundColor: colors.gold + "22", borderColor: colors.gold + "35" }]}>
                <Ionicons name="lock-closed" size={15} color={colors.gold} />
                <Text style={[styles.lockedText, { color: colors.gold }]}>Full dashboard unlocked after opening store</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Revenue Card */}
        <View style={styles.section}>
          <View style={[styles.revenueCard, { backgroundColor: colors.card, borderColor: colors.eco + "30" }]}>
            <LinearGradient colors={[colors.eco + "15", "transparent"]} style={StyleSheet.absoluteFill} />
            <View style={styles.revenueRow}>
              <View style={[styles.revenueIcon, { backgroundColor: colors.eco + "22" }]}>
                <Ionicons name="cash-outline" size={26} color={colors.eco} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.revenueTitle, { color: colors.foreground }]}>
                  Top sellers earn{" "}
                  <Text style={{ color: colors.eco }}>$8,000+</Text> per month
                </Text>
                <Text style={[styles.revenueSub, { color: colors.mutedForeground }]}>
                  SmartFit recommendations boost conversions by 2.4× compared to traditional stores
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Testimonial */}
        <View style={styles.section}>
          <View style={[styles.testimonialCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.quoteIcon}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.quoteText, { color: colors.foreground }]}>
              "Footwear's SmartFit drove 40% more conversions for my shoe store in the first month alone."
            </Text>
            <Text style={[styles.quoteAuthor, { color: colors.mutedForeground }]}>
              — Ahmad R., UrbanKicks Store · Jakarta
            </Text>
          </View>
        </View>

        {/* CTA */}
        <View style={[styles.section, { paddingTop: 4 }]}>
          <Animated.View style={btnStyle}>
            <Pressable onPress={handleOpenStore} disabled={loading || success}>
              <LinearGradient
                colors={
                  success ? [colors.eco, "#00D084"] :
                  loading ? [colors.gold + "80", "#CC7000"] :
                  [colors.gold, "#FF8C00"]
                }
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.ctaBtn}
              >
                {success ? (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#000" />
                    <Text style={styles.ctaBtnText}>Store Opened! Welcome, Seller 🎉</Text>
                  </>
                ) : loading ? (
                  <>
                    <Ionicons name="hourglass-outline" size={20} color="#000" />
                    <Text style={styles.ctaBtnText}>Setting up your store…</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="storefront-outline" size={22} color="#000" />
                    <Text style={styles.ctaBtnText}>Open Your Store — Free</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
          <Text style={[styles.ctaNote, { color: colors.mutedForeground }]}>
            Free to join · No monthly fees · Start selling in minutes
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingBottom: 8, alignItems: "flex-end" },
  closeBtn: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  hero: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 28, overflow: "hidden" },
  heroBg: { position: "absolute", top: 0, left: 0, right: 0, height: 260 },
  heroIcon: {
    width: 90, height: 90, borderRadius: 28,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
    marginBottom: 16, marginTop: 8,
  },
  heroTitle: { fontSize: 30, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 10 },
  heroSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  statsRow: { flexDirection: "row", width: "100%" },
  statItem: { flex: 1, alignItems: "center", paddingVertical: 14 },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 3 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 14 },
  benefitsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  benefitCard: {
    width: "47.5%", borderRadius: 16, borderWidth: 1,
    padding: 16, gap: 8, overflow: "hidden",
  },
  benefitIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  benefitLabel: { fontSize: 14, fontFamily: "Inter_700Bold" },
  benefitDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  previewCard: { borderRadius: 18, borderWidth: 1, padding: 18, overflow: "hidden", gap: 14 },
  previewKpis: { flexDirection: "row", gap: 8 },
  previewKpi: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: "center", gap: 4 },
  previewKpiVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  previewKpiLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  previewChart: { flexDirection: "row", alignItems: "flex-end", height: 65, gap: 5 },
  previewBarWrap: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  previewBar: { width: "100%", borderRadius: 4 },
  previewLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedBadge: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  lockedText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  revenueCard: { borderRadius: 16, borderWidth: 1, padding: 18, overflow: "hidden" },
  revenueRow: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  revenueIcon: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  revenueTitle: { fontSize: 16, fontFamily: "Inter_700Bold", lineHeight: 24, marginBottom: 6 },
  revenueSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  testimonialCard: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 12 },
  quoteIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  quoteText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, fontStyle: "italic" },
  quoteAuthor: { fontSize: 12, fontFamily: "Inter_500Medium" },
  ctaBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, borderRadius: 16, gap: 10 },
  ctaBtnText: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#000" },
  ctaNote: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 12 },
});
