import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { Product } from "@/data/products";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const colors = useColors();
  const [liked, setLiked] = useState(false);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSpring(0.97, {}, () => { scale.value = withSpring(1); });
    router.push(`/product/${product.id}`);
  };

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLiked((v) => !v);
  };

  // Support both require() format and URI format for seller products
  const imageSource = typeof product.image === 'string' ? { uri: product.image } : product.image;

  if (compact) {
    return (
      <Animated.View style={animStyle}>
        <Pressable onPress={handlePress} style={[styles.compactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Image source={imageSource} style={styles.compactImage} />
          <View style={styles.compactInfo}>
            <Text style={[styles.compactBrand, { color: colors.mutedForeground }]}>{product.brand}</Text>
            <Text style={[styles.compactName, { color: colors.foreground }]} numberOfLines={1}>{product.name}</Text>
            <Text style={[styles.compactPrice, { color: colors.primary }]}>${product.price}</Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animStyle}>
      <Pressable onPress={handlePress} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.imageContainer}>
          <Image source={imageSource} style={styles.image} />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.6)"]}
            style={StyleSheet.absoluteFill}
          />
          <Pressable onPress={handleLike} style={styles.heartBtn}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={20}
              color={liked ? "#FF4560" : "#fff"}
            />
          </Pressable>
          {product.isNew && (
            <View style={[styles.newBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
          {product.eco_friendly && (
            <View style={[styles.ecoBadge, { backgroundColor: colors.eco }]}>
              <Ionicons name="leaf" size={10} color="#000" />
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={[styles.brand, { color: colors.mutedForeground }]}>{product.brand}</Text>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{product.name}</Text>
          <View style={styles.row}>
            <Ionicons name="star" size={12} color={colors.gold} />
            <Text style={[styles.rating, { color: colors.mutedForeground }]}>{product.rating} ({product.reviewCount})</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.foreground }]}>${product.price}</Text>
            {product.originalPrice && (
              <Text style={[styles.originalPrice, { color: colors.mutedForeground }]}>${product.originalPrice}</Text>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 170,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    marginRight: 12,
  },
  imageContainer: { position: "relative", width: "100%", height: 160 },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  heartBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 6,
  },
  newBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  newBadgeText: { color: "#000", fontSize: 10, fontFamily: "Inter_700Bold" },
  ecoBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { padding: 12 },
  brand: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 2 },
  name: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 6 },
  rating: { fontSize: 11, fontFamily: "Inter_400Regular" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  price: { fontSize: 16, fontFamily: "Inter_700Bold" },
  originalPrice: { fontSize: 12, fontFamily: "Inter_400Regular", textDecorationLine: "line-through" },
  compactCard: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
    alignItems: "center",
    gap: 12,
  },
  compactImage: { width: 60, height: 60, borderRadius: 8, resizeMode: "cover" },
  compactInfo: { flex: 1 },
  compactBrand: { fontSize: 11, fontFamily: "Inter_400Regular" },
  compactName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginVertical: 2 },
  compactPrice: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
