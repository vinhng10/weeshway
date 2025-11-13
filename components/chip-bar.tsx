import { Chip } from "@/components/chip";
import { ScrollView } from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";

export interface Option<T extends string = string> {
  id: T;
  label: string;
  hasDropdown?: boolean;
}

interface ChipBarProps<T extends string = string>
  extends UnistylesVariants<typeof styles> {
  options: Option<T>[];
  activeOption?: T;
  onPress?: any;
}

export const ChipBar = <T extends string = string>({
  options,
  activeOption,
  onPress,
  padding,
}: ChipBarProps<T>) => {
  styles.useVariants({ padding });

  return (
    <ScrollView
      horizontal
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContainer}
      showsHorizontalScrollIndicator={false}
    >
      {options.map((option) => {
        const isActive = option.id === activeOption;

        return (
          <Chip
            key={option.id}
            size={"large"}
            color={isActive ? "light" : "dark"}
            label={option.label}
            icon={option.hasDropdown ? "chevron.down" : undefined}
            onPress={() => onPress?.(option.id)}
          />
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create((theme) => ({
  scrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  scrollContainer: {
    gap: theme.gap(1),
    alignItems: "center",
    variants: {
      padding: {
        true: {
          paddingVertical: theme.gap(1),
          paddingHorizontal: theme.gap(2),
        },
        false: {},
      },
    },
  },
}));
