import { Header } from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface OptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (value?: string) => void;
  options: Record<string, string>;
  title: string;
  currentValue?: string;
}

export const OptionsModal = ({
  visible,
  onClose,
  onSelect,
  options,
  title,
  currentValue,
}: OptionsModalProps) => {
  const handleSelect = (value: string) => {
    onSelect(currentValue === value ? undefined : value);
    onClose();
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
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(options).map(([key, value]) => {
            return (
              <Pressable key={key} onPress={() => handleSelect(value)}>
                <ThemedText
                  type="h3"
                  color={currentValue !== value ? "dimmed" : undefined}
                >
                  {value}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
    opacity: 0.95,
  },
  scrollContainer: {
    gap: theme.gap(4),
    padding: theme.gap(2),
    paddingBottom: theme.gap(16),
  },
}));
