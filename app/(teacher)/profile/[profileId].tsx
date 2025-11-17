import { Avatar } from "@/components/avatar";
import { Chip } from "@/components/chip";
import { Header } from "@/components/header";
import { SectionListView } from "@/components/section-list";
import { ThemedText } from "@/components/themed-text";
import { Tile } from "@/components/tile";
import { Video } from "@/components/video";
import { projects } from "@/mocks/projects";
import { users } from "@/mocks/users";
import { ProfileType, ProjectType } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Profile() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const profile = users.find((p) => p.id === Number(profileId));
  const classes = projects.filter((p) => p.teacher.id === Number(profileId));

  const renderProfile = (data: ProfileType): React.ReactElement => (
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

  const renderTile = (data: ProjectType): React.ReactElement => (
    <Tile
      imageSource={data.backgroundImage}
      title={data.songTitle}
      subtitle={data.artist}
      metadata={`${data.style} • ${data.level}`}
      rightContent={
        <>
          <Avatar source={data.teacher.avatarUrl} shape="circle" bordered />
          <Chip
            color="highlight"
            label={`${data.spots - data.books} spots left`}
          />
        </>
      }
      onPress={() => router.push(`/(student)/class/${data.id}`)}
    />
  );

  const sections: SectionListData<ProjectType | ProfileType | string[]>[] = [
    {
      data: [profile as ProfileType],
      render: renderProfile,
    },
    {
      data: [profile ? profile.videoUrls : []],
      render: renderVideos,
    },
    {
      title: "Classes",
      data: classes,
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
