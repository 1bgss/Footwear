import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { PRODUCTS, CATEGORIES, getAllProducts } from "@/data/products";
import { SELLER_ANALYTICS } from "@/data/analytics";
import { ProductCard } from "@/components/ProductCard";

function ExploreView() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, sellerProducts } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, Platform.OS === "android" ? 24 : 0);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Use getAllProducts to include seller products in search/filter
  const allProducts = getAllProducts(sellerProducts);

  const filtered = useMemo(() => {
    return allProducts.filter((p) => {
      const matchQuery =
        !query ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.brand.toLowerCase().includes(query.toLowerCase());
      const matchCategory = selectedCategory === "All" || p.category === selectedCategory;
      return matchQuery && matchCategory;
    });
  }, [query, selectedCategory, sellerProducts]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Explore</Text>
      </View>

      {/* Become a Seller banner — only for buyers */}
      {user?.role !== "seller" && (
        <Pressable
          onPress={() => router.push("/become-seller")}
          style={[styles.sellerBanner, { backgroundColor: colors.gold + "10", borderColor: colors.gold + "30" }]}
        >
          <LinearGradient colors={[colors.gold + "15", "transparent"]} style={StyleSheet.absoluteFill} />
          <View style={[styles.sellerBannerIcon, { backgroundColor: colors.gold + "20" }]}>
            <Ionicons name="storefront-outline" size={18} color={colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sellerBannerTitle, { color: colors.foreground }]}>Start Selling on Footwear</Text>
            <Text style={[styles.sellerBannerSub, { color: colors.mutedForeground }]}>
              Join 5,200+ sellers · Open your store today
            </Text>
          </View>
          <View style={[styles.sellerBannerCta, { backgroundColor: colors.gold, borderRadius: 8 }]}>
            <Text style={styles.sellerBannerCtaText}>Open Store</Text>
          </View>
        </Pressable>
      )}

      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search shoes, brands..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[
              styles.catChip,
              {
                backgroundColor: selectedCategory === cat ? colors.primary : colors.card,
                borderColor: selectedCategory === cat ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.catText, { color: selectedCategory === cat ? "#000" : colors.mutedForeground }]}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={[styles.resultCount, { color: colors.mutedForeground, paddingHorizontal: 20, marginBottom: 12 }]}>
        {filtered.length} results
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={[styles.grid, { paddingBottom: bottomPad + 90 }]}
        columnWrapperStyle={styles.row}
        scrollEnabled={!!filtered.length}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/product/${item.id}`)}
            style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <ProductCard product={item} compact />
          </Pressable>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No results found</Text>
          </View>
        )}
      />
    </View>
  );
}

// Animated bar item to avoid hook-in-loop issue
function AnimatedBarItem({
  item,
  index,
  maxVal,
  isLast,
  primaryColor,
  mutedColor,
}: {
  item: { month: string; value: number };
  index: number;
  maxVal: number;
  isLast: boolean;
  primaryColor: string;
  mutedColor: string;
}) {
  const opacity = useSharedValue(0);
  const ty = useSharedValue(12);

  useEffect(() => {
    opacity.value = withDelay(index * 90, withTiming(1, { duration: 400 }));
    ty.value = withDelay(index * 90, withTiming(0, { duration: 400 }));
  }, []);

  const aStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  const pct = Math.round((item.value / maxVal) * 100);

  return (
    <Animated.View style={[styles.barItem, aStyle]}>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.bar,
            {
              height: `${pct}%`,
              backgroundColor: isLast ? primaryColor : primaryColor + "55",
            },
          ]}
        />
      </View>
      <Text style={[styles.barLabel, { color: mutedColor }]}>{item.month}</Text>
    </Animated.View>
  );
}

function AnalyticsView() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, Platform.OS === "android" ? 24 : 0);
  const data = SELLER_ANALYTICS;

  const kpis = [
    { label: "Revenue", value: `$${(data.totalRevenue / 1000).toFixed(1)}k`, icon: "trending-up-outline" as const, color: colors.primary },
    { label: "Orders", value: data.totalOrders.toString(), icon: "receipt-outline" as const, color: colors.eco },
    { label: "Conversion", value: `${data.conversionRate}%`, icon: "analytics-outline" as const, color: colors.gold },
    { label: "SmartFit", value: `${data.smartfitUsage}%`, icon: "scan-outline" as const, color: "#7C3AED" },
  ];

  const recent = data.monthlyRevenue.slice(-6);
  const maxVal = Math.max(...recent.map((d) => d.value));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: bottomPad + 90 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: 0 }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Analytics</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Business Intelligence</Text>
        </View>
        <View style={[styles.livePill, { borderColor: colors.eco + "60" }]}>
          <View style={[styles.liveDotGreen, { backgroundColor: colors.eco }]} />
          <Text style={[styles.liveText, { color: colors.eco }]}>LIVE</Text>
        </View>
      </View>

      <View style={styles.kpiGrid}>
        {kpis.map((kpi, i) => (
          <View key={i} style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: kpi.color + "30" }]}>
            <LinearGradient colors={[kpi.color + "15", "transparent"]} style={StyleSheet.absoluteFill} />
            <Ionicons name={kpi.icon} size={22} color={kpi.color} />
            <Text style={[styles.kpiValue, { color: colors.foreground }]}>{kpi.value}</Text>
            <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>{kpi.label}</Text>
          </View>
        ))}
      </View>

      {/* Animated Bar Chart */}
      <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.chartTitle, { color: colors.foreground }]}>Monthly Revenue</Text>
        <View style={styles.barChart}>
          {recent.map((item, i) => (
            <AnimatedBarItem
              key={i}
              item={item}
              index={i}
              maxVal={maxVal}
              isLast={i === recent.length - 1}
              primaryColor={colors.primary}
              mutedColor={colors.mutedForeground}
            />
          ))}
        </View>
      </View>

      <View style={[styles.tableCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.chartTitle, { color: colors.foreground }]}>Top Products</Text>
        {data.topProducts.map((p, i) => (
          <View key={i} style={[styles.tableRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.tableRank, { color: colors.mutedForeground }]}>#{i + 1}</Text>
            <View style={styles.tableName}>
              <Text style={[styles.tableProduct, { color: colors.foreground }]}>{p.name}</Text>
              <Text style={[styles.tableStats, { color: colors.mutedForeground }]}>{p.sales} sold</Text>
            </View>
            <View style={styles.tableRight}>
              <Text style={[styles.tableRevenue, { color: colors.foreground }]}>
                ${(p.revenue / 1000).toFixed(1)}k
              </Text>
              <Text style={[styles.tableGrowth, { color: colors.eco }]}>+{p.growth}%</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.insightRow}>
        <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.insightTitle, { color: colors.foreground }]}>Foot Type</Text>
          {data.footTypeDistribution.map((ft, i) => (
            <View key={i} style={styles.insightItem}>
              <Text style={[styles.insightLabel, { color: colors.mutedForeground }]}>{ft.type}</Text>
              <View style={[styles.insightBar, { backgroundColor: colors.muted }]}>
                <View style={[styles.insightFill, { width: `${ft.percentage}%` as any, backgroundColor: colors.primary }]} />
              </View>
              <Text style={[styles.insightPct, { color: colors.foreground }]}>{ft.percentage}%</Text>
            </View>
          ))}
        </View>

        <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="leaf" size={20} color={colors.eco} />
          <Text style={[styles.insightTitle, { color: colors.foreground }]}>Eco Share</Text>
          <Text style={[styles.insightBig, { color: colors.eco }]}>{data.ecoProductShare}%</Text>
          <Text style={[styles.insightSub, { color: colors.mutedForeground }]}>of all sales</Text>
        </View>
      </View>
    </ScrollView>
  );
}

export default function ExploreOrAnalyticsScreen() {
  const { user } = useApp();
  if (user?.role === "seller") return <AnalyticsView />;
  return <ExploreView />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  sellerBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    overflow: "hidden",
  },
  sellerBannerIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sellerBannerTitle: { fontSize: 13, fontFamily: "Inter_700Bold" },
  sellerBannerSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  sellerBannerCta: { paddingHorizontal: 10, paddingVertical: 6 },
  sellerBannerCtaText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#000" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  categories: { paddingHorizontal: 20, paddingBottom: 16, gap: 8 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  catText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  resultCount: { fontSize: 13, fontFamily: "Inter_400Regular" },
  grid: { paddingHorizontal: 16 },
  row: { gap: 8, justifyContent: "space-between", marginBottom: 8 },
  gridCard: { flex: 1, borderRadius: 14, overflow: "hidden", borderWidth: 1 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  kpiCard: { width: "47%", borderRadius: 16, borderWidth: 1, padding: 16, gap: 6, overflow: "hidden" },
  kpiValue: { fontSize: 26, fontFamily: "Inter_700Bold" },
  kpiLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  livePill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  liveDotGreen: { width: 7, height: 7, borderRadius: 3.5 },
  liveText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  chartCard: { marginHorizontal: 20, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  chartTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 16 },
  barChart: { flexDirection: "row", alignItems: "flex-end", height: 100, gap: 6 },
  barItem: { flex: 1, alignItems: "center", gap: 4 },
  barTrack: { flex: 1, width: "100%", justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: 4 },
  barLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  tableCard: { marginHorizontal: 20, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16, gap: 4 },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderTopWidth: 1, gap: 10 },
  tableRank: { fontSize: 12, fontFamily: "Inter_400Regular", width: 24 },
  tableName: { flex: 1 },
  tableProduct: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tableStats: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  tableRight: { alignItems: "flex-end" },
  tableRevenue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  tableGrowth: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  insightRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10 },
  insightCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  insightTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  insightBig: { fontSize: 36, fontFamily: "Inter_700Bold" },
  insightSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  insightItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  insightLabel: { fontSize: 12, fontFamily: "Inter_400Regular", width: 50 },
  insightBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  insightFill: { height: "100%", borderRadius: 3 },
  insightPct: { fontSize: 12, fontFamily: "Inter_600SemiBold", width: 35, textAlign: "right" },
});
