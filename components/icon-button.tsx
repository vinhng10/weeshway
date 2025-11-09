import { Pressable, View, type ViewProps } from "react-native";
import { StyleSheet, UnistylesVariants } from "react-native-unistyles";
import { IconSymbol, type IconSymbolName } from "./ui/icon-symbol";

export type IconButtonProps = UnistylesVariants<typeof styles> &
  ViewProps & {
    icon: IconSymbolName;
    onPress?: any;
    iconSize?: number;
  };

export const IconButton: React.FunctionComponent<IconButtonProps> = ({
  icon,
  onPress,
  iconSize = 24,
  style,
  type,
  ...rest
}) => {
  styles.useVariants({ type });

  return (
    <Pressable onPress={onPress}>
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
      },
    },
  },
}));
