import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Button from "../../src/components/Button";
import Card from "../../src/components/Card";
import Gauge from "../../src/components/Gauge";
import {
  fetchAlerts,
  fetchBreaches,
  getMonitoredEmails,
  MonitoredEmail,
  scanEmail,
  scanPassword,
} from "../../src/lib/api";
import { AlertItem, BreachItem, Stats } from "../../src/lib/api";
import { getPlan, Plan } from "../../src/lib/plan";
import { useAuth } from "../../src/context/auth";
import { useTabs } from "../../src/context/tabs";
import { HIBP_API_KEY } from "../../src/lib/config";

export default function Dashboard() {
  const { userId } = useAuth();
  const { setActiveTab } = useTabs();
  const [plan, setPlan] = useState<Plan>("free");
  const [emails, setEmails] = useState<MonitoredEmail[]>([]);
  const [breaches, setBreaches] = useState<BreachItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    monitoredEmails: 0,
    totalBreaches: 0,
    unresolvedBreaches: 0,
    resolvedBreaches: 0,
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [needsKey, setNeedsKey] = useState(!HIBP_API_KEY);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [passwordResult, setPasswordResult] = useState<number | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    refresh();
  }, [userId]);

  const refresh = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [planValue, emailList, breachList, alertList] = await Promise.all([
        getPlan(userId),
        getMonitoredEmails(userId),
        fetchBreaches(userId),
        fetchAlerts(userId),
      ]);
      setPlan(planValue);
      setEmails(emailList);
      setBreaches(breachList);
      setAlerts(alertList);
      const resolved = breachList.filter((b) => (b.status ?? "open").toLowerCase() === "resolved").length;
      const unresolved = breachList.length - resolved;
      setStats({
        monitoredEmails: emailList.length,
        totalBreaches: breachList.length,
        unresolvedBreaches: Math.max(0, unresolved),
        resolvedBreaches: Math.max(0, resolved),
      });
    } finally {
      setLoading(false);
    }
  };

  const score = useMemo(() => {
    const total = stats.unresolvedBreaches + stats.resolvedBreaches;
    if (!total) return 86;
    const penalty = Math.min(60, stats.unresolvedBreaches * 8 + Math.max(0, total - stats.unresolvedBreaches) * 2);
    return Math.max(24, 86 - penalty);
  }, [stats]);

  const handleScanEmail = async () => {
    if (!userId) return;
    if (!emails.length) {
      Alert.alert("Add an email", "You need to monitor an email before running a scan.");
      return;
    }
    setScanning(true);
    setScanMessage(null);
    try {
      const result = await scanEmail(userId);
      setNeedsKey(Boolean(result.needsKey) || !HIBP_API_KEY);
      setScanMessage(`Scan complete. Found ${result.breaches.length} breach entries.`);
      await refresh();
    } catch (error: any) {
      Alert.alert("Scan failed", error?.message ?? "Please try again later.");
    } finally {
      setScanning(false);
    }
  };

  const openPasswordModal = () => {
    setPasswordValue("");
    setPasswordResult(null);
    setPasswordModal(true);
  };

  const closePasswordModal = () => {
    if (passwordLoading) return;
    setPasswordModal(false);
    setPasswordValue("");
    setPasswordResult(null);
  };

  const handlePasswordCheck = async () => {
    if (!passwordValue) {
      Alert.alert("Password required", "Enter a password to check.");
      return;
    }
    setPasswordLoading(true);
    try {
      const { count } = await scanPassword(passwordValue);
      setPasswordResult(count);
      setPasswordValue("");
    } catch (error: any) {
      Alert.alert("Check failed", error?.message ?? "Try again later.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const unresolvedBreaches = breaches.filter((b) => (b.status ?? "open").toLowerCase() !== "resolved");
  const resolvedBreaches = breaches.filter((b) => (b.status ?? "open").toLowerCase() === "resolved");

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <Text style={styles.h1}>Summary</Text>

      <Card>
        <Text style={styles.muted}>Security Health Score</Text>
        {loading ? (
          <View style={{ paddingVertical: 32 }}>
            <ActivityIndicator color="#0A66FF" />
          </View>
        ) : (
          <Gauge value={score} />
        )}
        <View style={{ marginTop: 10 }}>
          <Button title="Check what to do next" onPress={() => {}} />
        </View>
      </Card>

      <View style={styles.kpiRow}>
        <Card>
          <Text style={styles.muted}>Emails monitored</Text>
          <Text style={styles.kpi}>{stats.monitoredEmails}</Text>
        </Card>
        <Card>
          <Text style={styles.muted}>Known breaches</Text>
          <Text style={styles.kpi}>{stats.totalBreaches}</Text>
        </Card>
        <Card>
          <Text style={styles.muted}>Unresolved</Text>
          <Text style={styles.kpi}>{stats.unresolvedBreaches}</Text>
        </Card>
        <Card>
          <Text style={styles.muted}>Resolved</Text>
          <Text style={styles.kpi}>{stats.resolvedBreaches}</Text>
        </Card>
        <Card>
          <Text style={styles.muted}>Plan</Text>
          <Text style={styles.kpiLabel}>{plan === "flexpass" ? "FLEX PASS" : "FREE"}</Text>
        </Card>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Monitored email</Text>
        {needsKey && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              Email breach lookups require a Have I Been Pwned API key. Add one to enable live checks.
            </Text>
          </View>
        )}
        {plan === "free" && emails.length >= 1 && (
          <Text style={{ color: "#6b7280", marginBottom: 8 }}>
            Upgrade to Flex Pass to monitor multiple emails.
          </Text>
        )}
        {scanMessage && <Text style={styles.success}>{scanMessage}</Text>}
        {emails.length === 0 ? (
          <View style={{ gap: 12 }}>
            <Text style={{ color: "#6b7280" }}>Add an email to monitor (free includes 1).</Text>
            <Button title="Go to Settings" onPress={() => setActiveTab("Settings")} />
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <View style={styles.emailCard}>
              <Text style={{ color: "#111827", fontWeight: "700" }}>{emails[0].email}</Text>
              <Text style={{ color: "#6b7280", marginTop: 4 }}>
                Last checked via Have I Been Pwned. Run manual checks anytime.
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Button title={scanning ? "Checking..." : "Check for breaches"} onPress={handleScanEmail} disabled={scanning} />
              <Button title="Check a password" variant="secondary" onPress={openPasswordModal} />
            </View>
          </View>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Alerts</Text>
        {alerts.length === 0 ? (
          <Text style={{ color: "#6b7280" }}>No alerts just yet.</Text>
        ) : (
          alerts.map((alert) => (
            <View key={alert.id} style={styles.alertRow}>
              <Text style={{ fontWeight: "600", color: "#111827" }}>{alert.title}</Text>
              <Text style={{ color: "#6b7280" }}>{alert.status ?? "pending"}</Text>
            </View>
          ))
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Breaches</Text>
        {unresolvedBreaches.length === 0 && resolvedBreaches.length === 0 && (
          <Text style={{ color: "#6b7280" }}>No breaches found yet. You're off to a great start.</Text>
        )}
        {unresolvedBreaches.map((item) => (
          <View key={item.id} style={styles.breachRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", color: "#111827" }}>{item.title}</Text>
              <Text style={{ color: "#6b7280" }}>
                {item.domain || "Unknown domain"}
                {item.breach_date ? ` · ${item.breach_date}` : ""}
              </Text>
            </View>
          </View>
        ))}
        {resolvedBreaches.length > 0 && (
          <View style={{ marginTop: 16, gap: 8 }}>
            <Text style={{ color: "#111827", fontWeight: "700" }}>Resolved</Text>
            {resolvedBreaches.map((item) => (
              <View key={item.id} style={styles.breachRowMuted}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", color: "#111827" }}>{item.title}</Text>
                  <Text style={{ color: "#6b7280" }}>
                    {item.domain || "Unknown domain"}
                    {item.breach_date ? ` · ${item.breach_date}` : ""}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>

      <Modal transparent visible={passwordModal} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Check a password</Text>
            <Text style={{ color: "#6b7280" }}>We only send the first 5 SHA-1 characters to Have I Been Pwned.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter password"
              secureTextEntry
              value={passwordValue}
              onChangeText={setPasswordValue}
            />
            {passwordResult !== null && (
              <View style={styles.passwordResult}>
                <Text style={{ color: passwordResult > 0 ? "#B42318" : "#027A48", fontWeight: "600" }}>
                  {passwordResult > 0
                    ? `⚠️ This password appears in ${passwordResult} breach lists. Change it everywhere you used it.`
                    : "✅ No matches found in the public breach dataset."}
                </Text>
              </View>
            )}
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
              <Button title="Cancel" variant="ghost" onPress={closePasswordModal} disabled={passwordLoading} />
              <Button
                title={passwordLoading ? "Checking..." : "Check"}
                onPress={handlePasswordCheck}
                disabled={passwordLoading}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f6f8fb" },
  pageContent: { padding: 16, gap: 12, paddingBottom: 32 },
  h1: { fontSize: 24, fontWeight: "800", color: "#111827" },
  muted: { color: "#6b7280", marginBottom: 8 },
  sectionTitle: { color: "#111827", fontWeight: "700", marginBottom: 8 },
  kpiRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  kpi: { color: "#111827", fontSize: 24, fontWeight: "800", marginTop: 6 },
  kpiLabel: { color: "#111827", fontSize: 18, fontWeight: "800", marginTop: 6 },
  banner: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  bannerText: { color: "#4338CA", fontWeight: "600" },
  emailCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  success: {
    color: "#027A48",
    backgroundColor: "#ECFDF3",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ABEFC6",
    padding: 10,
    marginBottom: 12,
  },
  alertRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  breachRow: {
    paddingVertical: 12,
    borderBottomColor: "#E5E7EB",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  breachRowMuted: {
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    width: "100%",
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  passwordResult: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
});
