import { ThemedText } from "@/components/themed-text";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="h1">Home</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    marginTop: rt.insets.top + theme.gap(3),
    backgroundColor: theme.colors.background,
  },
}));
