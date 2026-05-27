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
import { useColors } from "@/hooks/useColors";

const SHOP_STEPS = [
  { icon: "search-outline" as const, title: "Browse shoes" },
  { icon: "shirt-outline" as const, title: "Open product detail" },
  { icon: "scan-outline" as const, title: "Scan your foot" },
  { icon: "sparkles-outline" as const, title: "Get SmartFit matches" },
  { icon: "cube-outline" as const, title: "Try AR Studio" },
  { icon: "bag-add-outline" as const, title: "Add to cart" },
  { icon: "card-outline" as const, title: "Checkout" },
];

const FAQS = [
  { q: "Is SmartFit real AI?", a: "SmartFit is a simulation-based recommendation engine using product metadata and foot scan inputs for presentation purposes." },
  { q: "How are Green Points calculated?", a: "Green Points are awarded for eco actions such as buying eco shoes, opening Eco Collection, sharing invoices, and completing foot scans." },
  { q: "Can I become a seller?", a: "Yes. The Become Seller flow simulates seller onboarding and unlocks seller analytics views." },
  { q: "Are payments real?", a: "No. Checkout and payment flows are simulated for a safe academic prototype experience." },
  { q: "Does AR detect my foot automatically?", a: "No. AR Try-On is pseudo AR: users upload a foot photo and manually adjust the shoe overlay." },
  { q: "Is my foot scan stored online?", a: "No. This prototype stores scan results locally with AsyncStorage and does not upload data to a backend." },
];

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

function FAQCard({ question, answer, index }: { question: string; answer: string; index: number }) {
  const colors = useColors();
  const [open, setOpen] = useState(index === 0);
  const progress = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    progress.value = withSpring(open ? 1 : 0, { damping: 16, stiffness: 160 });
  }, [open]);
  const answerStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    maxHeight: progress.value * 120,
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 180}deg` }],
  }));
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        setOpen((value) => !value);
      }}
      style={[styles.faqCard, { backgroundColor: colors.card, borderColor: open ? colors.primary + "45" : colors.border }]}
    >
      <View style={styles.faqTop}>
        <Text style={[styles.faqQuestion, { color: colors.foreground }]}>{question}</Text>
        <Animated.View style={iconStyle}>
          <Ionicons name="chevron-down" size={18} color={open ? colors.primary : colors.mutedForeground} />
        </Animated.View>
      </View>
      <Animated.View style={[styles.faqAnswerWrap, answerStyle]}>
        <Text style={[styles.faqAnswer, { color: colors.mutedForeground }]}>{answer}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function HelpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, Platform.OS === "android" ? 24 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.eco + "12", colors.primary + "08", "transparent"]} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Help Center</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Guides, FAQ, and support</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad + 30 }}>
        <FadeIn>
          <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.primary + "40" }]}>
            <LinearGradient colors={[colors.primary + "18", colors.eco + "10"]} style={StyleSheet.absoluteFill} />
            <Ionicons name="footsteps-outline" size={36} color={colors.primary} />
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>What is Footwear?</Text>
            <Text style={[styles.heroDesc, { color: colors.mutedForeground }]}>
              Footwear is a smart shoe marketplace prototype combining SmartFit recommendations, pseudo AR try-on, eco commerce, seller analytics, and SDG-12 engagement.
            </Text>
          </View>
        </FadeIn>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How to Shop</Text>
          <View style={styles.stepGrid}>
            {SHOP_STEPS.map((step, i) => (
              <FadeIn key={step.title} delay={90 + i * 45}>
                <View style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Ionicons name={step.icon} size={20} color={colors.primary} />
                  <Text style={[styles.stepTitle, { color: colors.foreground }]}>{step.title}</Text>
                </View>
              </FadeIn>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Green Rewards</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.eco + "35" }]}>
            <LinearGradient colors={[colors.eco + "18", "transparent"]} style={StyleSheet.absoluteFill} />
            <Ionicons name="leaf-outline" size={24} color={colors.eco} />
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>Earn GP, unlock badges, support SDG-12</Text>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              Buy eco shoes, complete scans, share invoices, and revisit Eco Collection to grow your Green Wallet and sustainability level.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>SmartFit Guide</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.accent + "35" }]}>
            <Ionicons name="scan-outline" size={24} color={colors.accent} />
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>Simulation-based fit recommendations</Text>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              SmartFit estimates foot type from marker placement and compares it with shoe metadata. It is not medical scanning or real machine learning.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AR Try-On Guide</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.gold + "35" }]}>
            <Ionicons name="cube-outline" size={24} color={colors.gold} />
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>Pseudo AR for demo interaction</Text>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              Upload a foot photo, then drag, resize, and rotate the shoe overlay. This creates a believable try-on studio without native AR tracking.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>FAQ</Text>
          {FAQS.map((faq, i) => (
            <FAQCard key={faq.q} question={faq.q} answer={faq.a} index={i} />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Contact Support</Text>
          <View style={[styles.supportCard, { backgroundColor: colors.card, borderColor: colors.primary + "40" }]}>
            <LinearGradient colors={[colors.primary + "14", colors.eco + "08"]} style={StyleSheet.absoluteFill} />
            <View style={[styles.supportBadge, { backgroundColor: colors.eco + "20", borderColor: colors.eco + "40" }]}>
              <Ionicons name="sparkles-outline" size={13} color={colors.eco} />
              <Text style={[styles.supportBadgeText, { color: colors.eco }]}>24/7 AI Support</Text>
            </View>
            <Text style={[styles.supportTitle, { color: colors.foreground }]}>Need help with the demo?</Text>
            <Text style={[styles.supportLine, { color: colors.primary }]}>support@footwear.app</Text>
            <Text style={[styles.supportLine, { color: colors.accent }]}>@footwear.id</Text>
            <Text style={[styles.supportDesc, { color: colors.mutedForeground }]}>Average response time: under 2 hours. Demo contact data only.</Text>
          </View>
        </View>
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
  heroCard: { marginHorizontal: 20, borderRadius: 22, borderWidth: 1, padding: 22, alignItems: "flex-start", gap: 10, overflow: "hidden", marginBottom: 24 },
  heroTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  heroDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 12 },
  
  // 🔧 PERBAIKAN DI SINI: stepGrid & stepCard
  stepGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 12,  // 🔧 gap sedikit lebih lega
  },
  stepCard: { 
    flex: 1,           // 🔧 KUNCI: bagi ruang secara adil
    minWidth: "48%",   // 🔧 batas minimal ~setengah layar
    minHeight: 118, 
    borderRadius: 16, 
    borderWidth: 1, 
    padding: 14, 
    gap: 9 
  },
  
  stepNum: { width: 26, height: 26, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  stepNumText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#000" },
  stepTitle: { fontSize: 13, fontFamily: "Inter_700Bold", lineHeight: 18 },
  infoCard: { borderRadius: 18, borderWidth: 1, padding: 17, gap: 9, overflow: "hidden" },
  infoTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  infoText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 19 },
  faqCard: { borderRadius: 16, borderWidth: 1, padding: 15, marginBottom: 10, overflow: "hidden" },
  faqTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  faqQuestion: { flex: 1, fontSize: 14, fontFamily: "Inter_700Bold" },
  faqAnswerWrap: { overflow: "hidden" },
  faqAnswer: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, paddingTop: 10 },
  supportCard: { borderRadius: 20, borderWidth: 1, padding: 18, gap: 8, overflow: "hidden" },
  supportBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, borderWidth: 1, gap: 5 },
  supportBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  supportTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginTop: 4 },
  supportLine: { fontSize: 14, fontFamily: "Inter_700Bold" },
  supportDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
});