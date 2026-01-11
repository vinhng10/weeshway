import {
  Avatar,
  AvatarGroup,
  Boundary,
  Button,
  Chip,
  ChipBar,
  ChipBarItemProps,
  ProjectStatus,
  SectionListView,
  Tile,
} from "@/components";
import {
  LEVEL,
  PROJECT_STATUS,
  STRIPE_PAYMENT_STATUS,
  STYLE,
  WISH_STATUS,
  WISH_WATCH,
} from "@/constants";
import { useAuth, useSuspenseInfiniteQuery } from "@/hooks";
import {
  LevelType,
  ProjectEnrichedType,
  ProjectStatusType,
  StyleType,
  WatchingEnrichedType,
  WishRecommendationEnrichedType,
  WishStatusType,
  WishWatchType,
} from "@/types";
import { router } from "expo-router";
import { useState } from "react";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface WishesContentProps {
  status?: WishStatusType;
  style?: StyleType;
  level?: LevelType;
}

interface WatchingsContentProps {
  status?: ProjectStatusType;
  style?: StyleType;
  level?: LevelType;
}

function WishesContent({ status, style, level }: WishesContentProps) {
  const profile = useAuth((state) => state.profile);

  const { data, hasNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery<WishRecommendationEnrichedType>({
      queryKey: ["wishes", "recommendations", status, style, level],
      tableName: "wishes",
      columns: `
        *, 
        song:songs(*), 
        recommendations:recommendations(
          project:projects(
            profile:profiles(avatar_url)
          )
        )
      `,
      pageSize: 10,
      trailingQuery: (query) => {
        query = query.eq("user_id", profile?.id);
        if (style) query = query.eq("style", style);
        if (level) query = query.eq("level", level);
        return query;
      },
    });

  const renderTile = (
    data: WishRecommendationEnrichedType
  ): React.ReactElement => (
    <Tile
      imageSource={data.song.artworkUrl}
      title={data.song.name}
      subtitle={data.song.artistName}
      metadata={`${data.style} • ${data.level}`}
      previewUrl={data.song.previewUrl}
      backgroundColor={data.status}
      rightContent={
        data.recommendations &&
        data.recommendations.length > 0 && (
          <>
            <AvatarGroup
              max={2}
              avatars={[
                ...new Set(
                  data.recommendations
                    .map((r) => r.project.profile.avatarUrl)
                    .filter((url): url is string => url !== undefined)
                ),
              ]}
            />
            <Chip color="light" label={data.status} />
          </>
        )
      }
      onPress={() => router.push(`/(student)/wishes/${data.id}`)}
    />
  );

  const sections: SectionListData<WishRecommendationEnrichedType>[] = [
    {
      title: "Wishes",
      data: data.map((wish) => ({
        ...wish,
        status:
          wish.recommendations.length > 0
            ? WISH_STATUS.CLASS_AVAILABLE
            : WISH_STATUS.WAITING,
      })),
      render: renderTile,
    },
  ];

  return (
    <>
      <SectionListView
        sections={sections}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
      />
      <Button
        stickyBottom
        label="Make A Wish"
        onPress={() => {
          router.push("/(student)/wishes/create");
        }}
      />
    </>
  );
}

function WatchingsContent({ status, style, level }: WatchingsContentProps) {
  const profile = useAuth((state) => state.profile);

  const {
    data: watchings,
    hasNextPage,
    fetchNextPage,
  } = useSuspenseInfiniteQuery<WatchingEnrichedType>({
    queryKey: ["watchings", "projects", status, style, level],
    tableName: "watchings",
    columns: `
      project:projects(
        *, 
        profile:profiles(*), 
        song:songs(*),
        bookings:bookings(*), 
        watchings:watchings(*)
      )
    `,
    pageSize: 10,
    trailingQuery: (query) => {
      query = query
        .eq("user_id", profile?.id)
        .eq("project.bookings.status", STRIPE_PAYMENT_STATUS.SUCCEEDED);
      if (status) query = query.eq("project.status", status);
      if (style) query = query.eq("project.style", style);
      if (level) query = query.eq("project.level", level);
      return query;
    },
  });

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

  const sections: SectionListData<ProjectEnrichedType>[] = [
    {
      title: "Watchings",
      data: watchings.map((watching) => watching.project),
      render: renderTile,
    },
  ];

  return (
    <SectionListView
      sections={sections}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
    />
  );
}

export default function Wishes() {
  const [type, setType] = useState<WishWatchType>(WISH_WATCH.WISH);
  const [wishStatus, setWishStatus] = useState<WishStatusType>();
  const [projectStatus, setProjectStatus] = useState<ProjectStatusType>();
  const [style, setStyle] = useState<StyleType>();
  const [level, setLevel] = useState<LevelType>();

  const options: ChipBarItemProps[] = [
    {
      label: "Type",
      value: type,
      options: WISH_WATCH,
      modal: false,
      onValueChange: setType,
    },
    {
      label: "Status",
      value: type === WISH_WATCH.WISH ? wishStatus : projectStatus,
      modal: true,
      options: type === WISH_WATCH.WISH ? WISH_STATUS : PROJECT_STATUS,
      onValueChange:
        type === WISH_WATCH.WISH ? setWishStatus : setProjectStatus,
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

  return (
    <View style={styles.container}>
      <ChipBar padding items={options} />
      <Boundary>
        {type === WISH_WATCH.WISH ? (
          <WishesContent status={wishStatus} style={style} level={level} />
        ) : (
          <WatchingsContent
            status={projectStatus}
            style={style}
            level={level}
          />
        )}
      </Boundary>
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
