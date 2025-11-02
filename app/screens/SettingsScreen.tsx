import { Alert, Modal, ScrollView, Text, TextInput, View } from "react-native";
import { useEffect, useState } from "react";
import Button from "../../src/components/Button";
import Card from "../../src/components/Card";
import { useAuth } from "../../src/context/auth";
import { getMonitoredEmails, MonitoredEmail, setMonitoredEmail } from "../../src/lib/api";
import { getPlan, Plan } from "../../src/lib/plan";
import { supabase } from "../../src/lib/supabase";

export default function Settings() {
  const { userId } = useAuth();
  const [plan, setPlan] = useState<Plan>("free");
  const [emails, setEmails] = useState<MonitoredEmail[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [p, e] = await Promise.all([getPlan(userId), getMonitoredEmails(userId)]);
      setPlan(p);
      setEmails(e);
    })();
  }, [userId]);

  const openModal = (current?: string) => {
    setEmailInput(current ?? "");
    setModalVisible(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalVisible(false);
  };

  const saveEmail = async () => {
    if (!userId) return;
    if (!emailInput.trim()) {
      Alert.alert("Email required", "Enter an email address to monitor.");
      return;
    }
    setSaving(true);
    try {
      await setMonitoredEmail(userId, emailInput.trim(), { replaceExisting: true });
      const updated = await getMonitoredEmails(userId);
      setEmails(updated);
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert("Could not update email", error?.message ?? "Please try again later.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f6f8fb" }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Text style={{ fontWeight: "800", color: "#111827", marginBottom: 4 }}>Plan</Text>
        <Text style={{ color: "#6b7280", marginBottom: 12 }}>
          Free plan: monitor 1 email + check passwords via Have I Been Pwned.
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ color: "#111827", fontSize: 18, fontWeight: "700" }}>{plan === "flexpass" ? "Flex Pass" : "Free"}</Text>
            {plan === "free" && (
              <Text style={{ color: "#6b7280", marginTop: 4 }}>Upgrade to Flex Pass to monitor multiple emails.</Text>
            )}
          </View>
          <Button title="Upgrade (coming soon)" variant="secondary" onPress={() => {}} />
        </View>
      </Card>

      <Card>
        <Text style={{ fontWeight: "800", color: "#111827", marginBottom: 8 }}>Monitored email</Text>
        {emails.length === 0 ? (
          <View style={{ gap: 12 }}>
            <Text style={{ color: "#6b7280" }}>You haven't added an email yet.</Text>
            <Button title="Add email" onPress={() => openModal()} />
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {emails.map((item) => (
              <View
                key={item.id}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 12,
                  backgroundColor: "#F9FAFB",
                }}
              >
                <Text style={{ color: "#111827", fontWeight: "600" }}>{item.email}</Text>
                <Text style={{ color: "#6b7280", marginTop: 4 }}>
                  We'll check this email against new breaches using Have I Been Pwned.
                </Text>
              </View>
            ))}
            {plan === "flexpass" ? (
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <Button title="Add another" onPress={() => openModal()} />
                <Button
                  title="Change first email"
                  onPress={() => openModal(emails[0]?.email)}
                  variant="secondary"
                />
              </View>
            ) : (
              <Button
                title="Change email"
                onPress={() => openModal(emails[0]?.email)}
                variant="secondary"
              />
            )}
          </View>
        )}
      </Card>

      <Card>
        <Text style={{ fontWeight: "800", color: "#111827", marginBottom: 8 }}>Account</Text>
        <Button title="Sign out" onPress={() => supabase.auth.signOut()} />
      </Card>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.35)",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 16, width: "100%", gap: 12 }}>
            <Text style={{ fontWeight: "700", fontSize: 18, color: "#111827" }}>Update monitored email</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="name@email.com"
              value={emailInput}
              onChangeText={setEmailInput}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
              <Button title="Cancel" variant="ghost" onPress={closeModal} disabled={saving} />
              <Button title={saving ? "Saving..." : "Save"} onPress={saveEmail} disabled={saving} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
