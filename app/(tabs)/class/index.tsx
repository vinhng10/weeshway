import { Avatar } from "@/components/avatar";
import { ClassCarousel } from "@/components/carousel";
import { FilterBar, FilterOption } from "@/components/filter-bar";
import { ThemedText } from "@/components/themed-text";
import { Tile } from "@/components/tile";
import { featuredClasses, upcomingClasses } from "@/mocks/classes";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type ClassFilter = "all" | "genre" | "style" | "level";

const CLASS_FILTERS: FilterOption<ClassFilter>[] = [
  { id: "all", label: "All" },
  { id: "genre", label: "Genre", hasDropdown: true },
  { id: "style", label: "Style", hasDropdown: true },
  { id: "level", label: "Level", hasDropdown: true },
];

export default function Classes() {
  const [activeFilter, setActiveFilter] = useState<ClassFilter>("all");

  const featured = useMemo(() => featuredClasses, []);

  const filteredUpcoming = useMemo(() => {
    if (activeFilter === "all") {
      return upcomingClasses;
    }

    if (activeFilter === "genre") {
      return upcomingClasses.filter((danceClass) => danceClass.genre);
    }

    if (activeFilter === "style") {
      return upcomingClasses.filter((danceClass) => danceClass.style);
    }

    if (activeFilter === "level") {
      return upcomingClasses.filter((danceClass) => danceClass.level);
    }

    return upcomingClasses;
  }, [activeFilter]);

  return (
    <View style={styles.container}>
      <FilterBar
        filters={CLASS_FILTERS}
        activeFilter={activeFilter}
        onFilterPress={setActiveFilter}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.section}>
          <ThemedText bold type="h4">
            You might like
          </ThemedText>
          {featured.length > 0 && (
            <ClassCarousel
              classes={featured}
              onBook={() => {}}
              onPlay={() => {}}
            />
          )}
        </View>

        <View style={styles.section}>
          <ThemedText bold type="h4">
            Upcoming
          </ThemedText>
          <View style={styles.upcomingList}>
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
                    <ThemedText bold style={styles.highlight}>
                      {danceClass.spotsLeft} spots left
                    </ThemedText>
                  </>
                }
                onPress={() => {}}
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
  contentContainer: {
    gap: theme.gap(1),
    padding: theme.gap(2),
  },
  section: {
    gap: theme.gap(1),
  },
  upcomingList: {
    gap: theme.gap(1),
  },
  highlight: {
    color: theme.colors.highlight,
    paddingTop: theme.gap(0.5),
  },
}));
