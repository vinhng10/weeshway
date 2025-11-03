import { Chip } from "@/components/chip";
import { ScrollView, View } from "react-native";
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
  onPress?: (option: T) => void;
}

export const ChipBar = <T extends string = string>({
  options,
  activeOption,
  onPress,
  padding,
}: ChipBarProps<T>) => {
  styles.useVariants({ padding });

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {options.map((option) => {
          const isActive = option.id === activeOption;

          return (
            <Chip
              key={option.id}
              size={"large"}
              type={isActive ? "light" : "dark"}
              label={option.label}
              icon={option.hasDropdown ? "chevron.down" : undefined}
              onPress={() => onPress?.(option.id)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    width: "100%",
  },
  scrollContent: {
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
