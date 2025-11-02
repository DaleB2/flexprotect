// app/(auth)/sign-in.tsx
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import AuthShell from "../../src/components/AuthShell";
import { supabase } from "../../src/lib/supabase";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async () => {
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (error) {
      setErr(error.message || "Invalid email or password.");
      return;
    }
    router.replace("/(tabs)/dashboard");
  };

  return (
    <AuthShell title="Welcome Back">
      <View style={{ gap: 14 }}>
        <View>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            autoCapitalize="none"
            inputMode="email"
            value={email}
            onChangeText={setEmail}
            placeholder="name@email.com"
            style={styles.input}
            onSubmitEditing={onSubmit}
          />
        </View>

        <View>
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={pw}
            onChangeText={setPw}
            placeholder="••••••••"
            secureTextEntry
            style={styles.input}
            onSubmitEditing={onSubmit}
          />
        </View>

        {!!err && <Text style={styles.error}>{err}</Text>}

        <Pressable onPress={onSubmit} disabled={loading} style={[styles.cta, loading && styles.ctaDisabled]}>
          <Text style={styles.ctaText}>{loading ? "Signing in..." : "Continue"}</Text>
        </Pressable>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: "600", color: "#0F172A", marginBottom: 6 },
  input: {
    height: 44, borderWidth: 1, borderColor: "#D0D5DD", borderRadius: 10,
    paddingHorizontal: 14, backgroundColor: "#fff",
  },
  cta: {
    marginTop: 6, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: "#0A66FF",
    boxShadow: "0 10px 24px rgba(10,102,255,0.35)",
  } as any,
  ctaDisabled: { opacity: 0.65 },
  ctaText: { color: "#fff", fontWeight: "700" },
  error: { color: "#B42318", backgroundColor: "#FEE4E2", borderRadius: 8, padding: 10, borderWidth: 1, borderColor: "#FDA29B" },
});
