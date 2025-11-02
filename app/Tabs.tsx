import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import DashboardScreen from "./screens/DashboardScreen";
import SettingsScreen from "./screens/SettingsScreen";

type TabKey = "Dashboard" | "Settings";

const tabs: Array<{
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { key: "Dashboard", label: "Dashboard", icon: "home" },
  { key: "Settings", label: "Settings", icon: "settings" },
];

export default function Tabs() {
  const [activeTab, setActiveTab] = useState<TabKey>("Dashboard");

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {activeTab === "Dashboard" ? <DashboardScreen /> : <SettingsScreen />}
      </View>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const focused = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon}
                size={24}
                color={focused ? "#4F46E5" : "#B3A8D9"}
              />
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8fb" },
  content: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 14,
    justifyContent: "space-around",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(15, 23, 42, 0.08)",
  },
  tabItem: { alignItems: "center", gap: 6 },
  tabLabel: { color: "#B3A8D9", fontWeight: "600" },
  tabLabelActive: { color: "#4F46E5" },
});
