import { IconSymbol, IconSymbolName } from "@/components/ui/icon-symbol";
import { Pressable, Text, View } from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";

type ChipProps = UnistylesVariants<typeof styles> & {
  label: string;
  onPress?: () => void;
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
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        {icon && <IconSymbol style={styles.icon} name={icon} size={16} />}
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
          paddingVertical: theme.gap(0.5),
        },
        large: {
          paddingHorizontal: theme.gap(2),
          paddingVertical: theme.gap(1.5),
        },
      },
      type: {
        light: {
          backgroundColor: "#FFFFFF",
        },
        dark: {
          backgroundColor: "#1B1B1B",
        },
        highlight: {},
      },
    },
  },
  label: {
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "700",
    variants: {
      size: {
        default: {},
        large: {},
      },
      type: {
        light: {
          color: "#000000",
        },
        dark: {
          color: "#FFFFFF",
        },
        highlight: {
          color: "#FF5154",
        },
      },
    },
  },
  icon: {
    variants: {
      size: {
        default: {},
        large: {},
      },
      type: {
        light: {
          color: "#000000",
        },
        dark: {
          color: "#FFFFFF",
        },
        highlight: {
          color: "#FF5154",
        },
      },
    },
  },
}));
