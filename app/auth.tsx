import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { UserRole } from "@/context/AppContext";

type Mode = "login" | "register";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { login } = useApp();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("buyer");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    if (mode === "register" && !name) {
      Alert.alert("Error", "Please enter your name");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    login(mode === "register" ? name : email.split("@")[0], email, role);
    setLoading(false);
    router.replace("/(tabs)");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(0,180,255,0.12)", "transparent", "rgba(124,58,237,0.06)"]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: topPad + 32, paddingBottom: bottomPad + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <Text style={[styles.logo, { color: colors.primary }]}>FOOTWEAR</Text>
            <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
              Smart Shoe Marketplace
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.modeSwitcher, { backgroundColor: colors.muted }]}>
              {(["login", "register"] as Mode[]).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setMode(m)}
                  style={[
                    styles.modeBtn,
                    mode === m && { backgroundColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.modeBtnText,
                      { color: mode === m ? "#000" : colors.mutedForeground },
                    ]}
                  >
                    {m === "login" ? "Sign In" : "Register"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {mode === "register" && (
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Full Name</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <Ionicons name="person-outline" size={18} color={colors.mutedForeground} />
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Your full name"
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.input, { color: colors.foreground }]}
                  />
                </View>
              </View>
            )}

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Email</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Ionicons name="mail-outline" size={18} color={colors.mutedForeground} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.input, { color: colors.foreground }]}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Password</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPass}
                  style={[styles.input, { color: colors.foreground }]}
                />
                <Pressable onPress={() => setShowPass((v) => !v)}>
                  <Ionicons
                    name={showPass ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              </View>
            </View>

            {mode === "register" && (
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>I am a...</Text>
                <View style={styles.roleRow}>
                  {(["buyer", "seller"] as UserRole[]).map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => setRole(r)}
                      style={[
                        styles.roleCard,
                        {
                          backgroundColor: role === r ? colors.primary + "20" : colors.muted,
                          borderColor: role === r ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={r === "buyer" ? "bag-outline" : "storefront-outline"}
                        size={28}
                        color={role === r ? colors.primary : colors.mutedForeground}
                      />
                      <Text
                        style={[
                          styles.roleLabel,
                          { color: role === r ? colors.primary : colors.foreground },
                        ]}
                      >
                        {r === "buyer" ? "Buyer" : "Seller"}
                      </Text>
                      <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>
                        {r === "buyer" ? "Shop & discover" : "Sell products"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <Pressable onPress={handleSubmit} disabled={loading} style={{ marginTop: 8 }}>
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.submitBtn, loading && { opacity: 0.6 }]}
              >
                <Text style={styles.submitText}>
                  {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>

          <View style={styles.demoHint}>
            <Text style={[styles.demoText, { color: colors.mutedForeground }]}>
              Demo: Enter any email & password to continue
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24, gap: 32 },
  brand: { alignItems: "center", gap: 8 },
  logo: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: 4 },
  tagline: { fontSize: 14, fontFamily: "Inter_400Regular" },
  card: { borderRadius: 20, borderWidth: 1, padding: 24, gap: 20 },
  modeSwitcher: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 4,
  },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  modeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  field: { gap: 8 },
  label: { fontSize: 12, fontFamily: "Inter_500Medium", letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  roleRow: { flexDirection: "row", gap: 12 },
  roleCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  roleLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  roleDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  submitBtn: { borderRadius: 14, paddingVertical: 18, alignItems: "center" },
  submitText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#000" },
  demoHint: { alignItems: "center" },
  demoText: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
});
