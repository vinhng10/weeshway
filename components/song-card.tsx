import { IconButton } from "@/components/icon-button";
import { ThemedText } from "@/components/themed-text";
import { useAudioPlayerStore } from "@/hooks/useAudioPlayerStore";
import { SongType } from "@/types";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface SongCardProps {
  data: SongType;
}

export const SongCard: React.FunctionComponent<SongCardProps> = ({ data }) => {
  const isPlaying = useAudioPlayerStore((state) =>
    state.isPlaying(data.previewUrl)
  );
  const play = useAudioPlayerStore((state) => state.play);
  const pause = useAudioPlayerStore((state) => state.pause);

  const handlePlay = () => {
    if (!data.previewUrl) {
      return;
    }

    isPlaying ? pause() : play(data.previewUrl);
  };

  return (
    <ImageBackground
      source={{ uri: data.artworkUrl }}
      style={styles.background}
      imageStyle={styles.backgroundImage}
    >
      <LinearGradient
        style={styles.overlay}
        colors={["rgba(255, 255, 255, 0.1)", "rgba(0, 0, 0, 0.9)"]}
        start={{ x: 0, y: 0.3 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.song}>
            <ThemedText type="h2">{data.name}</ThemedText>
            <ThemedText color="dimmed" type="h3">
              {data.artistName}
            </ThemedText>
          </View>
          <IconButton
            icon={isPlaying ? "pause" : "play"}
            iconSize={36}
            onPress={handlePlay}
          />
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

const styles = StyleSheet.create((theme) => ({
  background: {
    flex: 1,
  },
  backgroundImage: {
    borderRadius: theme.gap(2),
  },
  overlay: {
    flex: 1,
    padding: theme.gap(1),
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "flex-start",
    borderRadius: theme.gap(2),
  },
  song: {
    flex: 1,
    flexShrink: 1,
    gap: theme.gap(0.5),
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
}));
