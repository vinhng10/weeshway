import { Avatar } from "@/components/avatar";
import { Carousel } from "@/components/carousel";
import { Chip } from "@/components/chip";
import { ChipBar, ChipBarItemProps } from "@/components/chip-bar";
import { SectionListView } from "@/components/section-list";
import { Tile } from "@/components/tile";
import { Genre, Level, Style } from "@/constants/options";
import { projects } from "@/mocks/projects";
import { ProjectType } from "@/types";
import { router } from "expo-router";
import { useState } from "react";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Classes() {
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

  const navigateToClass = (id: number) => router.push(`/(student)/class/${id}`);

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
          <Avatar source={data.teacher.imageUrl} shape="circle" bordered />
          <Chip
            color="highlight"
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
