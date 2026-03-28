import { useScrollToTop } from "@react-navigation/native";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import React, { useMemo, useRef } from "react";
import { RefreshControl, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ThemedText } from "./themed-text";

export interface Section<T = any> {
  title?: string;
  data: T[];
  render: (item: T) => React.ReactElement;
}

interface SectionListViewProps {
  sections: readonly Section[];
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  refetch?: () => void;
  isRefetching?: boolean;
}

type FlashItem =
  | { type: "header"; title: string; sectionIndex: number }
  | {
      type: "row";
      item: any;
      render: (item: any) => React.ReactElement;
      sectionIndex: number;
    }
  | { type: "footer"; sectionIndex: number };

export function SectionListView({
  sections,
  hasNextPage,
  fetchNextPage,
  refetch,
  isRefetching,
}: SectionListViewProps) {
  const ref = useRef<FlashListRef<FlashItem>>(null);
  useScrollToTop(ref);

  const data = useMemo(() => {
    const result: FlashItem[] = [];
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (section.data.length === 0) continue;
      if (section.title) {
        result.push({ type: "header", title: section.title, sectionIndex: i });
      }
      for (const item of section.data) {
        result.push({
          type: "row",
          item,
          render: section.render,
          sectionIndex: i,
        });
      }
      result.push({ type: "footer", sectionIndex: i });
    }
    return result;
  }, [sections]);

  return (
    <FlashList
      ref={ref}
      data={data}
      renderItem={({ item }) => {
        if (item.type === "footer") return <View style={styles.footer} />;
        if (item.type === "header") {
          return <ThemedText type="h4">{item.title}</ThemedText>;
        }
        return <View style={styles.row}>{item.render(item.item)}</View>;
      }}
      getItemType={(item) => {
        if (item.type === "footer") return "footer";
        if (item.type === "header") return "header";
        return `row-${item.sectionIndex}`;
      }}
      keyExtractor={(item, index) => {
        if (item.type === "footer") return `footer-${item.sectionIndex}`;
        if (item.type === "header")
          return `header-${item.title}-${item.sectionIndex}`;
        return item.item?.id ?? `row-${item.sectionIndex}-${index}`;
      }}
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      onEndReached={() => hasNextPage && fetchNextPage?.()}
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
    paddingHorizontal: theme.gap(2),
    paddingBottom: theme.gap(16),
  },
  row: {
    paddingVertical: theme.gap(0.5),
  },
  footer: {
    height: theme.gap(1),
  },
}));
