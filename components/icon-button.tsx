import { Pressable, View, type ViewProps } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { IconSymbol, type IconSymbolName } from "./ui/icon-symbol";

export type IconButtonProps = {
  icon: IconSymbolName;
  onPress?: any;
  iconSize?: number;
  iconColor?: string;
} & ViewProps;

export const IconButton: React.FunctionComponent<IconButtonProps> = ({
  icon,
  onPress,
  iconSize = 24,
  iconColor = "rgba(255, 255, 255, 0.6)",
  style,
  ...rest
}) => {
  return (
    <Pressable onPress={onPress}>
      <View style={[styles.button, style]} {...rest}>
        <IconSymbol name={icon} size={iconSize} color={iconColor} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  button: {
    width: theme.gap(6),
    height: theme.gap(6),
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
}));
