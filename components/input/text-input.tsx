import { forwardRef } from "react";
import {
  TextInput as RNTextInput,
  type TextInputProps as RNTextInputProps,
} from "react-native";
import {
  StyleSheet,
  UnistylesVariants,
  useUnistyles,
} from "react-native-unistyles";
import { styles as textStyles } from "../themed-text";

export type TextInputProps = RNTextInputProps &
  UnistylesVariants<typeof styles> &
  UnistylesVariants<typeof textStyles>;

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  ({ type, color, multiline, style, ...rest }, ref) => {
    const { theme } = useUnistyles();
    styles.useVariants({ multiline });
    textStyles.useVariants({ type, color });

    return (
      <RNTextInput
        ref={ref}
        multiline={multiline}
        allowFontScaling={false}
        placeholderTextColor={theme.colors.dimmed}
        style={[styles.container, textStyles.style, style]}
        {...rest}
      />
    );
  },
);

const styles = StyleSheet.create((theme) => ({
  container: {
    width: "100%",
    backgroundColor: theme.colors.foreground,
    borderRadius: theme.gap(2),
    padding: theme.gap(2),
    includeFontPadding: false,
    textAlignVertical: "center",
    variants: {
      multiline: {
        true: {
          minHeight: theme.gap(12),
          textAlignVertical: "top",
        },
      },
    },
  },
}));
