// Fallback for using MaterialIcons on Android and web.

import Ionicons from "@expo/vector-icons/Ionicons";
import { SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<
  SymbolViewProps["name"],
  ComponentProps<typeof Ionicons>["name"]
>;
export type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "wand.and.sparkles": "color-wand",
  "circle.grid.2x2.fill": "grid",
  "person.fill": "person-sharp",
  play: "play",
  pause: "pause",
  "chevron.left": "chevron-back",
  "chevron.down": "chevron-down",
  "chevron.right": "chevron-forward",
  "location.app.fill": "location-sharp",
  "timer.circle.fill": "time",
  "music.note": "musical-notes",
  sharedwithyou: "share-social-sharp",
  heart: "heart",
  gear: "settings",
  "wallet.pass": "wallet",
  "shield.fill": "shield",
  "rectangle.portrait.and.arrow.right": "log-out",
  "camera.fill": "camera",
  scissors: "cut",
  "arrow.merge": "git-merge",
  "folder.fill": "folder",
  sparkles: "sparkles",
  calendar: "calendar",
  plus: "add",
  minus: "remove",
  xmark: "close",
  "compass.drawing": "compass",
  "creditcard.fill": "card",
  "checkmark.circle": "checkmark-circle",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
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
  weight?: SymbolWeight;
}) {
  return (
    <Ionicons color={color} size={size} name={MAPPING[name]} style={style} />
  );
}
