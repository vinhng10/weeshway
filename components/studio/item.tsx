import { PIXELS_PER_SECOND } from "@/constants";
import { ItemType } from "@/types";
import { StyleSheet, UnistylesVariants } from "react-native-unistyles";
import { Pressable } from "../pressable";
import { ThemedText } from "../themed-text";

type ItemProps = UnistylesVariants<typeof styles> & {
  index: number;
  item: ItemType;
  onPress: () => void;
  disabled?: boolean;
};

export const Item = ({ index, item, onPress, disabled }: ItemProps) => {
  const width = (item.endTime - item.startTime) * PIXELS_PER_SECOND;
  styles.useVariants({ selected: item.selected });

  return (
    <Pressable
      style={[
        styles.container,
        styles.color,
        {
          width: width,
        },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <ThemedText type="h3">{index + 1}</ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: theme.gap(2),
    borderWidth: 3,
  },
  color: {
    variants: {
      selected: {
        false: {
          borderColor: theme.colors.dimmed,
          backgroundColor: theme.colors.foreground,
        },
        true: {
          borderColor: theme.colors.typography,
          backgroundColor: theme.colors.primary,
        },
      },
    },
  },
}));
