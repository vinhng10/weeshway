import { Header, MenuItem } from "@/components";
import { WEBSITE_URL } from "@/constants";
import { Linking, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Policies() {
  const handleTerms = () => Linking.openURL(`${WEBSITE_URL}/terms`);
  const handlePrivacy = () => Linking.openURL(`${WEBSITE_URL}/privacy`);
  const handleCancellation = () =>
    Linking.openURL(`${WEBSITE_URL}/cancellation`);

  return (
    <View style={styles.container}>
      <Header title="Policies" />
      <View style={styles.content}>
        <MenuItem icon="document-text" title="Terms" onPress={handleTerms} />
        <MenuItem icon="shield" title="Privacy" onPress={handlePrivacy} />
        <MenuItem
          icon="refresh"
          title="Cancellation & Refunds"
          onPress={handleCancellation}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.gap(2),
    gap: theme.gap(1),
  },
}));
