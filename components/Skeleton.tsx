import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  delay?: number;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style, delay = 0 }: SkeletonProps) {
  const colors = useColors();
  const opacity = useSharedValue(0.25);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.7, { duration: 800 }),
          withTiming(0.25, { duration: 800 })
        ),
        -1
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: colors.muted },
        animStyle,
        style,
      ]}
    />
  );
}

export function ProductCardSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Skeleton height={140} borderRadius={12} delay={0} />
      <View style={styles.productCardBody}>
        <Skeleton width="55%" height={11} delay={60} />
        <Skeleton width="75%" height={14} delay={100} />
        <View style={styles.row}>
          <Skeleton width="40%" height={18} delay={140} />
          <Skeleton width="25%" height={14} delay={140} />
        </View>
      </View>
    </View>
  );
}

export function OrderSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Skeleton width="45%" height={11} delay={0} />
      <Skeleton width="70%" height={15} delay={60} />
      <View style={styles.row}>
        <Skeleton width="30%" height={11} delay={100} />
        <Skeleton width="18%" height={11} delay={100} />
      </View>
    </View>
  );
}

export function AnalyticsSkeleton() {
  const colors = useColors();
  return (
    <View style={{ gap: 12, paddingHorizontal: 20 }}>
      <View style={styles.kpiRow}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Skeleton width={28} height={28} borderRadius={8} delay={i * 60} />
            <Skeleton width="60%" height={22} delay={i * 60 + 30} />
            <Skeleton width="80%" height={12} delay={i * 60 + 60} />
          </View>
        ))}
      </View>
      <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Skeleton width="45%" height={16} delay={0} />
        <View style={styles.chartBars}>
          {[60, 80, 50, 95, 70, 100].map((h, i) => (
            <View key={i} style={styles.barWrap}>
              <Skeleton height={h * 0.6} borderRadius={4} delay={i * 50} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  productCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    flex: 1,
  },
  productCardBody: { padding: 12, gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginBottom: 10,
  },
  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiCard: { width: "47%", borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  chartCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 16 },
  chartBars: { flexDirection: "row", alignItems: "flex-end", height: 80, gap: 6 },
  barWrap: { flex: 1, justifyContent: "flex-end" },
});
