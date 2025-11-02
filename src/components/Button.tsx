import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

export default function Button({ title, onPress, style }: { title: string; onPress?: () => void; style?: ViewStyle }) {
  return (
    <Pressable onPress={onPress} style={[styles.btn, style]}>
      <Text style={styles.txt}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: "flex-start"
  },
  txt: { color: "#fff", fontWeight: "700" }
});
