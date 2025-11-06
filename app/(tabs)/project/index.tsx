import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { ChipBar, Option } from "@/components/chip-bar";
import { ThemedText } from "@/components/themed-text";
import { Tile } from "@/components/tile";
import { IconSymbolName } from "@/components/ui/icon-symbol";
import { projects } from "@/mocks/projects";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type ProjectOption = "all" | "status" | "genre" | "style" | "level";

const PROJECT_FILTERS: Option<ProjectOption>[] = [
  { id: "all", label: "All" },
  { id: "status", label: "Status", hasDropdown: true },
  { id: "genre", label: "Genre", hasDropdown: true },
  { id: "style", label: "Style", hasDropdown: true },
  { id: "level", label: "Level", hasDropdown: true },
];

export default function Projects() {
  const [activeOption, setActiveOption] = useState<ProjectOption>("all");

  const thisWeekProjects = projects.slice(0, 2);
  const otherProjects = projects.slice(2);

  const filteredUpcoming = useMemo(() => {
    if (activeOption === "all") {
      return otherProjects;
    }

    if (activeOption === "genre") {
      return otherProjects.filter((project) => project.genre);
    }

    if (activeOption === "style") {
      return otherProjects.filter((project) => project.style);
    }

    if (activeOption === "level") {
      return otherProjects.filter((project) => project.level);
    }

    return otherProjects;
  }, [activeOption]);

  return (
    <View style={styles.container}>
      <ChipBar
        padding
        options={PROJECT_FILTERS}
        activeOption={activeOption}
        onPress={setActiveOption}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.section}>
          <ThemedText type="h4">This Week</ThemedText>
          <View style={styles.list}>
            {thisWeekProjects.map((project) => {
              let icon: IconSymbolName | undefined = undefined;
              let label = "";
              if (project.status === "public") {
                icon = "heart";
                label = project.likes.toString();
              }
              if (project.status === "released") {
                icon = "person.fill";
                label = `${project.books} | ${project.spots}`;
              }
              return (
                <Tile
                  key={project.id}
                  imageSource={{ uri: project.backgroundImage }}
                  title={project.songTitle}
                  subtitle={project.artist}
                  metadata={`${project.style} • ${project.level}`}
                  rightContent={
                    <>
                      <Chip type="highlight" icon={icon} label={label} />
                      <Chip type="light" label={project.status ?? ""} />
                    </>
                  }
                  onPress={() => router.push(`/(tabs)/project/${project.id}`)}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4">Projects</ThemedText>
          <View style={styles.list}>
            {otherProjects.map((project) => {
              let icon: IconSymbolName | undefined = undefined;
              let label = "";
              if (project.status === "public") {
                icon = "heart";
                label = project.likes.toString();
              }
              if (project.status === "released") {
                icon = "person.fill";
                label = `${project.books} | ${project.spots}`;
              }
              return (
                <Tile
                  key={project.id}
                  imageSource={{ uri: project.backgroundImage }}
                  title={project.songTitle}
                  subtitle={project.artist}
                  metadata={`${project.style} • ${project.level}`}
                  rightContent={
                    <>
                      <Chip type="highlight" icon={icon} label={label} />
                      <Chip type="light" label={project.status ?? ""} />
                    </>
                  }
                  onPress={() => router.push(`/(tabs)/project/${project.id}`)}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>

      <Button
        stickyBottom
        label="Create Project"
        onPress={() => router.push("/(tabs)/project/create")}
      />
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
}));
