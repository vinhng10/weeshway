import { AvatarGroup } from "@/components/avatar-group";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { ChipBar, ChipBarItemProps } from "@/components/chip-bar";
import { SectionListView } from "@/components/section-list";
import { Tile } from "@/components/tile";
import { WishStatusEnum } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabase";
import { WishRecommendationEnrichedType } from "@/types";
import { useQuery } from "@tanstack/react-query";
import camelcaseKeys from "camelcase-keys";
import { router } from "expo-router";
import { useState } from "react";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Wishes() {
  const [status, setStatus] = useState<WishStatusEnum | undefined>();
  const profile = useAuth((state) => state.profile);
  const isLoggedIn = useAuth((state) => state.isLoggedIn);

  const { data, isPending, error } = useQuery<WishRecommendationEnrichedType[]>(
    {
      queryKey: ["wishes", "recommendations"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("wishes")
          .select(
            `*, 
            song:songs(*), 
            recommendations:recommendations(*)`
          )
          .eq("user_id", profile?.id);

        if (error) throw error;
        if (!data) return [];

        // Use camelcaseKeys to normalize keys to camelCase
        const result = camelcaseKeys(data, { deep: true });
        return result;
      },
      enabled: isLoggedIn && !!profile,
    }
  );

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
      data: isPending || error ? [] : data,
      render: renderTile,
    },
  ];

  return (
    <View style={styles.container}>
      <ChipBar padding items={options} />
      <SectionListView sections={sections} />
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
