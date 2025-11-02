// app/(auth)/sign-up.tsx
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import AuthShell from "../../src/components/AuthShell";
import { supabase } from "../../src/lib/supabase";

type Props = {
  onSelectLogin: () => void;
  onSelectRegister: () => void;
};

export default function SignUp({ onSelectLogin, onSelectRegister }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const onSubmit = async () => {
    setErr(null); setOk(null);
    if (!email || !pw) return setErr("Email and password are required.");
    if (pw !== confirm) return setErr("Passwords do not match.");

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password: pw, options: { data: { full_name: name } },
    });
    setLoading(false);

    if (error) return setErr(error.message || "Could not create your account.");
    // If email confirmation is ON in Supabase, you’ll receive a pending user.
    if (data.user && !data.session) {
      setOk("Check your email to confirm your account, then sign in.");
      return;
    }
  };

  return (
    <AuthShell
      title="Create Account"
      active="Register"
      onSelectLogin={onSelectLogin}
      onSelectRegister={onSelectRegister}
    >
      <View style={{ gap: 14 }}>
        <View>
          <Text style={styles.label}>Full Name</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Jane Doe" style={styles.input} />
        </View>

        <View>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            autoCapitalize="none"
            inputMode="email"
            value={email}
            onChangeText={setEmail}
            placeholder="name@email.com"
            style={styles.input}
          />
        </View>

        <View>
          <Text style={styles.label}>Password</Text>
          <TextInput value={pw} onChangeText={setPw} placeholder="••••••••" secureTextEntry style={styles.input} />
        </View>

        <View>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput value={confirm} onChangeText={setConfirm} placeholder="••••••••" secureTextEntry style={styles.input} />
        </View>

        {!!err && <Text style={styles.error}>{err}</Text>}
        {!!ok && <Text style={styles.ok}>{ok}</Text>}

        <Pressable onPress={onSubmit} disabled={loading} style={[styles.cta, loading && styles.ctaDisabled]}>
          <Text style={styles.ctaText}>{loading ? "Creating..." : "Continue"}</Text>
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
  ok: { color: "#027A48", backgroundColor: "#ECFDF3", borderRadius: 8, padding: 10, borderWidth: 1, borderColor: "#ABEFC6" },
});
