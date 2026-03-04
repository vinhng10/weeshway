import { Pressable, View } from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";
import { IconSymbol, IconSymbolName } from "./icon-symbol";
import { ThemedText } from "./themed-text";

type ChipProps = UnistylesVariants<typeof styles> & {
  label: string;
  onPress?: any;
  icon?: IconSymbolName;
};

export const Chip: React.FunctionComponent<ChipProps> = ({
  label,
  size,
  color,
  icon,
  onPress,
}) => {
  styles.useVariants({ color, size });

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <View style={[styles.container, styles.color]}>
        <ThemedText style={[styles.textColor, styles.contentSize]}>
          {label}
        </ThemedText>
        {icon && <IconSymbol style={styles.textColor} name={icon} size={16} />}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.gap(0.2),
    borderRadius: theme.gap(2),
    variants: {
      size: {
        default: {
          paddingHorizontal: theme.gap(1),
          paddingVertical: theme.gap(0.2),
        },
        large: {
          paddingHorizontal: theme.gap(2),
          paddingVertical: theme.gap(1.2),
        },
      },
      color: {
        light: {},
        dark: {},
        danger: {},
        contrast: {},
        default: {},
      },
    },
  },
  contentSize: {
    variants: {
      size: {
        default: {
          fontSize: 14,
        },
        large: {
          fontSize: 16,
        },
      },
      color: {
        light: {},
        dark: {},
        danger: {},
        contrast: {},
        default: {},
      },
    },
  },
  color: {
    variants: {
      size: {
        default: {},
        large: {},
      },
      color: {
        light: { backgroundColor: theme.colors.light },
        dark: { backgroundColor: theme.colors.foreground },
        danger: { paddingHorizontal: 0 },
        contrast: { backgroundColor: theme.colors.contrast },
        default: { backgroundColor: theme.colors.foreground },
      },
    },
  },
  textColor: {
    variants: {
      size: {
        default: {},
        large: {},
      },
      color: {
        light: { color: theme.colors.dark },
        dark: { color: theme.colors.light },
        danger: { color: theme.colors.danger },
        contrast: { color: theme.colors.typographyContrast },
        default: { color: theme.colors.typography },
      },
    },
  },
}));
