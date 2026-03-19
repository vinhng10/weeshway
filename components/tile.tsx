import { useAudioPlayerStore } from "@/hooks";
import { ProjectEnrichedType } from "@/types";
import React from "react";
import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Avatar } from "./avatar";
import { AvatarGroup } from "./avatar-group";
import { IconButton } from "./input/icon-button";
import { ProjectStats } from "./project-stats";
import { ThemedText } from "./themed-text";

const AudioPlayButton = React.memo(function AudioPlayButton({
  previewUrl,
}: {
  previewUrl: string;
}) {
  const isPlaying = useAudioPlayerStore((state) => state.isPlaying(previewUrl));
  const toggle = useAudioPlayerStore((state) => state.toggle);

  return (
    <View style={styles.playButtonOverlay}>
      <IconButton
        icon={isPlaying ? "pause" : "play"}
        iconSize={24}
        onPress={(e?: any) => {
          e?.stopPropagation?.();
          toggle(previewUrl);
        }}
      />
    </View>
  );
});

interface TileProps {
  imageSource?: string;
  title: string;
  subtitle?: string;
  metadata?: string;
  avatars?: string[];
  stats?: ProjectEnrichedType;
  previewUrl?: string;
  onPress?(): void;
}

export const Tile: React.FunctionComponent<TileProps> = React.memo(
  function Tile({
    imageSource,
    title,
    subtitle,
    metadata,
    avatars,
    stats,
    previewUrl,
    onPress,
  }) {
    return (
      <Pressable onPress={onPress}>
        <View style={styles.container}>
          <View style={styles.leftContainer}>
            <View style={styles.avatarContainer}>
              <Avatar source={imageSource} size="large" shape="square" />
              {previewUrl && <AudioPlayButton previewUrl={previewUrl} />}
            </View>
            <View style={styles.textContainer}>
              <ThemedText type="h5" numberOfLines={1} ellipsizeMode="tail">
                {title}
              </ThemedText>
              {subtitle && (
                <ThemedText
                  color="dimmed"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {subtitle}
                </ThemedText>
              )}
              {metadata && (
                <ThemedText numberOfLines={1} ellipsizeMode="tail">
                  {metadata}
                </ThemedText>
              )}
            </View>
          </View>
          <View style={styles.rightContainer}>
            {avatars && avatars.length > 0 && (
              <AvatarGroup avatars={avatars} max={2} />
            )}
            {stats && <ProjectStats data={stats} />}
          </View>
        </View>
      </Pressable>
    );
  },
  (prev, next) =>
    prev.imageSource === next.imageSource &&
    prev.title === next.title &&
    prev.subtitle === next.subtitle &&
    prev.metadata === next.metadata &&
    prev.previewUrl === next.previewUrl &&
    prev.avatars?.length === next.avatars?.length &&
    (prev.avatars ?? []).every((v, i) => v === next.avatars?.[i]) &&
    prev.stats?.id === next.stats?.id &&
    prev.stats?.status === next.stats?.status &&
    prev.stats?.bookings?.length === next.stats?.bookings?.length &&
    prev.stats?.watchings?.length === next.stats?.watchings?.length,
);

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    padding: theme.gap(1),
    borderRadius: theme.gap(2),
    backgroundColor: theme.colors.foreground,
  },
  leftContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: theme.gap(1),
  },
  rightContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  textContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  avatarContainer: {
    position: "relative",
  },
  playButtonOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
}));
