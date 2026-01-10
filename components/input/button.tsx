import { useState } from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  type PressableProps,
  type ViewProps,
} from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";
import { ThemedText } from "../themed-text";

export type ButtonProps = {
  label: string;
} & ViewProps &
  PressableProps &
  UnistylesVariants<typeof styles>;

export const Button: React.FunctionComponent<ButtonProps> = ({
  label,
  onPress,
  disabled,
  outlined,
  stickyBottom,
  style,
  ...rest
}) => {
  const [loading, setLoading] = useState(false);
  const isDisabled = disabled || loading;
  styles.useVariants({ outlined, stickyBottom });

  const handlePress = (event: GestureResponderEvent) => {
    if (!onPress || loading) return;

    const result = onPress(event);

    // Only manage loading state for async operations
    if (result != null && typeof (result as any).then === "function") {
      setLoading(true);
      Promise.resolve(result).finally(() => setLoading(false));
    }
  };

  return (
    <Pressable
      style={[styles.style, style]}
      onPress={handlePress}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="large"
          color={outlined ? "#FFFFFF" : "#0C0C0C"}
        />
      ) : (
        <ThemedText type="h4" style={styles.label}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  style: {
    height: theme.gap(6),
    paddingHorizontal: theme.gap(2),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: theme.gap(2),
    variants: {
      outlined: {
        true: {
          backgroundColor: theme.colors.background,
          borderWidth: theme.gap(0.4),
          borderColor: theme.colors.activeTint,
        },
        default: {
          backgroundColor: theme.colors.activeTint,
        },
      },
      stickyBottom: {
        true: {
          width: "70%",
          position: "absolute",
          alignSelf: "center",
          bottom: theme.gap(2),
        },
      },
    },
  },
  label: {
    variants: {
      outlined: {
        true: {
          color: theme.colors.activeTint,
        },
        default: {
          color: theme.colors.background,
        },
      },
      stickyBottom: { true: {} },
    },
  },
}));
