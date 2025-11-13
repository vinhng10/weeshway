import { Header } from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import React from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface OptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  options: Record<string, string>;
  title: string;
}

export const OptionsModal: React.FunctionComponent<OptionsModalProps> = ({
  visible,
  onClose,
  onSelect,
  options,
  title,
}) => {
  const handleSelect = (value: string) => {
    onSelect(value);
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
          {Object.entries(options).map(([value, label]) => {
            return (
              <Pressable key={value} onPress={() => handleSelect(value)}>
                <ThemedText type="h3">{label}</ThemedText>
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
    backgroundColor: theme.colors.background,
    opacity: 0.95,
  },
  scrollContainer: {
    gap: theme.gap(4),
    padding: theme.gap(2),
    paddingBottom: theme.gap(16),
  },
}));
