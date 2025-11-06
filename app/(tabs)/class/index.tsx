import { Avatar } from "@/components/avatar";
import { Carousel } from "@/components/carousel";
import { ChipBar, Option } from "@/components/chip-bar";
import { ThemedText } from "@/components/themed-text";
import { Tile } from "@/components/tile";
import { projects } from "@/mocks/projects";
import { ProjectType } from "@/types";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type ClassOption = "all" | "genre" | "style" | "level";

const CLASS_FILTERS: Option<ClassOption>[] = [
  { id: "all", label: "All" },
  { id: "genre", label: "Genre", hasDropdown: true },
  { id: "style", label: "Style", hasDropdown: true },
  { id: "level", label: "Level", hasDropdown: true },
];

export default function Classes() {
  const [activeOption, setActiveOption] = useState<ClassOption>("all");

  const featuredClasses = projects.slice(0, 3);
  const upcomingClasses = projects.slice(3);

  const filteredUpcoming = useMemo(() => {
    if (activeOption === "all") {
      return upcomingClasses;
    }

    if (activeOption === "genre") {
      return upcomingClasses.filter((danceClass) => danceClass.genre);
    }

    if (activeOption === "style") {
      return upcomingClasses.filter((danceClass) => danceClass.style);
    }

    if (activeOption === "level") {
      return upcomingClasses.filter((danceClass) => danceClass.level);
    }

    return upcomingClasses;
  }, [activeOption]);

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
          <ThemedText type="h4">You might like</ThemedText>
          {featuredClasses.length > 0 && (
            <Carousel
              data={featuredClasses}
              onBook={() => {}}
              onPlay={() => {}}
              onPress={(data: ProjectType) =>
                router.push(`/(tabs)/class/${data.id}`)
              }
            />
          )}
        </View>

        <View style={styles.section}>
          <ThemedText type="h4">Upcoming</ThemedText>
          <View style={styles.list}>
            {filteredUpcoming.map((danceClass) => (
              <Tile
                key={danceClass.id}
                imageSource={{ uri: danceClass.backgroundImage }}
                title={danceClass.songTitle}
                subtitle={danceClass.artist}
                metadata={`${danceClass.style} • ${danceClass.level}`}
                rightContent={
                  <>
                    <Avatar
                      source={{ uri: danceClass.instructor.imageUrl }}
                      shape="circle"
                      bordered
                    />
                    <ThemedText style={styles.highlight}>
                      {danceClass.spots - danceClass.books} spots left
                    </ThemedText>
                  </>
                }
                onPress={() => router.push(`/(tabs)/class/${danceClass.id}`)}
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
  highlight: {
    color: theme.colors.highlight,
    paddingTop: theme.gap(0.5),
  },
}));
