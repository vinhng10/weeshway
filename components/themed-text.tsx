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
  return <Text style={[styles.textColor, styles.textType, style]} {...rest} />;
}

const styles = StyleSheet.create((theme) => ({
  textColor: {
    color: theme.colors.typography,
  },
  textType: {
    variants: {
      type: {
        default: {
          fontSize: 16,
          lineHeight: 16,
        },
        h1: {
          fontSize: 32,
          lineHeight: 34,
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
        link: {
          lineHeight: 30,
          fontSize: 16,
          color: theme.colors.link,
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
