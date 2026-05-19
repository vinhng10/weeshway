import { useAudioPlayerStore } from "@/hooks";
import { SongType } from "@/types";
import { getArtworkUrl } from "@/utils";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Dimensions, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { IconButton } from "./input/icon-button";
import { ThemedText } from "./themed-text";

const { width: screenWidth } = Dimensions.get("window");

const UniLinearGradient = withUnistyles(LinearGradient, (theme) => ({
  colors: ["transparent", theme.colors.background] as const,
}));

interface SongCardProps {
  data: SongType;
}

export const SongCard = ({ data }: SongCardProps) => {
  const isPlaying = useAudioPlayerStore((state) =>
    state.isPlaying(data.previewUrl),
  );
  const toggle = useAudioPlayerStore((state) => state.toggle);

  const handlePlay = () => {
    if (!data.previewUrl) return;
    toggle(data.previewUrl);
  };

  return (
    <View style={styles.background}>
      <Image
        source={{ uri: getArtworkUrl(data.artworkUrl, 400) }}
        style={styles.backgroundImage}
      />
      <UniLinearGradient
        style={styles.overlay}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.song}>
            <ThemedText type="h3">{data.name}</ThemedText>
            <ThemedText color="dimmed" type="h5">
              {data.artistName}
            </ThemedText>
          </View>
          <IconButton
            icon={isPlaying ? "pause" : "play"}
            onPress={handlePlay}
          />
        </View>
      </UniLinearGradient>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  background: {
    alignSelf: "center",
    width: screenWidth * 0.75,
    height: screenWidth * 0.75,
    borderRadius: theme.gap(2),
    overflow: "hidden",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
    borderRadius: theme.gap(2),
  },
  overlay: {
    flex: 1,
    padding: theme.gap(1),
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },
  song: {
    flex: 1,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
}));
