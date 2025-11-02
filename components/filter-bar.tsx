import { Chip } from "@/components/chip";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export interface FilterOption<T extends string = string> {
  id: T;
  label: string;
  hasDropdown?: boolean;
}

interface FilterBarProps<T extends string = string> {
  filters: FilterOption<T>[];
  activeFilter?: T;
  onFilterPress?: (filter: T) => void;
}

export const FilterBar = <T extends string = string>({
  filters,
  activeFilter,
  onFilterPress,
}: FilterBarProps<T>) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => {
          const isActive = filter.id === activeFilter;

          return (
            <Chip
              key={filter.id}
              size={"large"}
              type={isActive ? "light" : "dark"}
              label={filter.label}
              icon={filter.hasDropdown ? "chevron.down" : undefined}
              onPress={() => onFilterPress?.(filter.id)}
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
    paddingVertical: theme.gap(1),
    paddingHorizontal: theme.gap(2),
    alignItems: "center",
  },
}));
