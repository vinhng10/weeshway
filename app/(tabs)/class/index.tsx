import { Avatar } from "@/components/avatar";
import { Carousel } from "@/components/carousel";
import { Chip } from "@/components/chip";
import { ChipBar, ChipBarItemProps } from "@/components/chip-bar";
import { SectionListView } from "@/components/section-list";
import { Tile } from "@/components/tile";
import { LevelEnum, StyleEnum } from "@/constants";
import { useQuery } from "@/hooks/useQuery";
import { supabase } from "@/supabase";
import { ProjectEnrichedType } from "@/types";
import { router } from "expo-router";
import { useState } from "react";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Classes() {
  const [style, setStyle] = useState<StyleEnum | undefined>();
  const [level, setLevel] = useState<LevelEnum | undefined>();

  const { data, isPending, error } = useQuery<ProjectEnrichedType[]>({
    queryKey: ["projects", style, level],
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select(`*, profile:profiles(*), song:songs(*), location:locations(*)`);

      if (style) {
        query = query.eq("style", style);
      }
      if (level) {
        query = query.eq("level", level);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data;
    },
  });

  const options: ChipBarItemProps[] = [
    {
      label: "Style",
      value: style,
      options: StyleEnum,
      modal: true,
      onValueChange: setStyle,
    },
    {
      label: "Level",
      value: level,
      options: LevelEnum,
      modal: true,
      onValueChange: setLevel,
    },
  ];

  const navigateToClass = (id: number) => router.push(`/(tabs)/class/${id}`);

  const renderCarousel = (data: ProjectEnrichedType[]): React.ReactElement => (
    <Carousel
      data={data}
      onBook={() => {}}
      onPress={(data: ProjectEnrichedType) => navigateToClass(data.id)}
    />
  );

  const renderTile = (data: ProjectEnrichedType): React.ReactElement => (
    <Tile
      imageSource={data.song.artworkUrl}
      title={data.song.name}
      subtitle={data.song.artistName}
      metadata={`${data.style} • ${data.level}`}
      rightContent={
        <>
          <Avatar source={data.profile.avatarUrl} shape="circle" bordered />
          <Chip color="highlight" label={`${data.spots} spots left`} />
        </>
      }
      onPress={() => navigateToClass(data.id)}
    />
  );

  const sections: SectionListData<
    ProjectEnrichedType | ProjectEnrichedType[]
  >[] = [
    {
      title: "You might like",
      data: [data?.slice(0, 2) ?? []],
      render: renderCarousel,
    },
    {
      title: "Upcoming",
      data: data?.slice(2) ?? [],
      render: renderTile,
    },
  ];

  return (
    <View style={styles.container}>
      <ChipBar padding items={options} />
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
