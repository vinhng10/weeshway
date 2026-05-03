import { FlashList, ListRenderItem } from "@shopify/flash-list";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Header } from "../header";
import { Modal } from "../modal";
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
    <Modal visible={visible} onRequestClose={onClose}>
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
    </Modal>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  searchContainer: {
    paddingHorizontal: theme.gap(2),
  },
  scrollContainer: {
    padding: theme.gap(2),
    paddingBottom: theme.gap(32),
  },
}));
