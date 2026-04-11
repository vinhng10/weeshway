import { FlashList, ListRenderItem } from "@shopify/flash-list";
import React from "react";
import { Modal, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Header } from "../header";
import { Separator } from "../separator";
import { TextInput } from "./text-input";

interface SearchModalProps<T> {
  visible: boolean;
  title: string;
  placeholder: string;
  query: string;
  onQueryChange: (q: string) => void;
  onClose: () => void;
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: ListRenderItem<T>;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  onEndReached?: () => void;
}

export function SearchModal<T>({
  visible,
  title,
  placeholder,
  query,
  onQueryChange,
  onClose,
  data,
  keyExtractor,
  renderItem,
  ListEmptyComponent,
  onEndReached,
}: SearchModalProps<T>) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Header title={title} onPress={onClose} />
        <View style={styles.searchContainer}>
          <TextInput
            placeholder={placeholder}
            value={query}
            onChangeText={onQueryChange}
            autoFocus
          />
        </View>
        <FlashList
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ItemSeparatorComponent={Separator}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    paddingHorizontal: theme.gap(2),
  },
  scrollContainer: {
    padding: theme.gap(2),
    paddingBottom: theme.gap(32),
  },
}));
