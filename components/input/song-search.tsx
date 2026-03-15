import { useSongSearch } from "@/hooks";
import { SongType } from "@/types";
import React, { useState } from "react";
import { FlatList, Keyboard, Modal, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Header } from "../header";
import { ThemedActivityIndicator } from "../themed-activity-indicator";
import { ThemedText } from "../themed-text";
import { Tile } from "../tile";
import { TextInput } from "./text-input";

interface SongSearchProps {
  onSongPress?(song: SongType): void;
}

export const SongSearch: React.FunctionComponent<SongSearchProps> = ({
  onSongPress,
}) => {
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

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.messageContainer}>
          <ThemedActivityIndicator size="large" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.messageContainer}>
          <ThemedText color="danger">{error}</ThemedText>
        </View>
      );
    }

    if (query.trim()) {
      return (
        <View style={styles.messageContainer}>
          <ThemedText color="dimmed">No songs found</ThemedText>
        </View>
      );
    }

    return null;
  };

  return (
    <>
      <ThemedText
        color="dimmed"
        onPress={() => setVisible(true)}
        style={styles.container}
      >
        What song is in your mind?
      </ThemedText>

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
              placeholder="What song is in your mind?"
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
          </View>

          <FlatList
            data={songs}
            keyExtractor={(item) => item.id}
            renderItem={({ item: song }) => (
              <Tile
                imageSource={song.artworkUrl}
                title={song.name}
                subtitle={song.artistName}
                metadata={song.genre}
                onPress={() => onSelect(song)}
              />
            )}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    backgroundColor: theme.colors.foreground,
    padding: theme.gap(2),
    borderRadius: theme.gap(2),
  },
  modalContainer: {
    flex: 1,
    marginTop: rt.insets.top,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    paddingHorizontal: theme.gap(2),
  },
  scrollContainer: {
    gap: theme.gap(1),
    padding: theme.gap(2),
    paddingBottom: theme.gap(16),
  },
  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
}));
