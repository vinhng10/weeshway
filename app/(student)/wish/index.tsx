import { Button } from "@/components/button";
import { ChipBar, ChipBarItemProps } from "@/components/chip-bar";
import { SectionListView } from "@/components/section-list";
import { Tile } from "@/components/tile";
import { WishStatusEnum } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabase";
import { WishEnrichedType } from "@/types";
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

  const { data, isPending, error } = useQuery({
    queryKey: ["wishes", status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishes")
        .select(`*,songs (*)`)
        .eq("user_id", profile?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data) return [];

      const result = camelcaseKeys(data, { deep: true });
      return result;
    },
    enabled: isLoggedIn && !!profile,
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

  const renderTile = (data: WishEnrichedType): React.ReactElement => (
    <Tile
      imageSource={data.songs.artworkUrl}
      title={data.songs.name}
      subtitle={data.songs.artistName}
      metadata={`${data.style} • ${data.level}`}
      previewUrl={data.songs.previewUrl}
      // rightContent={
      //   data.avatars &&
      //   data.avatars.length > 0 && (
      //     <>
      //       <AvatarGroup max={2} avatars={data.avatars} />
      //       <Chip color="light" label={data.status ?? ""} />
      //     </>
      //   )
      // }
      onPress={() => router.push(`/(student)/wish/${data.id}`)}
    />
  );

  const sections: SectionListData<WishEnrichedType>[] = [
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
          router.push("/(student)/wish/create");
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
