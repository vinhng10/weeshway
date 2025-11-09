import { IconButton } from "@/components/icon-button";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface ControlBarProps {
  type: "music" | "count";
  isPlaying: boolean;
  wakeWordEnabled: boolean;
  onLoadAudio: any;
  onTogglePlayback: any;
  onSplit: any;
  onMerge: any;
  onToggleWakeWord: any;
  onToggleType: any;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  type,
  isPlaying,
  wakeWordEnabled,
  onLoadAudio,
  onTogglePlayback,
  onSplit,
  onMerge,
  onToggleWakeWord,
  onToggleType,
}) => {
  const typeIcon = type === "music" ? "music.note" : "list.number";

  return (
    <View style={styles.container}>
      <IconButton
        icon={typeIcon}
        onPress={onToggleType}
        iconSize={26}
        type="transparent"
      />

      <IconButton
        icon={"folder.fill"}
        onPress={onLoadAudio}
        iconSize={26}
        type="transparent"
      />

      <IconButton
        icon={isPlaying ? "stop" : "play"}
        onPress={onTogglePlayback}
        iconSize={26}
        type="transparent"
      />

      <IconButton
        icon={"scissors"}
        onPress={onSplit}
        iconSize={26}
        type="transparent"
      />

      <IconButton
        icon={"arrow.merge"}
        onPress={onMerge}
        iconSize={26}
        type="transparent"
      />

      <IconButton
        icon={"sparkles"}
        onPress={onToggleWakeWord}
        iconSize={26}
        type="transparent"
        style={wakeWordEnabled ? styles.enabled : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.foreground,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  enabled: {
    backgroundColor: "rgba(76, 175, 80, 0.2)",
  },
}));
