import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { IconButton } from "../input/icon-button";
import { ThemedText } from "../themed-text";

interface DisplayAreaProps {
  recognizing: boolean;
  transcript: string;
  onOpenCamera?: any;
}

export const DisplayArea = ({
  recognizing,
  transcript,
  onOpenCamera,
}: DisplayAreaProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.comingSoonContainer}>
        <IconButton icon="sparkles" iconSize={48} type="transparent" />
        <ThemedText type="h3" style={styles.comingSoonTitle}>
          More Features Coming Soon
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    gap: theme.gap(2),
  },
  comingSoonContainer: {
    alignItems: "center",
    justifyContent: "center",
    maxWidth: "50%",
    gap: theme.gap(2),
  },
  comingSoonTitle: {
    textAlign: "center",
  },
}));
