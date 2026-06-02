import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
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
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";
import { useApp, type ShoepediaHistoryEntry, type ShoepediaResult } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");

const ANALYSIS_STEPS = [
  "Analyzing Shoe Structure...",
  "Identifying Brand...",
  "Generating Shoe History...",
  "Building Shoepedia Knowledge...",
];

const EMPTY_RESULT: ShoepediaResult = {
  shoe_type: "not_a_shoe",
  shoe_category: "not_shoe",
  brand: null,
  model: null,
  primary_color: "unknown",
  secondary_color: null,
  gender_target: null,
  usage: [],
  confidence: 0,
  description: "No shoe detected.",
  characteristics: [],
  history: "",
  care_tips: [],
  estimated_price_range: null,
  interesting_facts: [],
  similar_shoes: [],
};

function getMimeType(uri: string, pickerMimeType?: string | null) {
  if (pickerMimeType) return pickerMimeType;
  const cleanUri = uri.split("?")[0].toLowerCase();
  if (cleanUri.endsWith(".png")) return "image/png";
  if (cleanUri.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

async function uriToBase64(uri: string) {
  const response = await fetch(uri);
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result ?? "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function extractJson(text: string): ShoepediaResult {
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Gemini response did not contain JSON.");
  }
  const parsed = JSON.parse(trimmed.slice(start, end + 1)) as Partial<ShoepediaResult>;
  return {
    ...EMPTY_RESULT,
    ...parsed,
    brand: parsed.brand ?? null,
    model: parsed.model ?? null,
    secondary_color: parsed.secondary_color ?? null,
    gender_target: parsed.gender_target ?? null,
    usage: Array.isArray(parsed.usage) ? parsed.usage : [],
    confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(100, parsed.confidence)) : 0,
    characteristics: Array.isArray(parsed.characteristics) ? parsed.characteristics : [],
    care_tips: Array.isArray(parsed.care_tips) ? parsed.care_tips : [],
    estimated_price_range: parsed.estimated_price_range ?? null,
    interesting_facts: Array.isArray(parsed.interesting_facts) ? parsed.interesting_facts : [],
    similar_shoes: Array.isArray(parsed.similar_shoes) ? parsed.similar_shoes : [],
  };
}

async function analyzeShoeWithGemini(imageUri: string, mimeType: string): Promise<ShoepediaResult> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const base64Image = await uriToBase64(imageUri);
  const prompt = `You are Shoepedia AI Vision, an educational shoe encyclopedia for a smart footwear marketplace.

Analyze the image and decide whether it clearly contains a shoe, sneaker, sandal, boot, or other footwear.

If no shoe is detected, return valid JSON with shoe_type "not_a_shoe", shoe_category "not_shoe", confidence 0, null for unknown fields, and empty arrays where appropriate.

If a shoe is detected, return ONLY valid JSON with exactly these fields:
{
  "shoe_type": string,
  "shoe_category": string,
  "brand": string | null,
  "model": string | null,
  "primary_color": string,
  "secondary_color": string | null,
  "gender_target": string | null,
  "usage": string[],
  "confidence": number,
  "description": string,
  "characteristics": string[],
  "history": string,
  "care_tips": string[],
  "estimated_price_range": string | null,
  "interesting_facts": string[],
  "similar_shoes": string[]
}

Use null when unsure. Keep the response concise but educational.`;

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mimeType, data: base64Image } },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed with status ${response.status}.`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    throw new Error("Gemini response was empty.");
  }
  return extractJson(text);
}

function LoadingVision() {
  const colors = useColors();
  const scan = useSharedValue(0);
  const glow = useSharedValue(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    scan.value = withRepeat(
      withSequence(withTiming(1, { duration: 1300 }), withTiming(0, { duration: 1300 })),
      -1
    );
    glow.value = withRepeat(
      withSequence(withTiming(1, { duration: 900 }), withTiming(0.25, { duration: 900 })),
      -1
    );
    const timer = setInterval(() => setStep((current) => (current + 1) % ANALYSIS_STEPS.length), 1300);
    return () => clearInterval(timer);
  }, []);

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scan.value * 190 }],
  }));
  const frameStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(0, 180, 255, ${0.35 + glow.value * 0.45})`,
    shadowOpacity: 0.2 + glow.value * 0.35,
  }));

  return (
    <View style={styles.loadingWrap}>
      <Animated.View
        style={[
          styles.loadingFrame,
          {
            backgroundColor: colors.card,
            shadowColor: colors.primary,
          },
          frameStyle,
        ]}
      >
        <LinearGradient colors={[colors.primary + "18", colors.accent + "08"]} style={StyleSheet.absoluteFill} />
        <View style={styles.loadingGrid}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={`h${i}`} style={[styles.gridH, { top: `${i * 25}%`, backgroundColor: colors.primary + "12" }]} />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={`v${i}`} style={[styles.gridV, { left: `${i * 25}%`, backgroundColor: colors.primary + "12" }]} />
          ))}
        </View>
        <Ionicons name="footsteps-outline" size={72} color={colors.primary + "70"} />
        <Animated.View style={[styles.scanLine, { backgroundColor: colors.accent }, scanStyle]} />
      </Animated.View>
      <Text style={[styles.loadingTitle, { color: colors.foreground }]}>Shoepedia AI Vision</Text>
      <Text style={[styles.loadingStep, { color: colors.primary }]}>{ANALYSIS_STEPS[step]}</Text>
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <AnimatedProgress color={colors.primary} />
      </View>
    </View>
  );
}

function AnimatedProgress({ color }: { color: string }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 2300 }), -1, false);
  }, []);
  const style = useAnimatedStyle(() => ({
    width: `${20 + progress.value * 80}%`,
  }));
  return <Animated.View style={[styles.progressFill, { backgroundColor: color }, style]} />;
}

function InfoCard({
  icon,
  title,
  children,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
  color: string;
}) {
  const colors = useColors();
  return (
    <GlassCard style={styles.infoCard} intensity={24}>
      <LinearGradient colors={[color + "12", "transparent"]} style={StyleSheet.absoluteFill} />
      <View style={styles.infoHeader}>
        <View style={[styles.infoIcon, { backgroundColor: color + "22" }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={[styles.infoTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {children}
    </GlassCard>
  );
}

function BulletList({ items }: { items: string[] }) {
  const colors = useColors();
  if (items.length === 0) {
    return <Text style={[styles.bodyText, { color: colors.mutedForeground }]}>Unknown</Text>;
  }
  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.bulletRow}>
          <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
          <Text style={[styles.bodyText, { color: colors.foreground }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function ResultView({
  entry,
  onAnalyzeAnother,
  onRemove,
}: {
  entry: ShoepediaHistoryEntry;
  onAnalyzeAnother: () => void;
  onRemove?: () => void;
}) {
  const colors = useColors();
  const result = entry.result;
  const confidenceColor = result.confidence >= 75 ? colors.eco : result.confidence >= 45 ? colors.gold : colors.destructive;

  return (
    <View style={styles.resultWrap}>
      <Image source={{ uri: entry.imageUri }} style={styles.resultImage} />
      <View style={styles.resultTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.resultBrand, { color: colors.primary }]}>{result.brand ?? "Unknown Brand"}</Text>
          <Text style={[styles.resultModel, { color: colors.foreground }]}>{result.model ?? result.shoe_type}</Text>
        </View>
        <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor + "20", borderColor: confidenceColor + "45" }]}>
          <Ionicons name="star" size={14} color={confidenceColor} />
          <Text style={[styles.confidenceText, { color: confidenceColor }]}>{Math.round(result.confidence)}%</Text>
        </View>
      </View>

      <InfoCard icon="document-text-outline" title="Description" color={colors.primary}>
        <Text style={[styles.bodyText, { color: colors.foreground }]}>{result.description || "No description available."}</Text>
      </InfoCard>

      <InfoCard icon="time-outline" title="History" color={colors.gold}>
        <Text style={[styles.bodyText, { color: colors.foreground }]}>{result.history || "No history available."}</Text>
      </InfoCard>

      <InfoCard icon="search-outline" title="Characteristics" color={colors.accent}>
        <BulletList items={result.characteristics} />
      </InfoCard>

      <InfoCard icon="water-outline" title="Care Tips" color={colors.eco}>
        <BulletList items={result.care_tips} />
      </InfoCard>

      <View style={styles.twoCol}>
        <GlassCard style={[styles.miniCard, { borderColor: colors.primary + "40" }]} intensity={22}>
          <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>Price Range</Text>
          <Text style={[styles.miniValue, { color: colors.foreground }]}>{result.estimated_price_range ?? "Unknown"}</Text>
        </GlassCard>
        <GlassCard style={[styles.miniCard, { borderColor: colors.accent + "40" }]} intensity={22}>
          <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>Usage</Text>
          <Text style={[styles.miniValue, { color: colors.foreground }]}>{result.usage.length ? result.usage.join(", ") : "Unknown"}</Text>
        </GlassCard>
      </View>

      <InfoCard icon="bulb-outline" title="Interesting Facts" color={colors.gold}>
        <BulletList items={result.interesting_facts} />
      </InfoCard>

      <InfoCard icon="footsteps-outline" title="Similar Shoes" color={colors.primary}>
        <BulletList items={result.similar_shoes} />
      </InfoCard>

      <View style={styles.resultActions}>
        <Pressable onPress={onAnalyzeAnother} style={{ flex: 1 }}>
          <LinearGradient colors={[colors.primary, colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
            <Ionicons name="camera-outline" size={18} color="#000" />
            <Text style={styles.primaryBtnText}>Analyze Another</Text>
          </LinearGradient>
        </Pressable>
        {onRemove && (
          <Pressable onPress={onRemove} style={[styles.deleteBtn, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "35" }]}>
            <Ionicons name="trash-outline" size={18} color={colors.destructive} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function ShoepediaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { shoepediaHistory, addShoepediaEntry, removeShoepediaEntry, clearShoepediaHistory } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, Platform.OS === "android" ? 24 : 0);
  const [phase, setPhase] = useState<"home" | "loading" | "result">("home");
  const [selectedEntry, setSelectedEntry] = useState<ShoepediaHistoryEntry | null>(null);
  const [error, setError] = useState<"none" | "generic" | "no_shoe" | "missing_key">("none");

  const heroStats = useMemo(
    () => [
      { label: "Analyses", value: shoepediaHistory.length },
      { label: "Saved", value: Math.min(shoepediaHistory.length, 20) },
      { label: "Mode", value: "Vision" },
    ],
    [shoepediaHistory.length]
  );

  const resetToHome = () => {
    setPhase("home");
    setSelectedEntry(null);
    setError("none");
  };

  const handleImage = async (source: "camera" | "gallery") => {
    try {
      setError("none");
      Haptics.selectionAsync();
      const picker = source === "camera" ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
      const picked = await picker({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.72,
      });

      if (picked.canceled || !picked.assets[0]) return;

      const asset = picked.assets[0];
      setPhase("loading");
      const analyzed = await analyzeShoeWithGemini(asset.uri, getMimeType(asset.uri, asset.mimeType));
      const notShoe =
        analyzed.shoe_type.toLowerCase() === "not_a_shoe" ||
        analyzed.shoe_category.toLowerCase() === "not_shoe" ||
        analyzed.confidence <= 0;

      if (notShoe) {
        setError("no_shoe");
        setPhase("home");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }

      const saved = await addShoepediaEntry({ imageUri: asset.uri, result: analyzed });
      setSelectedEntry(saved);
      setPhase("result");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(message.includes("API key") ? "missing_key" : "generic");
      setPhase("home");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const handleClearHistory = () => {
    Alert.alert("Clear Shoepedia History", "Remove all saved shoe analyses from this device?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await clearShoepediaHistory();
          resetToHome();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.primary + "16", "transparent", colors.accent + "08"]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Shoepedia AI</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>AI Shoe Encyclopedia powered by Vision AI</Text>
        </View>
      </View>

      {phase === "loading" ? (
        <LoadingVision />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad + 28 }}>
          {phase === "result" && selectedEntry ? (
            <ResultView
              entry={selectedEntry}
              onAnalyzeAnother={resetToHome}
              onRemove={() => {
                removeShoepediaEntry(selectedEntry.id);
                resetToHome();
              }}
            />
          ) : (
            <>
              <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.primary + "40" }]}>
                <LinearGradient colors={[colors.primary + "22", colors.accent + "08", "transparent"]} style={StyleSheet.absoluteFill} />
                <View style={styles.heroTop}>
                  <View style={[styles.heroIcon, { backgroundColor: colors.primary }]}>
                    <Ionicons name="sparkles" size={28} color="#000" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.heroTitle, { color: colors.foreground }]}>Scan a Shoe</Text>
                    <Text style={[styles.heroDesc, { color: colors.mutedForeground }]}>
                      Upload or capture footwear to identify its type, style, history, care tips, and similar shoes.
                    </Text>
                  </View>
                </View>
                <View style={[styles.heroStats, { borderTopColor: colors.border }]}>
                  {heroStats.map((stat, index) => (
                    <View key={stat.label} style={styles.heroStat}>
                      <Text style={[styles.heroStatValue, { color: index === 2 ? colors.accent : colors.primary }]}>{stat.value}</Text>
                      <Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {error !== "none" && (
                <GlassCard style={[styles.errorCard, { borderColor: error === "no_shoe" ? colors.gold + "50" : colors.destructive + "45" }]} intensity={24}>
                  <LinearGradient colors={[error === "no_shoe" ? colors.gold + "14" : colors.destructive + "12", "transparent"]} style={StyleSheet.absoluteFill} />
                  <Ionicons
                    name={error === "no_shoe" ? "alert-circle-outline" : "warning-outline"}
                    size={22}
                    color={error === "no_shoe" ? colors.gold : colors.destructive}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.errorTitle, { color: colors.foreground }]}>
                      {error === "no_shoe"
                        ? "No shoe detected."
                        : error === "missing_key"
                          ? "Gemini API key is not configured."
                          : "Unable to analyze this shoe."}
                    </Text>
                    <Text style={[styles.errorDesc, { color: colors.mutedForeground }]}>
                      {error === "missing_key"
                        ? "Set EXPO_PUBLIC_GEMINI_API_KEY and restart Expo."
                        : "Try another image with better lighting."}
                    </Text>
                  </View>
                </GlassCard>
              )}

              <View style={styles.actionGrid}>
                <Pressable onPress={() => handleImage("camera")} style={{ flex: 1 }}>
                  <LinearGradient colors={[colors.primary, colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionCard}>
                    <Ionicons name="camera-outline" size={24} color="#000" />
                    <Text style={styles.actionTitle}>Take Photo</Text>
                    <Text style={styles.actionDesc}>Use camera</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable onPress={() => handleImage("gallery")} style={{ flex: 1 }}>
                  <View style={[styles.actionCardSecondary, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="images-outline" size={24} color={colors.primary} />
                    <Text style={[styles.actionTitleAlt, { color: colors.foreground }]}>Upload Image</Text>
                    <Text style={[styles.actionDescAlt, { color: colors.mutedForeground }]}>Choose gallery</Text>
                  </View>
                </Pressable>
              </View>

              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Analyses</Text>
                {shoepediaHistory.length > 0 && (
                  <Pressable onPress={handleClearHistory}>
                    <Text style={[styles.clearText, { color: colors.destructive }]}>Clear</Text>
                  </Pressable>
                )}
              </View>

              {shoepediaHistory.length === 0 ? (
                <GlassCard style={styles.emptyCard} intensity={18}>
                  <Ionicons name="book-outline" size={28} color={colors.mutedForeground} />
                  <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No analyses yet</Text>
                  <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>Your Shoepedia history will appear here after the first scan.</Text>
                </GlassCard>
              ) : (
                <View style={styles.historyList}>
                  {shoepediaHistory.map((entry) => (
                    <Pressable
                      key={entry.id}
                      onPress={() => {
                        setSelectedEntry(entry);
                        setPhase("result");
                      }}
                      style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <Image source={{ uri: entry.imageUri }} style={styles.historyImage} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.historyBrand, { color: colors.primary }]}>{entry.result.brand ?? "Unknown Brand"}</Text>
                        <Text style={[styles.historyModel, { color: colors.foreground }]} numberOfLines={1}>
                          {entry.result.model ?? entry.result.shoe_type}
                        </Text>
                        <Text style={[styles.historyMeta, { color: colors.mutedForeground }]}>
                          {new Date(entry.analyzedAt).toLocaleDateString()} - {Math.round(entry.result.confidence)}% confidence
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={17} color={colors.mutedForeground} />
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16, gap: 14 },
  backBtn: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  heroCard: { marginHorizontal: 20, borderRadius: 22, borderWidth: 1, padding: 18, marginBottom: 18, overflow: "hidden", gap: 16 },
  heroTop: { flexDirection: "row", gap: 14, alignItems: "center" },
  heroIcon: { width: 58, height: 58, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  heroTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  heroDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginTop: 4 },
  heroStats: { flexDirection: "row", borderTopWidth: 1, paddingTop: 14 },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  heroStatLabel: { fontSize: 10, fontFamily: "Inter_500Medium", marginTop: 2 },
  errorCard: { marginHorizontal: 20, marginBottom: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  errorTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  errorDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3 },
  actionGrid: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 24 },
  actionCard: { minHeight: 112, borderRadius: 18, padding: 16, justifyContent: "center", gap: 7 },
  actionCardSecondary: { minHeight: 112, borderRadius: 18, borderWidth: 1, padding: 16, justifyContent: "center", gap: 7 },
  actionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#000" },
  actionDesc: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "rgba(0,0,0,0.65)" },
  actionTitleAlt: { fontSize: 16, fontFamily: "Inter_700Bold" },
  actionDescAlt: { fontSize: 12, fontFamily: "Inter_500Medium" },
  sectionHeader: { paddingHorizontal: 20, marginBottom: 12, flexDirection: "row", alignItems: "center" },
  sectionTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold" },
  clearText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  emptyCard: { marginHorizontal: 20, padding: 22, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  historyList: { paddingHorizontal: 20, gap: 10 },
  historyCard: { borderRadius: 16, borderWidth: 1, padding: 10, flexDirection: "row", alignItems: "center", gap: 12 },
  historyImage: { width: 62, height: 62, borderRadius: 12, resizeMode: "cover" },
  historyBrand: { fontSize: 11, fontFamily: "Inter_700Bold" },
  historyModel: { fontSize: 14, fontFamily: "Inter_700Bold", marginTop: 2 },
  historyMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 14 },
  loadingFrame: {
    width: Math.min(width - 72, 300),
    height: 220,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowRadius: 24,
  },
  loadingGrid: { ...StyleSheet.absoluteFillObject },
  gridH: { position: "absolute", left: 0, right: 0, height: 1 },
  gridV: { position: "absolute", top: 0, bottom: 0, width: 1 },
  scanLine: { position: "absolute", left: 0, right: 0, top: 12, height: 2, opacity: 0.9 },
  loadingTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 8 },
  loadingStep: { fontSize: 13, fontFamily: "Inter_700Bold" },
  progressTrack: { width: Math.min(width - 120, 250), height: 8, borderRadius: 8, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 8 },
  resultWrap: { paddingHorizontal: 20, gap: 12 },
  resultImage: { width: "100%", height: 250, borderRadius: 22, resizeMode: "cover", backgroundColor: "#111118" },
  resultTopRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4, marginBottom: 2 },
  resultBrand: { fontSize: 12, fontFamily: "Inter_700Bold", textTransform: "uppercase" },
  resultModel: { fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 2 },
  confidenceBadge: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7, gap: 5 },
  confidenceText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  infoCard: { padding: 16, gap: 10 },
  infoHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  bodyText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  list: { gap: 9 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 9 },
  bullet: { width: 7, height: 7, borderRadius: 4, marginTop: 7 },
  twoCol: { flexDirection: "row", gap: 10 },
  miniCard: { flex: 1, padding: 14, minHeight: 86 },
  miniLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  miniValue: { fontSize: 14, fontFamily: "Inter_700Bold", lineHeight: 19 },
  resultActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  primaryBtn: { paddingVertical: 15, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#000" },
  deleteBtn: { width: 52, height: 52, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
