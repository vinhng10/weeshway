import { AvatarGroup } from "@/components/avatar-group";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { FilterBar, FilterOption } from "@/components/filter-bar";
import { Tile } from "@/components/tile";
import { wishes } from "@/mocks/wishes";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type WishStatusFilter = "all" | "available" | "granted" | "waiting";

const STATUS_FILTERS: FilterOption<WishStatusFilter>[] = [
  { id: "all", label: "All" },
  { id: "available", label: "Class available" },
  { id: "granted", label: "Granted" },
  { id: "waiting", label: "Waiting" },
];

export default function WishesScreen() {
  const [activeFilter, setActiveFilter] = useState<WishStatusFilter>("all");

  const filteredWishes = useMemo(() => {
    if (activeFilter === "all") {
      return wishes;
    }

    return wishes.filter((wish) => {
      if (activeFilter === "waiting") {
        return wish.status === undefined;
      }
      return wish.status === activeFilter;
    });
  }, [activeFilter]);

  return (
    <View style={styles.container}>
      <FilterBar
        filters={STATUS_FILTERS}
        activeFilter={activeFilter}
        onFilterPress={setActiveFilter}
      />
      <ScrollView contentContainerStyle={styles.contentContainer}>
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
    flexDirection: "column",
    alignItems: "center",
    marginTop: rt.insets.top + theme.gap(3),
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    gap: theme.gap(1),
    padding: theme.gap(2),
  },
  buttonContainer: {
    width: "100%",
    marginBottom: rt.insets.bottom,
    paddingHorizontal: theme.gap(2),
  },
}));
