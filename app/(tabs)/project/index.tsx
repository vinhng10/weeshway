import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { ChipBar, Option } from "@/components/chip-bar";
import { SectionListView } from "@/components/section-list";
import { Tile } from "@/components/tile";
import { IconSymbolName } from "@/components/ui/icon-symbol";
import { projects } from "@/mocks/projects";
import { ProjectType } from "@/types";
import { router } from "expo-router";
import { useState } from "react";
import { SectionListData, View } from "react-native";
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

  const renderTile = (data: ProjectType): React.ReactElement => {
    let icon: IconSymbolName | undefined = undefined;
    let label = "";
    if (data.status === "public") {
      icon = "heart";
      label = data.likes.toString();
    }
    if (data.status === "released") {
      icon = "person.fill";
      label = `${data.books} | ${data.spots}`;
    }
    return (
      <Tile
        imageSource={data.backgroundImage}
        title={data.songTitle}
        subtitle={data.artist}
        metadata={`${data.style} • ${data.level}`}
        rightContent={
          <>
            <Chip type="highlight" icon={icon} label={label} />
            <Chip type="light" label={data.status ?? ""} />
          </>
        }
        onPress={() => router.push(`/(tabs)/project/${data.id}`)}
      />
    );
  };

  const sections: SectionListData<ProjectType>[] = [
    {
      title: "This Week",
      data: thisWeekProjects,
      render: renderTile,
    },
    {
      title: "Projects",
      data: otherProjects,
      render: renderTile,
    },
  ];

  return (
    <View style={styles.container}>
      <ChipBar
        padding
        options={PROJECT_FILTERS}
        activeOption={activeOption}
        onPress={setActiveOption}
      />
      <SectionListView sections={sections} />

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
}));
