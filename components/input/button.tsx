import { useState } from "react";
import {
  GestureResponderEvent,
  Pressable,
  type PressableProps,
  type ViewProps,
} from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";
import { ThemedActivityIndicator } from "../themed-activity-indicator";
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
  color,
  outlined,
  stickyBottom,
  style,
  ...rest
}) => {
  const [loading, setLoading] = useState(false);
  const isDisabled = disabled || loading;
  styles.useVariants({ color, outlined, stickyBottom });

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
        <ThemedActivityIndicator
          size="large"
          color={
            (StyleSheet.flatten(styles.label) as { color?: string })?.color
          }
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
      color: {
        light: {
          backgroundColor: theme.colors.light,
        },
        dark: {
          backgroundColor: theme.colors.dark,
        },
        default: {
          backgroundColor: theme.colors.contrast,
        },
      },
      outlined: {
        true: {
          backgroundColor: "transparent",
          borderWidth: theme.gap(0.4),
          borderColor: theme.colors.typography,
        },
      },
      stickyBottom: {
        true: {
          width: "70%",
          position: "absolute",
          alignSelf: "center",
          bottom: theme.gap(2 + 9),
        },
      },
    },
  },
  label: {
    variants: {
      color: {
        light: {
          color: theme.colors.dark,
        },
        dark: {
          color: theme.colors.light,
        },
        default: {
          color: theme.colors.typographyContrast,
        },
      },
      outlined: {
        true: {
          color: theme.colors.typography,
        },
      },
      stickyBottom: { true: {} },
    },
  },
}));
