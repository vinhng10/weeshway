import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Pressable } from "react-native";
import { StyleSheet, UnistylesVariants } from "react-native-unistyles";

interface ProfileMenuItemProps extends UnistylesVariants<typeof styles> {
  icon: string;
  label: string;
  onPress?: () => void;
  showChevron?: boolean;
}

export function ProfileMenuItem({
  icon,
  label,
  onPress,
  color,
  showChevron = true,
}: ProfileMenuItemProps) {
  styles.useVariants({ color });

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <IconSymbol style={styles.color} name={icon as any} size={24} />
      <ThemedText style={[styles.color, styles.label]}>{label}</ThemedText>
      {showChevron && (
        <IconSymbol style={styles.color} name="chevron.right" size={20} />
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
  color: {
    variants: {
      color: {
        default: {
          color: theme.colors.typography,
        },
        highlight: {
          color: theme.colors.highlight,
        },
      },
    },
  },
}));
