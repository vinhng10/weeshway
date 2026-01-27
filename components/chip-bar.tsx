import { useState } from "react";
import { ScrollView } from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";
import { Chip } from "./chip";
import { Options } from "./input/options";

export interface ChipBarItemProps {
  label: string;
  value?: string;
  options: Record<string, string>;
  onValueChange?: any;
  modal: boolean;
  enabled?: boolean;
}

export const ChipBarItem = ({
  label,
  value,
  options,
  onValueChange,
  modal,
  enabled = true,
}: ChipBarItemProps) => {
  const [visible, setVisible] = useState(false);

  const handleModal = () => {
    setVisible(!visible);
  };

  const handleOptionSelect = (value?: string) => {
    onValueChange?.(value);
    setVisible(false);
  };

  if (!enabled) return null;

  if (modal) {
    // When an option is selected, text is the value prop
    const chipLabel = value ? value : label;
    const chipColor = value ? "light" : "dark";

    return (
      <>
        <Chip
          size={"large"}
          color={chipColor}
          label={chipLabel}
          icon="chevron-down"
          onPress={handleModal}
        />
        {options && (
          <Options
            visible={visible}
            onClose={handleModal}
            onSelect={handleOptionSelect}
            options={options}
            title={label}
            currentValue={value}
          />
        )}
      </>
    );
  } else {
    return (
      <>
        {Object.values(options).map((optionValue) => {
          const isActive = value === optionValue;
          return (
            <Chip
              key={optionValue}
              size={"large"}
              color={isActive ? "light" : "dark"}
              label={optionValue}
              onPress={() => onValueChange?.(optionValue)}
            />
          );
        })}
      </>
    );
  }
};

interface ChipBarProps extends UnistylesVariants<typeof styles> {
  items: ChipBarItemProps[];
}

export const ChipBar = ({ items, padding }: ChipBarProps) => {
  styles.useVariants({ padding });

  return (
    <ScrollView
      horizontal
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContainer}
      showsHorizontalScrollIndicator={false}
    >
      {items.map((item, index) => (
        <ChipBarItem key={index} {...item} />
      ))}
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
