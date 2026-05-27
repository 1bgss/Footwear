import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
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
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { ProductCard } from "@/components/ProductCard";
import { PRODUCTS, CATEGORIES, BRANDS, getEcoProducts } from "@/data/products";
import { useApp } from "@/context/AppContext";

const FEATURED = PRODUCTS.filter((p) => p.isFeatured);
const ECO_PICKS = getEcoProducts().slice(0, 4);

function AnimatedHeader({ scrollY }: { scrollY: Animated.SharedValue<number> }) {
  const colors = useColors();
  const { user } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const headerStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(10,10,15,${interpolate(scrollY.value, [0, 80], [0, 0.95], Extrapolation.CLAMP)})`,
  }));

  return (
    <Animated.View style={[styles.header, headerStyle, { paddingTop: topPad + 8 }]}>
      <View>
        <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
          Good morning,
        </Text>
        <Text style={[styles.userName, { color: colors.foreground }]}>
          {user?.name ?? "Explorer"}
        </Text>
      </View>
      <Pressable
        onPress={() => router.push("/(tabs)/profile")}
        style={[styles.avatar, { backgroundColor: colors.primary + "30", borderColor: colors.primary }]}
      >
        <Text style={[styles.avatarText, { color: colors.primary }]}>
          {(user?.name ?? "U")[0].toUpperCase()}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState("All");
  const scrollY = useSharedValue(0);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, Platform.OS === "android" ? 24 : 0);

  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const filteredProducts =
    activeCategory === "All"
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === activeCategory);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(0,180,255,0.06)", "transparent"]}
        style={[styles.bgGradient, { height: 300 }]}
      />

      <AnimatedHeader scrollY={scrollY} />

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad + 72,
          paddingBottom: bottomPad + 90,
        }}
      >
        {/* Search bar */}
        <Pressable
          onPress={() => router.push("/(tabs)/explore")}
          style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
          <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
            Search shoes, brands...
          </Text>
          <View style={[styles.scanChip, { backgroundColor: colors.primary + "20" }]}>
            <Ionicons name="scan-outline" size={14} color={colors.primary} />
            <Text style={[styles.scanChipText, { color: colors.primary }]}>SmartFit</Text>
          </View>
        </Pressable>

        {/* Featured Banner */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Featured</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {FEATURED.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ScrollView>

        {/* SmartFit Banner */}
        <Pressable onPress={() => router.push("/foot-scan")} style={styles.smartfitBanner}>
          <LinearGradient
            colors={[colors.primary + "30", colors.accent + "20"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.smartfitGradient, { borderColor: colors.primary + "40" }]}
          >
            <View style={styles.smartfitContent}>
              <View>
                <Text style={[styles.smartfitLabel, { color: colors.primary }]}>
                  SMARTFIT AI
                </Text>
                <Text style={[styles.smartfitTitle, { color: colors.foreground }]}>
                  Find Your Perfect Fit
                </Text>
                <Text style={[styles.smartfitDesc, { color: colors.mutedForeground }]}>
                  Scan your foot & get personalized recommendations
                </Text>
              </View>
              <View style={[styles.scanIconWrap, { backgroundColor: colors.primary }]}>
                <Ionicons name="scan" size={28} color="#000" />
              </View>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Categories</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: activeCategory === cat ? colors.primary : colors.card,
                  borderColor: activeCategory === cat ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: activeCategory === cat ? "#000" : colors.mutedForeground },
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Products Grid */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {activeCategory === "All" ? "All Shoes" : activeCategory}
          </Text>
          <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
            {filteredProducts.length} items
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ScrollView>

        {/* Brands */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Local Brands</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.brands}
        >
          {BRANDS.map((brand) => (
            <Pressable
              key={brand}
              onPress={() => router.push("/(tabs)/explore")}
              style={[styles.brandCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.brandIcon, { backgroundColor: colors.primary + "20" }]}>
                <Ionicons name="storefront-outline" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.brandName, { color: colors.foreground }]}>{brand}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Eco Section */}
        <Pressable onPress={() => router.push("/eco")} style={styles.ecoHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Eco Collection
            </Text>
            <Text style={[styles.sectionSub, { color: colors.eco }]}>
              SDG 12 — Responsible Consumption
            </Text>
          </View>
          <View style={[styles.ecoChip, { backgroundColor: colors.eco + "20" }]}>
            <Ionicons name="leaf-outline" size={14} color={colors.eco} />
            <Text style={[styles.ecoChipText, { color: colors.eco }]}>View All</Text>
          </View>
        </Pressable>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {ECO_PICKS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ScrollView>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgGradient: { position: "absolute", top: 0, left: 0, right: 0 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  greeting: { fontSize: 12, fontFamily: "Inter_400Regular" },
  userName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchPlaceholder: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  scanChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  scanChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  sectionCount: { fontSize: 13, fontFamily: "Inter_400Regular" },
  sectionSub: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  horizontalList: { paddingHorizontal: 20, paddingBottom: 24 },
  smartfitBanner: { marginHorizontal: 20, marginBottom: 24 },
  smartfitGradient: { borderRadius: 18, borderWidth: 1 },
  smartfitContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  smartfitLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.5, marginBottom: 4 },
  smartfitTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 6 },
  smartfitDesc: { fontSize: 13, fontFamily: "Inter_400Regular", maxWidth: 200 },
  scanIconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  categories: { paddingHorizontal: 20, paddingBottom: 20, gap: 8 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  brands: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  brandCard: {
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    minWidth: 90,
  },
  brandIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  brandName: { fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  ecoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  ecoChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 4 },
  ecoChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
