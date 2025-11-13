import { AvatarGroup } from "@/components/avatar-group";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { ChipBar, ChipBarItemProps } from "@/components/chip-bar";
import { SectionListView } from "@/components/section-list";
import { Tile } from "@/components/tile";
import { WishStatus } from "@/constants/options";
import { wishes } from "@/mocks/wishes";
import { WishType } from "@/types";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Wishes() {
  const [status, setStatus] = useState<string>("");

  const filters: ChipBarItemProps[] = [
    {
      label: "Class available",
      value: status,
      modal: false,
      options: WishStatus,
      onValueChange: setStatus,
    },
  ];

  const filteredWishes = useMemo(() => {
    if (status === "") {
      return wishes;
    }

    return wishes.filter((wish) => {
      if (status === WishStatus.Waiting) {
        return wish.status === undefined;
      }
      if (status === WishStatus.ClassAvailable) {
        return wish.status === "available";
      }
      if (status === WishStatus.Granted) {
        return wish.status === "granted";
      }
      return false;
    });
  }, [status]);

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
            <Chip color="light" label={data.status ?? ""} />
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
      <ChipBar padding items={filters} />
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
