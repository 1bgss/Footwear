import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
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
import { ProductCard } from "@/components/ProductCard";

export default function StoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const { sellerStores, sellerProducts } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, Platform.OS === "android" ? 24 : 0);

  const store = sellerStores.find((s) => s.id === id);
  const storeProducts = sellerProducts.filter((p) => p.storeId === id);

  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);

  React.useEffect(() => {
    fadeAnim.value = withDelay(100, withTiming(1, { duration: 600 }));
    slideAnim.value = withDelay(100, withSpring(0, { damping: 12 }));
  }, []);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value }));
  const slideStyle = useAnimatedStyle(() => ({ transform: [{ translateY: slideAnim.value }] }));

  if (!store) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center", gap: 16 }]}>
        <Ionicons name="storefront-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Store not found</Text>
        <Pressable onPress={() => router.back()}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>Go Back</Text>
          </LinearGradient>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary + "12", "transparent", colors.eco + "08"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Store</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad + 24 }}
      >
        {/* Hero Banner */}
        <Animated.View style={[fadeStyle, slideStyle]}>
          <View style={styles.heroContainer}>
            {store.bannerUri ? (
              <Image source={{ uri: store.bannerUri }} style={styles.banner} />
            ) : (
              <LinearGradient
                colors={[colors.primary + "30", colors.accent + "20", colors.eco + "10"]}
                style={styles.bannerPlaceholder}
              />
            )}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.8)"]}
              style={styles.bannerOverlay}
            />
            
            {/* Store Logo */}
            <View style={styles.logoContainer}>
              {store.logoUri ? (
                <Image source={{ uri: store.logoUri }} style={styles.logo} />
              ) : (
                <View style={[styles.logoPlaceholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name="storefront" size={32} color={colors.primary} />
                </View>
              )}
            </View>

            {/* Store Info */}
            <View style={styles.storeInfo}>
              <View style={styles.storeHeader}>
                <Text style={[styles.storeName, { color: colors.foreground }]}>{store.name}</Text>
                {store.isEcoCertified && (
                  <View style={[styles.ecoBadge, { backgroundColor: colors.eco }]}>
                    <Ionicons name="leaf" size={12} color="#000" />
                    <Text style={styles.ecoBadgeText}>Eco</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.storeUsername, { color: colors.mutedForeground }]}>@{store.username}</Text>
              <Text style={[styles.storeDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                {store.description}
              </Text>
              
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{store.city}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={14} color={colors.gold} />
                  <Text style={[styles.metaText, { color: colors.foreground }]}>{store.rating}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="pricetag-outline" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{store.category}</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Analytics Card */}
        <Animated.View style={[fadeStyle, slideStyle]}>
          <View style={[styles.analyticsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <LinearGradient colors={[colors.primary + "10", "transparent"]} style={StyleSheet.absoluteFill} />
            <Text style={[styles.analyticsTitle, { color: colors.foreground }]}>Store Overview</Text>
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsItem}>
                <Text style={[styles.analyticsValue, { color: colors.primary }]}>{store.totalProducts}</Text>
                <Text style={[styles.analyticsLabel, { color: colors.mutedForeground }]}>Products</Text>
              </View>
              <View style={[styles.analyticsDivider, { backgroundColor: colors.border }]} />
              <View style={styles.analyticsItem}>
                <Text style={[styles.analyticsValue, { color: colors.eco }]}>{store.totalSales}</Text>
                <Text style={[styles.analyticsLabel, { color: colors.mutedForeground }]}>Sales</Text>
              </View>
              <View style={[styles.analyticsDivider, { backgroundColor: colors.border }]} />
              <View style={styles.analyticsItem}>
                <Text style={[styles.analyticsValue, { color: colors.gold }]}>{store.rating}</Text>
                <Text style={[styles.analyticsLabel, { color: colors.mutedForeground }]}>Rating</Text>
              </View>
            </View>
            <View style={styles.growthRow}>
              <View style={[styles.growthBadge, { backgroundColor: colors.eco + "15", borderColor: colors.eco + "30" }]}>
                <Ionicons name="trending-up" size={12} color={colors.eco} />
                <Text style={[styles.growthText, { color: colors.eco }]}>+24% this month</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Products Section */}
        <Animated.View style={[fadeStyle, slideStyle]}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Products ({storeProducts.length})
            </Text>
            {storeProducts.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="cube-outline" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No products yet</Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                  This store hasn't uploaded any products
                </Text>
              </View>
            ) : (
              <View style={styles.productsGrid}>
                {storeProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </View>
            )}
          </View>
        </Animated.View>

        {/* Contact Section */}
        <Animated.View style={[fadeStyle, slideStyle]}>
          <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.contactTitle, { color: colors.foreground }]}>Contact Store</Text>
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={18} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.foreground }]}>{store.contact}</Text>
            </View>
            {store.instagram && (
              <View style={styles.contactRow}>
                <Ionicons name="logo-instagram" size={18} color={colors.accent} />
                <Text style={[styles.contactText, { color: colors.foreground }]}>{store.instagram}</Text>
              </View>
            )}
            <View style={styles.contactRow}>
              <Ionicons name="location-outline" size={18} color={colors.eco} />
              <Text style={[styles.contactText, { color: colors.foreground }]}>{store.address}, {store.city}</Text>
            </View>
          </View>
        </Animated.View>
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
  closeBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  
  heroContainer: { marginBottom: 24 }, // 🔧 Diperbaiki: jarak lebih lega sebelum Store Overview
  banner: { width: "100%", height: 200 },
  bannerPlaceholder: { width: "100%", height: 200 },
  bannerOverlay: { ...StyleSheet.absoluteFillObject },
  
  logoContainer: {
    marginTop: -40,        // 🔧 Ganti position: absolute -> negative margin (tetap di layout flow)
    marginLeft: 20,
    marginBottom: 16,      // 🔧 Beri napas ke storeInfo di bawahnya
    zIndex: 10,            // 🔧 Pastikan logo di atas overlay
    elevation: 8,          // Android shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  
  logo: { width: 80, height: 80, borderRadius: 20, borderWidth: 3, borderColor: "#fff" },
  logoPlaceholder: {
    width: 80, height: 80, borderRadius: 20,
    borderWidth: 3, borderColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  storeInfo: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 }, // PT 50 tetap agar teks tidak tertutup logo
  
  storeHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  storeName: { fontSize: 24, fontFamily: "Inter_700Bold" },
  ecoBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ecoBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#000" },
  storeUsername: { fontSize: 14, fontFamily: "Inter_500Medium", marginBottom: 8 },
  storeDesc: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 12 },
  
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",   // 🔧 KUNCI: pindah baris jika layar sempit
    gap: 16,
    alignItems: "center"
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1       // 🔧 KUNCI: izinkan item mengecil rapi
  },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  
  analyticsCard: {
    marginHorizontal: 20, borderRadius: 16, borderWidth: 1,
    padding: 20, marginBottom: 20, overflow: "hidden",
  },
  analyticsTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 16 },
  analyticsGrid: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  analyticsItem: { flex: 1, alignItems: "center" },
  analyticsValue: { fontSize: 24, fontFamily: "Inter_700Bold" },
  analyticsLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  analyticsDivider: { width: 1, height: 40 },
  growthRow: { alignItems: "center" },
  growthBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  growthText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 12 },
  productsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  emptyState: { borderRadius: 16, borderWidth: 1, padding: 40, alignItems: "center", gap: 12 },
  emptyText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  
  contactCard: {
    marginHorizontal: 20, borderRadius: 16, borderWidth: 1,
    padding: 20, marginBottom: 20, gap: 12,
  },
  contactTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  contactText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  
  errorText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#000" },
});