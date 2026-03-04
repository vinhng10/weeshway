import { OptionItem } from "@/types";
import { FlatList, ListRenderItem, Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Header } from "../header";
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
  const handleSelect = (value: string) => {
    onSelect(currentValue === value ? undefined : value);
    onClose();
  };

  const optionsArray = Object.entries(options).map(([key, value]) => ({
    key,
    value,
  }));

  const renderItem: ListRenderItem<OptionItem> = ({ item }) => {
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
  };

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
        <FlatList
          data={optionsArray}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    gap: theme.gap(4),
    padding: theme.gap(2),
    paddingBottom: theme.gap(16),
  },
}));
