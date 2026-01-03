import { styles as textStyles, ThemedText } from "@/components/themed-text";
import { IconSymbol, IconSymbolName } from "@/components/ui/icon-symbol";
import { Pressable } from "react-native";
import { StyleSheet, UnistylesVariants } from "react-native-unistyles";

type ProfileMenuItemProps = {
  icon: IconSymbolName;
  label: string;
  onPress?: () => void;
  showChevron?: boolean;
} & UnistylesVariants<typeof textStyles>;

export function ProfileMenuItem({
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
    padding: theme.gap(1),
    gap: theme.gap(2),
  },
  label: {
    flex: 1,
  },
}));
