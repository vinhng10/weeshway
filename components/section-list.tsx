import { useCallback, useMemo } from "react";
import {
  RefreshControl,
  SectionList,
  SectionListData,
  SectionListRenderItemInfo,
  View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ThemedText } from "./themed-text";

interface SectionListViewProps {
  sections: ReadonlyArray<SectionListData<any>>;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  refetch?: () => void;
  isRefetching?: boolean;
}

const keyExtractor = (item: any, i: number) => item?.id ?? `item-${i}`;

const renderSectionHeader = ({ section: { title } }: any) =>
  title ? <ThemedText type="h4">{title}</ThemedText> : null;

const renderSectionFooter = () => <View style={styles.footer} />;

const renderItem = ({ item, section }: SectionListRenderItemInfo<any>) =>
  section.render(item);

export function SectionListView({
  sections,
  hasNextPage,
  fetchNextPage,
  refetch,
  isRefetching,
}: SectionListViewProps) {
  const filteredSections = useMemo(
    () => sections.filter((section) => section.data.length > 0),
    [sections],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && fetchNextPage) fetchNextPage();
  }, [hasNextPage, fetchNextPage]);

  return (
    <SectionList
      sections={filteredSections}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      renderSectionFooter={renderSectionFooter}
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
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
