import {
  Button,
  Header,
  ProfileSearch,
  SelectBoxInput,
  SongCard,
  SongSearch,
  TextBoxInput,
} from "@/components";
import { LEVEL, STYLE } from "@/constants";
import { useAlert, useAuth } from "@/hooks";
import { supabase } from "@/supabase";
import { LevelType, ProfileType, SongType, StyleType } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { StyleSheet } from "react-native-unistyles";

export default function MakeAWish() {
  const profile = useAuth((state) => state.profile);
  const isLoggedIn = useAuth((state) => !!state.session && !!state.profile);
  const queryClient = useQueryClient();
  const showAlert = useAlert((state) => state.showAlert);

  const [style, setStyle] = useState<StyleType>();
  const [level, setLevel] = useState<LevelType>();
  const [description, setDescription] = useState("");
  const [song, setSong] = useState<SongType | null>(null);
  const [teachers, setTeachers] = useState<ProfileType[]>([]);

  const handleCreate = async () => {
    if (!isLoggedIn || !profile) {
      showAlert(
        "Login Required",
        "Please sign in to your account to continue.",
      );
      return;
    }

    if (!song) {
      showAlert(
        "Song Required",
        "Please select a song before making a wish.",
      );
      return;
    }

    try {
      const { error } = await supabase.rpc("create_wish_with_song", {
        p_song_data: {
          id: song.id,
          name: song.name,
          artist_name: song.artistName,
          artwork_url: song.artworkUrl,
          preview_url: song.previewUrl,
          genre: song.genre,
        },
        p_wish_data: {
          style: style,
          level: level,
          description: description.trim(),
        },
        p_teacher_ids: teachers.map((t) => t.id),
      });

      if (error) {
        throw error;
      }

      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes("wishes"),
      });

      router.back();
    } catch {
      showAlert(
        "Creation Failed",
        "Couldn't create your wish. Please try again.",
      );
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

        {song && <SongCard data={song} />}

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

        <ProfileSearch
          label="Dream Teachers"
          value={teachers}
          onAdd={(p) => setTeachers((prev) => [...prev, p])}
          onRemove={(id) =>
            setTeachers((prev) => prev.filter((t) => t.id !== id))
          }
        />

        <TextBoxInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
      </KeyboardAwareScrollView>

      <Button label={"Create"} onPress={handleCreate} position="stickyBottom" />
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
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
}));
