import {
  RefreshControl,
  SectionList,
  SectionListData,
  View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ThemedText } from "./themed-text";

// Extend SectionListData to include a render function

interface SectionListViewProps {
  sections: ReadonlyArray<SectionListData<any>>;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  refetch?: () => void;
  isRefetching?: boolean;
}

export function SectionListView({
  sections,
  hasNextPage,
  fetchNextPage,
  refetch,
  isRefetching,
}: SectionListViewProps) {
  return (
    <SectionList
      sections={sections.filter((section) => section.data.length > 0)}
      keyExtractor={(item, i) => `${item}-${i}`}
      renderItem={({ item, section }) => section.render(item)}
      renderSectionHeader={({ section: { title } }) =>
        title && <ThemedText type="h4">{title}</ThemedText>
      }
      renderSectionFooter={() => <View style={styles.footer} />}
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      onEndReached={() => {
        if (hasNextPage && fetchNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching ?? false}
          onRefresh={refetch}
        />
      }
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  scrollContainer: {
    gap: theme.gap(1),
    paddingHorizontal: theme.gap(2),
    paddingBottom: theme.gap(16),
  },
  footer: {
    height: theme.gap(1),
  },
}));
