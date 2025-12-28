import { Avatar } from "@/components/avatar";
import { Boundary } from "@/components/boundary";
import { Carousel } from "@/components/carousel";
import { ChipBar, ChipBarItemProps } from "@/components/chip-bar";
import { ProjectStatus } from "@/components/project-status";
import { SectionListView } from "@/components/section-list";
import { Tile } from "@/components/tile";
import {
  LevelEnum,
  ProjectStatusEnum,
  StripePaymentStatusEnum,
  StyleEnum,
} from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { useSuspenseInfiniteQuery } from "@/hooks/useSuspenseInfiniteQuery";
import { useSuspenseQuery } from "@/hooks/useSuspenseQuery";
import { supabase } from "@/supabase";
import { ProjectEnrichedType } from "@/types";
import { router } from "expo-router";
import { useState } from "react";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function ClassesContent() {
  const [status, setStatus] = useState<ProjectStatusEnum>();
  const [style, setStyle] = useState<StyleEnum>();
  const [level, setLevel] = useState<LevelEnum>();
  const profile = useAuth((state) => state.profile);

  const { data: recommendations } = useSuspenseQuery<ProjectEnrichedType[][]>({
    queryKey: ["classes", "recommendations", status, style, level],
    queryFn: async () => {
      let query = supabase
        .from("recommendations")
        .select(
          `*, 
          project:projects!inner(
            *, 
            profile:profiles(*), 
            song:songs(*), 
            location:locations(*),
            bookings:bookings(*)
          )`
        )
        .eq("user_id", profile?.id)
        .eq("project.bookings.status", StripePaymentStatusEnum.Succeeded)
        .limit(10);

      if (style) {
        query = query.eq("project.style", style);
      }
      if (level) {
        query = query.eq("project.level", level);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data.length > 0
        ? [data.map((recommendation) => recommendation.project)]
        : [];
    },
  });

  const {
    data: projects,
    hasNextPage,
    fetchNextPage,
  } = useSuspenseInfiniteQuery<ProjectEnrichedType>({
    queryKey: ["classes", "projects", status, style, level],
    tableName: "projects",
    columns: `*, profile:profiles(*), song:songs(*), bookings:bookings(*)`,
    pageSize: 10,
    trailingQuery: (query) => {
      query = query.gte("start_at", new Date().toISOString());
      query = query.neq("status", ProjectStatusEnum.Cancel);
      query = query.eq("bookings.status", StripePaymentStatusEnum.Succeeded);
      if (status) {
        query = query.eq("status", status);
      }
      if (style) {
        query = query.eq("style", style);
      }
      if (level) {
        query = query.eq("level", level);
      }
      return query;
    },
  });

  const options: ChipBarItemProps[] = [
    {
      label: "Status",
      value: status,
      options: ProjectStatusEnum,
      modal: true,
      onValueChange: setStatus,
    },
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
    <Carousel data={data} />
  );

  const renderTile = (data: ProjectEnrichedType): React.ReactElement => (
    <Tile
      imageSource={data.song.artworkUrl}
      title={data.song.name}
      subtitle={data.song.artistName}
      metadata={`${data.style} • ${data.level}`}
      previewUrl={data.song.previewUrl}
      rightContent={
        <>
          <Avatar source={data.profile.avatarUrl} shape="circle" bordered />
          <ProjectStatus data={data} />
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
      data: recommendations,
      render: renderCarousel,
    },
    {
      title: "Upcoming",
      data: projects,
      render: renderTile,
    },
  ];

  return (
    <View style={styles.container}>
      <ChipBar padding items={options} />
      <SectionListView
        sections={sections}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
      />
    </View>
  );
}

export default function Classes() {
  return (
    <Boundary>
      <ClassesContent />
    </Boundary>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
  },
}));
