import { Chip } from "@/components/chip";
import { OptionsModal } from "@/components/options-modal";
import { useState } from "react";
import { ScrollView } from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";

export interface ChipBarItemProps {
  label: string;
  value?: string;
  options: Record<string, string>;
  onValueChange?: any;
  modal: boolean;
}

export const ChipBarItem = ({
  label,
  value,
  options,
  onValueChange,
  modal,
}: ChipBarItemProps) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleOptionSelect = (selectedValue: string) => {
    onValueChange?.(selectedValue);
    handleCloseModal();
  };

  if (modal) {
    // Modal mode: single chip with chevron down icon
    const hasValue = value !== undefined && value !== null && value !== "";
    // When an option is selected, text is the value prop
    const chipLabel = hasValue ? value : label;
    const chipColor = hasValue ? "light" : "dark";

    return (
      <>
        <Chip
          size={"large"}
          color={chipColor}
          label={chipLabel}
          icon="chevron.down"
          onPress={() => setModalVisible(true)}
        />
        {options && (
          <OptionsModal
            visible={modalVisible}
            onClose={handleCloseModal}
            onSelect={handleOptionSelect}
            options={options}
            title={label}
          />
        )}
      </>
    );
  } else {
    return (
      <>
        {Object.entries(options).map(([optionValue, optionLabel]) => {
          const isActive = value === optionValue;
          return (
            <Chip
              key={optionValue}
              size={"large"}
              color={isActive ? "light" : "dark"}
              label={optionLabel}
              onPress={() => onValueChange?.(optionValue)}
            />
          );
        })}
      </>
    );
  }
};

export interface ChipBarItem {
  label: string;
  value?: string;
  options?: Record<string, string>;
  onValueChange?: any;
  modal: boolean;
}

interface ChipBarProps extends UnistylesVariants<typeof styles> {
  items: ChipBarItem[];
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
        <ChipBarItem
          key={item.label || index}
          label={item.label}
          value={item.value}
          options={item.options}
          onValueChange={item.onValueChange}
          modal={item.modal}
        />
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
