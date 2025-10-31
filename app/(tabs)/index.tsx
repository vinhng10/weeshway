import { SongTile } from "@/components/song-tile";
import { ThemedText } from "@/components/themed-text";
import { playlist } from "@/mocks/playlist";
import { router } from "expo-router";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function PlaylistScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <ThemedText type="title">Playlist</ThemedText>
        </View>
        {playlist.map((song) => (
          <SongTile
            song={song}
            onPress={() => router.push(`/(tabs)/player/${song.id}`)}
            key={song.id}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    marginTop: rt.insets.top + theme.gap(3),
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    gap: theme.gap(3),
    paddingHorizontal: theme.gap(2),
  },
  header: {
    paddingBottom: theme.gap(2),
  },
}));
