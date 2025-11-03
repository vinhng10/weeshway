import { ClassCarousel } from "@/components/carousel";
import { Header } from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { Tile } from "@/components/tile";
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

  const handleBook = (classId: number) => {
    console.log("Book class:", classId);
    // Add booking logic here
  };

  const handlePlay = (classId: number) => {
    console.log("Play class:", classId);
    // Add play logic here
  };

  return (
    <View style={styles.container}>
      <Header title="Wish" />

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Top Classes Container */}
        {wish.classes && wish.classes.length > 0 && (
          <View style={styles.section}>
            <ThemedText bold type="h4">
              {wish.status === "available"
                ? "Your top classes"
                : "Granted classes"}
            </ThemedText>
            <ClassCarousel
              classes={wish.classes}
              onBook={handleBook}
              onPlay={handlePlay}
            />
          </View>
        )}

        <View style={styles.wishContainer}>
          <Tile
            imageSource={{ uri: wish.imageUrl }}
            title={wish.title}
            subtitle={wish.artist}
            metadata={`${wish.style} • ${wish.level}`}
            onPress={() => console.log("Navigate to class")}
          />
          <View style={styles.descriptionContainer}>
            <ThemedText>{wish.description}</ThemedText>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
  },
  contentContainer: {
    flex: 1,
    gap: theme.gap(2),
    padding: theme.gap(2),
  },
  descriptionContainer: {
    height: theme.gap(12),
    padding: theme.gap(1),
    backgroundColor: theme.colors.foreground,
    borderRadius: theme.gap(2),
  },
  wishContainer: {
    gap: theme.gap(1),
  },
  section: {
    gap: theme.gap(1),
  },
}));
