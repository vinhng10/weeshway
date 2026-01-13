import {
  Boundary,
  BubbleChart,
  ChipBar,
  ChipBarItemProps,
  LocationPermission,
  SectionListView,
  Tile,
} from "@/components";
import { LEVEL, STYLE } from "@/constants";
import { useSuspenseInfiniteRpc, useSuspenseQuery } from "@/hooks";
import { supabase } from "@/supabase";
import { BubbleType, LevelType, StyleType, WishEnrichedType } from "@/types";
import { router } from "expo-router";
import { useState } from "react";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface ExploreContentProps {
  style?: StyleType;
  level?: LevelType;
}

function ExploreContent({ style, level }: ExploreContentProps) {
  const [centroidId, setCentroidId] = useState<number>();

  const {
    data: bubbles,
    refetch: refetchBubbles,
    isRefetching: isRefetchingBubbles,
  } = useSuspenseQuery<BubbleType[]>({
    queryKey: ["bubbles", style, level],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_bubbles", {
        p_style: style,
        p_level: level,
      });
      if (error) throw error;
      return data;
    },
  });

  const {
    data: wishes,
    hasNextPage,
    fetchNextPage,
    refetch: refetchWishes,
    isRefetching: isRefetchingWishes,
  } = useSuspenseInfiniteRpc<WishEnrichedType>({
    queryKey: ["wishes", style, level, centroidId],
    rpcFunction: "get_nearby_wishes",
    columns: `*, song:songs!inner(*)`,
    pageSize: 10,
    trailingQuery: (query) => {
      if (style) {
        query = query.eq("style", style);
      }
      if (level) {
        query = query.eq("level", level);
      }
      if (centroidId) {
        query = query.eq("song.centroid_id", centroidId);
      }
      return query;
    },
  });

  const handleBubbleTap = (bubbleData: BubbleType) => {
    if (centroidId !== bubbleData.label) {
      setCentroidId(bubbleData.label);
    } else {
      setCentroidId(undefined);
    }
  };

  const renderBubbleChart = (data: BubbleType[]): React.ReactElement => (
    <BubbleChart data={data} onBubbleTap={handleBubbleTap} />
  );

  const renderTile = (data: WishEnrichedType): React.ReactElement => (
    <Tile
      imageSource={data.song.artworkUrl}
      title={data.song.name}
      subtitle={data.song.artistName}
      metadata={`${data.style} • ${data.level}`}
      previewUrl={data.song.previewUrl}
      onPress={() => router.navigate(`/(teacher)/(explore)/wishes/${data.id}`)}
    />
  );

  const sections: SectionListData<BubbleType[] | WishEnrichedType>[] = [
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

  return (
    <>
      <SectionListView
        sections={sections}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        refetch={() => {
          refetchBubbles();
          refetchWishes();
        }}
        isRefetching={isRefetchingBubbles || isRefetchingWishes}
      />
      <LocationPermission />
    </>
  );
}

export default function Explore() {
  const [style, setStyle] = useState<StyleType>();
  const [level, setLevel] = useState<LevelType>();

  const options: ChipBarItemProps[] = [
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
      <ChipBar padding items={options} />
      <Boundary>
        <ExploreContent />
      </Boundary>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
  },
}));
