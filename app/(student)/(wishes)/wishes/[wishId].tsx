import {
  Boundary,
  Button,
  ButtonGroup,
  Carousel,
  Header,
  ProfileSearch,
  SelectBoxInput,
  SongCard,
  TextBoxInput,
  ThemedText,
  Tile,
} from "@/components";
import { LEVEL, STYLE } from "@/constants";
import { useAlert, useSuspenseQuery } from "@/hooks";
import { supabase } from "@/supabase";
import { ProfileType, WishRecommendationEnrichedType } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { RefreshControl, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { StyleSheet } from "react-native-unistyles";

function WishContent() {
  const { wishId } = useLocalSearchParams<{ wishId: string }>();
  const queryClient = useQueryClient();
  const showAlert = useAlert((state) => state.showAlert);

  const { data, refetch, isRefetching } =
    useSuspenseQuery<WishRecommendationEnrichedType>({
      queryKey: ["wishes", "recommendations", "classes", wishId],
      queryFn: async () => {
        const { data } = await supabase
          .from("wishes")
          .select(
            `*,
            song:songs(id, name, artist_name, preview_url, artwork_url),
            wish_teachers(profile:profiles(*)),
            recommendations:recommendations(
              project:projects(
                *,
                profile:profiles(*),
                song:songs(id, name, artist_name, preview_url, artwork_url),
                location:locations(*),
                bookings:bookings(*),
                watchings:watchings(*)
              )
            )`,
          )
          .eq("id", wishId)
          .single()
          .throwOnError();
        return data;
      },
    });

  const [style, setStyle] = useState(data.style);
  const [level, setLevel] = useState(data.level);
  const [description, setDescription] = useState(data.description);
  const [teachers, setTeachers] = useState<ProfileType[]>(
    data.wishTeachers
      ?.map((wt) => wt.profile)
      .filter((p): p is ProfileType => !!p) ?? [],
  );

  const hasRecommendations =
    data.recommendations && data.recommendations.length > 0;

  const handleSave = async () => {
    try {
      await supabase
        .rpc("update_wish", {
          p_wish_id: wishId,
          p_style: style ?? null,
          p_level: level ?? null,
          p_description: description ?? null,
          p_teacher_ids: teachers.map((t) => t.id),
        })
        .throwOnError();

      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes("wishes"),
      });
      router.back();
    } catch {
      showAlert(
        "Save Failed",
        "Couldn't save your wish changes. Please try again.",
      );
    }
  };

  const handleDelete = async () => {
    try {
      await supabase.from("wishes").delete().eq("id", wishId).throwOnError();

      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes("wishes"),
      });
      router.back();
    } catch {
      showAlert(
        "Delete Failed",
        "Couldn't delete your wish. Please try again.",
      );
    }
  };

  return (
    <>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Recommended Classes */}
        {hasRecommendations && (
          <View style={styles.section}>
            <ThemedText type="h4">Classes</ThemedText>
            <Carousel
              data={data.recommendations.map(
                (recommendation) => recommendation.project,
              )}
            />
          </View>
        )}

        {/* Song */}
        {hasRecommendations ? (
          <Tile
            imageSource={data.song.artworkUrl}
            title={data.song.name}
            subtitle={data.song.artistName}
            previewUrl={data.song.previewUrl}
          />
        ) : (
          <SongCard data={data.song} />
        )}
        <ProfileSearch
          label="Dream Teachers"
          value={teachers}
          onAdd={(p) => setTeachers((prev) => [...prev, p])}
          onRemove={(id) =>
            setTeachers((prev) => prev.filter((t) => t.id !== id))
          }
        />

        {/* Editable Fields */}
        <View style={styles.row}>
          <SelectBoxInput
            label="Style"
            value={style}
            options={STYLE}
            onValueChange={setStyle}
          />
          <SelectBoxInput
            label="Level"
            value={level}
            options={LEVEL}
            onValueChange={setLevel}
          />
        </View>

        <TextBoxInput
          label="Description"
          value={description}
          onValueChange={setDescription}
          multiline
          numberOfLines={4}
        />
      </KeyboardAwareScrollView>

      <ButtonGroup position="stickyBottom">
        <Button label="Delete" onPress={handleDelete} outlined />
        <Button label="Save" onPress={handleSave} />
      </ButtonGroup>
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
  row: {
    flexDirection: "row",
    gap: theme.gap(2),
  },
  section: {
    gap: theme.gap(1),
  },
}));
