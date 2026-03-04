import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";

type AntDesignName = ComponentProps<typeof AntDesign>["name"];
type IoniconsName = ComponentProps<typeof Ionicons>["name"];

const ANTDESIGN_ICONS: AntDesignName[] = ["merge-cells", "split-cells"];

export type IconSymbolName = AntDesignName | IoniconsName;

const UniAntDesign = withUnistyles(AntDesign);
const UniIonicons = withUnistyles(Ionicons);

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color?: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  if (ANTDESIGN_ICONS.includes(name as AntDesignName)) {
    return (
      <UniAntDesign
        size={size}
        name={name as AntDesignName}
        style={[styles.color(color), style]}
      />
    );
  }
  return (
    <UniIonicons
      size={size}
      name={name as IoniconsName}
      style={[styles.color(color), style]}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  color: (color?: string | OpaqueColorValue) => ({
    color: color ?? theme.colors.typography,
  }),
}));
