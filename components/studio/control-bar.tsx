import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { IconButton } from "../input/icon-button";

interface ControlBarProps {
  isPlaying: boolean;
  isRecording: boolean;
  wakeWordEnabled: boolean;
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
  onLoadAudio,
  onRecordAudio,
  onTogglePlayback,
  onSplit,
  onMerge,
  onToggleWakeWord,
}: ControlBarProps) => {
  return (
    <View style={styles.container}>
      <IconButton
        icon={"folder.fill"}
        onPress={onLoadAudio}
        iconSize={26}
        type="transparent"
      />

      <IconButton
        icon={isRecording ? "mic.slash" : "mic"}
        onPress={onRecordAudio}
        iconSize={26}
        type="transparent"
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
