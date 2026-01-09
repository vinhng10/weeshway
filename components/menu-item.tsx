import { Pressable } from "react-native";
import { StyleSheet, UnistylesVariants } from "react-native-unistyles";
import { ThemedText, styles as textStyles } from "./themed-text";
import { IconSymbol, IconSymbolName } from "./ui/icon-symbol";

type ProfileMenuItemProps = {
  icon: IconSymbolName;
  label: string;
  onPress?: () => void;
  showChevron?: boolean;
} & UnistylesVariants<typeof textStyles>;

export function MenuItem({
  icon,
  label,
  onPress,
  showChevron = true,
  color,
}: ProfileMenuItemProps) {
  textStyles.useVariants({ type: "h5", color });

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <IconSymbol style={textStyles.style} name={icon} />
      <ThemedText style={[textStyles.style, styles.label]}>{label}</ThemedText>
      {showChevron && (
        <IconSymbol style={textStyles.style} name="chevron.right" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.gap(2),
    gap: theme.gap(2),
    borderRadius: theme.gap(2),
    backgroundColor: theme.colors.foreground,
  },
  label: {
    flex: 1,
  },
}));
