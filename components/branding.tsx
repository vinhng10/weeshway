import { Image, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ThemedText } from "./themed-text";

export function Branding() {
  return (
    <View style={styles.branding}>
      <Image
        source={require("@/assets/images/icon.png")}
        style={styles.logo}
      />
      <ThemedText type="h1">WeeshWay</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  branding: {
    alignItems: "center",
    gap: theme.gap(1),
    paddingVertical: theme.gap(4),
  },
  logo: {
    width: theme.gap(10),
    height: theme.gap(10),
    borderRadius: theme.gap(2),
  },
}));
