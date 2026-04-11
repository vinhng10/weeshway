import {
  Boundary,
  BubbleChart,
  ChipBar,
  ChipBarItemProps,
  LocationPermission,
  Search,
  SectionListView,
  Tile,
} from "@/components";
import { EXPLORE_FILTER, LEVEL, STYLE } from "@/constants";
import { useAuth, useSuspenseInfiniteQuery, useSuspenseQuery } from "@/hooks";
import { supabase } from "@/supabase";
import {
  BubbleType,
  ExploreFilterType,
  LevelType,
  StyleType,
  WishEnrichedType,
} from "@/types";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type WishWithSimilarCount = WishEnrichedType & { similarWishCount: number };

interface ExploreContentProps {
  style?: StyleType;
  level?: LevelType;
  filter: ExploreFilterType;
}

function ExploreContent({ style, level, filter }: ExploreContentProps) {
  const profile = useAuth((state) => state.profile);
  const [centroidId, setCentroidId] = useState<number>();
  const forMe = filter === EXPLORE_FILTER.FOR_ME;

  const {
    data: bubbles,
    refetch: refetchBubbles,
    isRefetching: isRefetchingBubbles,
  } = useSuspenseQuery<BubbleType[]>({
    queryKey: ["bubbles", style, level, filter],
    queryFn: async () => {
      const { data } = await supabase
        .rpc("get_bubbles", {
          p_style: style,
          p_level: level,
          p_teacher_id: forMe ? profile?.id : null,
        })
        .throwOnError();
      return data ?? [];
    },
  });

  const {
    data: wishes,
    hasNextPage,
    fetchNextPage,
    refetch: refetchWishes,
    isRefetching: isRefetchingWishes,
  } = useSuspenseInfiniteQuery<WishWithSimilarCount>({
    queryKey: ["wishes", style, level, filter, centroidId],
    tableName: "nearby_wishes",
    columns: forMe
      ? `*, song:songs!inner(*), wish_teachers!inner()`
      : `*, song:songs!inner(*)`,
    trailingQuery: (query) => {
      if (style) query = query.eq("style", style);
      if (level) query = query.eq("level", level);
      if (centroidId) query = query.eq("song.centroid_id", centroidId);
      if (forMe) query = query.eq("wish_teachers.teacher_id", profile?.id);
      return query;
    },
  });

  const handleBubbleTap = useCallback((bubbleData: BubbleType) => {
    setCentroidId((prev) =>
      prev !== bubbleData.label ? bubbleData.label : undefined,
    );
  }, []);

  const renderBubbleChart = useCallback(
    (data: BubbleType[]): React.ReactElement => (
      <BubbleChart data={data} onBubbleTap={handleBubbleTap} />
    ),
    [handleBubbleTap],
  );

  const renderTile = useCallback(
    (data: WishEnrichedType): React.ReactElement => (
      <Tile
        imageSource={data.song.artworkUrl}
        title={data.song.name}
        subtitle={data.song.artistName}
        metadata={[data.style, data.level].filter(Boolean).join(" • ")}
        previewUrl={data.song.previewUrl}
        onPress={() => router.navigate(`./wishes/${data.id}`)}
      />
    ),
    [],
  );

  const sections = [
    {
      title: "Explore",
      data: [bubbles],
      render: renderBubbleChart,
    },
    {
      title: "Wishes",
      data: wishes,
      render: renderTile,
    },
  ];

  const refetch = useCallback(() => {
    refetchBubbles();
    refetchWishes();
  }, [refetchBubbles, refetchWishes]);

  return (
    <SectionListView
      sections={sections}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      refetch={refetch}
      isRefetching={isRefetchingBubbles || isRefetchingWishes}
    />
  );
}

export default function Explore() {
  const [filter, setFilter] = useState<ExploreFilterType>(EXPLORE_FILTER.ALL);
  const [style, setStyle] = useState<StyleType>();
  const [level, setLevel] = useState<LevelType>();

  const options: ChipBarItemProps[] = [
    {
      label: "Filter",
      value: filter,
      options: EXPLORE_FILTER,
      modal: false,
      onValueChange: setFilter,
    },
    {
      label: "Style",
      value: style,
      options: STYLE,
      modal: true,
      onValueChange: setStyle,
    },
    {
      label: "Level",
      value: level,
      options: LEVEL,
      modal: true,
      onValueChange: setLevel,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Search rpc="search_nearby_wishes" />
        <ChipBar items={options} />
      </View>
      <Boundary>
        <ExploreContent style={style} level={level} filter={filter} />
      </Boundary>
      <LocationPermission />
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top,
    backgroundColor: theme.colors.background,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(1),
    gap: theme.gap(1),
    backgroundColor: "transparent",
  },
}));
