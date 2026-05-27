import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
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
import { useApp } from "@/context/AppContext";
import { PRODUCTS, getSmartFitScore, getFootTypeLabel, ActivityType } from "@/data/products";

function ScoreBar({ score, delay = 0 }: { score: number; delay?: number }) {
  const colors = useColors();
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(delay, withTiming(score, { duration: 800 }));
  }, []);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%` as any,
  }));

  const color = score >= 80 ? colors.eco : score >= 50 ? colors.gold : colors.destructive;

  return (
    <View style={[scoreBarStyles.track, { backgroundColor: colors.muted }]}>
      <Animated.View style={[scoreBarStyles.fill, { backgroundColor: color }, barStyle]} />
    </View>
  );
}

const scoreBarStyles = StyleSheet.create({
  track: { height: 8, borderRadius: 4, overflow: "hidden", flex: 1 },
  fill: { height: "100%", borderRadius: 4 },
});

function AnimatedCounter({ target, delay = 0 }: { target: number; delay?: number }) {
  const colors = useColors();
  const value = useSharedValue(0);
  const [display, setDisplay] = React.useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0;
      const step = target / 30;
      const interval = setInterval(() => {
        start = Math.min(start + step, target);
        setDisplay(Math.round(start));
        if (start >= target) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  return <Text style={[counterStyles.num, { color: colors.foreground }]}>{display}</Text>;
}

const counterStyles = StyleSheet.create({
  num: { fontSize: 42, fontFamily: "Inter_700Bold" },
});

export default function SmartFitResultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { footScanResult } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, Platform.OS === "android" ? 24 : 0);

  if (!footScanResult) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center", gap: 16 }]}>
        <Ionicons name="scan-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.noScanText, { color: colors.mutedForeground }]}>
          No foot scan data found
        </Text>
        <Pressable onPress={() => router.push("/foot-scan")}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.scanNowBtn}
          >
            <Text style={styles.scanNowText}>Scan Now</Text>
          </LinearGradient>
        </Pressable>
      </View>
    );
  }

  const footType = footScanResult.footType;
  const footTypeColors = { narrow: colors.accent, normal: colors.eco, wide: colors.gold };
  const accentColor = footTypeColors[footType] ?? colors.primary;

  const scoredProducts = PRODUCTS.map((p) => ({
    product: p,
    score: getSmartFitScore(p, footType, true, p.activity_type as ActivityType),
  })).sort((a, b) => b.score - a.score);

  const recommended = scoredProducts.filter((s) => s.score >= 70).slice(0, 4);
  const notRecommended = scoredProducts.filter((s) => s.score < 40).slice(0, 3);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[accentColor + "12", "transparent", "rgba(0,180,255,0.05)"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>SmartFit Results</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad + 24 }}
      >
        {/* Foot type card */}
        <View style={[styles.footTypeCard, { backgroundColor: colors.card, borderColor: accentColor + "40" }]}>
          <LinearGradient
            colors={[accentColor + "20", "transparent"]}
            style={StyleSheet.absoluteFill}
          />
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>DETECTED FOOT TYPE</Text>
          <Text style={[styles.footType, { color: accentColor }]}>
            {getFootTypeLabel(footType)}
          </Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: colors.foreground }]}>
                {footScanResult.footLength}mm
              </Text>
              <Text style={[styles.metricLbl, { color: colors.mutedForeground }]}>Length</Text>
            </View>
            <View style={[styles.metricDiv, { backgroundColor: colors.border }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: colors.foreground }]}>
                {footScanResult.footWidth}mm
              </Text>
              <Text style={[styles.metricLbl, { color: colors.mutedForeground }]}>Width</Text>
            </View>
            <View style={[styles.metricDiv, { backgroundColor: colors.border }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: colors.foreground }]}>
                {footScanResult.widthRatio}
              </Text>
              <Text style={[styles.metricLbl, { color: colors.mutedForeground }]}>Ratio</Text>
            </View>
          </View>
        </View>

        {/* AI analysis fake */}
        <View style={[styles.aiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.aiHeader}>
            <View style={[styles.aiDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.aiLabel, { color: colors.primary }]}>SmartFit AI Analysis</Text>
            <View style={[styles.premiumBadge, { backgroundColor: colors.gold + "20" }]}>
              <Ionicons name="star" size={10} color={colors.gold} />
              <Text style={[styles.premiumText, { color: colors.gold }]}>PREMIUM</Text>
            </View>
          </View>
          <Text style={[styles.aiText, { color: colors.foreground }]}>
            {footType === "wide"
              ? "Your wide foot profile indicates you need shoes with a roomy toe box and flexible upper materials. Running shoes and hiking boots with wide fit options will provide optimal comfort and prevent blisters."
              : footType === "narrow"
              ? "Your narrow foot profile suggests you need snug-fitting shoes with good lateral support. Look for shoes marketed for narrow feet or those with adjustable lacing systems for a secure fit."
              : "Your normal foot profile is compatible with most shoe types. You have great flexibility in choosing footwear, but still look for shoes that match your primary activity for best performance."}
          </Text>
          <View style={styles.tags}>
            {(footType === "wide"
              ? ["Wide Toe Box", "Flexible Upper", "Cushioned Sole"]
              : footType === "narrow"
              ? ["Snug Fit", "Lateral Support", "Secure Lacing"]
              : ["Versatile Fit", "Standard Width", "All-Activity"]
            ).map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recommended */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-circle" size={18} color={colors.eco} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recommended</Text>
          </View>
          {recommended.map(({ product, score }, i) => (
            <Pressable
              key={product.id}
              onPress={() => router.push(`/product/${product.id}`)}
              style={[styles.productRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Image source={product.image} style={styles.productImg} />
              <View style={styles.productInfo}>
                <Text style={[styles.productBrand, { color: colors.mutedForeground }]}>{product.brand}</Text>
                <Text style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>
                <View style={styles.scoreRow}>
                  <ScoreBar score={score} delay={i * 100} />
                  <Text style={[styles.scoreText, { color: score >= 80 ? colors.eco : colors.gold }]}>
                    {score}%
                  </Text>
                </View>
              </View>
              {product.eco_friendly && (
                <Ionicons name="leaf" size={14} color={colors.eco} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Not Recommended */}
        {notRecommended.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="warning" size={18} color={colors.destructive} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>May Not Fit Well</Text>
            </View>
            {notRecommended.map(({ product, score }) => (
              <View
                key={product.id}
                style={[styles.productRow, { backgroundColor: colors.card, borderColor: colors.border, opacity: 0.7 }]}
              >
                <Image source={product.image} style={styles.productImg} />
                <View style={styles.productInfo}>
                  <Text style={[styles.productBrand, { color: colors.mutedForeground }]}>{product.brand}</Text>
                  <Text style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>
                  <Text style={[styles.warnText, { color: colors.destructive }]}>
                    May feel too {footType === "wide" ? "tight" : "loose"}
                  </Text>
                </View>
                <Ionicons name="close-circle" size={16} color={colors.destructive} />
              </View>
            ))}
          </View>
        )}

        {/* CTA */}
        <Pressable
          onPress={() => router.push("/(tabs)/explore")}
          style={{ marginHorizontal: 20 }}
        >
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            <Ionicons name="search-outline" size={18} color="#000" />
            <Text style={styles.ctaText}>Explore Matching Shoes</Text>
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  noScanText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  scanNowBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  scanNowText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#000" },
  footTypeCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  footType: { fontSize: 36, fontFamily: "Inter_700Bold", marginVertical: 8 },
  metricsRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  metricItem: { flex: 1, alignItems: "center" },
  metricVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  metricLbl: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  metricDiv: { width: 1, height: 30, marginHorizontal: 4 },
  aiCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  aiDot: { width: 8, height: 8, borderRadius: 4 },
  aiLabel: { flex: 1, fontSize: 13, fontFamily: "Inter_700Bold" },
  premiumBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 3 },
  premiumText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  aiText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  tagText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  productImg: { width: 60, height: 60, borderRadius: 10, resizeMode: "cover" },
  productInfo: { flex: 1, gap: 3 },
  productBrand: { fontSize: 11, fontFamily: "Inter_400Regular" },
  productName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  scoreText: { fontSize: 13, fontFamily: "Inter_700Bold", width: 36 },
  warnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  cta: { paddingVertical: 16, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  ctaText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#000" },
});
