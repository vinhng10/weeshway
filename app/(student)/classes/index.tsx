import {
  Avatar,
  Boundary,
  Carousel,
  ChipBar,
  ChipBarItemProps,
  LocationPermission,
  ProjectStatus,
  SectionListView,
  Tile,
} from "@/components";
import {
  LEVEL,
  PROJECT_STATUS,
  STRIPE_PAYMENT_STATUS,
  STYLE,
} from "@/constants";
import { useAuth, useSuspenseInfiniteRpc, useSuspenseQuery } from "@/hooks";
import { supabase } from "@/supabase";
import {
  LevelType,
  ProjectEnrichedType,
  ProjectStatusType,
  StyleType,
} from "@/types";
import { router } from "expo-router";
import { useState } from "react";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function ClassesContent() {
  const [status, setStatus] = useState<ProjectStatusType>();
  const [style, setStyle] = useState<StyleType>();
  const [level, setLevel] = useState<LevelType>();
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
        .eq("project.bookings.status", STRIPE_PAYMENT_STATUS.SUCCEEDED)
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
  } = useSuspenseInfiniteRpc<ProjectEnrichedType>({
    queryKey: ["classes", "projects", status, style, level],
    rpcFunction: "get_nearby_classes",
    columns: `*, profile:profiles(*), song:songs(*), bookings:bookings(*)`,
    pageSize: 10,
    trailingQuery: (query) => {
      query = query
        .or(`start_at.is.null,start_at.gte.${new Date().toISOString()}`)
        .neq("status", PROJECT_STATUS.CANCEL)
        .eq("bookings.status", STRIPE_PAYMENT_STATUS.SUCCEEDED);
      if (status) query = query.eq("status", status);
      if (style) query = query.eq("style", style);
      if (level) query = query.eq("level", level);
      return query;
    },
  });

  const options: ChipBarItemProps[] = [
    {
      label: "Status",
      value: status,
      options: PROJECT_STATUS,
      modal: true,
      onValueChange: setStatus,
    },
    {
      label: "Style",
      value: style,
      options: STYLE,
      modal: true,
      onValueChange: setStyle,
    },
    {
      label: "Level",
      value: level,
      options: LEVEL,
      modal: true,
      onValueChange: setLevel,
    },
  ];

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
      onPress={() => router.push(`/(student)/classes/${data.id}`)}
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
      <LocationPermission />
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
