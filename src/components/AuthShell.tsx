// src/components/AuthShell.tsx
import { Link, usePathname } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

type Props = { title: string; children: React.ReactNode; };

export default function AuthShell({ title, children }: Props) {
  const path = usePathname();
  const onSignIn = path.includes("/sign-in");
  return (
    <View style={s.wrap}>
      <View style={s.card}>
        {/* Left: form column */}
        <View style={s.left}>
          <View style={s.logoRow}>
            <View style={s.logoDot} />
            <Text style={s.brand}>SmartSave</Text>
          </View>

          <Text style={s.h1}>Welcome Back</Text>
          <Text style={s.sub}>Welcome back, please enter your details</Text>

          {/* Tabs */}
          <View style={s.tabs}>
<Link href="/(auth)/sign-in">
  <View style={[s.tab, onSignIn && s.tabActive]}>
    <Text style={[s.tabText, onSignIn && s.tabTextActive]}>Sign In</Text>
  </View>
</Link>

<Link href="/(auth)/sign-up">
  <View style={[s.tab, !onSignIn && s.tabActive]}>
    <Text style={[s.tabText, !onSignIn && s.tabTextActive]}>Signup</Text>
  </View>
</Link>
          </View>

          {/* Form area */}
          <View style={{ width: "100%", marginTop: 18 }}>{children}</View>

          {/* Footer copy */}
          <Text style={s.footer}>
            Join the millions of smart investors who trust us to manage their finances. Log in
            to access your personalised dashboard, track portfolio performance, and make informed decisions.
          </Text>
        </View>

        {/* Right: hero image */}
        <View style={s.right}>
          <Image
            source={{
              uri:
                "https://images.unsplash.com/photo-1550525811-e5869dd03032?q=80&w=1600&auto=format&fit=crop",
            }}
            resizeMode="cover"
            style={s.hero}
          />
          <View style={s.heroOverlay} />
          <View style={s.safeBox} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#EFF1F4", alignItems: "center", justifyContent: "center", padding: 16 },
  card: {
    width: 980, height: 620, backgroundColor: "#fff", borderRadius: 20,
    overflow: "hidden", flexDirection: "row", boxShadow: "0 20px 60px rgba(16,24,40,0.12)",
  } as any,
  left: { flex: 1, paddingHorizontal: 40, paddingVertical: 36, justifyContent: "flex-start" },
  right: { width: 480, height: "100%", position: "relative", backgroundColor: "#DCEAFE" },
  logoRow: { flexDirection: "row", alignItems: "center", marginBottom: 36 },
  logoDot: { width: 24, height: 24, borderRadius: 6, backgroundColor: "#0A66FF", marginRight: 10 },
  brand: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  h1: { fontSize: 28, fontWeight: "800", color: "#0F172A" },
  sub: { marginTop: 6, color: "#667085" },
  tabs: {
    marginTop: 18, backgroundColor: "#F2F4F7", borderRadius: 12, flexDirection: "row", padding: 4, width: 280,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: "#fff" },
  tabText: { color: "#667085", fontWeight: "600" },
  tabTextActive: { color: "#0F172A" },
  hero: { width: "100%", height: "100%" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(13,71,161,0.15)" },
  safeBox: {
    position: "absolute", right: 48, bottom: 64, width: 260, height: 210, borderRadius: 24,
    backgroundColor: "#2B6CB0",
    boxShadow: "0 15px 40px rgba(0,0,0,0.18)",
  } as any,
  footer: { color: "#98A2B3", fontSize: 12, marginTop: 28, lineHeight: 18, width: 420 },
});
