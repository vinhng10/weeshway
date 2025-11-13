import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { ChipBar, ChipBarItemProps } from "@/components/chip-bar";
import { SectionListView } from "@/components/section-list";
import { Tile } from "@/components/tile";
import { IconSymbolName } from "@/components/ui/icon-symbol";
import { Genre, Level, ProjectStatus, Style } from "@/constants/options";
import { projects } from "@/mocks/projects";
import { ProjectType } from "@/types";
import { router } from "expo-router";
import { useState } from "react";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Projects() {
  const [status, setStatus] = useState<string>(ProjectStatus.Private);
  const [genre, setGenre] = useState<string>("");
  const [style, setStyle] = useState<string>("");
  const [level, setLevel] = useState<string>("");

  const filters: ChipBarItemProps[] = [
    {
      label: "Status",
      value: status,
      options: ProjectStatus,
      modal: true,
      onValueChange: setStatus,
    },
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
            <Chip color="highlight" icon={icon} label={label} />
            <Chip color="light" label={data.status ?? ""} />
          </>
        }
        onPress={() => router.push(`/(teacher)/project/${data.id}`)}
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
      <ChipBar padding items={filters} />
      <SectionListView sections={sections} />

      <Button
        stickyBottom
        label="Create Project"
        onPress={() => router.push("/(teacher)/project/create")}
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
