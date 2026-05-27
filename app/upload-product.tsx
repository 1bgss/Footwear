import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
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
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { ActivityType, ComfortLevel, CushioningType, FitType, MaterialType, StyleType } from "@/data/products";

const CATEGORIES = ["Running", "Casual", "Sport", "Hiking", "Formal", "Streetwear"];
const FIT_TYPES: FitType[] = ["narrow", "normal", "wide"];
const ACTIVITY_TYPES: ActivityType[] = ["running", "casual", "sport", "hiking", "formal", "streetwear"];
const COMFORT_LEVELS: ComfortLevel[] = ["low", "medium", "high"];
const CUSHIONING_TYPES: CushioningType[] = ["soft", "medium", "hard", "firm"];
const STYLE_TYPES: StyleType[] = ["sporty", "elegant", "minimalist", "streetwear", "outdoor", "eco_lifestyle"];
const MATERIAL_TYPES: MaterialType[] = ["recycled", "vegan", "leather", "knit"];
const RECOMMENDED_FOR: FitType[] = ["narrow", "normal", "wide"];
const AVOID_FOR: FitType[] = ["narrow", "normal", "wide"];

export default function UploadProductScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, sellerStores, uploadSellerProduct } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, Platform.OS === "android" ? 24 : 0);

  const sellerStore = sellerStores.find((s) => s.ownerUserId === user?.id);

  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [category, setCategory] = useState("");
  const [fitType, setFitType] = useState<FitType>("normal");
  const [activityType, setActivityType] = useState<ActivityType>("casual");
  const [comfortLevel, setComfortLevel] = useState<ComfortLevel>("medium");
  const [cushioning, setCushioning] = useState<CushioningType>("medium");
  const [styleType, setStyleType] = useState<StyleType>("sporty");
  const [materialType, setMaterialType] = useState<MaterialType>("leather");
  const [ecoFriendly, setEcoFriendly] = useState(false);
  const [ecoDiscount, setEcoDiscount] = useState("");
  const [recommendedFor, setRecommendedFor] = useState<FitType[]>([]);
  const [avoidFor, setAvoidFor] = useState<FitType[]>([]);
  const [imageUris, setImageUris] = useState<string[]>([]);

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newUris = result.assets.map((asset) => asset.uri);
        setImageUris((prev) => [...prev, ...newUris]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick images");
    }
  };

  const removeImage = (index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleRecommendedFor = (type: FitType) => {
    setRecommendedFor((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleAvoidFor = (type: FitType) => {
    setAvoidFor((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = async () => {
    if (!sellerStore) {
      Alert.alert("Error", "No store found. Please create a store first.");
      return;
    }

    if (!productName || !description || !price || !category || imageUris.length === 0) {
      Alert.alert("Missing Fields", "Please fill in all required fields and add at least one image");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    btnScale.value = withSequence(withTiming(0.94, { duration: 100 }), withSpring(1, { damping: 10 }));

    try {
      await uploadSellerProduct({
        sellerId: user!.id,
        storeId: sellerStore.id,
        name: productName,
        brand: sellerStore.name,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        rating: 4.5,
        reviewCount: 0,
        image: imageUris[0],
        images: imageUris,
        category,
        description,
        sizes: [38, 39, 40, 41, 42, 43, 44, 45],
        fit_type: fitType,
        recommended_for: recommendedFor,
        avoid_for: avoidFor,
        comfort_level: comfortLevel,
        activity_type: activityType,
        eco_friendly: ecoFriendly,
        eco_discount: ecoDiscount ? parseFloat(ecoDiscount) : undefined,
        material_type: materialType,
        style_type: styleType,
        cushioning,
        isNew: true,
        imageUri: imageUris[0],
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Product uploaded successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to upload product");
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary + "12", "transparent", colors.eco + "08"]}
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
        <Text style={[styles.title, { color: colors.foreground }]}>Upload Product</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad + 32 }}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "40" }]}>
            <Ionicons name="add-circle-outline" size={44} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>Add New Product</Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            Upload your product to {sellerStore?.name || "your store"}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Product Name */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Product Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Enter product name"
              placeholderTextColor={colors.mutedForeground}
              value={productName}
              onChangeText={setProductName}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Description *</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Describe your product..."
              placeholderTextColor={colors.mutedForeground}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Price */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Price ($) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="0.00"
              placeholderTextColor={colors.mutedForeground}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Original Price */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Original Price ($) (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="0.00"
              placeholderTextColor={colors.mutedForeground}
              value={originalPrice}
              onChangeText={setOriginalPrice}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Category */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Category *</Text>
            <View style={styles.chipsContainer}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: category === cat ? colors.primary : colors.card,
                      borderColor: category === cat ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: category === cat ? "#000" : colors.mutedForeground },
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Fit Type */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Fit Type *</Text>
            <View style={styles.chipsContainer}>
              {FIT_TYPES.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setFitType(type)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: fitType === type ? colors.primary : colors.card,
                      borderColor: fitType === type ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: fitType === type ? "#000" : colors.mutedForeground },
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Activity Type */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Activity Type *</Text>
            <View style={styles.chipsContainer}>
              {ACTIVITY_TYPES.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setActivityType(type)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: activityType === type ? colors.primary : colors.card,
                      borderColor: activityType === type ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: activityType === type ? "#000" : colors.mutedForeground },
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Comfort Level */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Comfort Level *</Text>
            <View style={styles.chipsContainer}>
              {COMFORT_LEVELS.map((level) => (
                <Pressable
                  key={level}
                  onPress={() => setComfortLevel(level)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: comfortLevel === level ? colors.primary : colors.card,
                      borderColor: comfortLevel === level ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: comfortLevel === level ? "#000" : colors.mutedForeground },
                    ]}
                  >
                    {level}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Cushioning */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Cushioning *</Text>
            <View style={styles.chipsContainer}>
              {CUSHIONING_TYPES.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setCushioning(type)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: cushioning === type ? colors.primary : colors.card,
                      borderColor: cushioning === type ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: cushioning === type ? "#000" : colors.mutedForeground },
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Style Type */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Style Type *</Text>
            <View style={styles.chipsContainer}>
              {STYLE_TYPES.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setStyleType(type)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: styleType === type ? colors.primary : colors.card,
                      borderColor: styleType === type ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: styleType === type ? "#000" : colors.mutedForeground },
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Material Type */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Material Type *</Text>
            <View style={styles.chipsContainer}>
              {MATERIAL_TYPES.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setMaterialType(type)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: materialType === type ? colors.primary : colors.card,
                      borderColor: materialType === type ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: materialType === type ? "#000" : colors.mutedForeground },
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Eco Friendly */}
          <View style={[styles.field, styles.row]}>
            <Text style={[styles.label, { color: colors.foreground, flex: 1 }]}>Eco Friendly</Text>
            <Pressable
              onPress={() => setEcoFriendly(!ecoFriendly)}
              style={[
                styles.toggle,
                { backgroundColor: ecoFriendly ? colors.eco : colors.muted, borderColor: ecoFriendly ? colors.eco : colors.border },
              ]}
            >
              <View
                style={[
                  styles.toggleDot,
                  { backgroundColor: ecoFriendly ? "#000" : colors.mutedForeground, transform: [{ translateX: ecoFriendly ? 20 : 0 }] },
                ]}
              />
            </Pressable>
          </View>

          {/* Eco Discount */}
          {ecoFriendly && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Eco Discount (%)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                value={ecoDiscount}
                onChangeText={setEcoDiscount}
                keyboardType="decimal-pad"
              />
            </View>
          )}

          {/* Recommended For */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Recommended For (multi-select)</Text>
            <View style={styles.chipsContainer}>
              {RECOMMENDED_FOR.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => toggleRecommendedFor(type)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: recommendedFor.includes(type) ? colors.primary : colors.card,
                      borderColor: recommendedFor.includes(type) ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: recommendedFor.includes(type) ? "#000" : colors.mutedForeground },
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Avoid For */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Avoid For (multi-select)</Text>
            <View style={styles.chipsContainer}>
              {AVOID_FOR.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => toggleAvoidFor(type)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: avoidFor.includes(type) ? colors.destructive : colors.card,
                      borderColor: avoidFor.includes(type) ? colors.destructive : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: avoidFor.includes(type) ? "#fff" : colors.mutedForeground },
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Images */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Product Images *</Text>
            <Pressable onPress={pickImages} style={[styles.imageUpload, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="images-outline" size={32} color={colors.mutedForeground} />
                <Text style={[styles.uploadText, { color: colors.mutedForeground }]}>Tap to add images</Text>
              </View>
            </Pressable>
            {imageUris.length > 0 && (
              <View style={styles.imageGrid}>
                {imageUris.map((uri, index) => (
                  <View key={index} style={styles.imageItem}>
                    <Image source={{ uri }} style={styles.imageThumb} />
                    <Pressable
                      onPress={() => removeImage(index)}
                      style={[styles.removeBtn, { backgroundColor: colors.destructive }]}
                    >
                      <Ionicons name="close" size={14} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Submit Button */}
          <Animated.View style={btnStyle}>
            <Pressable onPress={handleSubmit} disabled={loading}>
              <LinearGradient
                colors={loading ? [colors.primary + "80", "#0088CC"] : [colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                {loading ? (
                  <>
                    <Ionicons name="hourglass-outline" size={20} color="#000" />
                    <Text style={styles.submitBtnText}>Uploading...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={22} color="#000" />
                    <Text style={styles.submitBtnText}>Upload Product</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 8 },
  closeBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  hero: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 24, overflow: "hidden" },
  heroIcon: {
    width: 80, height: 80, borderRadius: 24,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
    marginBottom: 16, marginTop: 8,
  },
  heroTitle: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 8 },
  heroSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  form: { paddingHorizontal: 20, gap: 16 },
  field: { gap: 8 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  input: {
    borderRadius: 12, borderWidth: 1, padding: 14,
    fontSize: 15, fontFamily: "Inter_400Regular",
  },
  textArea: {
    borderRadius: 12, borderWidth: 1, padding: 14,
    fontSize: 15, fontFamily: "Inter_400Regular",
    minHeight: 80, textAlignVertical: "top",
  },
  chipsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  toggle: {
    width: 48, height: 28, borderRadius: 14,
    borderWidth: 1, padding: 2,
  },
  toggleDot: {
    width: 22, height: 22, borderRadius: 11,
  },
  imageUpload: {
    borderRadius: 12, borderWidth: 1, overflow: "hidden",
    height: 100, alignItems: "center", justifyContent: "center",
  },
  uploadPlaceholder: { alignItems: "center", gap: 8 },
  uploadText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  imageItem: { position: "relative", width: 80, height: 80 },
  imageThumb: { width: "100%", height: "100%", borderRadius: 8, resizeMode: "cover" },
  removeBtn: {
    position: "absolute", top: -4, right: -4,
    width: 20, height: 20, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, borderRadius: 14, gap: 10, marginTop: 8,
  },
  submitBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#000" },
});
