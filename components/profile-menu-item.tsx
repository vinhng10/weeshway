import { styles as textStyles, ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Pressable } from "react-native";
import { StyleSheet, UnistylesVariants } from "react-native-unistyles";

type ProfileMenuItemProps = {
  icon: string;
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
  textStyles.useVariants({
    color,
  });

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <IconSymbol style={textStyles.color} name={icon as any} size={24} />
      <ThemedText style={[textStyles.color, styles.label]}>{label}</ThemedText>
      {showChevron && (
        <IconSymbol style={textStyles.color} name="chevron.right" size={20} />
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
