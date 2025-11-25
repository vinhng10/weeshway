import { ThemedText } from "@/components/themed-text";
import { PIXELS_PER_SECOND } from "@/constants";
import { ItemType } from "@/types";
import { Pressable } from "react-native";
import { StyleSheet, UnistylesVariants } from "react-native-unistyles";

type ItemProps = UnistylesVariants<typeof styles> & {
  index: number;
  item: ItemType;
  onPress: () => void;
};

export const Item = ({ index, item, onPress }: ItemProps) => {
  const width = (item.endTime - item.startTime) * PIXELS_PER_SECOND;
  styles.useVariants({
    selected: item.selected,
  });

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
          borderColor: theme.colors.tint,
          backgroundColor: theme.colors.foreground,
        },
        true: {
          borderColor: theme.colors.activeTint,
          backgroundColor: theme.colors.primary,
        },
      },
    },
  },
}));
