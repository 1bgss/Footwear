import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { SETTINGS_KEYS } from "@/utils/settings";

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useSharedValue(0);
  const y = useSharedValue(18);
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 420 }));
    y.value = withDelay(delay, withSpring(0, { damping: 14, stiffness: 140 }));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: y.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

function GlowSwitch({
  value,
  onValueChange,
  color,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  color: string;
}) {
  const knob = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    knob.value = withSpring(value ? 1 : 0, { damping: 14, stiffness: 180 });
  }, [value]);
  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: knob.value * 28 }],
  }));
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={[
        styles.switchTrack,
        { backgroundColor: value ? color + "35" : "rgba(255,255,255,0.08)", borderColor: value ? color : "rgba(255,255,255,0.12)" },
      ]}
    >
      <Animated.View style={[styles.switchKnob, { backgroundColor: value ? color : "#6B7280" }, knobStyle]} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, footScanResult, ecoLevel } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, Platform.OS === "android" ? 24 : 0);
  const [notifications, setNotifications] = useState(true);
  const [lightMode, setLightMode] = useState(false);
  const [haptics, setHaptics] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [storedNotifications, storedLightMode, storedHaptics] = await Promise.all([
        AsyncStorage.getItem(SETTINGS_KEYS.NOTIFICATIONS),
        AsyncStorage.getItem(SETTINGS_KEYS.LIGHT_MODE),
        AsyncStorage.getItem(SETTINGS_KEYS.HAPTICS),
      ]);
      if (storedNotifications !== null) setNotifications(storedNotifications === "true");
      if (storedLightMode !== null) setLightMode(storedLightMode === "true");
      if (storedHaptics !== null) setHaptics(storedHaptics === "true");
    };
    load();
  }, []);

  const setPreference = async (key: string, value: boolean, setter: (value: boolean) => void) => {
    setter(value);
    await AsyncStorage.setItem(key, String(value));
    if (haptics || key === SETTINGS_KEYS.HAPTICS) {
      Haptics.selectionAsync();
    }
  };

  const screenColors = lightMode
    ? { background: "#12161C", card: "#1B2430", border: "#3C5368" }
    : { background: colors.background, card: colors.card, border: colors.border };

  const settingRows = [
    {
      icon: "notifications-outline" as const,
      title: "Enable Notifications",
      desc: "Receive order updates, eco rewards, and SmartFit alerts.",
      value: notifications,
      color: colors.primary,
      onToggle: (value: boolean) => setPreference(SETTINGS_KEYS.NOTIFICATIONS, value, setNotifications),
    },
    {
      icon: "sunny-outline" as const,
      title: "Light Mode",
      desc: "Preview a brighter futuristic theme while preserving neon accents.",
      value: lightMode,
      color: colors.gold,
      onToggle: (value: boolean) => setPreference(SETTINGS_KEYS.LIGHT_MODE, value, setLightMode),
    },
    {
      icon: "phone-portrait-outline" as const,
      title: "Haptic Feedback",
      desc: "Enable immersive touch interactions across demo flows.",
      value: haptics,
      color: colors.eco,
      onToggle: (value: boolean) => setPreference(SETTINGS_KEYS.HAPTICS, value, setHaptics),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: screenColors.background }]}>
      <LinearGradient colors={[colors.primary + "12", colors.eco + "08", "transparent"]} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: screenColors.card, borderColor: screenColors.border }]}>
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Preferences and app controls</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad + 28 }}>
        <FadeIn>
          <View style={[styles.heroCard, { backgroundColor: screenColors.card, borderColor: colors.primary + "40" }]}>
            <LinearGradient colors={[colors.primary + "18", colors.accent + "08"]} style={StyleSheet.absoluteFill} />
            <View style={[styles.heroIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="options-outline" size={26} color="#000" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroTitle, { color: colors.foreground }]}>Control Center</Text>
              <Text style={[styles.heroDesc, { color: colors.mutedForeground }]}>Fine-tune the prototype experience for notifications, touch feedback, and theme preview.</Text>
            </View>
          </View>
        </FadeIn>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Preferences</Text>
          {settingRows.map((item, i) => (
            <FadeIn key={item.title} delay={120 + i * 80}>
              <View style={[styles.settingCard, { backgroundColor: screenColors.card, borderColor: item.value ? item.color + "45" : screenColors.border }]}>
                <LinearGradient colors={[item.value ? item.color + "12" : "transparent", "transparent"]} style={StyleSheet.absoluteFill} />
                <View style={[styles.settingIcon, { backgroundColor: item.color + "18" }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
                </View>
                <GlowSwitch value={item.value} onValueChange={item.onToggle} color={item.color} />
              </View>
            </FadeIn>
          ))}
        </View>

        <FadeIn delay={420}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Account Snapshot</Text>
            <View style={[styles.accountCard, { backgroundColor: screenColors.card, borderColor: screenColors.border }]}>
              {[
                { label: "Account", value: user?.role === "seller" ? "Seller Account" : "Buyer Account", icon: "person-outline" as const, color: colors.primary },
                { label: "SmartFit", value: footScanResult ? "Active" : "Not scanned", icon: "scan-outline" as const, color: footScanResult ? colors.eco : colors.gold },
                { label: "Eco Level", value: ecoLevel, icon: "leaf-outline" as const, color: colors.eco },
              ].map((item) => (
                <View key={item.label} style={styles.accountRow}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                  <Text style={[styles.accountLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                  <Text style={[styles.accountValue, { color: colors.foreground }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={520}>
          <View style={[styles.versionCard, { backgroundColor: screenColors.card, borderColor: colors.accent + "40" }]}>
            <LinearGradient colors={[colors.accent + "12", colors.primary + "08"]} style={StyleSheet.absoluteFill} />
            <Ionicons name="rocket-outline" size={24} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.versionTitle, { color: colors.foreground }]}>Footwear v1.0</Text>
              <Text style={[styles.versionDesc, { color: colors.mutedForeground }]}>Smart Shoe Marketplace Prototype</Text>
              <Text style={[styles.versionMeta, { color: colors.primary }]}>Expo SDK 54</Text>
            </View>
          </View>
        </FadeIn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16, gap: 14 },
  backBtn: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  heroCard: { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, padding: 18, flexDirection: "row", alignItems: "center", gap: 14, overflow: "hidden", marginBottom: 24 },
  heroIcon: { width: 54, height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  heroTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  heroDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginTop: 4 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 12 },
  settingCard: { borderRadius: 16, borderWidth: 1, padding: 15, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12, overflow: "hidden" },
  settingIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  settingTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  settingDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16, marginTop: 3 },
  switchTrack: { width: 58, height: 32, borderRadius: 18, borderWidth: 1, padding: 3, justifyContent: "center" },
  switchKnob: { width: 24, height: 24, borderRadius: 12 },
  accountCard: { borderRadius: 16, borderWidth: 1, padding: 15, gap: 12 },
  accountRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  accountLabel: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium" },
  accountValue: { fontSize: 13, fontFamily: "Inter_700Bold" },
  versionCard: { marginHorizontal: 20, borderRadius: 18, borderWidth: 1, padding: 18, flexDirection: "row", gap: 14, overflow: "hidden" },
  versionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  versionDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  versionMeta: { fontSize: 12, fontFamily: "Inter_700Bold", marginTop: 8 },
});
