import { BubbleChart } from "@/components/bubble-chart";
import { ChipBar, ChipBarItemProps } from "@/components/chip-bar";
import { SectionListView } from "@/components/section-list";
import { Tile } from "@/components/tile";
import { Genre, Level, Style } from "@/constants/options";
import { BubbleChartData, bubbleChartData } from "@/mocks/bubble-chart";
import { wishes } from "@/mocks/wishes";
import { WishType } from "@/types";
import { router } from "expo-router";
import { useState } from "react";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function WishBoard() {
  const [genre, setGenre] = useState<string>("");
  const [style, setStyle] = useState<string>("");
  const [level, setLevel] = useState<string>("");

  const filters: ChipBarItemProps[] = [
    {
      label: "Genre",
      value: genre,
      options: Genre,
      modal: true,
      onValueChange: setGenre,
    },
    {
      label: "Style",
      value: style,
      options: Style,
      modal: true,
      onValueChange: setStyle,
    },
    {
      label: "Level",
      value: level,
      options: Level,
      modal: true,
      onValueChange: setLevel,
    },
  ];

  const renderBubbleChart = (data: BubbleChartData[]): React.ReactElement => (
    <BubbleChart data={data} />
  );

  const renderTile = (data: WishType): React.ReactElement => (
    <Tile
      imageSource={data.imageUrl}
      title={data.title}
      subtitle={data.artist}
      metadata={`${data.style} • ${data.level}`}
      onPress={() => router.push(`/(teacher)/wish-board/${data.id}`)}
    />
  );

  const sections: SectionListData<BubbleChartData[] | WishType>[] = [
    { title: "Explore", data: [bubbleChartData], render: renderBubbleChart },
    { title: "Wishes", data: wishes, render: renderTile },
  ];

  return (
    <View style={styles.container}>
      <ChipBar padding items={filters} />
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
