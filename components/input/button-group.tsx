import { Children, ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";

export type ButtonGroupProps = {
  children: ReactNode;
  direction?: "row" | "column";
} & ViewProps &
  UnistylesVariants<typeof styles>;

export const ButtonGroup: React.FunctionComponent<ButtonGroupProps> = ({
  children,
  direction,
  position,
  style,
  ...rest
}) => {
  styles.useVariants({ direction, position });

  return (
    <View style={[styles.style, style]} {...rest}>
      {Children.map(children, (child, index) => {
        if (!child) return null;
        return (
          <View key={index} style={styles.childWrapper}>
            {child}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  style: {
    flexDirection: "column",
    width: "100%",
    gap: theme.gap(1),
    variants: {
      direction: {
        default: {
          flexDirection: "row",
        },
        column: {
          flexDirection: "column",
        },
      },
      position: {
        default: {},
        stickyBottom: {
          position: "absolute",
          bottom: theme.gap(2 + 8),
          paddingHorizontal: theme.gap(2),
        },
        stickyBottomAbsolute: {
          position: "absolute",
          bottom: theme.gap(2),
          paddingHorizontal: theme.gap(2),
        },
      },
    },
  },
  childWrapper: {
    variants: {
      direction: {
        default: {
          flex: 1,
        },
        column: {},
      },
      position: {
        default: {},
        stickyBottom: {},
        stickyBottomAbsolute: {},
      },
    },
  },
}));
