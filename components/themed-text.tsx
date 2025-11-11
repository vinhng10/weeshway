import { Text, type TextProps } from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";

export type ThemedTextProps = TextProps & UnistylesVariants<typeof styles>;

export function ThemedText({
  style,
  type,
  bold,
  color,
  ...rest
}: ThemedTextProps) {
  styles.useVariants({
    type,
    bold,
    color,
  });
  return (
    <Text style={[styles.family, styles.color, styles.type, style]} {...rest} />
  );
}

export const styles = StyleSheet.create((theme) => ({
  family: {
    fontFamily: theme.fontFamily,
  },
  color: {
    color: theme.colors.typography,
    variants: {
      color: {
        default: {
          color: theme.colors.typography,
        },
        dimmed: {
          color: theme.colors.dimmed,
        },
        highlight: {
          color: theme.colors.highlight,
        },
      },
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
    },
  },
  type: {
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
      color: {
        default: {},
        dimmed: {},
        highlight: {},
      },
    },
  },
}));
