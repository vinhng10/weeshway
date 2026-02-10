import { WISH_STATUS } from "@/constants";
import { useAudioPlayerStore } from "@/hooks";
import { WishStatusType } from "@/types";
import { ImageProps } from "expo-image";
import { LinearGradientProps } from "expo-linear-gradient";
import React, { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Avatar } from "./avatar";
import { IconButton } from "./input/icon-button";
import { ThemedText } from "./themed-text";

interface TileProps {
  imageSource?: ImageProps["source"];
  title: string;
  subtitle?: string;
  metadata?: string;
  backgroundColor?: WishStatusType;
  avatar?: ReactNode;
  status?: ReactNode;
  previewUrl?: string;
  onPress?(): void;
}

export const Tile: React.FunctionComponent<TileProps> = ({
  imageSource,
  title,
  subtitle,
  metadata,
  backgroundColor,
  avatar,
  status,
  previewUrl,
  onPress,
}) => {
  const isPlaying = useAudioPlayerStore((state) => state.isPlaying(previewUrl));
  const toggle = useAudioPlayerStore((state) => state.toggle);

  const handleAudioPlayer = (e?: any) => {
    if (!previewUrl) return;
    e?.stopPropagation?.();
    toggle(previewUrl);
  };

  const getBackgroundColor = (): LinearGradientProps["colors"] => {
    switch (backgroundColor) {
      case WISH_STATUS.CLASS_AVAILABLE:
        return ["#558200", "#135700"];
      case WISH_STATUS.GRANTED:
        return ["#558200", "#135700"];
      default:
        return ["#1B1B1B", "#1B1B1B"];
    }
  };

  return (
    <Pressable onPress={onPress}>
      <View
        style={styles.container}
        // colors={getBackgroundColor()}
        // start={{ x: 0, y: 0 }}
        // end={{ x: 1, y: 0 }}
      >
        <View style={styles.leftContainer}>
          <View style={styles.avatarContainer}>
            <Avatar source={imageSource} size="large" shape="square" />
            {previewUrl && (
              <View style={styles.playButtonOverlay}>
                <IconButton
                  icon={isPlaying ? "pause" : "play"}
                  iconSize={24}
                  onPress={handleAudioPlayer}
                />
              </View>
            )}
          </View>
          <View style={styles.textContainer}>
            <ThemedText type="h5" numberOfLines={1} ellipsizeMode="tail">
              {title}
            </ThemedText>
            {subtitle && (
              <ThemedText color="dimmed" numberOfLines={1} ellipsizeMode="tail">
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
          <View>{avatar}</View>
          <View>{status}</View>
        </View>
      </View>
    </Pressable>
  );
};

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
    gap: theme.gap(0.5),
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
