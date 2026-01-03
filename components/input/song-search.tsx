import { Header } from "@/components/header";
import { TextInput } from "@/components/input/text-input";
import { Tile } from "@/components/tile";
import { SongType } from "@/types";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  ScrollView,
  View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ThemedText } from "../themed-text";

// --- Types & Helpers ---
interface iTunesSearchResult {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  artworkUrl60?: string;
  previewUrl?: string;
  primaryGenreName?: string;
}

const mapITunesToSong = (result: iTunesSearchResult): SongType => ({
  id: result.trackId.toString(),
  name: result.trackName,
  artistName: result.artistName,
  artworkUrl: (result.artworkUrl100 || result.artworkUrl60 || "").replace(
    /\d+x\d+/g,
    "200x200"
  ),
  genreNames: result.primaryGenreName ? [result.primaryGenreName] : [],
  previewUrl: result.previewUrl,
  createdAt: new Date(),
});

// --- Custom Hook ---
const useSongSearch = (query: string) => {
  const [state, setState] = useState({
    songs: [] as SongType[],
    loading: false,
    error: null as string | null,
  });

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setState({ songs: [], loading: false, error: null });
      return;
    }

    const abortController = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const timeoutId = setTimeout(async () => {
      try {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
          trimmed
        )}&media=music&entity=song&limit=25`;
        const response = await fetch(url, { signal: abortController.signal });

        if (!response.ok) throw new Error("Search failed");

        const data = await response.json();
        const mapped = data.results.map(mapITunesToSong);

        setState({ songs: mapped, loading: false, error: null });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setState({ songs: [], loading: false, error: err.message });
        }
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [query]);

  return state;
};

// --- Main Component ---
interface SongSearchProps {
  onSongPress?(song: SongType): void;
}

export const SongSearch: React.FC<SongSearchProps> = ({ onSongPress }) => {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const { songs, loading, error } = useSongSearch(query);

  const handleClose = () => {
    setVisible(false);
    setQuery("");
    Keyboard.dismiss();
  };

  const onSelect = (song: SongType) => {
    onSongPress?.(song);
    handleClose();
  };

  // Simplified List Rendering Logic
  const renderContent = () => {
    if (loading)
      return (
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.center} />
      );
    if (error)
      return (
        <ThemedText color="danger" style={styles.center}>
          {error}
        </ThemedText>
      );
    if (query.trim() && songs.length === 0)
      return (
        <ThemedText color="dimmed" style={styles.center}>
          No songs found
        </ThemedText>
      );

    return songs.map((song, i) => (
      <Tile
        key={`${song.id}-${i}`}
        imageSource={{ uri: song.artworkUrl }}
        title={song.name}
        subtitle={song.artistName}
        metadata={song.genreNames.join(", ")}
        onPress={() => onSelect(song)}
      />
    ));
  };

  return (
    <>
      <TextInput
        placeholder="What song are you looking for?"
        onPress={() => setVisible(true)}
      />

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          <Header title="Search Song" onPress={handleClose} />

          <View style={styles.searchContainer}>
            <TextInput
              placeholder="What song do you want to dance?"
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            {renderContent()}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  modalContainer: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
    opacity: 0.95,
  },
  searchContainer: {
    padding: theme.gap(2),
  },
  scrollContainer: {
    gap: theme.gap(1),
    paddingHorizontal: theme.gap(2),
    paddingBottom: theme.gap(16),
  },
  center: {
    marginTop: theme.gap(8),
    textAlign: "center",
  },
}));
