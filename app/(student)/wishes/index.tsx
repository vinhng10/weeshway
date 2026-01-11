import {
  AvatarGroup,
  Boundary,
  Button,
  Chip,
  ChipBar,
  ChipBarItemProps,
  SectionListView,
  Tile,
} from "@/components";
import { LEVEL, STYLE, WISH_STATUS } from "@/constants";
import { useAuth, useSuspenseInfiniteQuery } from "@/hooks";
import {
  LevelType,
  StyleType,
  WishRecommendationEnrichedType,
  WishStatusType,
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
        if (style) {
          query = query.eq("style", style);
        }
        if (level) {
          query = query.eq("level", level);
        }
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

export default function Wishes() {
  const [status, setStatus] = useState<WishStatusType>();
  const [style, setStyle] = useState<StyleType>();
  const [level, setLevel] = useState<LevelType>();

  const options: ChipBarItemProps[] = [
    {
      label: "Status",
      value: status,
      modal: true,
      options: WISH_STATUS,
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

  return (
    <View style={styles.container}>
      <ChipBar padding items={options} />
      <Boundary>
        <WishesContent status={status} style={style} level={level} />
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
