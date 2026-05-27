import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, cartItems } = useApp();
  const isSeller = user?.role === "seller";
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";
  const bottomInset = isWeb ? 12 : Math.max(insets.bottom, Platform.OS === "android" ? 24 : 8);
  const tabBarHeight = (isWeb ? 84 : 64) + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: tabBarHeight,
          paddingBottom: bottomInset,
          paddingTop: 8,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.background },
              ]}
            />
          ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "Inter_500Medium",
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: isSeller ? "Analytics" : "Explore",
          tabBarIcon: ({ color, focused }) =>
            isSeller ? (
              <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={22} color={color} />
            ) : (
              <Ionicons name={focused ? "compass" : "compass-outline"} size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: isSeller ? "Orders" : "Cart",
          tabBarBadge: !isSeller && cartItems.length > 0 ? cartItems.length : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary, color: "#000", fontSize: 10 },
          tabBarIcon: ({ color, focused }) =>
            isSeller ? (
              <Ionicons name={focused ? "receipt" : "receipt-outline"} size={22} color={color} />
            ) : (
              <Ionicons name={focused ? "bag" : "bag-outline"} size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
