import { Avatar } from "@/components/avatar";
import { Boundary } from "@/components/boundary";
import { Chip } from "@/components/chip";
import { Header } from "@/components/header";
import { SectionListView } from "@/components/section-list";
import { ThemedText } from "@/components/themed-text";
import { Tile } from "@/components/tile";
import { IconSymbolName } from "@/components/ui/icon-symbol";
import { Video } from "@/components/video";
import { ProjectStatusEnum } from "@/constants";
import { useSuspenseQuery } from "@/hooks/useSuspenseQuery";
import { supabase } from "@/supabase";
import { ProfileEnrichedType, ProjectEnrichedType } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function TeacherProfileContent() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();

  const { data } = useSuspenseQuery<ProfileEnrichedType>({
    queryKey: ["profiles", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`*, projects(*, song:songs(*))`)
        .eq("id", profileId)
        .single();

      if (error) throw error;
      return data;
    },
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
    if (data.status === ProjectStatusEnum.Draft) {
      icon = "heart";
      label = `10`;
    }
    if (data.status === ProjectStatusEnum.Release) {
      icon = "person.fill";
      label = `${data.spots}`;
    }
    return (
      <Tile
        imageSource={data.song.artworkUrl}
        title={data.song.name || data.name || ""}
        subtitle={data.song.artistName}
        metadata={`${data.style} • ${data.level}`}
        rightContent={
          <>{icon && <Chip color="highlight" icon={icon} label={label} />}</>
        }
        onPress={() => router.push(`/(tabs)/class/${data.id}`)}
      />
    );
  };

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
