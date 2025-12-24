import { Button } from "@/components/button";
import { Header } from "@/components/header";
import { SelectBoxInput, TextInput } from "@/components/input";
import { SongCard } from "@/components/song-card";
import { SongSearch } from "@/components/song-search";
import { LevelEnum, StyleEnum } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabase";
import { SongType } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { StyleSheet } from "react-native-unistyles";

export default function MakeAWish() {
  const profile = useAuth((state) => state.profile);
  const isLoggedIn = useAuth((state) => state.isLoggedIn);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [style, setStyle] = useState<StyleEnum>(StyleEnum.HipHop);
  const [level, setLevel] = useState<LevelEnum>(LevelEnum.Beginner);
  const [description, setDescription] = useState("");
  const [song, setSong] = useState<SongType | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!isLoggedIn || !profile) {
      console.error("Error: User not logged in");
      return;
    }

    if (!song) {
      console.error("Error: Song is required");
      return;
    }

    setIsCreating(true);

    try {
      const { error } = await supabase.rpc("create_wish_with_song", {
        p_song_data: {
          id: song.id,
          name: song.name,
          artist_name: song.artistName,
          artwork_url: song.artworkUrl,
          preview_url: song.previewUrl,
          genre: song.genreNames[0],
        },
        p_wish_data: {
          style: style,
          level: level,
          description: description.trim(),
        },
      });

      if (error) {
        throw error;
      }

      // Invalidate wishes queries to refresh the list
      await queryClient.invalidateQueries({ queryKey: ["wishes"] });

      // Navigate back or show success message
      router.back();
    } catch (error: any) {
      console.error("Error creating wish:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Make A Wish" />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SongSearch onSongPress={(song) => setSong(song)} />

        {/* Song Card */}
        {song && (
          <View style={styles.cardContainer}>
            <SongCard data={song} />
          </View>
        )}

        {/* Style and Level Selects */}
        <View style={styles.row}>
          <SelectBoxInput
            label="Style"
            value={style}
            options={StyleEnum}
            onValueChange={setStyle}
          />
          <SelectBoxInput
            label="Level"
            value={level}
            options={LevelEnum}
            onValueChange={setLevel}
          />
        </View>

        {/* Wish Description */}
        <TextInput
          placeholder="What do you wish for?"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />
      </KeyboardAwareScrollView>

      <Button
        label={isCreating ? "Creating..." : "Create"}
        onPress={handleCreate}
        disabled={isCreating}
        stickyBottom
      />
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
    gap: theme.gap(2),
  },
}));
