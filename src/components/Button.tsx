import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

type Props = {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
};

export default function Button({ title, onPress, style, disabled, variant = "primary" }: Props) {
  const palette = variantStyles[variant] ?? variantStyles.primary;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[styles.btn, palette.button, disabled && styles.disabled, style]}
    >
      <Text style={[styles.txt, palette.text]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  txt: { fontWeight: "700", fontSize: 15 },
  disabled: { opacity: 0.6 },
});

const variantStyles = {
  primary: StyleSheet.create({
    button: { backgroundColor: "#0A66FF" },
    text: { color: "#fff" },
  }),
  secondary: StyleSheet.create({
    button: { backgroundColor: "#E8EDFF" },
    text: { color: "#0A66FF" },
  }),
  ghost: StyleSheet.create({
    button: { backgroundColor: "transparent" },
    text: { color: "#0A66FF" },
  }),
} as const;
