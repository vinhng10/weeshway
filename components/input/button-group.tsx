import { Children, ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";

export type ButtonGroupProps = {
  children: ReactNode;
  direction?: "row" | "column";
  stickyBottom?: boolean;
} & ViewProps &
  UnistylesVariants<typeof styles>;

export const ButtonGroup: React.FunctionComponent<ButtonGroupProps> = ({
  children,
  direction,
  stickyBottom,
  style,
  ...rest
}) => {
  styles.useVariants({ direction, stickyBottom });

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
      stickyBottom: {
        true: {
          position: "absolute",
          bottom: theme.gap(2 + 9),
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
    },
  },
}));
