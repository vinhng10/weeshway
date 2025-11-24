import { BubbleChart } from "@/components/bubble-chart";
import { ChipBar, ChipBarItemProps } from "@/components/chip-bar";
import { SectionListView } from "@/components/section-list";
import { Tile } from "@/components/tile";
import { LevelEnum, StyleEnum } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { BubbleChartData } from "@/mocks/bubble-chart";
import { supabase } from "@/supabase";
import { WishEnrichedType } from "@/types";
import { useQuery } from "@tanstack/react-query";
import camelcaseKeys from "camelcase-keys";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function WishBoard() {
  const [style, setStyle] = useState<StyleEnum | undefined>();
  const [level, setLevel] = useState<LevelEnum | undefined>();
  const profile = useAuth((state) => state.profile);
  const isLoggedIn = useAuth((state) => state.isLoggedIn);

  const { data, isPending, error } = useQuery<WishEnrichedType[]>({
    queryKey: ["wishes", "board", style, level],
    queryFn: async () => {
      let query = supabase.from("wishes").select(`*, song:songs(*)`);

      // Apply filters
      if (style) {
        query = query.eq("style", style);
      }
      if (level) {
        query = query.eq("level", level);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data) return [];

      // Use camelcaseKeys to normalize keys to camelCase
      const result = camelcaseKeys(data, { deep: true });
      return result;
    },
    enabled: isLoggedIn && !!profile,
  });
  // console.log(data);

  // Generate bubble chart data from wishes grouped by style
  const bubbleChartData = useMemo((): BubbleChartData[] => {
    if (!data) return [];

    const styleCounts = new Map<string, number>();
    data.forEach((wish) => {
      const wishStyle = wish.style || "Other";
      styleCounts.set(wishStyle, (styleCounts.get(wishStyle) || 0) + 1);
    });

    return Array.from(styleCounts.entries()).map(([label, value]) => ({
      label,
      value,
    }));
  }, [data]);

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

  const renderBubbleChart = (data: BubbleChartData[]): React.ReactElement => (
    <BubbleChart data={data} />
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

  const sections: SectionListData<BubbleChartData[] | WishEnrichedType>[] = [
    { title: "Explore", data: [bubbleChartData], render: renderBubbleChart },
    {
      title: "Wishes",
      data: isPending || error ? [] : data || [],
      render: renderTile,
    },
  ];

  return (
    <View style={styles.container}>
      <ChipBar padding items={options} />
      <SectionListView sections={sections} />
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
