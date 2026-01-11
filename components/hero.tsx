import { useAudioPlayerStore } from "@/hooks";
import { SongType } from "@/types";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Header } from "./header";
import { IconButton } from "./input/icon-button";
import { ThemedText } from "./themed-text";

interface HeroProps {
  data: SongType;
  onShare?: () => void;
}

export const Hero = ({ data, onShare }: HeroProps) => {
  const isPlaying = useAudioPlayerStore((state) =>
    state.isPlaying(data.previewUrl)
  );
  const toggle = useAudioPlayerStore((state) => state.toggle);

  const handleAudioPlayer = () => {
    if (!data.previewUrl) return;
    toggle(data.previewUrl);
  };

  return (
    <ImageBackground source={data.artworkUrl} style={styles.background}>
      <LinearGradient
        style={styles.overlay}
        colors={["rgba(0, 0, 0, 0.3)", "#0C0C0C"]}
        start={{ x: 0, y: 0.3 }}
        end={{ x: 0, y: 1 }}
      >
        <Header />
        <View style={styles.contentContainer}>
          <View style={styles.songInfo}>
            <ThemedText type="h2">{data.name}</ThemedText>
            <ThemedText color="dimmed" type="h3">
              {data.artistName}
            </ThemedText>
          </View>
          <View style={styles.buttonContainer}>
            <IconButton icon="sharedwithyou" iconSize={24} onPress={onShare} />
            <IconButton
              icon={isPlaying ? "pause" : "play"}
              iconSize={36}
              onPress={handleAudioPlayer}
            />
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

const styles = StyleSheet.create((theme) => ({
  background: {
    height: theme.gap(32),
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
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
    gap: theme.gap(0.5),
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
  },
}));
