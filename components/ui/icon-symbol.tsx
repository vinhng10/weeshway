// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<
  SymbolViewProps["name"],
  ComponentProps<typeof MaterialIcons>["name"]
>;
export type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "wand.and.sparkles": "auto-fix-high",
  "folder.fill": "workspaces",
  "person.fill": "person",
  "gearshape.fill": "settings",
  "music.house": "queue-music",
  "play.circle": "play-circle-outline",
  "gear.circle": "settings",
  "backward.end.fill": "first-page",
  "backward.fill": "fast-rewind",
  "forward.fill": "fast-forward",
  "forward.end.fill": "last-page",
  play: "play-arrow",
  "chevron.left": "keyboard-arrow-left",
  "chevron.down": "keyboard-arrow-down",
  "location.app.fill": "location-on",
  "timer.circle.fill": "access-time-filled",
  "music.note": "music-note",
  sharedwithyou: "share",
  heart: "favorite",
  "bell": "notifications",
  "wallet.pass": "account-balance-wallet",
  "shield.fill": "security",
  "rectangle.portrait.and.arrow.right": "logout",
  "chevron.right": "keyboard-arrow-right",
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
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}
