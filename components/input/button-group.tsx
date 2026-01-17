import { Children, ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";

export type ButtonGroupProps = {
  children: ReactNode;
  stickyBottom?: boolean;
} & ViewProps &
  UnistylesVariants<typeof styles>;

export const ButtonGroup: React.FunctionComponent<ButtonGroupProps> = ({
  children,
  stickyBottom,
  style,
  ...rest
}) => {
  styles.useVariants({ stickyBottom });

  return (
    <View style={[styles.style, style]} {...rest}>
      {Children.map(children, (child, index) => (
        <View key={index} style={styles.childWrapper}>
          {child}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  style: {
    flexDirection: "row",
    gap: theme.gap(2),
    variants: {
      stickyBottom: {
        true: {
          position: "absolute",
          bottom: theme.gap(2),
          paddingHorizontal: theme.gap(2),
        },
      },
    },
  },
  childWrapper: {
    flex: 1,
  },
}));
