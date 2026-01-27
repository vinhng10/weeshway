import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { IconSymbol } from "./icon-symbol";
import { ThemedText } from "./themed-text";

export type BulletProps = {
  text: string;
};

export function Bullet({ text }: BulletProps) {
  return (
    <View style={styles.container}>
      <IconSymbol name="checkmark-circle" size={20} color="#6B9C00" />
      <ThemedText type="h5" color="dimmed" style={styles.text}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
  },
  text: {
    flex: 1,
  },
}));
