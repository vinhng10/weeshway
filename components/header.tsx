import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { IconSymbol } from "./icon-symbol";
import { ThemedText } from "./themed-text";

type HeaderProps = {
  title?: string;
  onPress?: () => void;
};

export const Header: React.FunctionComponent<HeaderProps> = ({
  title,
  onPress,
}) => {
  const { theme } = useUnistyles();
  return (
    <View style={styles.container}>
      <Pressable onPress={onPress ?? router.back} style={styles.backButton}>
        <IconSymbol
          name="chevron-back"
          size={32}
          color={theme.colors.typography}
        />
      </Pressable>
      <ThemedText type="h4">{title}</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(1),
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: theme.gap(1),
    justifyContent: "center",
    alignItems: "center",
  },
}));
