import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

function JarvixTabIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: size ?? 16, color, fontFamily: "Inter_700Bold", letterSpacing: 2, opacity: focused ? 1 : 0.7 }}>
        J<Text style={{ color }}>X</Text>
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          ...(Platform.OS === "web" ? { height: 84 } : {}),
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Agent",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="robot-excited" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="jarvix"
        options={{
          title: "JARVIX",
          tabBarActiveTintColor: "#38BDF8",
          tabBarIcon: (props) => <JarvixTabIcon {...props} />,
        }}
      />
      <Tabs.Screen
        name="engineering"
        options={{
          title: "Engineering",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="smm"
        options={{
          title: "SMM",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="telegram"
        options={{
          title: "Telegram",
          tabBarActiveTintColor: "#2AABEE",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="send-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
