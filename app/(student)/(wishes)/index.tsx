import {
  Avatar,
  AvatarGroup,
  Boundary,
  Button,
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
  WishWatchType,
} from "@/types";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface WishesContentProps {
  style?: StyleType;
  level?: LevelType;
}

interface WatchingsContentProps {
  status?: ProjectStatusType;
  style?: StyleType;
  level?: LevelType;
}

function WishesContent({ style, level }: WishesContentProps) {
  const profile = useAuth((state) => state.profile);

  const { data, hasNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery<WishRecommendationEnrichedType>({
      queryKey: ["wishes", "recommendations", style, level],
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
      avatar={
        data.recommendations &&
        data.recommendations.length > 0 && (
          <View style={styles.avatarGroup}>
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
          </View>
        )
      }
      onPress={() => router.navigate(`/(student)/(wishes)/${data.id}`)}
    />
  );

  const { wishesWithClass, otherWishes } = useMemo(() => {
    const wishesWithClass: WishRecommendationEnrichedType[] = [];
    const otherWishes: WishRecommendationEnrichedType[] = [];

    for (const wish of data) {
      const hasClassAvailable = wish.recommendations.length > 0;
      const enrichedWish = {
        ...wish,
        status: hasClassAvailable
          ? WISH_STATUS.CLASS_AVAILABLE
          : WISH_STATUS.WAITING,
      };

      if (hasClassAvailable) {
        wishesWithClass.push(enrichedWish);
      } else {
        otherWishes.push(enrichedWish);
      }
    }

    return { wishesWithClass, otherWishes };
  }, [data]);

  const sections: SectionListData<WishRecommendationEnrichedType>[] = [
    {
      title: "Class Available",
      data: wishesWithClass,
      render: renderTile,
    },
    {
      title: "Wishes",
      data: otherWishes,
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
          router.navigate("/(student)/(wishes)/create");
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
      avatar={
        <Avatar source={data.profile.avatarUrl} shape="circle" bordered />
      }
      status={<ProjectStatus data={data} />}
      onPress={() => router.navigate(`/(student)/(wishes)/classes/${data.id}`)}
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
      value: projectStatus,
      modal: true,
      options: PROJECT_STATUS,
      onValueChange: setProjectStatus,
      enabled: type === WISH_WATCH.WATCHING,
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
          <WishesContent style={style} level={level} />
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
  avatarGroup: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
}));
