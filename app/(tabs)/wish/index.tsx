import { AvatarGroup } from "@/components/avatar-group";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { ChipBar, Option } from "@/components/chip-bar";
import { Tile } from "@/components/tile";
import { wishes } from "@/mocks/wishes";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
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

  return (
    <View style={styles.container}>
      <ChipBar
        padding
        options={STATUS_FILTERS}
        activeOption={activeOption}
        onPress={setActiveOption}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {filteredWishes.map((wish) => (
          <Tile
            imageSource={{ uri: wish.imageUrl }}
            title={wish.title}
            subtitle={wish.artist}
            metadata={`${wish.style} • ${wish.level}`}
            backgroundColor={wish.status}
            rightContent={
              wish.avatars &&
              wish.avatars.length > 0 && (
                <>
                  <AvatarGroup max={2} avatars={wish.avatars} />
                  <Chip type="light" label={wish.status ?? ""} />
                </>
              )
            }
            onPress={() => router.push(`/(tabs)/wish/${wish.id}`)}
            key={wish.id}
          />
        ))}
      </ScrollView>
      <View style={styles.buttonContainer}>
        <Button
          label="Make A Wish"
          onPress={() => {
            router.back();
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    gap: theme.gap(1),
    padding: theme.gap(2),
  },
  buttonContainer: {
    width: "70%",
    position: "absolute",
    alignSelf: "center",
    bottom: theme.gap(2),
  },
}));
