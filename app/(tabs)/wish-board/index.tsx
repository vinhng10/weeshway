import { Boundary } from "@/components/boundary";
import { BubbleChart, BubbleType } from "@/components/bubble-chart";
import { ChipBar, ChipBarItemProps } from "@/components/chip-bar";
import { SectionListView } from "@/components/section-list";
import { Tile } from "@/components/tile";
import { LevelEnum, StyleEnum } from "@/constants";
import { useSuspenseInfiniteQuery } from "@/hooks/useSuspenseInfiniteQuery";
import { useSuspenseQuery } from "@/hooks/useSuspenseQuery";
import { supabase } from "@/supabase";
import { WishEnrichedType } from "@/types";
import { router } from "expo-router";
import { useState } from "react";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function WishBoardContent() {
  const [style, setStyle] = useState<StyleEnum | undefined>();
  const [level, setLevel] = useState<LevelEnum | undefined>();
  const [centroidId, setCentroidId] = useState<number | undefined>();

  const { data: bubbles } = useSuspenseQuery<BubbleType[]>({
    queryKey: ["bubbles", style, level],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_wish_clusters", {
        filter_style: style,
        filter_level: level,
      });
      if (error) throw error;
      return data;
    },
  });

  const {
    data: wishes,
    hasNextPage,
    fetchNextPage,
  } = useSuspenseInfiniteQuery<WishEnrichedType>({
    queryKey: ["wishes", style, level, centroidId],
    tableName: "wishes",
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

  const options: ChipBarItemProps[] = [
    {
      label: "Style",
      value: style,
      options: StyleEnum,
      modal: true,
      onValueChange: setStyle,
    },
    {
      label: "Level",
      value: level,
      options: LevelEnum,
      modal: true,
      onValueChange: setLevel,
    },
  ];

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
      onPress={() => router.push(`/(tabs)/wish-board/${data.id}`)}
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
    <View style={styles.container}>
      <ChipBar padding items={options} />
      <SectionListView
        sections={sections}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
      />
    </View>
  );
}

export default function WishBoard() {
  return (
    <Boundary>
      <WishBoardContent />
    </Boundary>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
  },
}));
