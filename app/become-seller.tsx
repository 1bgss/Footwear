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

const STORE_CATEGORIES = ["Running", "Casual", "Sport", "Hiking", "Formal", "Streetwear"];
const BRAND_STYLES = ["Sporty", "Streetwear", "Minimal", "Outdoor", "Eco Lifestyle"];

export default function BecomeSellerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, createSellerStore, upgradeToSeller } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, Platform.OS === "android" ? 24 : 0);

  const [loading, setLoading] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeUsername, setStoreUsername] = useState("");
  const [ownerName, setOwnerName] = useState(user?.name || "");
  const [storeDescription, setStoreDescription] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [city, setCity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrandStyle, setSelectedBrandStyle] = useState("");
  const [isEcoCertified, setIsEcoCertified] = useState(false);
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [bannerUri, setBannerUri] = useState<string | null>(null);

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const pickImage = async (isLogo: boolean) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: isLogo ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        if (isLogo) {
          setLogoUri(result.assets[0].uri);
        } else {
          setBannerUri(result.assets[0].uri);
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleSubmit = async () => {
    if (!storeName || !storeUsername || !ownerName || !storeDescription || !storeAddress || !city || !selectedCategory || !selectedBrandStyle || !phone) {
      Alert.alert("Missing Fields", "Please fill in all required fields");
      return;
    }

    if (!user) {
      Alert.alert("Error", "Please log in first");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    btnScale.value = withSequence(withTiming(0.94, { duration: 100 }), withSpring(1, { damping: 10 }));

    try {
      await createSellerStore({
        ownerUserId: user.id,
        name: storeName,
        username: storeUsername,
        ownerName,
        description: storeDescription,
        address: storeAddress,
        city,
        category: selectedCategory,
        brandStyle: selectedBrandStyle,
        contact: phone,
        instagram: instagram || undefined,
        isEcoCertified,
        logoUri: logoUri || undefined,
        bannerUri: bannerUri || undefined,
      });

      await upgradeToSeller();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      await new Promise((r) => setTimeout(r, 500));
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", "Failed to create store");
      setLoading(false);
    }
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
        <Text style={[styles.title, { color: colors.foreground }]}>Create Your Store</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad + 32 }}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: colors.gold + "22", borderColor: colors.gold + "40" }]}>
            <Ionicons name="storefront" size={44} color={colors.gold} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>Seller Onboarding</Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            Set up your store and start selling on Footwear
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Store Name */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Store Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Enter store name"
              placeholderTextColor={colors.mutedForeground}
              value={storeName}
              onChangeText={setStoreName}
            />
          </View>

          {/* Store Username */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Store Username *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="@storename"
              placeholderTextColor={colors.mutedForeground}
              value={storeUsername}
              onChangeText={setStoreUsername}
              autoCapitalize="none"
            />
          </View>

          {/* Owner Name */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Owner Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Your name"
              placeholderTextColor={colors.mutedForeground}
              value={ownerName}
              onChangeText={setOwnerName}
            />
          </View>

          {/* Store Description */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Store Description *</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Describe your store..."
              placeholderTextColor={colors.mutedForeground}
              value={storeDescription}
              onChangeText={setStoreDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Address */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Store Address *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Street address"
              placeholderTextColor={colors.mutedForeground}
              value={storeAddress}
              onChangeText={setStoreAddress}
            />
          </View>

          {/* City */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>City *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="City"
              placeholderTextColor={colors.mutedForeground}
              value={city}
              onChangeText={setCity}
            />
          </View>

          {/* Store Category */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Store Category *</Text>
            <View style={styles.chipsContainer}>
              {STORE_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selectedCategory === cat ? colors.primary : colors.card,
                      borderColor: selectedCategory === cat ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: selectedCategory === cat ? "#000" : colors.mutedForeground },
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Brand Style */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Brand Style *</Text>
            <View style={styles.chipsContainer}>
              {BRAND_STYLES.map((style) => (
                <Pressable
                  key={style}
                  onPress={() => setSelectedBrandStyle(style)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selectedBrandStyle === style ? colors.primary : colors.card,
                      borderColor: selectedBrandStyle === style ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: selectedBrandStyle === style ? "#000" : colors.mutedForeground },
                    ]}
                  >
                    {style}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Eco Certified */}
          <View style={[styles.field, styles.row]}>
            <Text style={[styles.label, { color: colors.foreground, flex: 1 }]}>Eco Certified Store</Text>
            <Pressable
              onPress={() => setIsEcoCertified(!isEcoCertified)}
              style={[
                styles.toggle,
                { backgroundColor: isEcoCertified ? colors.eco : colors.muted, borderColor: isEcoCertified ? colors.eco : colors.border },
              ]}
            >
              <View
                style={[
                  styles.toggleDot,
                  { backgroundColor: isEcoCertified ? "#000" : colors.mutedForeground, transform: [{ translateX: isEcoCertified ? 20 : 0 }] },
                ]}
              />
            </Pressable>
          </View>

          {/* Phone */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Phone / WhatsApp *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="+62..."
              placeholderTextColor={colors.mutedForeground}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Instagram */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Instagram Handle</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="@username"
              placeholderTextColor={colors.mutedForeground}
              value={instagram}
              onChangeText={setInstagram}
              autoCapitalize="none"
            />
          </View>

          {/* Logo Image */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Store Logo</Text>
            <Pressable onPress={() => pickImage(true)} style={[styles.imageUpload, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="image-outline" size={32} color={colors.mutedForeground} />
                  <Text style={[styles.uploadText, { color: colors.mutedForeground }]}>Tap to upload logo</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Banner Image */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Store Banner</Text>
            <Pressable onPress={() => pickImage(false)} style={[styles.imageUpload, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {bannerUri ? (
                <Image source={{ uri: bannerUri }} style={styles.uploadedImageBanner} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="image-outline" size={32} color={colors.mutedForeground} />
                  <Text style={[styles.uploadText, { color: colors.mutedForeground }]}>Tap to upload banner</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Submit Button */}
          <Animated.View style={btnStyle}>
            <Pressable onPress={handleSubmit} disabled={loading}>
              <LinearGradient
                colors={loading ? [colors.gold + "80", "#CC7000"] : [colors.gold, "#FF8C00"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                {loading ? (
                  <>
                    <Ionicons name="hourglass-outline" size={20} color="#000" />
                    <Text style={styles.submitBtnText}>Creating store...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="storefront-outline" size={22} color="#000" />
                    <Text style={styles.submitBtnText}>Create Store & Start Selling</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
          <Text style={[styles.note, { color: colors.mutedForeground }]}>
            By creating a store, you agree to our seller terms and conditions
          </Text>
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
    height: 120, alignItems: "center", justifyContent: "center",
  },
  uploadedImage: { width: "100%", height: "100%", resizeMode: "cover" },
  uploadedImageBanner: { width: "100%", height: "100%", resizeMode: "cover" },
  uploadPlaceholder: { alignItems: "center", gap: 8 },
  uploadText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, borderRadius: 14, gap: 10, marginTop: 8,
  },
  submitBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#000" },
  note: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 8 },
});
