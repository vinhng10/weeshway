import { Pressable, PressableProps, type ViewProps } from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";
import { ThemedText } from "./themed-text";

export type ButtonProps = {
  label: string;
  onPress(): void;
} & ViewProps &
  PressableProps &
  UnistylesVariants<typeof styles>;

export const Button: React.FunctionComponent<ButtonProps> = ({
  label,
  onPress,
  stickyBottom,
  style,
  ...rest
}) => {
  styles.useVariants({ stickyBottom });

  return (
    <Pressable
      style={[styles.button, styles.position, style]}
      onPress={onPress}
      {...rest}
    >
      <ThemedText type="h4" style={styles.label}>
        {label}
      </ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  button: {
    height: theme.gap(6),
    paddingHorizontal: theme.gap(2),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: theme.gap(2),
    backgroundColor: "#FFFFFF",
  },
  position: {
    variants: {
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
    color: "#000000",
  },
}));
