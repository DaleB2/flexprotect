import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Button from "../../src/components/Button";
import Card from "../../src/components/Card";
import Gauge from "../../src/components/Gauge";
import { supabase } from "../../src/lib/supabase";

type Finding = { id: string; status: string };
type EmailRow = { id: string; email: string };

export default function Dashboard() {
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [unresolved, setUnresolved] = useState<number>(0);
  const [resolved, setResolved] = useState<number>(0);
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    (async () => {
      const { data: e } = await supabase.from("monitored_emails").select("id,email");
      setEmails(e || []);
      const { data: uf } = await supabase.from("breach_findings").select("id,status");
      const u = (uf || []).filter((f: Finding) => f.status !== "resolved").length;
      const r = (uf || []).filter((f: Finding) => f.status === "resolved").length;
      setUnresolved(u); setResolved(r);
      const { data: prof } = await supabase.from("profiles").select("plan").maybeSingle();
      if (prof?.plan) setPlan(prof.plan);
    })();
  }, []);

  const score = useMemo(() => {
    const total = unresolved + resolved;
    if (!total) return 86;
    const penalty = Math.min(60, unresolved * 8 + Math.max(0, total - unresolved) * 2);
    return Math.max(24, 86 - penalty);
  }, [unresolved, resolved]);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <Text style={styles.h1}>Summary</Text>

      <Card>
        <Text style={styles.muted}>Security Health Score</Text>
        <Gauge value={score} />
        <View style={{ marginTop: 10 }}>
          <Button title="Check what to do next" onPress={() => {}} />
        </View>
      </Card>

      <View style={styles.kpiRow}>
        <Card><Text style={styles.muted}>Emails monitored</Text><Text style={styles.kpi}>{emails.length}</Text></Card>
        <Card><Text style={styles.muted}>Known breaches</Text><Text style={styles.kpi}>{unresolved+resolved}</Text></Card>
        <Card><Text style={styles.muted}>Unresolved</Text><Text style={styles.kpi}>{unresolved}</Text></Card>
        <Card><Text style={styles.muted}>Resolved</Text><Text style={styles.kpi}>{resolved}</Text></Card>
        <Card><Text style={styles.muted}>Plan</Text><Text style={styles.kpiLabel}>{plan.toUpperCase()}</Text></Card>
      </View>

      <Card>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.titleStrong}>Email alerts</Text>
            <Text style={styles.muted}>Get notified automatically when new breaches are found</Text>
          </View>
          <Button title="Upgrade (coming soon)" onPress={() => {}} />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f6f8fb" },
  pageContent: { padding: 16, gap: 12 },
  h1: { fontSize: 24, fontWeight: "800", color: "#111827" },
  muted: { color: "#6b7280", marginBottom: 8 },
  titleStrong: { color: "#111827", fontWeight: "700" },
  kpiRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  kpi: { color: "#111827", fontSize: 24, fontWeight: "800", marginTop: 6 },
  kpiLabel: { color: "#111827", fontSize: 18, fontWeight: "800", marginTop: 6 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }
});
