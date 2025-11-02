import { Text, View } from "react-native";

export default function Gauge({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const label =
    clamped >= 80 ? "Excellent" : clamped >= 60 ? "Somewhat safe" : clamped >= 40 ? "Low safety" : "Risky";
  const color = clamped >= 80 ? "#22c55e" : clamped >= 60 ? "#f59e0b" : clamped >= 40 ? "#ef4444" : "#b91c1c";

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ width: 220, height: 110, overflow: "hidden", alignItems: "center", justifyContent: "flex-end" }}>
        {/* simple arc using border trick for RN/web portability */}
        <View
          style={{
            width: 220,
            height: 220,
            borderRadius: 110,
            borderWidth: 14,
            borderColor: "#e5e7eb",
            borderBottomColor: "transparent",
            transform: [{ rotate: "180deg" }]
          }}
        />
        <View style={{ position: "absolute", bottom: 0, width: `${clamped}%`, height: 14, backgroundColor: color }} />
      </View>
      <Text style={{ fontSize: 28, fontWeight: "800", color: "#111827", marginTop: 6 }}>{clamped}</Text>
      <Text style={{ color: "#6b7280" }}>{label}</Text>
    </View>
  );
}
