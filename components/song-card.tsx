import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ImageBackground, ImageProps } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface SongCardProps {
  title: string;
  artist: string;
  imageUrl: ImageProps["source"];
  onPlay?: any;
}

export const SongCard: React.FunctionComponent<SongCardProps> = ({
  title,
  artist,
  imageUrl,
  onPlay,
}) => {
  return (
    <ImageBackground
      source={imageUrl}
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
            <ThemedText type="h2">{title}</ThemedText>
            <ThemedText color="dimmed" type="h3">
              {artist}
            </ThemedText>
          </View>
          <Pressable style={styles.button} onPress={onPlay}>
            <IconSymbol
              name="play"
              size={36}
              color="rgba(255, 255, 255, 0.6)"
            />
          </Pressable>
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
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  button: {
    height: theme.gap(6),
    width: theme.gap(6),
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
}));
