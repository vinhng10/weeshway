import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface ControlBarProps {
  isPlaying: boolean;
  wakeWordEnabled: boolean;
  onLoadAudio: () => void;
  onLoadCountAudio: () => void;
  onPlayCountAudio: () => void;
  onTogglePlayback: () => void;
  onSplit: () => void;
  onMerge: () => void;
  onToggleWakeWord: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isPlaying,
  wakeWordEnabled,
  onLoadAudio,
  onLoadCountAudio,
  onPlayCountAudio,
  onTogglePlayback,
  onSplit,
  onMerge,
  onToggleWakeWord,
}) => {
  return (
    <View style={styles.controlBar}>
      <TouchableOpacity style={styles.controlButton} onPress={onLoadAudio}>
        <Ionicons name="musical-notes" size={26} color="white" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.controlButton} onPress={onLoadCountAudio}>
        <Ionicons name="mic" size={26} color="white" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.controlButton} onPress={onPlayCountAudio}>
        <Ionicons name="play-circle" size={26} color="white" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.controlButton} onPress={onTogglePlayback}>
        <Ionicons name={isPlaying ? "stop" : "play"} size={26} color="white" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.controlButton} onPress={onSplit}>
        <Ionicons name="cut" size={26} color="white" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.controlButton} onPress={onMerge}>
        <Ionicons name="git-merge" size={26} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.controlButton,
          wakeWordEnabled && styles.controlButtonActive,
        ]}
        onPress={onToggleWakeWord}
      >
        <Ionicons
          name={wakeWordEnabled ? "sparkles" : "sparkles-outline"}
          size={26}
          color={wakeWordEnabled ? "#4CAF50" : "white"}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  controlBar: {
    height: 50,
    backgroundColor: "#222",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  controlButton: {
    minHeight: "100%",
    minWidth: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  controlButtonActive: {
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    borderRadius: 8,
  },
});
