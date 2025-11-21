import { Avatar } from "@/components/avatar";
import { Chip } from "@/components/chip";
import { Header } from "@/components/header";
import { SectionListView } from "@/components/section-list";
import { ThemedText } from "@/components/themed-text";
import { Tile } from "@/components/tile";
import { IconSymbolName } from "@/components/ui/icon-symbol";
import { Video } from "@/components/video";
import { ProjectStatusEnum } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabase";
import { ProfileEnrichedType, ProjectEnrichedType } from "@/types";
import { useQuery } from "@tanstack/react-query";
import camelcaseKeys from "camelcase-keys";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function TeacherProfile() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const profile = useAuth((state) => state.profile);
  const isLoggedIn = useAuth((state) => state.isLoggedIn);

  const { data, isPending, error } = useQuery<ProfileEnrichedType>({
    queryKey: ["profiles", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`*, projects(*, songs(*))`)
        .eq("id", profileId)
        .single();

      if (error) throw error;
      if (!data) return null;

      const result = camelcaseKeys(data, { deep: true });
      return result;
    },
    enabled: isLoggedIn && !!profile && !!profileId,
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

  const renderTile = (data: ProjectEnrichedType): React.ReactElement => {
    let icon: IconSymbolName | undefined = undefined;
    let label = "";
    if (data.status === ProjectStatusEnum.Public) {
      icon = "heart";
      label = `10`;
    }
    if (data.status === ProjectStatusEnum.Release) {
      icon = "person.fill";
      label = `${data.spots}`;
    }
    return (
      <Tile
        imageSource={data.songs?.artworkUrl}
        title={data.songs?.name || data.name || ""}
        subtitle={data.songs?.artistName}
        metadata={`${data.style} • ${data.level}`}
        rightContent={
          <>{icon && <Chip color="highlight" icon={icon} label={label} />}</>
        }
        onPress={() => router.push(`/(student)/class/${data.id}`)}
      />
    );
  };

  if (isPending) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <Header title="Profile" />
        <ThemedText>Profile not found</ThemedText>
      </View>
    );
  }

  const sections: SectionListData<
    ProfileEnrichedType | ProjectEnrichedType | string[]
  >[] = [
    {
      data: [data],
      render: renderProfile,
    },
    {
      data: [data.videoUrls || []],
      render: renderVideos,
    },
    {
      title: "Classes",
      data: data?.projects || [],
      render: renderTile,
    },
  ];

  return (
    <View style={styles.container}>
      <Header title="Profile" />
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
