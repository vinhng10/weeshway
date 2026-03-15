import { useSearch } from "@/hooks";
import { SearchResultType } from "@/types";
import { useState } from "react";
import { FlatList, Keyboard, Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Avatar } from "../avatar";
import { Boundary } from "../boundary";
import { Header } from "../header";
import { IconSymbol } from "../icon-symbol";
import { ThemedText } from "../themed-text";
import { Tile } from "../tile";
import { TextInput } from "./text-input";

interface SearchProps {
  onSelect: (item: SearchResultType) => void;
  rpc: string;
}

function SearchResults({
  query,
  rpc,
  onSelect,
}: {
  query: string;
  rpc: string;
  onSelect: (item: SearchResultType) => void;
}) {
  const { data, fetchNextPage, hasNextPage, isDebouncing } = useSearch(
    query,
    rpc,
  );
  if (!query.trim() || isDebouncing) return null;

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => `${item.type}-${item.id}`}
      renderItem={({ item }) => (
        <Tile
          imageSource={item.imageUrl}
          title={item.title}
          subtitle={item.subtitle}
          metadata={item.metadata}
          previewUrl={item.previewUrl}
          avatar={
            item.avatarUrl ? (
              <Avatar source={item.avatarUrl} shape="circle" bordered />
            ) : undefined
          }
          onPress={() => onSelect(item)}
        />
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <ThemedText color="dimmed">No results found</ThemedText>
        </View>
      }
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      onEndReached={() => {
        if (hasNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
    />
  );
}

export const Search = ({ onSelect, rpc }: SearchProps) => {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");

  const handleClose = () => {
    setVisible(false);
    setQuery("");
    Keyboard.dismiss();
  };

  const handleSelect = (item: SearchResultType) => {
    onSelect(item);
    handleClose();
  };

  return (
    <>
      <Pressable style={styles.searchButton} onPress={() => setVisible(true)}>
        <IconSymbol name="search" size={20} style={styles.searchIcon} />
      </Pressable>

      <Modal
        visible={visible}
        // animationType="slide"
        presentationStyle="overFullScreen"
        transparent
        onRequestClose={handleClose}
      >
        <View style={styles.container}>
          <Header title="Search" onPress={handleClose} />
          <View style={styles.inputContainer}>
            <TextInput
              placeholder={"What are you looking for?"}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
          </View>
          <Boundary>
            <SearchResults query={query} rpc={rpc} onSelect={handleSelect} />
          </Boundary>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top,
    backgroundColor: theme.colors.background,
  },
  inputContainer: {
    paddingHorizontal: theme.gap(2),
    paddingBottom: theme.gap(1),
  },
  scrollContainer: {
    gap: theme.gap(1),
    paddingHorizontal: theme.gap(2),
    paddingBottom: theme.gap(16),
  },
  emptyContainer: {
    alignSelf: "center",
    paddingTop: theme.gap(8),
  },
  searchButton: {
    width: theme.gap(4),
    height: theme.gap(4),
    borderRadius: 20,
    backgroundColor: theme.colors.contrast,
    justifyContent: "center",
    alignItems: "center",
  },
  searchIcon: {
    color: theme.colors.typographyContrast,
  },
}));
