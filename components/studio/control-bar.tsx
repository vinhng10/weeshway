import { TEMPO } from "@/constants";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ChipBar, type ChipBarItemProps } from "../chip-bar";
import { IconButton } from "../input/icon-button";
import { ThemedText } from "../themed-text";

interface ControlBarProps {
  isPlaying: boolean;
  isRecording: boolean;
  wakeWordEnabled: boolean;
  playbackRate: string;
  onPlaybackRateChange: any;
  onLoadAudio: any;
  onRecordAudio: any;
  onTogglePlayback: any;
  onSplit: any;
  onMerge: any;
  onToggleWakeWord: any;
}

export const ControlBar = ({
  isPlaying,
  isRecording,
  wakeWordEnabled,
  playbackRate,
  onPlaybackRateChange,
  onLoadAudio,
  onRecordAudio,
  onTogglePlayback,
  onSplit,
  onMerge,
  onToggleWakeWord,
}: ControlBarProps) => {
  const options: ChipBarItemProps[] = [
    {
      label: "Tempo",
      value: playbackRate,
      options: TEMPO,
      onValueChange: onPlaybackRateChange,
      modal: false,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        <IconButton
          icon={"folder.fill"}
          onPress={onLoadAudio}
          iconSize={26}
          type="transparent"
        />

        <IconButton
          icon={"mic"}
          onPress={onRecordAudio}
          iconSize={26}
          type={isRecording ? "danger" : "transparent"}
        />

        <IconButton
          icon={isPlaying ? "pause" : "play"}
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

        {/* <IconButton
          icon={"sparkles"}
          onPress={onToggleWakeWord}
          iconSize={26}
          type="transparent"
          style={wakeWordEnabled ? styles.enabled : undefined}
        /> */}
      </View>
      <View style={styles.chipBarRow}>
        <ThemedText type="h5">Tempo</ThemedText>
        <ChipBar items={options} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.gap(1),
    paddingVertical: theme.gap(2),
  },
  chipBarRow: {
    paddingHorizontal: theme.gap(1),
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(2),
  },
  iconRow: {
    backgroundColor: theme.colors.foreground,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
}));
