import { BubbleChart } from "@/components/bubble-chart";
import { ChipBar, Option } from "@/components/chip-bar";
import { SectionListView } from "@/components/section-list";
import { Tile } from "@/components/tile";
import { BubbleChartData, bubbleChartData } from "@/mocks/bubble-chart";
import { wishes } from "@/mocks/wishes";
import { WishType } from "@/types";
import { router } from "expo-router";
import { useState } from "react";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type ClassOption = "all" | "genre" | "style" | "level";

const CLASS_FILTERS: Option<ClassOption>[] = [
  { id: "all", label: "All" },
  { id: "genre", label: "Genre", hasDropdown: true },
  { id: "style", label: "Style", hasDropdown: true },
  { id: "level", label: "Level", hasDropdown: true },
];

export default function WishBoard() {
  const [activeOption, setActiveOption] = useState<ClassOption>("all");

  const renderBubbleChart = (data: BubbleChartData[]): React.ReactElement => (
    <BubbleChart data={data} />
  );

  const renderTile = (data: WishType): React.ReactElement => (
    <Tile
      imageSource={data.imageUrl}
      title={data.title}
      subtitle={data.artist}
      metadata={`${data.style} • ${data.level}`}
      onPress={() => router.push(`/(tabs)/wish-board/${data.id}`)}
    />
  );

  const sections: SectionListData<BubbleChartData[] | WishType>[] = [
    { title: "Explore", data: [bubbleChartData], render: renderBubbleChart },
    { title: "Wishes", data: wishes, render: renderTile },
  ];

  return (
    <View style={styles.container}>
      <ChipBar
        padding
        options={CLASS_FILTERS}
        activeOption={activeOption}
        onPress={setActiveOption}
      />
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
