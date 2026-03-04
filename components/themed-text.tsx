import { Text, type TextProps } from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";

export type ThemedTextProps = TextProps & UnistylesVariants<typeof styles>;

export function ThemedText({ style, type, color, ...rest }: ThemedTextProps) {
  styles.useVariants({ type, color });
  return (
    <Text allowFontScaling={false} style={[styles.style, style]} {...rest} />
  );
}

export const styles = StyleSheet.create((theme) => ({
  style: {
    fontFamily: theme.fontFamily,
    variants: {
      type: {
        default: {
          fontSize: 14,
          lineHeight: 16,
        },
        h1: {
          fontSize: 30,
          lineHeight: 32,
        },
        h2: {
          fontSize: 24,
          lineHeight: 26,
        },
        h3: {
          fontSize: 20,
          lineHeight: 22,
        },
        h4: {
          fontSize: 18,
          lineHeight: 20,
        },
        h5: {
          fontSize: 16,
          lineHeight: 18,
        },
        tiny: {
          fontSize: 9,
          lineHeight: 11,
        },
      },
      color: {
        default: {
          color: theme.colors.typography,
        },
        primary: {
          color: theme.colors.primary,
        },
        dimmed: {
          color: theme.colors.dimmed,
        },
        danger: {
          color: theme.colors.danger,
        },
        light: {
          color: theme.colors.light,
        },
        dark: {
          color: theme.colors.dark,
        },
      },
    },
  },
}));
