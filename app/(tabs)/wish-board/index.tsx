import BubbleChart from "@/components/bubble-chart";
import { ChipBar, Option } from "@/components/chip-bar";

import { ThemedText } from "@/components/themed-text";
import { Tile } from "@/components/tile";
import { bubbleChartData } from "@/mocks/bubble-chart";
import { wishes } from "@/mocks/wishes";
import { router } from "expo-router";
import { useState } from "react";
import { Dimensions, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type ClassOption = "all" | "genre" | "style" | "level";

const CLASS_FILTERS: Option<ClassOption>[] = [
  { id: "all", label: "All" },
  { id: "genre", label: "Genre", hasDropdown: true },
  { id: "style", label: "Style", hasDropdown: true },
  { id: "level", label: "Level", hasDropdown: true },
];

export default function WishBoard() {
  const [activeOption, setActiveOption] = useState<ClassOption>("all");

  return (
    <View style={styles.container}>
      <ChipBar
        padding
        options={CLASS_FILTERS}
        activeOption={activeOption}
        onPress={setActiveOption}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <ThemedText type="h4">Explore</ThemedText>
          <View style={styles.chartContainer}>
            <BubbleChart
              data={bubbleChartData}
              width={360}
              height={360}
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4">Wishes</ThemedText>
          <View style={styles.list}>
            {wishes.map((wish) => (
              <Tile
                imageSource={wish.imageUrl}
                title={wish.title}
                subtitle={wish.artist}
                metadata={`${wish.style} • ${wish.level}`}
                onPress={() => router.push(`/(tabs)/wish-board/${wish.id}`)}
                key={wish.id}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    gap: theme.gap(2),
    padding: theme.gap(2),
  },
  section: {
    gap: theme.gap(1),
  },
  list: {
    gap: theme.gap(1),
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
}));
