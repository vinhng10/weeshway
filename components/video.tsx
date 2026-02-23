import { useEvent } from "expo";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import * as VideoThumbnails from "expo-video-thumbnails";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface VideoProps {
  source: string | null;
}

export function Video({ source }: VideoProps) {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldLoadPlayer, setShouldLoadPlayer] = useState(false);
  const videoRef = useRef<any>(null);

  useEffect(() => {
    if (!source) {
      setIsLoading(false);
      setThumbnailUri(null);
      return;
    }

    const generateThumbnail = async () => {
      setIsLoading(true);
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(source, {
          time: 15000,
        });
        setThumbnailUri(uri);
      } catch (e) {
        console.warn("Thumbnail generation failed:", e);
        setThumbnailUri(null);
      } finally {
        setIsLoading(false);
      }
    };

    generateThumbnail();
  }, [source]);

  const handlePress = useCallback(() => {
    if (!source) return;
    setShouldLoadPlayer(true);
  }, [source]);

  return (
    <Pressable onPress={handlePress} disabled={isLoading}>
      <View style={[styles.container, styles.indicator]}>
        {source && isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          thumbnailUri && (
            <Image source={{ uri: thumbnailUri }} style={styles.container} />
          )
        )}
      </View>
      {source && shouldLoadPlayer && (
        <VideoPlayerComponent
          uri={source}
          videoRef={videoRef}
          onClose={() => setShouldLoadPlayer(false)}
        />
      )}
    </Pressable>
  );
}

function VideoPlayerComponent({
  uri,
  videoRef,
  onClose,
}: {
  uri: string;
  videoRef: React.RefObject<any>;
  onClose: any;
}) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.muted = false;
    p.play();
  });

  const { status, error } = useEvent(player, "statusChange", {
    status: player.status,
    error: undefined,
  });

  useEffect(() => {
    if (status === "readyToPlay" && !error) {
      videoRef.current?.enterFullscreen().catch(() => {});
    }
  }, [status, error, videoRef]);

  return (
    <VideoView
      ref={videoRef}
      player={player}
      nativeControls
      fullscreenOptions={{ enable: true }}
      onFullscreenExit={onClose}
    />
  );
}

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
