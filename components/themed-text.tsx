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
          fontSize: 14,
          lineHeight: 16,
        },
        title: {
          fontSize: 18,
          lineHeight: 20,
          fontWeight: "900",
        },
        subtitle: {
          fontSize: 20,
          lineHeight: 20,
          fontWeight: "700",
        },
        link: {
          lineHeight: 30,
          fontSize: 16,
          color: theme.colors.link,
        },
      },
      bold: {
        true: {
          fontWeight: "bold",
        },
      },
      dimmed: {
        true: {
          color: theme.colors.tint,
        },
      },
    },
  },
}));
