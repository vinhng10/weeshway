import { useState } from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { IconSymbol, type IconSymbolName } from "../icon-symbol";
import { ThemedText } from "../themed-text";

export type ToolbarItem = {
  icon: IconSymbolName;
  label?: string;
  onPress?: (event: GestureResponderEvent) => void | Promise<void>;
};

export type ToolbarProps = {
  items: ToolbarItem[];
};

function ToolbarButton({ icon, label, onPress }: ToolbarItem) {
  const [loading, setLoading] = useState(false);

  const handlePress = (event: GestureResponderEvent) => {
    if (!onPress || loading) return;

    const result = onPress(event);

    if (result != null && typeof (result as any).then === "function") {
      setLoading(true);
      Promise.resolve(result).finally(() => setLoading(false));
    }
  };

  return (
    <Pressable
      style={[styles.button, !onPress && styles.disabled]}
      onPress={handlePress}
      disabled={loading || !onPress}
    >
      {loading ? (
        <ActivityIndicator size="small" color={styles.icon.color} />
      ) : (
        <>
          <IconSymbol name={icon} size={18} color={styles.icon.color} />
          {label && (
            <ThemedText color="dark" style={styles.label}>
              {label}
            </ThemedText>
          )}
        </>
      )}
    </Pressable>
  );
}

export const Toolbar: React.FunctionComponent<ToolbarProps> = ({ items }) => {
  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <View key={index} style={styles.itemWrapper}>
          {index > 0 && <View style={styles.divider} />}
          <ToolbarButton {...item} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    height: theme.gap(6),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: theme.gap(2),
    backgroundColor: theme.colors.activeTint,
    position: "absolute",
    alignSelf: "center",
    bottom: theme.gap(2),
  },
  itemWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    width: theme.gap(7),
    height: theme.gap(7),
    justifyContent: "center",
    alignItems: "center",
    gap: theme.gap(0.3),
  },
  divider: {
    width: theme.gap(0.1),
    height: theme.gap(3),
    backgroundColor: theme.colors.background,
    opacity: 0.3,
  },
  icon: {
    color: theme.colors.background,
  },
  disabled: {
    opacity: 0.3,
  },
  label: {
    fontSize: 9,
    lineHeight: 11,
  },
}));
