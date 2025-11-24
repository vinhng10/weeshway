import { Carousel } from "@/components/carousel";
import { Header } from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { Tile } from "@/components/tile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabase";
import { ProjectEnrichedType, WishRecommendationEnrichedType } from "@/types";
import { useQuery } from "@tanstack/react-query";
import camelcaseKeys from "camelcase-keys";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Wish() {
  const { wishId } = useLocalSearchParams<{ wishId: string }>();
  const profile = useAuth((state) => state.profile);
  const isLoggedIn = useAuth((state) => state.isLoggedIn);

  const { data, isPending, error } = useQuery<WishRecommendationEnrichedType>({
    queryKey: ["wishes", "recommendations", wishId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishes")
        .select(
          `*, 
            song:songs(*), 
            recommendations:recommendations(*)`
        )
        .eq("id", wishId)
        .eq("user_id", profile?.id)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Use camelcaseKeys to normalize keys to camelCase
      const result = camelcaseKeys(data, { deep: true });
      return result;
    },
    enabled: isLoggedIn && !!profile && !!wishId,
  });

  if (error || !data) {
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
        {data.recommendations && data.recommendations.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="h4">Classes</ThemedText>
            <Carousel
              data={data.recommendations.map(
                (recommendation) => recommendation.project
              )}
              onBook={() => {}}
              onPress={(data: ProjectEnrichedType) =>
                router.push(`/(tabs)/class/${data.id}`)
              }
            />
          </View>
        )}

        <View style={styles.wishContainer}>
          <Tile
            imageSource={data.song.artworkUrl}
            title={data.song.name}
            subtitle={data.song.artistName}
            metadata={`${data.style} • ${data.level}`}
            previewUrl={data.song.previewUrl}
            onPress={() => {}}
          />
          <View style={styles.descriptionContainer}>
            <ThemedText>{data.description}</ThemedText>
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
