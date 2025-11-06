import { Text, type TextProps } from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";

export type ThemedTextProps = TextProps & UnistylesVariants<typeof styles>;

export function ThemedText({
  style,
  type,
  bold,
  dimmed,
  ...rest
}: ThemedTextProps) {
  styles.useVariants({
    type,
    bold,
    dimmed,
  });
  return (
    <Text
      style={[styles.textFamily, styles.textColor, styles.textType, style]}
      {...rest}
    />
  );
}

export const styles = StyleSheet.create((theme) => ({
  textFamily: {
    fontFamily: theme.fontFamily,
  },
  textColor: {
    color: theme.colors.typography,
  },
  textType: {
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
      },
      bold: {
        true: {
          fontWeight: 900,
        },
      },
      dimmed: {
        true: {
          color: theme.colors.dimmed,
        },
      },
    },
  },
}));
