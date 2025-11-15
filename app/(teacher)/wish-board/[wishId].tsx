import { Button } from "@/components/button";
import { Header } from "@/components/header";
import { BoxInput, TextInput } from "@/components/input";
import { SongCard } from "@/components/song-card";
import { ThemedText } from "@/components/themed-text";
import { wishes } from "@/mocks/wishes";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Wish() {
  const { wishId } = useLocalSearchParams<{ wishId: string }>();

  // Find the wish by ID
  const wish = wishes.find((w) => w.id === Number(wishId));

  if (!wish) {
    return (
      <View style={styles.container}>
        <ThemedText>Wish not found</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Wish" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Song Card */}
        <View style={styles.cardContainer}>
          <SongCard
            name={wish.title}
            artistName={wish.artist}
            imageUrl={wish.imageUrl}
            onPlay={() => {}}
          />
        </View>

        {/* Style and Level Selects */}
        <View style={styles.row}>
          <BoxInput
            label="Style"
            type="text"
            value={wish.style}
            editable={false}
          />
          <BoxInput
            label="Level"
            type="text"
            value={wish.level}
            editable={false}
          />
        </View>

        {/* Wish Description */}
        <TextInput
          multiline
          numberOfLines={4}
          value={wish.description}
          editable={false}
        />
      </ScrollView>

      <Button label="Create Project" onPress={() => {}} stickyBottom />
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
  },
  scrollContainer: {
    gap: theme.gap(2),
    padding: theme.gap(2),
    paddingBottom: theme.gap(16),
  },
  cardContainer: {
    width: theme.gap(42),
    height: theme.gap(42),
    alignSelf: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.gap(2),
  },
}));
