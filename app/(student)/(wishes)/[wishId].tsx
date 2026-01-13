import {
  Boundary,
  Carousel,
  Header,
  ThemedText,
  Tile,
  WishInfo,
} from "@/components";
import { useSuspenseQuery } from "@/hooks";
import { supabase } from "@/supabase";
import { WishRecommendationEnrichedType } from "@/types";
import { useLocalSearchParams } from "expo-router";
import { RefreshControl, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function WishContent() {
  const { wishId } = useLocalSearchParams<{ wishId: string }>();

  const { data, refetch, isRefetching } =
    useSuspenseQuery<WishRecommendationEnrichedType>({
      queryKey: ["wishes", "recommendations", wishId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("wishes")
          .select(
            `*, 
          song:songs(*), 
          recommendations:recommendations(
            project:projects(
              *, 
              profile:profiles(*), 
              song:songs(*), 
              location:locations(*),
              bookings:bookings(*),
              watchings:watchings(*)
            )
          )`
          )
          .eq("id", wishId)
          .single();

        if (error) throw error;
        return data;
      },
    });

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      {/* Top Classes Container */}
      {data.recommendations && data.recommendations.length > 0 ? (
        <>
          <View style={styles.section}>
            <ThemedText type="h4">Classes</ThemedText>
            <Carousel
              data={data.recommendations.map(
                (recommendation) => recommendation.project
              )}
            />
          </View>
          <View style={styles.wishContainer}>
            <Tile
              imageSource={data.song.artworkUrl}
              title={data.song.name}
              subtitle={data.song.artistName}
              metadata={`${data.style} • ${data.level}`}
              previewUrl={data.song.previewUrl}
            />
            <View style={styles.descriptionContainer}>
              <ThemedText>{data.description}</ThemedText>
            </View>
          </View>
        </>
      ) : (
        <WishInfo data={data} />
      )}
    </ScrollView>
  );
}

export default function Wish() {
  return (
    <View style={styles.container}>
      <Header title="Wish" />
      <Boundary>
        <WishContent />
      </Boundary>
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
