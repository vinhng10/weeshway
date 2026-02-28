import { useState } from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { IconSymbol, type IconSymbolName } from "../icon-symbol";
import { ThemedText } from "../themed-text";

export type FABItem = {
  icon: IconSymbolName;
  label: string;
  onPress?: (event: GestureResponderEvent) => void | Promise<void>;
};

export type FABProps = {
  label: string;
  items: FABItem[];
};

function FABAction({
  icon,
  label,
  onPress,
  onDone,
  index,
  total,
}: FABItem & { onDone: () => void; index: number; total: number }) {
  const [loading, setLoading] = useState(false);
  const disabled = !onPress || loading;
  styles.useVariants({ disabled });

  const handlePress = (event: GestureResponderEvent) => {
    if (disabled) return;
    const result = onPress!(event);
    if (result != null && typeof (result as any).then === "function") {
      setLoading(true);
      Promise.resolve(result).finally(() => {
        setLoading(false);
        onDone();
      });
    } else {
      onDone();
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 30).duration(200)}
      exiting={FadeOutDown.delay((total - 1 - index) * 30).duration(200)}
    >
      <Pressable
        style={styles.action}
        onPress={handlePress}
        disabled={disabled}
      >
        <View style={styles.iconCircle}>
          {loading ? (
            <ActivityIndicator size="small" color={styles.iconColor.color} />
          ) : (
            <IconSymbol name={icon} size={20} color={styles.iconColor.color} />
          )}
        </View>
        <ThemedText type="h4" style={styles.actionLabel}>
          {label}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

export const FAB: React.FunctionComponent<FABProps> = ({ label, items }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {expanded && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={StyleSheet.absoluteFill}
        >
          <Pressable
            style={styles.overlay}
            onPress={() => setExpanded(false)}
          />
        </Animated.View>
      )}

      {expanded && (
        <View style={styles.menu}>
          {items.map((item, idx) => (
            <FABAction
              key={idx}
              {...item}
              index={idx}
              total={items.length}
              onDone={() => setExpanded(false)}
            />
          ))}
        </View>
      )}

      <Pressable style={styles.button} onPress={() => setExpanded((v) => !v)}>
        <ThemedText type="h4" style={styles.buttonLabel}>
          {label}
        </ThemedText>
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create((theme) => ({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.background,
    opacity: 0.95,
  },
  menu: {
    position: "absolute",
    width: "70%",
    alignSelf: "center",
    bottom: theme.gap(10),
    gap: theme.gap(2),
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
    height: theme.gap(5),
    paddingHorizontal: theme.gap(1),
    variants: {
      disabled: {
        true: { opacity: 0.3 },
        default: {},
      },
    },
  },
  iconCircle: {
    width: theme.gap(5),
    height: theme.gap(5),
    borderRadius: theme.gap(2),
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  iconColor: {
    color: theme.colors.background,
  },
  actionLabel: {
    color: theme.colors.activeTint,
  },
  button: {
    width: "70%",
    height: theme.gap(6),
    position: "absolute",
    alignSelf: "center",
    bottom: theme.gap(2),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: theme.gap(2),
    backgroundColor: theme.colors.activeTint,
  },
  buttonLabel: {
    color: theme.colors.background,
  },
}));
