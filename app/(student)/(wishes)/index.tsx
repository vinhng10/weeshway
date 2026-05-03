import {
  Boundary,
  Button,
  ChipBar,
  ChipBarItemProps,
  NotificationsPermission,
  Search,
  SectionListView,
  Tile,
} from "@/components";
import {
  BOOKING_ACTIVE_STATUSES,
  LEVEL,
  PROJECT_STATUS,
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
import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
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

  const { data, hasNextPage, fetchNextPage, refetch, isRefetching } =
    useSuspenseInfiniteQuery<WishRecommendationEnrichedType>({
      queryKey: ["wishes", "recommendations", style, level],
      tableName: "wishes",
      columns: `
        *,
        song:songs(id, name, artist_name, preview_url, artwork_url),
        recommendations:recommendations(
          project:projects(
            profile:profiles(avatar_url)
          )
        )
      `,
      trailingQuery: (query) => {
        query = query.eq("user_id", profile?.id);
        if (style) query = query.eq("style", style);
        if (level) query = query.eq("level", level);
        return query;
      },
    });

  const renderTile = useCallback(
    (data: WishRecommendationEnrichedType): React.ReactElement => (
      <Tile
        imageSource={data.song.artworkUrl}
        title={data.song.name}
        subtitle={data.song.artistName}
        metadata={[data.style, data.level].filter(Boolean).join(" • ")}
        previewUrl={data.song.previewUrl}
        avatars={data.recommendations
          ?.map((r) => r.project.profile.avatarUrl)
          .filter((url): url is string => url !== undefined)}
        onPress={() => router.navigate(`./wishes/${data.id}`)}
      />
    ),
    [],
  );

  const { wishesWithClass, otherWishes } = useMemo(() => {
    const wishesWithClass: WishRecommendationEnrichedType[] = [];
    const otherWishes: WishRecommendationEnrichedType[] = [];

    for (const wish of data) {
      const hasClassRecommended = wish.recommendations.length > 0;
      const enrichedWish = {
        ...wish,
        status: hasClassRecommended
          ? WISH_STATUS.CLASS_RECOMMENDED
          : WISH_STATUS.WAITING,
      };

      if (hasClassRecommended) {
        wishesWithClass.push(enrichedWish);
      } else {
        otherWishes.push(enrichedWish);
      }
    }

    return { wishesWithClass, otherWishes };
  }, [data]);

  const sections = [
    {
      title: "Class recommended",
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
        refetch={refetch}
        isRefetching={isRefetching}
      />
      <Button
        position="stickyBottom"
        label="Make A Wish"
        onPress={() => {
          router.navigate("./create");
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
    refetch,
    isRefetching,
  } = useSuspenseInfiniteQuery<WatchingEnrichedType>({
    queryKey: ["watchings", "projects", status, style, level],
    tableName: "watchings",
    columns: `
      project:projects(
        *,
        profile:profiles(*),
        song:songs(id, name, artist_name, preview_url, artwork_url),
        bookings:bookings(*),
        watchings:watchings(*)
      )
    `,
    trailingQuery: (query) => {
      query = query
        .eq("user_id", profile?.id)
        .in("project.bookings.status", BOOKING_ACTIVE_STATUSES);
      if (status) query = query.eq("project.status", status);
      if (style) query = query.eq("project.style", style);
      if (level) query = query.eq("project.level", level);
      return query;
    },
  });

  const renderTile = useCallback(
    (data: ProjectEnrichedType): React.ReactElement => (
      <Tile
        imageSource={data.artworkUrl ?? data.song.artworkUrl}
        title={data.song.name}
        subtitle={data.song.artistName}
        metadata={[data.style, data.level].filter(Boolean).join(" • ")}
        previewUrl={data.song.previewUrl}
        avatars={data.profile.avatarUrl ? [data.profile.avatarUrl] : undefined}
        stats={data}
        onPress={() => router.navigate(`./classes/${data.id}`)}
      />
    ),
    [],
  );

  const projects = useMemo(
    () => watchings.map((watching) => watching.project),
    [watchings],
  );

  const sections = [
    {
      title: "Watchings",
      data: projects,
      render: renderTile,
    },
  ];

  return (
    <SectionListView
      sections={sections}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      refetch={refetch}
      isRefetching={isRefetching}
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
      <View style={styles.toolbar}>
        <Search rpc="search_wishes" />
        <ChipBar items={options} />
      </View>
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
      <NotificationsPermission />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(1),
    gap: theme.gap(1),
  },
}));
