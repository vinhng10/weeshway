import { useSearch } from "@/hooks";
import { SearchResultType } from "@/types";
import { ListRenderItem } from "@shopify/flash-list";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { IconSymbol } from "../icon-symbol";
import { Pressable } from "../pressable";
import { ThemedActivityIndicator } from "../themed-activity-indicator";
import { ThemedText } from "../themed-text";
import { Tile } from "../tile";
import { SearchModal } from "./search-modal";

const ROUTE_BY_TYPE: Record<string, string> = {
  profile: "teacher",
  class: "classes",
  project: "projects",
  wish: "wishes",
};

interface SearchProps {
  rpc: string;
}

export const Search: React.FunctionComponent<SearchProps> = ({ rpc }) => {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const { data, loading, error, fetchNextPage, hasNextPage, isDebouncing } =
    useSearch(query, rpc);

  const open = useCallback(() => setVisible(true), []);

  const close = useCallback(() => {
    setVisible(false);
    setQuery("");
  }, []);

  const handleSelect = useCallback(
    (item: SearchResultType) => {
      close();
      const prefix = ROUTE_BY_TYPE[item.type] ?? "";
      router.navigate(`./${prefix ? `${prefix}/` : ""}${item.id}`);
    },
    [close],
  );

  const renderItem: ListRenderItem<SearchResultType> = useCallback(
    ({ item }) => (
      <Tile
        imageSource={item.imageUrl}
        title={item.title}
        subtitle={item.subtitle}
        metadata={item.metadata}
        previewUrl={item.previewUrl}
        avatars={item.avatarUrl ? [item.avatarUrl] : undefined}
        onPress={() => handleSelect(item)}
      />
    ),
    [handleSelect],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage) fetchNextPage();
  }, [hasNextPage, fetchNextPage]);

  const renderEmptyState = () => {
    if (!query.trim() || isDebouncing) return null;
    if (loading) {
      return (
        <View style={styles.messageContainer}>
          <ThemedActivityIndicator size="large" />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.messageContainer}>
          <ThemedText color="danger">{error}</ThemedText>
        </View>
      );
    }
    return (
      <View style={styles.messageContainer}>
        <ThemedText color="dimmed">No results found</ThemedText>
      </View>
    );
  };

  return (
    <>
      <Pressable style={styles.searchButton} onPress={open}>
        <IconSymbol name="search" size={20} style={styles.icon} />
      </Pressable>
      <SearchModal
        visible={visible}
        title="Search"
        placeholder="What are you looking for?"
        query={query}
        onQueryChange={setQuery}
        onClose={close}
        data={data}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyState}
        onEndReached={handleEndReached}
      />
    </>
  );
};

const styles = StyleSheet.create((theme) => ({
  searchButton: {
    width: theme.gap(4),
    height: theme.gap(4),
    borderRadius: 999,
    backgroundColor: theme.colors.contrast,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    color: theme.colors.typographyContrast,
  },
  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
}));
