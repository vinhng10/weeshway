import { ThemedText } from "@/components/themed-text";
import { IconSymbol, IconSymbolName } from "@/components/ui/icon-symbol";
import { Pressable, View } from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";

type ChipProps = UnistylesVariants<typeof styles> & {
  label: string;
  onPress?: any;
  icon?: IconSymbolName;
};

export const Chip: React.FunctionComponent<ChipProps> = ({
  label,
  size,
  type,
  icon,
  onPress,
}) => {
  styles.useVariants({ type, size });

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <View style={[styles.container, styles.color]}>
        <ThemedText style={[styles.color, styles.contentSize]}>
          {label}
        </ThemedText>
        {icon && <IconSymbol style={styles.color} name={icon} size={16} />}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.gap(0.5),
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
      type: {
        light: {},
        dark: {},
        highlight: {},
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
      type: {
        light: {},
        dark: {},
        highlight: {},
      },
    },
  },
  color: {
    variants: {
      size: {
        default: {},
        large: {},
      },
      type: {
        light: {
          color: "#000000",
          backgroundColor: "#FFFFFF",
        },
        dark: {
          color: "#FFFFFF",
          backgroundColor: theme.colors.foreground,
        },
        highlight: {
          color: theme.colors.highlight,
          paddingHorizontal: 0,
        },
      },
    },
  },
}));
