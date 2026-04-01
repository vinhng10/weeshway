import { useSearch } from "@/hooks";
import { SearchResultType } from "@/types";
import { FlashList, ListRenderItem } from "@shopify/flash-list";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Header } from "../header";
import { IconSymbol } from "../icon-symbol";
import { Separator } from "../separator";
import { ThemedActivityIndicator } from "../themed-activity-indicator";
import { ThemedText } from "../themed-text";
import { Tile } from "../tile";
import { TextInput } from "./text-input";

interface SearchProps {
  rpc: string;
}

export const Search: React.FunctionComponent<SearchProps> = ({ rpc }) => {
  return (
    <Pressable
      style={styles.searchButton}
      onPress={() => router.navigate({ pathname: "./search", params: { rpc } })}
    >
      <IconSymbol name="search" size={20} style={styles.icon} />
    </Pressable>
  );
};

const ROUTE_BY_TYPE: Record<string, string> = {
  profile: "teacher",
  class: "classes",
  project: "projects",
  wish: "wishes",
};

const keyExtractor = (item: SearchResultType) => `${item.type}-${item.id}`;

export const SearchScreen: React.FunctionComponent = () => {
  const { rpc = "search" } = useLocalSearchParams<{ rpc?: string }>();
  const [query, setQuery] = useState("");
  const { data, loading, error, fetchNextPage, hasNextPage, isDebouncing } =
    useSearch(query, rpc);

  const handleSelect = useCallback((item: SearchResultType) => {
    const prefix = ROUTE_BY_TYPE[item.type] ?? "";
    router.back();
    router.navigate(`./${prefix ? `${prefix}/` : ""}${item.id}`);
  }, []);

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

    if (query.trim()) {
      return (
        <View style={styles.messageContainer}>
          <ThemedText color="dimmed">No results found</ThemedText>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <Header title="Search" />
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="What are you looking for?"
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>
      <FlashList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ItemSeparatorComponent={Separator}
      />
    </View>
  );
};

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
  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
}));
