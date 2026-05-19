import {
  Avatar,
  Boundary,
  ChipBar,
  ChipBarItemProps,
  Header,
  PassCard,
  SectionListView,
  ThemedText,
  Tile,
  Video,
} from "@/components";
import { BOOKING_ACTIVE_STATUSES, TEACHER_PROFILE_VIEW } from "@/constants";
import { useSuspenseInfiniteQuery, useSuspenseQuery } from "@/hooks";
import { supabase } from "@/supabase";
import {
  PassType,
  ProfileEnrichedType,
  ProjectEnrichedType,
  TeacherProfileViewType,
} from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const renderTile = (data: ProjectEnrichedType): React.ReactElement => (
  <Tile
    imageSource={data.artworkUrl ?? data.song.artworkUrl}
    title={data.song.name}
    subtitle={data.song.artistName}
    metadata={[data.style, data.level].filter(Boolean).join(" • ")}
    previewUrl={data.song.previewUrl}
    stats={data}
    onPress={() => router.dismissTo(`../classes/${data.id}`)}
  />
);

function TeacherProfileContent({ profileId }: { profileId: string }) {
  const [view, setView] = useState<TeacherProfileViewType>(
    TEACHER_PROFILE_VIEW.CLASSES,
  );

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

  const {
    data: passes,
    refetch: refetchPasses,
    isRefetching: isRefetchingPasses,
  } = useSuspenseQuery<PassType[]>({
    queryKey: ["classes", "profiles", profileId, "passes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("passes")
        .select("*")
        .eq("user_id", profileId)
        .eq("active", true)
        .throwOnError();
      return data ?? [];
    },
  });

  const renderPassCard = useCallback(
    (pass: PassType): React.ReactElement => <PassCard pass={pass} />,
    [],
  );

  const chipItems: ChipBarItemProps[] = [
    {
      label: "View",
      value: view,
      options: TEACHER_PROFILE_VIEW,
      modal: false,
      onValueChange: setView,
    },
  ];

  const listHeaderComponent = (
    <View style={styles.listHeader}>
      <View style={styles.profileHeader}>
        <Avatar
          source={profile.avatarUrl}
          size="large"
          shape="circle"
          bordered
        />
        <ThemedText type="h3">{profile.fullName}</ThemedText>
        {profile.bio && (
          <ThemedText
            type="h5"
            color="dimmed"
            numberOfLines={2}
            ellipsizeMode="tail"
            style={styles.bio}
          >
            {profile.bio}
          </ThemedText>
        )}
      </View>
      {profile.videoUrls && (
        <View style={styles.videoContainer}>
          {profile.videoUrls.map((video, index) => (
            <Video key={index} source={video} />
          ))}
        </View>
      )}
      <ChipBar items={chipItems} centered />
    </View>
  );

  const isClasses = view === TEACHER_PROFILE_VIEW.CLASSES;

  const sections = isClasses
    ? [{ title: "Classes", data: projects, render: renderTile }]
    : [{ title: "Passes", data: passes, render: renderPassCard }];

  const refetch = useCallback(() => {
    refetchProfile();
    if (isClasses) {
      refetchProjects();
    } else {
      refetchPasses();
    }
  }, [refetchProfile, refetchProjects, refetchPasses, isClasses]);

  const isRefetching =
    isRefetchingProfile ||
    (isClasses ? isRefetchingProjects : isRefetchingPasses);

  return (
    <SectionListView
      sections={sections}
      ListHeaderComponent={listHeaderComponent}
      hasNextPage={isClasses ? hasNextPage : false}
      fetchNextPage={isClasses ? fetchNextPage : undefined}
      refetch={refetch}
      isRefetching={isRefetching}
    />
  );
}

export default function TeacherProfile() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();

  return (
    <View style={styles.container}>
      <Header title="Profile" />
      <Boundary>
        <TeacherProfileContent profileId={profileId} />
      </Boundary>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
  listHeader: {
    gap: theme.gap(1),
    paddingBottom: theme.gap(1),
  },
  profileHeader: {
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
