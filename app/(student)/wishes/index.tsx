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
import { LevelEnum, StyleEnum, WishStatusEnum } from "@/constants";
import { useAuth, useSuspenseInfiniteQuery } from "@/hooks";
import { WishRecommendationEnrichedType } from "@/types";
import { router } from "expo-router";
import { useState } from "react";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function WishesContent() {
  const [status, setStatus] = useState<WishStatusEnum>();
  const [style, setStyle] = useState<StyleEnum>();
  const [level, setLevel] = useState<LevelEnum>();
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

  const options: ChipBarItemProps[] = [
    {
      label: "Status",
      value: status,
      modal: true,
      options: WishStatusEnum,
      onValueChange: setStatus,
    },
    {
      label: "Style",
      value: style,
      options: StyleEnum,
      modal: true,
      onValueChange: setStyle,
    },
    {
      label: "Level",
      value: level,
      options: LevelEnum,
      modal: true,
      onValueChange: setLevel,
    },
  ];

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
            ? WishStatusEnum.ClassAvailable
            : WishStatusEnum.Waiting,
      })),
      render: renderTile,
    },
  ];

  return (
    <View style={styles.container}>
      <ChipBar padding items={options} />
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
    </View>
  );
}

export default function Wishes() {
  return (
    <Boundary>
      <WishesContent />
    </Boundary>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
  },
}));
