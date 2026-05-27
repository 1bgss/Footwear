import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    icon: "storefront-outline" as const,
    title: "Smart Shoe\nMarketplace",
    subtitle: "Discover premium local & international shoe brands with AI-powered recommendations tailored just for you.",
    accent: "#00B4FF",
  },
  {
    icon: "scan-outline" as const,
    title: "SmartFit\nTechnology",
    subtitle: "Scan your foot to get a precise size profile and receive shoe recommendations that match your unique foot shape.",
    accent: "#00E5FF",
  },
  {
    icon: "cube-outline" as const,
    title: "AR Virtual\nTry-On",
    subtitle: "Experience shoes before you buy them with our interactive AR simulation. See exactly how they look on you.",
    accent: "#00C878",
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { completeOnboarding } = useApp();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const dotScales = SLIDES.map(() => useSharedValue(1));

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(idx);
  };

  const handleNext = async () => {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
    } else {
      await completeOnboarding();
      router.replace("/auth");
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace("/auth");
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, Platform.OS === "android" ? 24 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(0,180,255,0.08)", "transparent", "rgba(0,200,120,0.05)"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.logo, { color: colors.primary }]}>FOOTWEAR</Text>
        <Pressable onPress={handleSkip}>
          <Text style={[styles.skip, { color: colors.mutedForeground }]}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <View style={[styles.iconContainer, { borderColor: slide.accent + "40" }]}>
              <LinearGradient
                colors={[slide.accent + "20", slide.accent + "05"]}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name={slide.icon} size={64} color={slide.accent} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>{slide.title}</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{slide.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 24 }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: activeIndex === i ? 24 : 8,
                  backgroundColor: activeIndex === i ? colors.primary : colors.border,
                },
              ]}
            />
          ))}
        </View>

        <Pressable onPress={handleNext} style={styles.nextBtn}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextGradient}
          >
            <Text style={styles.nextText}>
              {activeIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#000" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  logo: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: 3 },
  skip: { fontSize: 14, fontFamily: "Inter_500Medium" },
  scrollView: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 48,
    overflow: "hidden",
  },
  title: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 44,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 24,
    alignItems: "center",
  },
  dots: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { height: 8, borderRadius: 4 },
  nextBtn: { width: "100%", borderRadius: 16, overflow: "hidden" },
  nextGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 8,
  },
  nextText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#000" },
});
