import { OptionItem } from "@/types";
import { FlashList, ListRenderItem } from "@shopify/flash-list";
import React, { useCallback, useMemo } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Header } from "../header";
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

  const renderItem: ListRenderItem<OptionItem> = useCallback(
    ({ item }) => {
      return (
        <Pressable onPress={() => handleSelect(item.value)}>
          <ThemedText
            type="h3"
            color={currentValue !== item.value ? "dimmed" : undefined}
          >
            {renderFunction ? renderFunction(item) : item.value}
          </ThemedText>
        </Pressable>
      );
    },
    [handleSelect, currentValue, renderFunction],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <Header title={title} onPress={onClose} />

        {/* Options List */}
        <FlashList
          data={optionsArray}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          extraData={currentValue}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <Separator gap={3} />}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    paddingHorizontal: theme.gap(2),
    paddingBottom: theme.gap(32),
  },
}));
