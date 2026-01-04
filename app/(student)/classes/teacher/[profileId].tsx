import {
  Avatar,
  Boundary,
  Header,
  ProjectStatus,
  SectionListView,
  ThemedText,
  Tile,
  Video,
} from "@/components";
import { STRIPE_PAYMENT_STATUS } from "@/constants";
import { useSuspenseInfiniteQuery, useSuspenseQuery } from "@/hooks";
import { supabase } from "@/supabase";
import { ProfileEnrichedType, ProjectEnrichedType } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function TeacherProfileContent() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();

  const { data: profile } = useSuspenseQuery<ProfileEnrichedType>({
    queryKey: ["classes", "profiles", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`*`)
        .eq("id", profileId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const {
    data: projects,
    hasNextPage,
    fetchNextPage,
  } = useSuspenseInfiniteQuery<ProjectEnrichedType>({
    queryKey: ["classes", "profiles", profileId, "projects"],
    tableName: "projects",
    columns: `*, song:songs(*), bookings:bookings(*)`,
    pageSize: 10,
    trailingQuery: (query) =>
      query
        .eq("user_id", profileId)
        .eq("bookings.status", STRIPE_PAYMENT_STATUS.SUCCEEDED)
        .gte("start_at", new Date().toISOString()),
  });

  const renderProfile = (data: ProfileEnrichedType): React.ReactElement => (
    <View style={styles.header}>
      <Avatar source={data.avatarUrl} size="large" shape="circle" bordered />
      <ThemedText type="h3" style={styles.text}>
        {data.fullName}
      </ThemedText>
      <ThemedText
        color="dimmed"
        numberOfLines={2}
        ellipsizeMode="tail"
        style={styles.text}
      >
        {data.bio}
      </ThemedText>
    </View>
  );

  const renderVideos = (data: string[]): React.ReactElement => (
    <View style={styles.videoContainer}>
      {data.map((video: string, index: number) => (
        <Video key={`${video}-${index}`} source={video} />
      ))}
    </View>
  );

  const renderTile = (data: ProjectEnrichedType): React.ReactElement => (
    <Tile
      imageSource={data.song.artworkUrl}
      title={data.song.name || data.name || ""}
      subtitle={data.song.artistName}
      metadata={`${data.style} • ${data.level}`}
      rightContent={<ProjectStatus data={data} />}
      onPress={() => router.push(`/(student)/classes/${data.id}`)}
    />
  );

  const sections: SectionListData<
    ProfileEnrichedType | ProjectEnrichedType | string[]
  >[] = [
    {
      data: [profile],
      render: renderProfile,
    },
    {
      data: profile.videoUrls ? [profile.videoUrls] : [],
      render: renderVideos,
    },
    {
      title: "Classes",
      data: projects,
      render: renderTile,
    },
  ];

  return (
    <View style={styles.container}>
      <Header title="Profile" />
      <SectionListView
        sections={sections}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
      />
    </View>
  );
}

export default function TeacherProfile() {
  return (
    <Boundary>
      <TeacherProfileContent />
    </Boundary>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: "center",
    gap: theme.gap(1),
  },
  videoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.gap(1),
  },
  text: {
    textAlign: "center",
  },
}));
