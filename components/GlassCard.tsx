import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: "dark" | "light" | "extraLight" | "prominent" | "systemUltraThinMaterial" | "systemThinMaterial" | "systemMaterial" | "systemThickMaterial" | "systemChromeMaterial" | "systemUltraThinMaterialLight" | "systemThinMaterialLight" | "systemMaterialLight" | "systemThickMaterialLight" | "systemChromeMaterialLight" | "systemUltraThinMaterialDark" | "systemThinMaterialDark" | "systemMaterialDark" | "systemThickMaterialDark" | "systemChromeMaterialDark" | "default";
}

export function GlassCard({ children, style, intensity = 20, tint = "dark" }: GlassCardProps) {
  const colors = useColors();

  if (Platform.OS === "web") {
    return (
      <View style={[styles.webFallback, { borderColor: colors.border, backgroundColor: colors.card }, style]}>
        {children}
      </View>
    );
  }

  return (
    <BlurView intensity={intensity} tint={tint} style={[styles.glass, { borderColor: colors.border }, style]}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  glass: {
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 14,
  },
  webFallback: {
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 14,
  },
});
