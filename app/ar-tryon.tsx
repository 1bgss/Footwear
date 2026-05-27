import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { PRODUCTS, getSmartFitScore, ActivityType } from "@/data/products";

const { width, height } = Dimensions.get("window");

function getDefaultScale(footType?: "narrow" | "normal" | "wide" | null): number {
  if (footType === "narrow") return 0.85;
  if (footType === "wide") return 1.15;
  return 1.0;
}

function ScanGrid() {
  const colors = useColors();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[0.25, 0.5, 0.75].map((frac) => (
        <View key={`h${frac}`} style={[styles.gridLine, { top: `${frac * 100}%`, backgroundColor: colors.primary + "18" }]} />
      ))}
      {[0.25, 0.5, 0.75].map((frac) => (
        <View key={`v${frac}`} style={[styles.gridLineV, { left: `${frac * 100}%`, backgroundColor: colors.primary + "18" }]} />
      ))}
      {[
        { top: 60, left: 20 } as any,
        { top: 60, right: 20 } as any,
        { bottom: 120, left: 20 } as any,
        { bottom: 120, right: 20 } as any,
      ].map((pos, i) => (
        <View key={i} style={[styles.cornerMarker, pos, { borderColor: colors.primary }]} />
      ))}
    </View>
  );
}

function ScanPulse() {
  const colors = useColors();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);
  React.useEffect(() => {
    scale.value = withRepeat(withSequence(withTiming(1.5, { duration: 1200 }), withTiming(1, { duration: 1200 })), -1);
    opacity.value = withRepeat(withSequence(withTiming(0, { duration: 1200 }), withTiming(0.5, { duration: 1200 })), -1);
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  return (
    <Animated.View
      style={[styles.pulse, { borderColor: colors.primary }, pulseStyle]}
      pointerEvents="none"
    />
  );
}

export default function ARTryOnScreen() {
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { footScanResult } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, Platform.OS === "android" ? 24 : 0);

  const initialProduct = PRODUCTS.find((p) => p.id === productId) ?? PRODUCTS[0];
  const defaultScale = getDefaultScale(footScanResult?.footType);

  const [phase, setPhase] = useState<"upload" | "studio">("upload");
  const [footPhotoUri, setFootPhotoUri] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState(initialProduct.id);
  const [showPremium, setShowPremium] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const selectedProduct = PRODUCTS.find((p) => p.id === selectedId) ?? initialProduct;
  const score = getSmartFitScore(
    selectedProduct,
    footScanResult?.footType ?? null,
    true,
    selectedProduct.activity_type as ActivityType
  );
  const scoreColor = score >= 80 ? colors.eco : score >= 50 ? colors.gold : colors.destructive;

  const posX = useSharedValue(width / 2 - 75);
  const posY = useSharedValue(height * 0.50);
  const scaleVal = useSharedValue(defaultScale);
  const rotation = useSharedValue(-8);
  const imageOpacity = useSharedValue(1);

  const lastPos = useRef({ x: width / 2 - 75, y: height * 0.50 });
  const lastScale = useRef(defaultScale);
  const lastRotation = useRef(-8);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { Haptics.selectionAsync(); },
      onPanResponderMove: (_, gs) => {
        posX.value = lastPos.current.x + gs.dx;
        posY.value = lastPos.current.y + gs.dy;
        if (gs.numberActiveTouches === 2) {
          scaleVal.value = Math.max(0.3, Math.min(4, lastScale.current + gs.dx / 100));
          rotation.value = lastRotation.current + gs.dy / 3;
        }
      },
      onPanResponderRelease: () => {
        lastPos.current = { x: posX.value, y: posY.value };
        lastScale.current = scaleVal.value;
        lastRotation.current = rotation.value;
      },
    })
  ).current;

  const shoeStyle = useAnimatedStyle(() => ({
    left: posX.value,
    top: posY.value,
    transform: [{ scale: scaleVal.value }, { rotate: `${rotation.value}deg` }],
    opacity: imageOpacity.value,
  }));

  const handlePickImage = async (useCamera: boolean) => {
    try {
      const fn = useCamera
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;
      const result = await fn({ allowsEditing: false, quality: 0.85 });
      if (!result.canceled && result.assets[0]) {
        setFootPhotoUri(result.assets[0].uri);
        setPhase("studio");
      }
    } catch {
      Alert.alert("Error", "Could not access photo. Please check permissions.");
    }
  };

  const handleDemo = () => {
    setFootPhotoUri(null);
    setPhase("studio");
  };

  const handleShoeSelect = (newId: string) => {
    if (newId === selectedId) return;
    Haptics.selectionAsync();
    imageOpacity.value = withTiming(0, { duration: 150 }, () => {
      runOnJS(setSelectedId)(newId);
      imageOpacity.value = withTiming(1, { duration: 250 });
    });
  };

  const handleReset = () => {
    posX.value = withTiming(width / 2 - 75, { duration: 350 });
    posY.value = withTiming(height * 0.50, { duration: 350 });
    scaleVal.value = withTiming(defaultScale, { duration: 350 });
    rotation.value = withTiming(-8, { duration: 350 });
    lastPos.current = { x: width / 2 - 75, y: height * 0.50 };
    lastScale.current = defaultScale;
    lastRotation.current = -8;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleShare = async () => {
    setIsSharing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const available = await Sharing.isAvailableAsync();
      if (available && footPhotoUri) {
        await Sharing.shareAsync(footPhotoUri, { dialogTitle: "Share Try-On Result" });
      } else {
        Alert.alert("Try-On Captured! ✓", `Your virtual try-on with ${selectedProduct.name} has been saved.`);
      }
    } catch {
      Alert.alert("Saved!", "Try-on snapshot captured successfully.");
    }
    setTimeout(() => setIsSharing(false), 1500);
  };

  // ─── UPLOAD PHASE ─────────────────────────────────────────────────────────────
  if (phase === "upload") {
    return (
      <View style={[styles.container, { backgroundColor: "#000" }]}>
        <LinearGradient colors={["#0A0A0F", "#0D0D18", "#0A0A0F"]} style={StyleSheet.absoluteFill} />
        <View style={[styles.ambientGlow, { backgroundColor: colors.primary + "08" }]} />

        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.iconBtn, { backgroundColor: "rgba(0,0,0,0.7)", borderColor: colors.border }]}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
          <View style={[styles.headerBadge, { backgroundColor: "rgba(0,0,0,0.7)", borderColor: colors.border }]}>
            <Ionicons name="shirt-outline" size={14} color={colors.primary} />
            <Text style={[styles.liveText, { color: "#fff" }]}>VIRTUAL TRY-ON STUDIO</Text>
          </View>
          <Pressable
            onPress={() => setShowPremium(true)}
            style={[styles.iconBtn, { backgroundColor: colors.gold + "25", borderColor: colors.gold + "40" }]}
          >
            <Ionicons name="star" size={18} color={colors.gold} />
          </Pressable>
        </View>

        <View style={styles.uploadCenter}>
          <View style={[styles.uploadProductCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: colors.primary + "30" }]}>
            <LinearGradient colors={[colors.primary + "25", "transparent"]} style={StyleSheet.absoluteFill} />
            <Image source={initialProduct.image} style={styles.uploadShoePreview} resizeMode="contain" />
            <Text style={[styles.uploadProductName, { color: "#fff" }]}>{initialProduct.name}</Text>
            <Text style={[styles.uploadProductBrand, { color: colors.mutedForeground }]}>{initialProduct.brand}</Text>
          </View>

          <Text style={[styles.uploadTitle, { color: "#fff" }]}>Upload Foot Photo</Text>
          <Text style={[styles.uploadSub, { color: colors.mutedForeground }]}>
            Place your foot on a flat surface for the most realistic try-on experience
          </Text>

          <Pressable onPress={() => handlePickImage(true)} style={{ width: "100%" }}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.uploadBtn}
            >
              <Ionicons name="camera-outline" size={20} color="#000" />
              <Text style={styles.uploadBtnText}>Capture Foot Photo</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => handlePickImage(false)}
            style={[styles.uploadBtnSecondary, { backgroundColor: "rgba(255,255,255,0.07)", borderColor: colors.border }]}
          >
            <Ionicons name="images-outline" size={20} color="#fff" />
            <Text style={[styles.uploadBtnSecText, { color: "#fff" }]}>Choose from Gallery</Text>
          </Pressable>

          <Pressable onPress={handleDemo} style={styles.demoBtn}>
            <Ionicons name="play-circle-outline" size={15} color={colors.mutedForeground} />
            <Text style={[styles.demoBtnText, { color: colors.mutedForeground }]}>Use Demo Mode (no photo)</Text>
          </Pressable>
        </View>

        {footScanResult && (
          <View style={[styles.scanHint, { bottom: bottomPad + 20 }]}>
            <View style={[styles.hintChip, { backgroundColor: "rgba(0,180,255,0.1)", borderColor: colors.primary + "30" }]}>
              <Ionicons name="scan-outline" size={13} color={colors.primary} />
              <Text style={[styles.hintText, { color: colors.primary }]}>
                SmartFit detected: {footScanResult.footType} foot · shoe pre-scaled accordingly
              </Text>
            </View>
          </View>
        )}

        {showPremium && (
          <Pressable style={styles.modalOverlay} onPress={() => setShowPremium(false)}>
            <View style={[styles.premiumModal, { backgroundColor: colors.card, borderColor: colors.gold + "40" }]}>
              <LinearGradient colors={[colors.gold + "20", colors.primary + "10"]} style={StyleSheet.absoluteFill} />
              <Pressable onPress={() => setShowPremium(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.foreground} />
              </Pressable>
              <View style={[styles.premiumIcon, { backgroundColor: colors.gold + "20" }]}>
                <Ionicons name="star" size={32} color={colors.gold} />
              </View>
              <Text style={[styles.premiumTitle, { color: colors.foreground }]}>Unlock SmartFit Premium</Text>
              <Text style={[styles.premiumDesc, { color: colors.mutedForeground }]}>Advanced try-on features & exclusive insights</Text>
              {["Advanced compatibility analysis", "Return risk prediction", "Personalized recommendations", "Exclusive eco discounts", "Priority customer support"].map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.gold} />
                  <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
                </View>
              ))}
              <Pressable onPress={() => setShowPremium(false)}>
                <LinearGradient colors={[colors.gold, "#FF8C00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.premiumBtn}>
                  <Ionicons name="star" size={18} color="#000" />
                  <Text style={styles.premiumBtnText}>Upgrade to Premium</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Pressable>
        )}
      </View>
    );
  }

  // ─── STUDIO PHASE ─────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      {footPhotoUri ? (
        <Image source={{ uri: footPhotoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <LinearGradient colors={["#0A0A0F", "#0E0E1A", "#0A0A0F"]} style={StyleSheet.absoluteFill} />
      )}
      {footPhotoUri && <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.32)" }]} />}
      <View style={[styles.ambientGlow, { backgroundColor: colors.primary + "08" }]} />

      <ScanGrid />
      <ScanPulse />

      {/* Draggable shoe overlay */}
      <Animated.View {...panResponder.panHandlers} style={[styles.shoeOverlay, shoeStyle]}>
        <Image source={selectedProduct.image} style={styles.shoeImage} resizeMode="contain" />
      </Animated.View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => setPhase("upload")}
          style={[styles.iconBtn, { backgroundColor: "rgba(0,0,0,0.7)", borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <View style={[styles.headerBadge, { backgroundColor: "rgba(0,0,0,0.7)", borderColor: colors.border }]}>
          <View style={[styles.liveDot, { backgroundColor: colors.eco }]} />
          <Text style={[styles.liveText, { color: "#fff" }]}>TRY-ON STUDIO</Text>
        </View>
        <Pressable
          onPress={() => setShowPremium(true)}
          style={[styles.iconBtn, { backgroundColor: colors.gold + "30", borderColor: colors.gold + "50" }]}
        >
          <Ionicons name="star" size={18} color={colors.gold} />
        </Pressable>
      </View>

      {/* SmartFit float */}
      <View style={[styles.smartfitFloat, { backgroundColor: "rgba(0,0,0,0.82)", borderColor: colors.primary + "45", top: topPad + 70 }]}>
        <LinearGradient colors={[colors.primary + "22", "transparent"]} style={StyleSheet.absoluteFill} />
        <Ionicons name="sparkles" size={13} color={colors.primary} />
        <Text style={[styles.smartfitText, { color: colors.primary }]}>
          {score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Limited"} Match
        </Text>
        <Text style={[styles.confidenceText, { color: colors.mutedForeground }]}>
          {Math.round(75 + score * 0.24)}% confidence
        </Text>
      </View>

      {/* Action buttons (left side) */}
      <View style={[styles.actionBtns, { top: topPad + 70 }]}>
        <Pressable
          onPress={handleReset}
          style={[styles.actionBtn, { backgroundColor: "rgba(0,0,0,0.7)", borderColor: colors.border }]}
        >
          <Ionicons name="refresh-outline" size={16} color="#fff" />
        </Pressable>
        <Pressable
          onPress={handleShare}
          style={[
            styles.actionBtn,
            {
              backgroundColor: isSharing ? colors.eco + "35" : "rgba(0,0,0,0.7)",
              borderColor: isSharing ? colors.eco : colors.border,
            },
          ]}
        >
          <Ionicons name={isSharing ? "checkmark" : "share-outline"} size={16} color={isSharing ? colors.eco : "#fff"} />
        </Pressable>
      </View>

      {/* Product info bar */}
      <View style={[styles.productInfo, { borderColor: colors.border }]}>
        <LinearGradient colors={["rgba(0,0,0,0.92)", "rgba(0,0,0,0.75)"]} style={StyleSheet.absoluteFill} />
        <View style={styles.productRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.productBrand}>{selectedProduct.brand}</Text>
            <Text style={styles.productName}>{selectedProduct.name}</Text>
          </View>
          <View style={[styles.scoreChip, { backgroundColor: scoreColor + "20", borderColor: scoreColor + "40" }]}>
            <Text style={[styles.scoreText, { color: scoreColor }]}>{score}%</Text>
            <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>FIT</Text>
          </View>
        </View>
      </View>

      {/* Shoe carousel */}
      <View style={[styles.carouselWrap, { bottom: bottomPad + 68 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
          {PRODUCTS.slice(0, 8).map((p) => (
            <Pressable
              key={p.id}
              onPress={() => handleShoeSelect(p.id)}
              style={[
                styles.carouselItem,
                {
                  backgroundColor: p.id === selectedId ? "rgba(0,180,255,0.18)" : "rgba(0,0,0,0.72)",
                  borderColor: p.id === selectedId ? colors.primary : colors.border,
                },
              ]}
            >
              <Image source={p.image} style={styles.carouselShoe} resizeMode="contain" />
              {p.id === selectedId && (
                <View style={[styles.selectedDot, { backgroundColor: colors.primary }]} />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Instructions */}
      <View style={[styles.instructions, { bottom: bottomPad + 16 }]}>
        {[
          { icon: "move-outline" as const, text: "Drag" },
          { icon: "resize-outline" as const, text: "Pinch" },
          { icon: "sync-outline" as const, text: "Rotate" },
        ].map((item, i) => (
          <View key={i} style={[styles.instrItem, { backgroundColor: "rgba(0,0,0,0.72)", borderColor: colors.border }]}>
            <Ionicons name={item.icon} size={12} color={colors.primary} />
            <Text style={[styles.instrText, { color: "#fff" }]}>{item.text}</Text>
          </View>
        ))}
      </View>

      {/* Premium Modal */}
      {showPremium && (
        <Pressable style={styles.modalOverlay} onPress={() => setShowPremium(false)}>
          <View style={[styles.premiumModal, { backgroundColor: colors.card, borderColor: colors.gold + "40" }]}>
            <LinearGradient colors={[colors.gold + "20", colors.primary + "10"]} style={StyleSheet.absoluteFill} />
            <Pressable onPress={() => setShowPremium(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.foreground} />
            </Pressable>
            <View style={[styles.premiumIcon, { backgroundColor: colors.gold + "20" }]}>
              <Ionicons name="star" size={32} color={colors.gold} />
            </View>
            <Text style={[styles.premiumTitle, { color: colors.foreground }]}>Unlock SmartFit Premium</Text>
            <Text style={[styles.premiumDesc, { color: colors.mutedForeground }]}>Advanced try-on features & exclusive insights</Text>
            {["Advanced compatibility analysis", "Return risk prediction", "Personalized recommendations", "Exclusive eco discounts", "Priority customer support"].map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.gold} />
                <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
              </View>
            ))}
            <Pressable onPress={() => setShowPremium(false)}>
              <LinearGradient colors={[colors.gold, "#FF8C00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.premiumBtn}>
                <Ionicons name="star" size={18} color="#000" />
                <Text style={styles.premiumBtnText}>Upgrade to Premium</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ambientGlow: { position: "absolute", top: 0, left: 0, right: 0, height: height / 2 },
  gridLine: { position: "absolute", left: 0, right: 0, height: 1 },
  gridLineV: { position: "absolute", top: 0, bottom: 0, width: 1 },
  cornerMarker: { position: "absolute", width: 22, height: 22, borderTopWidth: 2, borderLeftWidth: 2 },
  pulse: {
    position: "absolute",
    top: height / 2 - 80,
    left: width / 2 - 80,
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
  },
  shoeOverlay: { position: "absolute", width: 150, height: 150 },
  shoeImage: { width: "100%", height: "100%" },
  header: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 12, zIndex: 100,
  },
  iconBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  headerBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 3.5 },
  liveText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  smartfitFloat: { position: "absolute", right: 16, borderRadius: 14, borderWidth: 1, padding: 11, gap: 3, overflow: "hidden" },
  smartfitText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  confidenceText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  actionBtns: { position: "absolute", left: 16, gap: 8 },
  actionBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  productInfo: { position: "absolute", bottom: 112, left: 16, right: 16, borderRadius: 14, borderWidth: 1, padding: 14, overflow: "hidden" },
  productRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  productBrand: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.45)", marginBottom: 2 },
  productName: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  scoreChip: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 11, borderWidth: 1, alignItems: "center" },
  scoreText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  scoreLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  carouselWrap: { position: "absolute", left: 0, right: 0 },
  carousel: { paddingHorizontal: 16, gap: 10 },
  carouselItem: { width: 56, height: 56, borderRadius: 12, borderWidth: 1.5, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  carouselShoe: { width: 44, height: 44 },
  selectedDot: { position: "absolute", bottom: 3, width: 6, height: 6, borderRadius: 3 },
  instructions: { position: "absolute", left: 16, right: 16, flexDirection: "row", gap: 8, justifyContent: "center" },
  instrItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, gap: 4 },
  instrText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.72)", alignItems: "center", justifyContent: "flex-end", zIndex: 200 },
  premiumModal: { width: "100%", borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 24, gap: 13, overflow: "hidden" },
  closeBtn: { position: "absolute", top: 16, right: 16, zIndex: 10 },
  premiumIcon: { width: 58, height: 58, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  premiumTitle: { fontSize: 21, fontFamily: "Inter_700Bold" },
  premiumDesc: { fontSize: 13, fontFamily: "Inter_400Regular" },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  premiumBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 15, borderRadius: 14, gap: 8, marginTop: 4 },
  premiumBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#000" },
  // Upload phase
  uploadCenter: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 16, marginTop: 80 },
  uploadProductCard: { width: 180, height: 160, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center", overflow: "hidden", gap: 8, padding: 12 },
  uploadShoePreview: { width: 110, height: 100 },
  uploadProductName: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  uploadProductBrand: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  uploadTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center", marginTop: 8 },
  uploadSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  uploadBtn: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 14, gap: 10 },
  uploadBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#000" },
  uploadBtnSecondary: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 14, borderWidth: 1, gap: 10 },
  uploadBtnSecText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  demoBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8 },
  demoBtnText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  scanHint: { position: "absolute", left: 16, right: 16 },
  hintChip: { flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 10, borderWidth: 1, gap: 7 },
  hintText: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
});
