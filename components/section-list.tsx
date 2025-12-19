import { ThemedText } from "@/components/themed-text";
import React from "react";
import { SectionList, SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

// Extend SectionListData to include a render function

interface SectionListViewProps<ItemT> {
  sections: ReadonlyArray<SectionListData<ItemT>>;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
}

export function SectionListView<ItemT>({
  sections,
  hasNextPage,
  fetchNextPage,
}: SectionListViewProps<ItemT>) {
  return (
    <SectionList
      sections={sections.filter((section) => section.data.length > 0)}
      keyExtractor={(item, i) => `${item}-${i}`}
      renderItem={({ item, section }) => section.render(item)}
      renderSectionHeader={({ section: { title } }) => (
        <ThemedText type="h4">{title}</ThemedText>
      )}
      renderSectionFooter={() => <View style={styles.footer} />}
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      onEndReached={() => {
        if (hasNextPage && fetchNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  scrollContainer: {
    gap: theme.gap(1),
    padding: theme.gap(2),
    paddingBottom: theme.gap(16),
  },
  footer: {
    height: theme.gap(1),
  },
}));
