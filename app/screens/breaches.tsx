import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import Button from "../../src/components/Button";
import Card from "../../src/components/Card";
import { fetchBreachesForEmail } from "../../src/lib/api";
import { supabase } from "../../src/lib/supabase";

type EmailRow = { id: string; email: string };
type Finding = { id: string; breach: string; domain: string | null; breach_date: string | null; status: string; email: string };

export default function Breaches() {
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { data: e } = await supabase.from("monitored_emails").select("id,email").order("created_at", { ascending: false });
    setEmails(e || []);
    const { data: f } = await supabase.from("breach_findings").select("*").order("created_at", { ascending: false });
    setFindings(f || []);
  }

  useEffect(() => { refresh(); }, []);

  async function addEmail() {
    if (!newEmail) return;
    const { error } = await supabase.from("monitored_emails").insert([{ email: newEmail }]);
    if (error) return Alert.alert("Error", error.message);
    setNewEmail("");
    refresh();
  }

  async function checkNow(email: string) {
    try {
      setBusy(true);
      // 1) call free API (XposedOrNot)
      const breaches = await fetchBreachesForEmail(email);
      // 2) insert new findings (skip duplicates by (email, breach))
      for (const b of breaches) {
        await supabase.from("breach_findings")
          .upsert({ user_id: (await supabase.auth.getUser()).data.user?.id, email, breach: b.title, domain: b.domain || null, breach_date: b.breach_date || null, raw: b }, { onConflict: "id" });
      }
      refresh();
      Alert.alert("Check complete", `Found ${breaches.length} items (new and existing).`);
    } catch (e: any) {
      Alert.alert("Check failed", e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function markResolved(id: string) {
    await supabase.from("breach_findings").update({ status: "resolved" }).eq("id", id);
    refresh();
  }

  const unresolved = findings.filter(f => f.status !== "resolved");
  const resolved = findings.filter(f => f.status === "resolved");

  return (
    <ScrollView style={{ flex:1, backgroundColor:"#f6f8fb" }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "800", color: "#111827" }}>Breaches</Text>

      <Card>
        <Text style={{ color: "#6b7280", marginBottom: 8 }}>Monitored emails</Text>
        {emails.map((e) => (
          <View key={e.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ color: "#111827" }}>{e.email}</Text>
            <Button title={busy ? "Checking…" : "Check now"} onPress={() => checkNow(e.email)} />
          </View>
        ))}
        <View style={{ height: 10 }} />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            placeholder="Add another email"
            style={{
              flex: 1, backgroundColor: "#fff", borderColor: "#e5e7eb", borderWidth: 1,
              borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, color: "#111827"
            }}
            value={newEmail}
            onChangeText={setNewEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Button title="Add" onPress={addEmail} />
        </View>
      </Card>

      <Card>
        <Text style={{ color: "#6b7280", marginBottom: 8 }}>Unresolved breaches</Text>
        {unresolved.length === 0 && <Text style={{ color:"#111827" }}>No unresolved breaches 🎉</Text>}
        {unresolved.map((b) => (
          <View key={b.id} style={{ paddingVertical: 8, borderBottomColor:"#e5e7eb", borderBottomWidth: 1 }}>
            <Text style={{ fontWeight:"700", color:"#111827" }}>{b.breach}</Text>
            <Text style={{ color:"#6b7280" }}>{b.domain || "Unknown"} {b.breach_date ? `· ${b.breach_date}` : ""}</Text>
            <View style={{ marginTop: 6 }}>
              <Button title="Mark as resolved" onPress={() => markResolved(b.id)} />
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={{ color: "#6b7280", marginBottom: 8 }}>Resolved</Text>
        {resolved.length === 0 && <Text style={{ color:"#111827" }}>Nothing resolved yet.</Text>}
        {resolved.map((b) => (
          <View key={b.id} style={{ paddingVertical: 8, borderBottomColor:"#e5e7eb", borderBottomWidth: 1 }}>
            <Text style={{ fontWeight:"700", color:"#111827" }}>{b.breach}</Text>
            <Text style={{ color:"#6b7280" }}>{b.domain || "Unknown"} {b.breach_date ? `· ${b.breach_date}` : ""}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}
