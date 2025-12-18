import React from "react";
import {
  TextInput as RNTextInput,
  type TextInputProps as RNTextInputProps,
} from "react-native";
import { StyleSheet, UnistylesVariants } from "react-native-unistyles";
import { styles as textStyles } from "../themed-text";

export type TextInputProps = RNTextInputProps &
  UnistylesVariants<typeof styles>;

export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(
  ({ type, bold, color, multiline, style, ...rest }, ref) => {
    styles.useVariants({ type, bold, color, multiline });
    textStyles.useVariants({ type, bold, color });

    return (
      <RNTextInput
        ref={ref}
        multiline={multiline}
        style={[
          styles.container,
          textStyles.family,
          textStyles.color,
          textStyles.type,
          style,
        ]}
        {...rest}
      />
    );
  }
);

const styles = StyleSheet.create((theme) => ({
  container: {
    width: "100%",
    backgroundColor: theme.colors.foreground,
    borderRadius: theme.gap(2),
    padding: theme.gap(2),
    variants: {
      type: {
        default: {},
        h1: {},
        h2: {},
        h3: {},
        h4: {},
        h5: {},
      },
      bold: {
        true: {},
      },
      color: {
        default: {},
        dimmed: {},
        danger: {},
      },
      multiline: {
        true: {
          minHeight: theme.gap(12),
          textAlignVertical: "top",
        },
      },
    },
  },
}));
