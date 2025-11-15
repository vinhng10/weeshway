import { Header } from "@/components/header";
import { TextInput } from "@/components/input/text-input";
import { Tile } from "@/components/tile";
import { results } from "@/mocks/results";
import { SongType } from "@/types";
import React, { useMemo, useState } from "react";
import { Keyboard, Modal, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type NormalizedSong = SongType & {
  searchableText: string;
};

const songs: NormalizedSong[] =
  results.results?.songs?.data?.map((item) => {
    const artworkUrl =
      item.attributes.artwork?.url?.replace("{w}x{h}", "200x200") ?? "";

    const previewUrl = item.attributes.previews?.[0]?.url;

    const normalizedSong: NormalizedSong = {
      id: item.id,
      name: item.attributes.name,
      artistName: item.attributes.artistName,
      artworkUrl,
      genreNames: item.attributes.genreNames ?? [],
      previewUrl,
      searchableText: [
        item.attributes.name,
        item.attributes.artistName,
        ...(item.attributes.genreNames ?? []),
      ]
        .join(" ")
        .toLowerCase(),
    };

    return normalizedSong;
  }) ?? [];

interface SongSearchProps {
  onSongPress?(song: SongType): void;
}

export const SongSearch: React.FunctionComponent<SongSearchProps> = ({
  onSongPress,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState("");

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;

  const filteredSongs = useMemo(() => {
    const normalizedQuery = trimmedQuery.toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return songs.filter((song) =>
      song.searchableText.includes(normalizedQuery)
    );
  }, [trimmedQuery]);

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setQuery("");
    Keyboard.dismiss();
  };

  const handleSongPress = (song: SongType) => {
    Keyboard.dismiss();
    if (onSongPress) {
      onSongPress(song);
    }
    handleCloseModal();
  };

  return (
    <>
      <TextInput
        placeholder="What song do you want to dance?"
        onPress={handleOpenModal}
        // editable={false}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <Header title="Search Song" onPress={handleCloseModal} />

          <View style={styles.searchContainer}>
            <TextInput
              placeholder="What song do you want to dance?"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCapitalize="none"
              autoFocus
            />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {hasQuery &&
              filteredSongs.map((song, index) => (
                <Tile
                  key={`${song.id}-${index}`}
                  imageSource={{ uri: song.artworkUrl }}
                  title={song.name}
                  subtitle={song.artistName}
                  metadata={song.genreNames.join(", ")}
                  onPress={() => handleSongPress(song)}
                />
              ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create((theme) => ({
  modalContainer: {
    flex: 1,
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
}));
