import {
  Badge,
  Boundary,
  Button,
  Header,
  SongCard,
  TextBoxInput,
  ThemedText,
  Tile,
} from "@/components";
import { useAuth, useSuspenseQuery, useTempDataStore } from "@/hooks";
import { supabase } from "@/supabase";
import { WishEnrichedType } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { RefreshControl, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type WishWithSimilarCount = WishEnrichedType & { similarWishCount: number };

type SimilarWish = {
  id: string;
  style?: string;
  level?: string;
  songName: string;
  songArtistName: string;
  songArtworkUrl: string;
  songPreviewUrl?: string;
};

function WishContent() {
  const { wishId } = useLocalSearchParams<{ wishId: string }>();
  const setData = useTempDataStore((state) => state.setData);
  const profile = useAuth((state) => state.profile);

  const { data, refetch, isRefetching } =
    useSuspenseQuery<WishWithSimilarCount>({
      queryKey: ["wishes", "explore", wishId],
      queryFn: async () => {
        const { data } = await supabase
          .from("wishes")
          .select(
            `*, song:songs(id, name, artist_name, preview_url, artwork_url), wish_teachers(teacher_id), similar_wish_count`,
          )
          .eq("id", wishId)
          .single()
          .throwOnError();
        return data;
      },
      enabled: !!wishId,
    });

  const { data: similarWishes } = useSuspenseQuery<SimilarWish[]>({
    queryKey: ["wishes", "similar", wishId],
    queryFn: async () => {
      const { data } = await supabase
        .rpc("find_similar_wishes", {
          p_wish_id: wishId,
          p_limit: 5,
        })
        .throwOnError();
      return data ?? [];
    },
    enabled: !!wishId,
  });

  const handleCreateProject = () => {
    setData<WishEnrichedType>(data);
    router.navigate("../create");
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <View style={styles.wishInfo}>
          <SongCard data={data.song} />
          <Badge
            show={
              data.wishTeachers?.some((wt) => wt.teacherId === profile?.id) ??
              false
            }
            label="This wish is for you"
          />
          <View style={styles.row}>
            <TextBoxInput label="Style" value={data.style} editable={false} />
            <TextBoxInput label="Level" value={data.level} editable={false} />
          </View>
          <TextBoxInput
            label="Description"
            multiline
            numberOfLines={4}
            value={data.description}
            editable={false}
          />
        </View>

        {similarWishes.length > 0 && (
          <View style={styles.similarSection}>
            <ThemedText type="h5">Similar Wishes</ThemedText>
            {similarWishes.map((wish) => (
              <Tile
                key={wish.id}
                imageSource={wish.songArtworkUrl}
                title={wish.songName}
                subtitle={wish.songArtistName}
                metadata={[wish.style, wish.level].filter(Boolean).join(" • ")}
                previewUrl={wish.songPreviewUrl}
                onPress={() => router.push(`./${wish.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
      <Button
        label="Create Project"
        onPress={handleCreateProject}
        position="stickyBottom"
      />
    </>
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
    marginTop: rt.insets.top,
  },
  scrollContainer: {
    gap: theme.gap(2),
    paddingHorizontal: theme.gap(2),
    paddingBottom: theme.gap(32),
  },
  wishInfo: {
    gap: theme.gap(2),
  },
  similarSection: {
    gap: theme.gap(1),
  },
  row: {
    flexDirection: "row",
    gap: theme.gap(2),
  },
}));
