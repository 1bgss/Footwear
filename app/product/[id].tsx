import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { PRODUCTS, getSmartFitScore, ActivityType } from "@/data/products";

function MetaBadge({ label, value, color }: { label: string; value: string; color?: string }) {
  const colors = useColors();
  return (
    <View style={[badgeStyles.badge, { backgroundColor: (color ?? colors.primary) + "15", borderColor: (color ?? colors.primary) + "30" }]}>
      <Text style={[badgeStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[badgeStyles.value, { color: color ?? colors.primary }]}>{value}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  label: { fontSize: 10, fontFamily: "Inter_400Regular", marginBottom: 2 },
  value: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addToCart, footScanResult } = useApp();
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.foreground }}>Product not found</Text>
      </View>
    );
  }

  const score = getSmartFitScore(
    product,
    footScanResult?.footType ?? null,
    true,
    product.activity_type as ActivityType
  );

  const scoreColor =
    score >= 80 ? colors.eco : score >= 50 ? colors.gold : colors.destructive;

  const handleAddToCart = () => {
    if (!selectedSize) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addToCart(product, selectedSize);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad + 100 }}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image source={product.images[activeImg]} style={styles.heroImage} />
          <LinearGradient
            colors={["transparent", colors.background]}
            style={styles.imageGradient}
          />
          {product.eco_friendly && (
            <View style={[styles.ecoBadge, { backgroundColor: colors.eco }]}>
              <Ionicons name="leaf" size={12} color="#000" />
              <Text style={styles.ecoBadgeText}>Eco Certified</Text>
            </View>
          )}
          <View style={styles.imgDots}>
            {product.images.map((_, i) => (
              <Pressable key={i} onPress={() => setActiveImg(i)}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: activeImg === i ? colors.primary : colors.border, width: activeImg === i ? 20 : 8 },
                  ]}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Back button */}
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { top: topPad + 8, backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.productHeader}>
            <View style={styles.productTitles}>
              <Text style={[styles.brand, { color: colors.mutedForeground }]}>{product.brand}</Text>
              <Text style={[styles.name, { color: colors.foreground }]}>{product.name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={colors.gold} />
                <Text style={[styles.rating, { color: colors.foreground }]}>{product.rating}</Text>
                <Text style={[styles.reviews, { color: colors.mutedForeground }]}>({product.reviewCount} reviews)</Text>
              </View>
            </View>
            <View style={styles.priceBlock}>
              <Text style={[styles.price, { color: colors.foreground }]}>${product.price}</Text>
              {product.originalPrice && (
                <Text style={[styles.origPrice, { color: colors.mutedForeground }]}>${product.originalPrice}</Text>
              )}
            </View>
          </View>

          {/* SmartFit Card */}
          <Pressable onPress={() => router.push("/foot-scan")} style={[styles.smartfitCard, { borderColor: scoreColor + "40", backgroundColor: scoreColor + "10" }]}>
            <View style={styles.smartfitRow}>
              <View>
                <Text style={[styles.smartfitTitle, { color: scoreColor }]}>SmartFit Analysis</Text>
                <Text style={[styles.smartfitDesc, { color: colors.mutedForeground }]}>
                  {footScanResult
                    ? `Recommended for ${product.fit_type} feet`
                    : "Scan your foot for personalized fit"}
                </Text>
              </View>
              <View style={styles.scoreCircle}>
                <Text style={[styles.scoreNum, { color: scoreColor }]}>{score}</Text>
                <Text style={[styles.scorePct, { color: colors.mutedForeground }]}>%</Text>
              </View>
            </View>
            <View style={[styles.scoreBar, { backgroundColor: colors.muted }]}>
              <View style={[styles.scoreFill, { width: `${score}%` as any, backgroundColor: scoreColor }]} />
            </View>
          </Pressable>

          {/* Metadata badges */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
            <View style={styles.metaRow}>
              <MetaBadge label="FIT" value={product.fit_type.toUpperCase()} />
              <MetaBadge label="ACTIVITY" value={product.activity_type.toUpperCase()} color={colors.accent} />
              <MetaBadge label="COMFORT" value={product.comfort_level.toUpperCase()} color={product.comfort_level === "high" ? colors.eco : colors.gold} />
              <MetaBadge label="CUSHION" value={product.cushioning.toUpperCase()} color="#7C3AED" />
              <MetaBadge label="STYLE" value={product.style_type.toUpperCase()} color={colors.gold} />
              {product.eco_friendly && <MetaBadge label="ECO" value="CERTIFIED" color={colors.eco} />}
            </View>
          </ScrollView>

          {/* Description */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ABOUT</Text>
          <Text style={[styles.description, { color: colors.foreground }]}>{product.description}</Text>

          {/* Size selection */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>SELECT SIZE (EU)</Text>
          <View style={styles.sizeGrid}>
            {product.sizes.map((size) => (
              <Pressable
                key={size}
                onPress={() => setSelectedSize(size)}
                style={[
                  styles.sizeChip,
                  {
                    backgroundColor: selectedSize === size ? colors.primary : colors.card,
                    borderColor: selectedSize === size ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sizeText,
                    { color: selectedSize === size ? "#000" : colors.foreground },
                  ]}
                >
                  {size}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <Pressable
              onPress={() => router.push(`/ar-tryon?productId=${product.id}`)}
              style={[styles.arBtn, { borderColor: colors.primary }]}
            >
              <LinearGradient
                colors={[colors.primary + "20", colors.accent + "10"]}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="cube-outline" size={18} color={colors.primary} />
              <Text style={[styles.arBtnText, { color: colors.primary }]}>AR Try-On</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/foot-scan")}
              style={[styles.scanBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            >
              <Ionicons name="scan-outline" size={18} color={colors.foreground} />
              <Text style={[styles.scanBtnText, { color: colors.foreground }]}>Scan Foot</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Add to cart */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 16 }]}>
        <Pressable
          onPress={handleAddToCart}
          disabled={!selectedSize || addedToCart}
          style={{ flex: 1 }}
        >
          <LinearGradient
            colors={addedToCart ? [colors.eco, colors.eco + "CC"] : [colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.addBtn, (!selectedSize) && { opacity: 0.4 }]}
          >
            <Ionicons name={addedToCart ? "checkmark" : "bag-add-outline"} size={20} color="#000" />
            <Text style={styles.addBtnText}>
              {addedToCart ? "Added to Cart!" : !selectedSize ? "Select a Size" : "Add to Cart"}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageContainer: { position: "relative", height: 340 },
  heroImage: { width: "100%", height: "100%", resizeMode: "cover" },
  imageGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: 120 },
  backBtn: { position: "absolute", left: 16, borderRadius: 12, padding: 10 },
  ecoBadge: {
    position: "absolute",
    top: 56,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  ecoBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#000" },
  imgDots: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  dot: { height: 8, borderRadius: 4 },
  content: { padding: 20 },
  productHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  productTitles: { flex: 1 },
  brand: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 4 },
  name: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 8, lineHeight: 28 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  rating: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  reviews: { fontSize: 12, fontFamily: "Inter_400Regular" },
  priceBlock: { alignItems: "flex-end" },
  price: { fontSize: 26, fontFamily: "Inter_700Bold" },
  origPrice: { fontSize: 14, fontFamily: "Inter_400Regular", textDecorationLine: "line-through" },
  smartfitCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20, gap: 12 },
  smartfitRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  smartfitTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 4 },
  smartfitDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  scoreCircle: { flexDirection: "row", alignItems: "baseline", gap: 1 },
  scoreNum: { fontSize: 32, fontFamily: "Inter_700Bold" },
  scorePct: { fontSize: 14, fontFamily: "Inter_400Regular" },
  scoreBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  scoreFill: { height: "100%", borderRadius: 3 },
  metaRow: { flexDirection: "row", gap: 8, paddingRight: 16 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1, marginBottom: 10 },
  description: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  sizeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  sizeChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  sizeText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  actions: { flexDirection: "row", gap: 10, marginBottom: 12 },
  arBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 14, borderWidth: 1.5, overflow: "hidden", gap: 6 },
  arBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scanBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 14, borderWidth: 1, gap: 6 },
  scanBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 18, borderRadius: 16, gap: 8 },
  addBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#000" },
});
