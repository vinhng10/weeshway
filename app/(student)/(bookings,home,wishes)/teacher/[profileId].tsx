import {
  Avatar,
  Boundary,
  Header,
  SectionListView,
  ThemedText,
  Tile,
  Video,
} from "@/components";
import { BOOKING_ACTIVE_STATUSES } from "@/constants";
import { useSuspenseInfiniteQuery, useSuspenseQuery } from "@/hooks";
import { supabase } from "@/supabase";
import { ProfileEnrichedType, ProjectEnrichedType } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function TeacherProfileContent() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();

  const {
    data: profile,
    refetch: refetchProfile,
    isRefetching: isRefetchingProfile,
  } = useSuspenseQuery<ProfileEnrichedType>({
    queryKey: ["classes", "profiles", profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select(`*`)
        .eq("id", profileId)
        .single()
        .throwOnError();
      return data;
    },
  });

  const {
    data: projects,
    hasNextPage,
    fetchNextPage,
    refetch: refetchProjects,
    isRefetching: isRefetchingProjects,
  } = useSuspenseInfiniteQuery<ProjectEnrichedType>({
    queryKey: ["classes", "profiles", profileId, "projects"],
    tableName: "projects",
    columns: `
      *, 
      song:songs(id, name, artist_name, preview_url, artwork_url),
      bookings:bookings(*), 
      watchings:watchings(*)
    `,
    trailingQuery: (query) =>
      query
        .eq("user_id", profileId)
        .in("bookings.status", BOOKING_ACTIVE_STATUSES)
        .or(`start_at.gte.${new Date().toISOString()},start_at.is.null`),
  });

  const renderProfile = useCallback(
    (data: ProfileEnrichedType): React.ReactElement => (
      <View style={styles.header}>
        <Avatar source={data.avatarUrl} size="large" shape="circle" bordered />
        <ThemedText type="h3">{data.fullName}</ThemedText>
        {data.bio && (
          <ThemedText
            type="h5"
            color="dimmed"
            numberOfLines={2}
            ellipsizeMode="tail"
            style={styles.bio}
          >
            {data.bio}
          </ThemedText>
        )}
      </View>
    ),
    [],
  );

  const renderVideos = useCallback(
    (data: string[]): React.ReactElement => (
      <View style={styles.videoContainer}>
        {data.map((video: string, index: number) => (
          <Video key={index} source={video} />
        ))}
      </View>
    ),
    [],
  );

  const renderTile = useCallback(
    (data: ProjectEnrichedType): React.ReactElement => (
      <Tile
        imageSource={data.artworkUrl ?? data.song.artworkUrl}
        title={data.song.name}
        subtitle={data.song.artistName}
        metadata={[data.style, data.level].filter(Boolean).join(" • ")}
        previewUrl={data.song.previewUrl}
        stats={data}
        onPress={() => router.dismissTo(`../classes/${data.id}`)}
      />
    ),
    [],
  );

  const videoData = useMemo(
    () => (profile.videoUrls ? [profile.videoUrls] : []),
    [profile.videoUrls],
  );

  const sections = [
    {
      data: [profile],
      render: renderProfile,
    },
    {
      data: videoData,
      render: renderVideos,
    },
    {
      title: "Classes",
      data: projects,
      render: renderTile,
    },
  ];

  const refetch = useCallback(() => {
    refetchProfile();
    refetchProjects();
  }, [refetchProfile, refetchProjects]);

  return (
    <SectionListView
      sections={sections}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      refetch={refetch}
      isRefetching={isRefetchingProfile || isRefetchingProjects}
    />
  );
}

export default function TeacherProfile() {
  return (
    <View style={styles.container}>
      <Header title="Profile" />
      <Boundary>
        <TeacherProfileContent />
      </Boundary>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignSelf: "center",
    alignItems: "center",
    textAlign: "center",
    width: "70%",
    gap: theme.gap(0.2),
  },
  bio: {
    textAlign: "center",
  },
  videoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.gap(1),
  },
}));
