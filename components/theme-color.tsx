import { Pressable } from "react-native";
import {
  ScopedTheme,
  StyleSheet,
  UnistylesThemes,
} from "react-native-unistyles";
import { ThemedText } from "./themed-text";

type ThemeColorProps = {
  label: keyof UnistylesThemes;
  onPress: VoidFunction;
};

export const ThemeColor: React.FunctionComponent<ThemeColorProps> = ({
  label,
  onPress,
}) => {
  return (
    <ScopedTheme name={label}>
      <Pressable style={styles.container} onPress={onPress}>
        <ThemedText>{label}</ThemedText>
      </Pressable>
    </ScopedTheme>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    height: 80,
    borderRadius: theme.gap(2),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.dimmed,
    backgroundColor: theme.colors.background,
  },
}));
