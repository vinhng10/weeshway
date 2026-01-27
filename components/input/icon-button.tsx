import {
  Pressable,
  View,
  type PressableProps,
  type ViewProps,
} from "react-native";
import { StyleSheet, UnistylesVariants } from "react-native-unistyles";
import { IconSymbol, type IconSymbolName } from "../ui/icon-symbol";

export type IconButtonProps = UnistylesVariants<typeof styles> &
  ViewProps &
  PressableProps & {
    icon: IconSymbolName;
    iconSize?: number;
  };

export const IconButton: React.FunctionComponent<IconButtonProps> = ({
  icon,
  onPress,
  disabled,
  iconSize = 24,
  style,
  type,
  ...rest
}) => {
  styles.useVariants({ type, disabled: !!disabled });

  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <View style={[styles.container, style]} {...rest}>
        <IconSymbol name={icon} size={iconSize} style={styles.color} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    width: theme.gap(6),
    height: theme.gap(6),
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    variants: {
      type: {
        default: {
          backgroundColor: "rgba(255, 255, 255, 0.2)",
        },
        transparent: {
          backgroundColor: "transparent",
        },
        danger: {
          backgroundColor: "transparent",
        },
        primary: {
          backgroundColor: "transparent",
        },
      },
      disabled: {
        true: {
          opacity: 0.7,
        },
      },
    },
  },
  color: {
    variants: {
      type: {
        default: {
          color: "rgba(255, 255, 255, 0.6)",
        },
        transparent: {
          color: theme.colors.typography,
        },
        danger: {
          color: theme.colors.danger,
        },
        primary: {
          color: theme.colors.primary,
        },
      },
    },
  },
}));
