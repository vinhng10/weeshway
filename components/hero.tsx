import { useAudioPlayerStore } from "@/hooks";
import { SongType } from "@/types";
import { getArtworkUrl, pickImage } from "@/utils";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { IconButton } from "./input/icon-button";
import { ThemedText } from "./themed-text";

const UniLinearGradient = withUnistyles(LinearGradient, (theme) => ({
  colors: ["rgba(255, 255, 255, 0)", theme.colors.background] as const,
}));

interface HeroProps {
  data: SongType;
  artworkUrl?: string;
  artworkEditable?: boolean;
  onArtworkChange?: (uri: string | undefined) => void;
}

export const Hero = ({
  data,
  artworkUrl,
  artworkEditable,
  onArtworkChange,
}: HeroProps) => {
  const isPlaying = useAudioPlayerStore((state) =>
    state.isPlaying(data.previewUrl),
  );
  const toggle = useAudioPlayerStore((state) => state.toggle);

  const hasCustomArtwork = !!artworkUrl && artworkUrl !== data.artworkUrl;

  const handleAudioPlayer = () => {
    if (!data.previewUrl) return;
    toggle(data.previewUrl);
  };

  const handleArtworkPress = async () => {
    if (hasCustomArtwork) {
      onArtworkChange?.(undefined);
      return;
    }
    const uri = await pickImage();
    if (uri) onArtworkChange?.(uri);
  };

  return (
    <View style={styles.background}>
      <Image
        source={getArtworkUrl(artworkUrl ?? data.artworkUrl, 400)}
        style={styles.backgroundImage}
      />
      <UniLinearGradient
        style={styles.overlay}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.contentContainer}>
          <View style={styles.songInfo}>
            <ThemedText type="h2">{data.name}</ThemedText>
            <ThemedText color="dimmed" type="h3">
              {data.artistName}
            </ThemedText>
          </View>
          <View style={styles.buttonContainer}>
            {artworkEditable && onArtworkChange && (
              <IconButton
                icon={hasCustomArtwork ? "close" : "camera"}
                onPress={handleArtworkPress}
              />
            )}
            <IconButton
              icon={isPlaying ? "pause" : "play"}
              iconSize={36}
              onPress={handleAudioPlayer}
            />
          </View>
        </View>
      </UniLinearGradient>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  background: {
    height: theme.gap(32),
    marginHorizontal: -theme.gap(2),
    marginTop: -theme.gap(2),
    overflow: "hidden",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  contentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(1),
  },
  songInfo: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
  },
}));
