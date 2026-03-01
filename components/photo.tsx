import { Image } from "expo-image";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface PhotoProps {
  source: string | null;
}

export function Photo({ source }: PhotoProps) {
  return (
    <View style={styles.container}>
      {source && <Image source={source} style={styles.container} />}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    height: theme.gap(24),
    aspectRatio: 9 / 16,
    borderRadius: theme.gap(2),
    backgroundColor: theme.colors.foreground,
  },
}));
