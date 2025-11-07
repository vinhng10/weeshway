import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

interface IControlBarProps {
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

export const ControlBar: React.FC<IControlBarProps> = ({
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
  return (
    <View style={styles.controlBar}>
      <Pressable
        style={[styles.controlButton, styles.typeToggleButton]}
        onPress={onToggleType}
      >
        <MaterialIcons
          name={type === "music" ? "music-note" : "format-list-numbered"}
          size={26}
          color={type === "music" ? "#FFD700" : "#00BFFF"}
        />
      </Pressable>

      <Pressable style={styles.controlButton} onPress={onLoadAudio}>
        <Ionicons name="folder-open" size={26} color="white" />
      </Pressable>

      <Pressable style={styles.controlButton} onPress={onTogglePlayback}>
        <Ionicons name={isPlaying ? "stop" : "play"} size={26} color="white" />
      </Pressable>

      <Pressable style={styles.controlButton} onPress={onSplit}>
        <Ionicons name="cut" size={26} color="white" />
      </Pressable>

      <Pressable style={styles.controlButton} onPress={onMerge}>
        <Ionicons name="git-merge" size={26} color="white" />
      </Pressable>

      <Pressable
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
      </Pressable>
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
  typeToggleButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
  },
});
