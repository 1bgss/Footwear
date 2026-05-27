import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
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
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { FootScanResult } from "@/context/AppContext";

const { width, height } = Dimensions.get("window");

type Point = { x: number; y: number };

function ScanningOverlay({ active }: { active: boolean }) {
  const colors = useColors();
  const scanY = useSharedValue(0);

  React.useEffect(() => {
    if (active) {
      scanY.value = withRepeat(
        withSequence(withTiming(200, { duration: 1200 }), withTiming(0, { duration: 1200 })),
        -1
      );
    }
  }, [active]);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }],
  }));

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          styles.scanLine,
          { backgroundColor: colors.primary },
          lineStyle,
        ]}
      />
    </View>
  );
}

export default function FootScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { saveFootScanResult, rewardFootScan } = useApp();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [step, setStep] = useState<"capture" | "adjust" | "result">("capture");
  const [result, setResult] = useState<FootScanResult | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, Platform.OS === "android" ? 24 : 0);

  // 4 draggable points: toe, heel, left edge, right edge
  const points = {
    toe: useSharedValue<Point>({ x: width / 2, y: 80 }),
    heel: useSharedValue<Point>({ x: width / 2, y: 260 }),
    left: useSharedValue<Point>({ x: width / 2 - 70, y: 170 }),
    right: useSharedValue<Point>({ x: width / 2 + 70, y: 170 }),
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setStep("adjust");
    }
  };

  const useSimulated = () => {
    setImageUri("simulated");
    setStep("adjust");
  };

  const calculateResult = async () => {
    setScanning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((r) => setTimeout(r, 2000));

    const toeY = points.toe.value.y;
    const heelY = points.heel.value.y;
    const leftX = points.left.value.x;
    const rightX = points.right.value.x;

    const footLength = Math.abs(heelY - toeY);
    const footWidth = Math.abs(rightX - leftX);
    const widthRatio = footWidth / Math.max(footLength, 1);

    let footType: "narrow" | "normal" | "wide";
    if (widthRatio < 0.38) footType = "narrow";
    else if (widthRatio <= 0.45) footType = "normal";
    else footType = "wide";

    const scanResult: FootScanResult = {
      footLength: Math.round(footLength * 0.26),
      footWidth: Math.round(footWidth * 0.26),
      widthRatio: Math.round(widthRatio * 100) / 100,
      footType,
      imageUri: imageUri ?? undefined,
    };

    await saveFootScanResult(scanResult);
    rewardFootScan();
    setResult(scanResult);
    setStep("result");
    setScanning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const makePanResponder = (point: Animated.SharedValue<Point>) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        Haptics.selectionAsync();
      },
      onPanResponderMove: (_, gs) => {
        point.value = {
          x: point.value.x + gs.dx,
          y: point.value.y + gs.dy,
        };
      },
    });
  };

  const toePan = useRef(makePanResponder(points.toe)).current;
  const heelPan = useRef(makePanResponder(points.heel)).current;
  const leftPan = useRef(makePanResponder(points.left)).current;
  const rightPan = useRef(makePanResponder(points.right)).current;

  const toeStyle = useAnimatedStyle(() => ({
    left: points.toe.value.x - 14,
    top: points.toe.value.y - 14,
  }));
  const heelStyle = useAnimatedStyle(() => ({
    left: points.heel.value.x - 14,
    top: points.heel.value.y - 14,
  }));
  const leftStyle = useAnimatedStyle(() => ({
    left: points.left.value.x - 14,
    top: points.left.value.y - 14,
  }));
  const rightStyle = useAnimatedStyle(() => ({
    left: points.right.value.x - 14,
    top: points.right.value.y - 14,
  }));

  const footTypeColors = { narrow: colors.accent, normal: colors.eco, wide: colors.gold };
  const footTypeLabels = { narrow: "Narrow Foot", normal: "Normal Foot", wide: "Wide Foot" };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(0,180,255,0.08)", "transparent"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Foot Scan</Text>
        <View style={{ width: 40 }} />
      </View>

      {step === "capture" && (
        <View style={styles.captureStep}>
          <View style={[styles.scanFrame, { borderColor: colors.primary + "60" }]}>
            <LinearGradient
              colors={[colors.primary + "10", colors.accent + "05"]}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="footsteps-outline" size={80} color={colors.primary + "40"} />
            <Text style={[styles.frameHint, { color: colors.mutedForeground }]}>
              Place your foot here
            </Text>
          </View>

          <Text style={[styles.stepTitle, { color: colors.foreground }]}>
            Scan Your Foot
          </Text>
          <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
            Take a photo of your foot from above for accurate SmartFit analysis
          </Text>

          <View style={styles.captureActions}>
            <Pressable onPress={pickImage} style={{ flex: 1 }}>
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.captureBtn}
              >
                <Ionicons name="image-outline" size={20} color="#000" />
                <Text style={styles.captureBtnText}>Choose Photo</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={useSimulated}
              style={[styles.simulateBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="flask-outline" size={20} color={colors.primary} />
              <Text style={[styles.simulateBtnText, { color: colors.primary }]}>Demo Scan</Text>
            </Pressable>
          </View>
        </View>
      )}

      {step === "adjust" && (
        <View style={styles.adjustStep}>
          <Text style={[styles.adjustHint, { color: colors.mutedForeground }]}>
            Drag the markers to align with your foot edges
          </Text>

          <View style={[styles.canvas, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {imageUri && imageUri !== "simulated" && (
              <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            )}
            {imageUri === "simulated" && (
              <LinearGradient
                colors={[colors.muted, colors.secondary]}
                style={StyleSheet.absoluteFill}
              />
            )}

            <ScanningOverlay active={false} />

            {/* Point markers */}
            <Animated.View {...toePan.panHandlers} style={[styles.point, { backgroundColor: colors.primary }, toeStyle]}>
              <Text style={styles.pointLabel}>Toe</Text>
            </Animated.View>
            <Animated.View {...heelPan.panHandlers} style={[styles.point, { backgroundColor: colors.accent }, heelStyle]}>
              <Text style={styles.pointLabel}>Heel</Text>
            </Animated.View>
            <Animated.View {...leftPan.panHandlers} style={[styles.point, { backgroundColor: colors.gold }, leftStyle]}>
              <Text style={styles.pointLabel}>L</Text>
            </Animated.View>
            <Animated.View {...rightPan.panHandlers} style={[styles.point, { backgroundColor: colors.gold }, rightStyle]}>
              <Text style={styles.pointLabel}>R</Text>
            </Animated.View>

            <View style={styles.pointLegend}>
              {[
                { color: colors.primary, label: "Toe Point" },
                { color: colors.accent, label: "Heel Point" },
                { color: colors.gold, label: "Width Edges" },
              ].map((item, i) => (
                <View key={i} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendText, { color: colors.mutedForeground }]}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <Pressable onPress={calculateResult} disabled={scanning}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.analyzeBtn, scanning && { opacity: 0.6 }]}
            >
              <Ionicons name={scanning ? "hourglass-outline" : "analytics-outline"} size={20} color="#000" />
              <Text style={styles.analyzeBtnText}>
                {scanning ? "Analyzing..." : "Analyze Foot"}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      )}

      {step === "result" && result && (
        <View style={[styles.resultStep, { paddingBottom: bottomPad + 24 }]}>
          <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: (footTypeColors[result.footType] ?? colors.primary) + "40" }]}>
            <LinearGradient
              colors={[(footTypeColors[result.footType] ?? colors.primary) + "15", "transparent"]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>DETECTED FOOT TYPE</Text>
            <Text style={[styles.resultType, { color: footTypeColors[result.footType] ?? colors.primary }]}>
              {footTypeLabels[result.footType]}
            </Text>
            <View style={styles.resultMetrics}>
              <View style={styles.metric}>
                <Text style={[styles.metricVal, { color: colors.foreground }]}>{result.footLength} mm</Text>
                <Text style={[styles.metricLbl, { color: colors.mutedForeground }]}>Length</Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
              <View style={styles.metric}>
                <Text style={[styles.metricVal, { color: colors.foreground }]}>{result.footWidth} mm</Text>
                <Text style={[styles.metricLbl, { color: colors.mutedForeground }]}>Width</Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
              <View style={styles.metric}>
                <Text style={[styles.metricVal, { color: colors.foreground }]}>{result.widthRatio}</Text>
                <Text style={[styles.metricLbl, { color: colors.mutedForeground }]}>Ratio</Text>
              </View>
            </View>
          </View>

          <View style={styles.resultActions}>
            <Pressable
              onPress={() => router.push("/smartfit-result")}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.recBtn}
              >
                <Ionicons name="sparkles-outline" size={18} color="#000" />
                <Text style={styles.recBtnText}>View Recommendations</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={() => setStep("capture")}
              style={[styles.rescanBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="refresh-outline" size={20} color={colors.foreground} />
            </Pressable>
          </View>
        </View>
      )}
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
  captureStep: { flex: 1, paddingHorizontal: 20, alignItems: "center", gap: 20, paddingTop: 20 },
  scanFrame: {
    width: width - 80,
    height: 220,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    gap: 12,
  },
  frameHint: { fontSize: 14, fontFamily: "Inter_400Regular" },
  stepTitle: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "center" },
  stepDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  captureActions: { flexDirection: "row", gap: 10, width: "100%" },
  captureBtn: { paddingVertical: 16, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  captureBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#000" },
  simulateBtn: { paddingVertical: 16, paddingHorizontal: 20, borderRadius: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  simulateBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  adjustStep: { flex: 1, paddingHorizontal: 20, gap: 16 },
  adjustHint: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  canvas: {
    height: 300,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  point: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  pointLabel: { fontSize: 8, fontFamily: "Inter_700Bold", color: "#000" },
  pointLegend: {
    position: "absolute",
    bottom: 10,
    right: 10,
    gap: 4,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  analyzeBtn: { paddingVertical: 16, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  analyzeBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#000" },
  scanLine: { position: "absolute", left: 0, right: 0, height: 2, opacity: 0.8 },
  resultStep: { flex: 1, paddingHorizontal: 20, paddingTop: 10, gap: 20 },
  resultCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 12,
    overflow: "hidden",
  },
  resultLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  resultType: { fontSize: 32, fontFamily: "Inter_700Bold" },
  resultMetrics: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  metric: { flex: 1, alignItems: "center" },
  metricVal: { fontSize: 20, fontFamily: "Inter_700Bold" },
  metricLbl: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  metricDivider: { width: 1, marginVertical: 4 },
  resultActions: { flexDirection: "row", gap: 10 },
  recBtn: { paddingVertical: 16, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  recBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#000" },
  rescanBtn: { width: 52, height: 52, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
