import { AvatarGroup } from "@/components/avatar-group";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { ChipBar, Option } from "@/components/chip-bar";
import { SectionListView } from "@/components/section-list";
import { Tile } from "@/components/tile";
import { wishes } from "@/mocks/wishes";
import { WishType } from "@/types";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type WishStatusOption = "all" | "available" | "granted" | "waiting";

const STATUS_FILTERS: Option<WishStatusOption>[] = [
  { id: "all", label: "All" },
  { id: "available", label: "Class available" },
  { id: "granted", label: "Granted" },
  { id: "waiting", label: "Waiting" },
];

export default function Wishes() {
  const [activeOption, setActiveOption] = useState<WishStatusOption>("all");

  const filteredWishes = useMemo(() => {
    if (activeOption === "all") {
      return wishes;
    }

    return wishes.filter((wish) => {
      if (activeOption === "waiting") {
        return wish.status === undefined;
      }
      return wish.status === activeOption;
    });
  }, [activeOption]);

  const renderTile = (data: WishType): React.ReactElement => (
    <Tile
      imageSource={data.imageUrl}
      title={data.title}
      subtitle={data.artist}
      metadata={`${data.style} • ${data.level}`}
      backgroundColor={data.status}
      rightContent={
        data.avatars &&
        data.avatars.length > 0 && (
          <>
            <AvatarGroup max={2} avatars={data.avatars} />
            <Chip type="light" label={data.status ?? ""} />
          </>
        )
      }
      onPress={() => router.push(`/(student)/wish/${data.id}`)}
    />
  );

  const sections: SectionListData<WishType>[] = [
    {
      data: filteredWishes,
      render: renderTile,
    },
  ];

  return (
    <View style={styles.container}>
      <ChipBar
        padding
        options={STATUS_FILTERS}
        activeOption={activeOption}
        onPress={setActiveOption}
      />
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
