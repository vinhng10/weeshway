import { Image } from "expo-image";
import { useVideoPlayer, VideoThumbnail, VideoView } from "expo-video";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface VideoProps {
  source: string | null;
}

export const Video = React.memo(function Video({ source }: VideoProps) {
  const [thumbnail, setThumbnail] = useState<VideoThumbnail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const videoRef = useRef<any>(null);

  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = false;
  });

  useEffect(() => {
    if (!source) {
      setIsLoading(false);
      setThumbnail(null);
      return;
    }

    let cancelled = false;
    const generateThumbnail = async () => {
      setIsLoading(true);
      try {
        const [result] = await player.generateThumbnailsAsync(15);
        if (!cancelled) setThumbnail(result);
      } catch (e) {
        console.warn("Thumbnail generation failed:", e);
        if (!cancelled) setThumbnail(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    generateThumbnail();
    return () => {
      cancelled = true;
    };
  }, [source, player]);

  const handlePress = useCallback(() => {
    if (!source) return;
    player.currentTime = 0;
    player.play();
    setShowPlayer(true);
  }, [source, player]);

  useEffect(() => {
    if (showPlayer) {
      videoRef.current?.enterFullscreen().catch(() => {});
    }
  }, [showPlayer]);

  const handleFullscreenExit = useCallback(() => {
    player.pause();
    player.currentTime = 0;
    setShowPlayer(false);
  }, [player]);

  return (
    <Pressable onPress={handlePress} disabled={isLoading}>
      <View style={[styles.container, styles.indicator]}>
        {source && isLoading ? (
          <ActivityIndicator size="large" color="#FFFFFF" />
        ) : (
          thumbnail && <Image source={thumbnail} style={styles.container} />
        )}
      </View>
      {showPlayer && (
        <VideoView
          ref={videoRef}
          style={StyleSheet.absoluteFill}
          player={player}
          nativeControls
          fullscreenOptions={{ enable: true }}
          onFullscreenExit={handleFullscreenExit}
        />
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create((theme) => ({
  container: {
    height: theme.gap(24),
    aspectRatio: 9 / 16,
    borderRadius: theme.gap(2),
    backgroundColor: theme.colors.foreground,
  },
  indicator: {
    justifyContent: "center",
    alignItems: "center",
  },
}));
