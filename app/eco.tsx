import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
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
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { getEcoProducts, PRODUCTS } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";
import { useApp } from "@/context/AppContext";

const SDG_GOALS = [
  {
    number: "12",
    title: "Responsible Consumption & Production",
    desc: "Ensure sustainable consumption and production patterns through eco-certified footwear.",
    icon: "leaf-outline" as const,
    color: "#1DB954",
  },
  {
    number: "13",
    title: "Climate Action",
    desc: "Reduce the carbon footprint of shoe manufacturing and shipping.",
    icon: "earth-outline" as const,
    color: "#00B4FF",
  },
  {
    number: "8",
    title: "Decent Work & Economic Growth",
    desc: "Support fair-trade certified local shoe artisans and small businesses.",
    icon: "people-outline" as const,
    color: "#FFB800",
  },
];

const IMPACT_STATS = [
  { value: "2,400", unit: "kg", label: "CO₂ offset", icon: "cloud-outline" as const, color: "#1DB954" },
  { value: "480", unit: "trees", label: "Planted", icon: "leaf-outline" as const, color: "#00C878" },
  { value: "85%", unit: "", label: "Recycled materials", icon: "refresh-outline" as const, color: "#00B4FF" },
  { value: "320", unit: "sellers", label: "Eco certified", icon: "shield-checkmark-outline" as const, color: "#7C3AED" },
];

const ECO_TIPS = [
  "Choose shoes made from recycled or natural materials",
  "Buy local to reduce shipping carbon footprint",
  "Extend shoe life with proper cleaning and care",
  "Donate or recycle worn shoes instead of discarding",
  "Look for water-based adhesives and natural dyes",
];

const LEADERBOARD = [
  { name: "Alex", points: 1240, level: "Eco Champion" },
  { name: "Sarah", points: 980, level: "Sustainable Supporter" },
  { name: "You", points: 740, level: "Green Shopper" },
  { name: "Budi", points: 520, level: "Sustainable Supporter" },
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
    opacity.value = withDelay(delay, withTiming(1, { duration: 450 }));
    y.value = withDelay(delay, withSpring(0, { damping: 14, stiffness: 140 }));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: y.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

export default function EcoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { greenPoints, ecoLevel, ecoBadges, ecoStats, recordEcoCollectionOpen } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, Platform.OS === "android" ? 24 : 0);
  const [activeTip, setActiveTip] = useState(0);

  const ecoProducts = getEcoProducts();
  const nextTarget = getNextEcoTarget(greenPoints);
  const progress =
    nextTarget.target === greenPoints
      ? 1
      : Math.min(1, (greenPoints - nextTarget.previous) / (nextTarget.target - nextTarget.previous));

  useEffect(() => {
    recordEcoCollectionOpen();
  }, [recordEcoCollectionOpen]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.eco + "12", "transparent"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Eco Collection</Text>
        <View style={[styles.sdgBadge, { backgroundColor: colors.eco + "20", borderColor: colors.eco + "40" }]}>
          <Ionicons name="leaf" size={14} color={colors.eco} />
          <Text style={[styles.sdgBadgeText, { color: colors.eco }]}>SDG 12</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad + 24 }}
      >
        {/* Hero Banner */}
        <View style={[styles.heroBanner, { backgroundColor: colors.card, borderColor: colors.eco + "40" }]}>
          <LinearGradient
            colors={[colors.eco + "20", colors.primary + "10"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContent}>
            <View style={[styles.heroIcon, { backgroundColor: colors.eco }]}>
              <Ionicons name="leaf" size={32} color="#000" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroTitle, { color: colors.foreground }]}>
                Shop Sustainably
              </Text>
              <Text style={[styles.heroDesc, { color: colors.mutedForeground }]}>
                Every eco-certified purchase contributes to SDG Goal 12 — Responsible Consumption and Production
              </Text>
            </View>
          </View>
          <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatVal, { color: colors.eco }]}>5%</Text>
              <Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>Revenue donated</Text>
            </View>
            <View style={[styles.heroStatDiv, { backgroundColor: colors.border }]} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatVal, { color: colors.eco }]}>{ecoProducts.length}</Text>
              <Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>Eco products</Text>
            </View>
            <View style={[styles.heroStatDiv, { backgroundColor: colors.border }]} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatVal, { color: colors.eco }]}>100%</Text>
              <Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>Certified</Text>
            </View>
          </View>
        </View>

        {/* Eco Reward Preview */}
        <FadeIn delay={100}>
          <View style={[styles.rewardPreview, { backgroundColor: colors.card, borderColor: colors.eco + "45" }]}>
            <LinearGradient
              colors={[colors.eco + "20", colors.primary + "10", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.rewardTop}>
              <View style={[styles.rewardIcon, { backgroundColor: colors.eco }]}>
                <Ionicons name="leaf" size={22} color="#000" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rewardTitle, { color: colors.foreground }]}>Eco Rewards</Text>
                <Text style={[styles.rewardSub, { color: colors.mutedForeground }]}>Sustainability loyalty wallet</Text>
              </View>
              <Text style={[styles.rewardPoints, { color: colors.eco }]}>{greenPoints} GP</Text>
            </View>
            <View style={styles.rewardStats}>
              <View style={styles.rewardStat}>
                <Text style={[styles.rewardStatValue, { color: colors.foreground }]}>{ecoLevel}</Text>
                <Text style={[styles.rewardStatLabel, { color: colors.mutedForeground }]}>Current level</Text>
              </View>
              <View style={[styles.rewardDivider, { backgroundColor: colors.border }]} />
              <View style={styles.rewardStat}>
                <Text style={[styles.rewardStatValue, { color: colors.foreground }]}>{ecoBadges.length}/6</Text>
                <Text style={[styles.rewardStatLabel, { color: colors.mutedForeground }]}>Badges unlocked</Text>
              </View>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.eco }]} />
            </View>
            <Text style={[styles.rewardHint, { color: colors.mutedForeground }]}>
              {nextTarget.target === greenPoints
                ? "You reached the top sustainability tier"
                : `${Math.max(0, nextTarget.target - greenPoints)} GP until ${nextTarget.label}`}
            </Text>
          </View>
        </FadeIn>

        {/* Sustainability Impact Card */}
        <FadeIn delay={180}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Sustainability Impact</Text>
            <View style={[styles.userImpactCard, { backgroundColor: colors.card, borderColor: colors.eco + "35" }]}>
              <LinearGradient colors={[colors.eco + "15", "transparent"]} style={StyleSheet.absoluteFill} />
              {[
                { icon: "cloud-outline" as const, label: "CO2 saved", value: `${ecoStats.co2Saved}kg`, color: colors.eco },
                { icon: "refresh-outline" as const, label: "Recycled support", value: `${ecoStats.ecoPurchases * 18}%`, color: colors.primary },
                { icon: "leaf-outline" as const, label: "Tree equivalent", value: `${Math.max(1, Math.round(ecoStats.co2Saved / 21))}`, color: colors.gold },
              ].map((item, i) => (
                <View key={i} style={styles.userImpactItem}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                  <Text style={[styles.userImpactValue, { color: colors.foreground }]}>{item.value}</Text>
                  <Text style={[styles.userImpactLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeIn>

        {/* Community Leaderboard */}
        <FadeIn delay={240}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top Green Shoppers</Text>
            <View style={[styles.leaderboardCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {LEADERBOARD.map((member, i) => (
                <View
                  key={member.name}
                  style={[
                    styles.leaderRow,
                    i < LEADERBOARD.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                  ]}
                >
                  <View style={[styles.rankBadge, { backgroundColor: i === 0 ? colors.gold : colors.muted }]}>
                    <Text style={[styles.rankText, { color: i === 0 ? "#000" : colors.foreground }]}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.leaderName, { color: colors.foreground }]}>{member.name}</Text>
                    <Text style={[styles.leaderLevel, { color: colors.mutedForeground }]}>{member.level}</Text>
                  </View>
                  <Text style={[styles.leaderPoints, { color: i === 2 ? colors.eco : colors.primary }]}>{member.points} GP</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeIn>

        {/* Impact Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Our Impact So Far
          </Text>
          <View style={styles.impactGrid}>
            {IMPACT_STATS.map((stat, i) => (
              <View
                key={i}
                style={[
                  styles.impactCard,
                  { backgroundColor: colors.card, borderColor: stat.color + "30" },
                ]}
              >
                <LinearGradient
                  colors={[stat.color + "12", "transparent"]}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name={stat.icon} size={22} color={stat.color} />
                <View style={styles.impactNum}>
                  <Text style={[styles.impactValue, { color: colors.foreground }]}>{stat.value}</Text>
                  {stat.unit ? (
                    <Text style={[styles.impactUnit, { color: stat.color }]}>{stat.unit}</Text>
                  ) : null}
                </View>
                <Text style={[styles.impactLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* SDG Goals */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>SDG Alignment</Text>
          {SDG_GOALS.map((goal, i) => (
            <View
              key={i}
              style={[
                styles.sdgCard,
                { backgroundColor: colors.card, borderColor: goal.color + "30" },
              ]}
            >
              <LinearGradient
                colors={[goal.color + "15", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.sdgNum, { backgroundColor: goal.color }]}>
                <Text style={styles.sdgNumText}>{goal.number}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sdgTitle, { color: colors.foreground }]}>{goal.title}</Text>
                <Text style={[styles.sdgDesc, { color: colors.mutedForeground }]}>{goal.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Eco Products */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Eco Products</Text>
            <View style={[styles.countChip, { backgroundColor: colors.eco + "20" }]}>
              <Text style={[styles.countText, { color: colors.eco }]}>{ecoProducts.length} items</Text>
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productList}
        >
          {ecoProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ScrollView>

        {/* Tips */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sustainability Tips</Text>
          <View style={[styles.tipCard, { backgroundColor: colors.card, borderColor: colors.eco + "30" }]}>
            <LinearGradient
              colors={[colors.eco + "15", "transparent"]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[styles.tipText, { color: colors.foreground }]}>
              💡 {ECO_TIPS[activeTip]}
            </Text>
            <View style={styles.tipNav}>
              <Pressable
                onPress={() => setActiveTip((t) => Math.max(0, t - 1))}
                style={[styles.tipBtn, { backgroundColor: colors.muted }]}
                disabled={activeTip === 0}
              >
                <Ionicons name="arrow-back" size={16} color={activeTip === 0 ? colors.mutedForeground : colors.foreground} />
              </Pressable>
              <Text style={[styles.tipCount, { color: colors.mutedForeground }]}>
                {activeTip + 1}/{ECO_TIPS.length}
              </Text>
              <Pressable
                onPress={() => setActiveTip((t) => Math.min(ECO_TIPS.length - 1, t + 1))}
                style={[styles.tipBtn, { backgroundColor: colors.muted }]}
                disabled={activeTip === ECO_TIPS.length - 1}
              >
                <Ionicons name="arrow-forward" size={16} color={activeTip === ECO_TIPS.length - 1 ? colors.mutedForeground : colors.foreground} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* CTA */}
        <Pressable onPress={() => router.push("/(tabs)/explore")} style={{ marginHorizontal: 20 }}>
          <LinearGradient
            colors={[colors.eco, "#00D084"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            <Ionicons name="search-outline" size={18} color="#000" />
            <Text style={styles.ctaText}>Explore All Eco Shoes</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold" },
  sdgBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  sdgBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  heroBanner: {
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    overflow: "hidden",
    gap: 14,
  },
  heroContent: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  heroIcon: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  heroTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 6 },
  heroDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  heroDivider: { height: 1 },
  heroStats: { flexDirection: "row", alignItems: "center" },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatVal: { fontSize: 22, fontFamily: "Inter_700Bold" },
  heroStatLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2, textAlign: "center" },
  heroStatDiv: { width: 1, height: 28 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 14, flex: 1 },
  countChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  countText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  impactGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  impactCard: {
    width: "47%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
    overflow: "hidden",
  },
  impactNum: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  impactValue: { fontSize: 26, fontFamily: "Inter_700Bold" },
  impactUnit: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  impactLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  sdgCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
    overflow: "hidden",
  },
  sdgNum: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sdgNumText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#000" },
  sdgTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 4 },
  sdgDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  productList: { paddingHorizontal: 20, paddingBottom: 8 },
  tipCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 14,
    overflow: "hidden",
  },
  tipText: { fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 22 },
  tipNav: { flexDirection: "row", alignItems: "center", gap: 12 },
  tipBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  tipCount: { flex: 1, textAlign: "center", fontSize: 13, fontFamily: "Inter_400Regular" },
  cta: { paddingVertical: 16, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  ctaText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#000" },
  rewardPreview: { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 22, overflow: "hidden", gap: 14 },
  rewardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  rewardIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  rewardTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  rewardSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  rewardPoints: { fontSize: 22, fontFamily: "Inter_700Bold" },
  rewardStats: { flexDirection: "row", alignItems: "center" },
  rewardStat: { flex: 1 },
  rewardStatValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  rewardStatLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  rewardDivider: { width: 1, height: 34, marginHorizontal: 14 },
  progressTrack: { height: 8, borderRadius: 8, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 8 },
  rewardHint: { fontSize: 12, fontFamily: "Inter_500Medium" },
  userImpactCard: { borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: "row", overflow: "hidden" },
  userImpactItem: { flex: 1, alignItems: "center", gap: 5 },
  userImpactValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  userImpactLabel: { fontSize: 10, fontFamily: "Inter_500Medium", textAlign: "center" },
  leaderboardCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  leaderRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  rankBadge: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rankText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  leaderName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  leaderLevel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  leaderPoints: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
