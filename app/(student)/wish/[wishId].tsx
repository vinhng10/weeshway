import { Header } from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { Tile } from "@/components/tile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabase";
import { useQuery } from "@tanstack/react-query";
import camelcaseKeys from "camelcase-keys";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Wish() {
  const { wishId } = useLocalSearchParams<{ wishId: string }>();
  const profile = useAuth((state) => state.profile);
  const isLoggedIn = useAuth((state) => state.isLoggedIn);

  const {
    data: wish,
    isPending,
    error,
  } = useQuery({
    queryKey: ["wish", wishId, profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishes")
        .select(`*,songs (*)`)
        .eq("id", wishId)
        .eq("user_id", profile.id)
        .single();

      if (error) throw error;
      if (!data) return null;

      const result = camelcaseKeys(data, { deep: true });
      return result;
    },
    enabled: isLoggedIn && !!profile && !!wishId,
  });

  if (error || !wish) {
    return (
      <View style={styles.container}>
        <Header title="Wish" />
        <View style={styles.scrollContainer}>
          <ThemedText>Wish not found</ThemedText>
        </View>
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
        {/* Top Classes Container */}
        {/* TODO: Add classes query when available */}
        {/* {wish.classes && wish.classes.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="h4">
              {wish.status === "available"
                ? "Your top classes"
                : "Granted classes"}
            </ThemedText>
            <Carousel
              data={wish.classes}
              onBook={() => {}}
              onPlay={() => {}}
              onPress={(data: ProjectType) =>
                router.push(`/(student)/class/${data.id}`)
              }
            />
          </View>
        )} */}

        <View style={styles.wishContainer}>
          <Tile
            imageSource={wish.songs.artworkUrl}
            title={wish.songs.name}
            subtitle={wish.songs.artistName}
            metadata={`${wish.style} • ${wish.level}`}
            previewUrl={wish.songs.previewUrl}
            onPress={() => {}}
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
  scrollContainer: {
    gap: theme.gap(2),
    padding: theme.gap(2),
    paddingBottom: theme.gap(16),
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
