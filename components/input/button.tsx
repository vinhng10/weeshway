import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  type ViewProps,
} from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";
import { ThemedText } from "../themed-text";

export type ButtonProps = {
  label: string;
  onPress(): void;
  loading?: boolean;
} & ViewProps &
  PressableProps &
  UnistylesVariants<typeof styles>;

export const Button: React.FunctionComponent<ButtonProps> = ({
  label,
  onPress,
  outlined,
  stickyBottom,
  loading,
  style,
  ...rest
}) => {
  styles.useVariants({ outlined, stickyBottom });

  return (
    <Pressable
      style={[styles.style, style]}
      onPress={onPress}
      disabled={rest.disabled || loading}
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
