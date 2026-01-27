import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type AntDesignName = ComponentProps<typeof AntDesign>["name"];
type IoniconsName = ComponentProps<typeof Ionicons>["name"];

const ANTDESIGN_ICONS: AntDesignName[] = ["merge-cells", "split-cells"];

export type IconSymbolName = AntDesignName | IoniconsName;

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
      <AntDesign
        color={color}
        size={size}
        name={name as AntDesignName}
        style={style}
      />
    );
  }
  return (
    <Ionicons
      color={color}
      size={size}
      name={name as IoniconsName}
      style={style}
    />
  );
}
