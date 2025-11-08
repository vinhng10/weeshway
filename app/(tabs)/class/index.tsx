import { Avatar } from "@/components/avatar";
import { Carousel } from "@/components/carousel";
import { Chip } from "@/components/chip";
import { ChipBar, Option } from "@/components/chip-bar";
import { SectionListView } from "@/components/section-list";
import { Tile } from "@/components/tile";
import { projects } from "@/mocks/projects";
import { ProjectType } from "@/types";
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

export default function Classes() {
  const [activeOption, setActiveOption] = useState<ClassOption>("all");

  const navigateToClass = (id: number) => router.push(`/(tabs)/class/${id}`);

  const renderCarousel = (data: ProjectType[]): React.ReactElement => (
    <Carousel
      data={data}
      onBook={() => {}}
      onPlay={() => {}}
      onPress={(data: ProjectType) => navigateToClass(data.id)}
    />
  );

  const renderTile = (data: ProjectType): React.ReactElement => (
    <Tile
      imageSource={data.backgroundImage}
      title={data.songTitle}
      subtitle={data.artist}
      metadata={`${data.style} • ${data.level}`}
      rightContent={
        <>
          <Avatar source={data.instructor.imageUrl} shape="circle" bordered />
          <Chip
            type="highlight"
            label={`${data.spots - data.books} spots left`}
          />
        </>
      }
      onPress={() => navigateToClass(data.id)}
    />
  );

  const sections: SectionListData<ProjectType | ProjectType[]>[] = [
    {
      title: "You might like",
      data: [projects.slice(0, 3)],
      render: renderCarousel,
    },
    {
      title: "Upcoming",
      data: projects.slice(3),
      render: renderTile,
    },
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
