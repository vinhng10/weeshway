import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export const Separator = ({ gap = 1 }: { gap?: number }) => (
  <View style={styles.separator(gap)} />
);

const styles = StyleSheet.create((theme) => ({
  separator: (gap: number) => ({
    height: theme.gap(gap),
  }),
}));
