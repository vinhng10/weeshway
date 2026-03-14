import { Avatar, Boundary, TextInput, ThemedText, Tile } from "@/components";
import { useSearch } from "@/hooks/useSearch";
import { SearchResultType } from "@/types";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function SearchContent({ query }: { query: string }) {
  const { data, fetchNextPage, hasNextPage, isDebouncing } = useSearch(query);
  if (!query.trim() || isDebouncing) return null;

  const handlePress = (item: SearchResultType) => {
    if (item.type === "profile") {
      router.navigate(`./teacher/${item.id}`);
    } else {
      router.navigate(`./classes/${item.id}`);
    }
  };

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
          onPress={() => handlePress(item)}
        />
      )}
      ListEmptyComponent={
        <View style={styles.messageContainer}>
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

export default function Search() {
  const [query, setQuery] = useState("");

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="What are you looking for?"
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <Boundary>
        <SearchContent query={query} />
      </Boundary>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    padding: theme.gap(2),
  },
  scrollContainer: {
    gap: theme.gap(1),
    paddingHorizontal: theme.gap(2),
    paddingBottom: theme.gap(16),
  },
  messageContainer: {
    alignSelf: "center",
    paddingTop: theme.gap(8),
  },
}));
