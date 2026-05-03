import { OptionItem } from "@/types";
import React, { useCallback, useMemo } from "react";
import { ScrollView } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Header } from "../header";
import { Modal } from "../modal";
import { Pressable } from "../pressable";
import { Separator } from "../separator";
import { ThemedText } from "../themed-text";

interface OptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (value?: string) => void;
  options: Record<string, string>;
  title: string;
  currentValue?: string;
  renderFunction?: (item: OptionItem) => string;
}

export const Options = ({
  visible,
  onClose,
  onSelect,
  options,
  title,
  currentValue,
  renderFunction,
}: OptionsModalProps) => {
  const handleSelect = useCallback(
    (value: string) => {
      onSelect(currentValue === value ? undefined : value);
      onClose();
    },
    [currentValue, onSelect, onClose],
  );

  const optionsArray = useMemo(
    () =>
      Object.entries(options).map(([key, value]) => ({
        key,
        value,
      })),
    [options],
  );

  return (
    <Modal visible={visible} onRequestClose={onClose}>
      {/* Header */}
      <Header title={title} onPress={onClose} />

      {/* Options List */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {optionsArray.map((item, index) => (
          <React.Fragment key={item.key}>
            {index > 0 && <Separator gap={3} />}
            <Pressable onPress={() => handleSelect(item.value)}>
              <ThemedText
                type="h3"
                color={currentValue !== item.value ? "dimmed" : undefined}
              >
                {renderFunction ? renderFunction(item) : item.value}
              </ThemedText>
            </Pressable>
          </React.Fragment>
        ))}
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  scrollContainer: {
    paddingHorizontal: theme.gap(2),
    paddingBottom: theme.gap(32),
  },
}));
