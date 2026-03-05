import { Image } from "expo-image";
import { useVideoPlayer, type VideoThumbnail, VideoView } from "expo-video";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ThemedActivityIndicator } from "./themed-activity-indicator";

interface VideoProps {
  source: string | null;
}

export const Video = React.memo(function Video({ source }: VideoProps) {
  const [thumbnail, setThumbnail] = useState<VideoThumbnail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<VideoView>(null);

  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
  });

  useEffect(() => {
    if (!source) {
      setThumbnail(null);
      return;
    }

    setIsLoading(true);

    const generate = async () => {
      try {
        const [result] = await player.generateThumbnailsAsync(0);
        setThumbnail(result);
      } catch {
        setThumbnail(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (player.status === "readyToPlay") {
      generate();
    } else {
      const sub = player.addListener("statusChange", ({ status }) => {
        if (status === "readyToPlay") {
          sub.remove();
          generate();
        } else if (status === "error") {
          sub.remove();
          setThumbnail(null);
          setIsLoading(false);
        }
      });
      return () => sub.remove();
    }
  }, [source, player]);

  const handlePress = async () => {
    if (!source) return;
    player.currentTime = 0;
    player.play();
    try {
      await videoRef.current?.enterFullscreen();
    } catch {}
  };

  const handleFullscreenExit = () => {
    player.pause();
    player.currentTime = 0;
  };

  return (
    <Pressable onPress={handlePress} disabled={isLoading}>
      <View style={[styles.container, styles.indicator]}>
        {source && isLoading ? (
          <ThemedActivityIndicator size="large" />
        ) : (
          thumbnail && <Image source={thumbnail} style={styles.thumbnail} />
        )}
      </View>
      <VideoView
        ref={videoRef}
        style={styles.hiddenPlayer}
        player={player}
        nativeControls
        fullscreenOptions={{ enable: true }}
        onFullscreenExit={handleFullscreenExit}
      />
    </Pressable>
  );
});

const styles = StyleSheet.create((theme) => ({
  container: {
    height: theme.gap(24),
    aspectRatio: 9 / 16,
    borderRadius: theme.gap(2),
    backgroundColor: theme.colors.foreground,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  indicator: {
    justifyContent: "center",
    alignItems: "center",
  },
  hiddenPlayer: {
    width: 1,
    height: 1,
    opacity: 0,
    position: "absolute",
  },
}));
