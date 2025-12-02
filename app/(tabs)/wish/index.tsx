import { AvatarGroup } from "@/components/avatar-group";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { ChipBar, ChipBarItemProps } from "@/components/chip-bar";
import { SectionListView } from "@/components/section-list";
import { Tile } from "@/components/tile";
import { WishStatusEnum } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { useInfiniteQuery } from "@/hooks/useInfiniteQuery";
import { WishRecommendationEnrichedType } from "@/types";
import { router } from "expo-router";
import { useState } from "react";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Wishes() {
  const [status, setStatus] = useState<WishStatusEnum | undefined>();
  const profile = useAuth((state) => state.profile);

  const { data, isLoading, error, hasNextPage, fetchNextPage } =
    useInfiniteQuery<WishRecommendationEnrichedType>({
      queryKey: ["wishes", "recommendations"],
      tableName: "wishes",
      columns: `*, 
      song:songs(*), 
      recommendations:recommendations(*)`,
      pageSize: 10,
      trailingQuery: (query) => query.eq("user_id", profile?.id),
    });

  const options: ChipBarItemProps[] = [
    {
      label: "Class available",
      value: status,
      modal: false,
      options: WishStatusEnum,
      onValueChange: setStatus,
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
            <Chip color="light" label={""} />
          </>
        )
      }
      onPress={() => router.push(`/(tabs)/wish/${data.id}`)}
    />
  );

  const sections: SectionListData<WishRecommendationEnrichedType>[] = [
    {
      data: isLoading || error ? [] : data,
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
          router.push("/(tabs)/wish/create");
        }}
      />
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
