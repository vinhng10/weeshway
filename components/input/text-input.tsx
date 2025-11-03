import React from "react";
import {
  TextInput as RNTextInput,
  type TextInputProps as RNTextInputProps,
} from "react-native";
import { StyleSheet, UnistylesVariants } from "react-native-unistyles";
import { styles as textStyles } from "../themed-text";

export type TextInputProps = RNTextInputProps &
  UnistylesVariants<typeof styles>;

export function TextInput({
  multiline,
  type,
  bold,
  dimmed,
  style,
  ...rest
}: TextInputProps) {
  styles.useVariants({
    type,
    bold,
    dimmed,
    multiline,
  });
  textStyles.useVariants({
    type,
    bold,
    dimmed,
  });

  return (
    <RNTextInput
      style={[
        styles.container,
        textStyles.textColor,
        textStyles.textType,
        style,
      ]}
      placeholderTextColor={dimmed ? "#999999" : "#666666"}
      {...rest}
    />
  );
}

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
      dimmed: {
        true: {},
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
