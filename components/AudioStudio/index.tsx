import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as DocumentPicker from "expo-document-picker";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { ControlBar } from "./components/ControlBar";
import { CountTrack } from "./components/CountTrack";
import { DisplayArea } from "./components/DisplayArea";
import { MusicTrack } from "./components/MusicTrack";
import { useRoutines } from "./hooks/useRoutines";
import { useVoiceCommands } from "./hooks/useVoiceCommands";
import { useWakeWordDetection } from "./hooks/useWakeWordDetection";
import { AudioPlayerAction } from "./types";
import {
  addPaddingToMergedRoutines,
  mapUserIdsToIndices,
  mergeConsecutiveRoutines,
} from "./utils";

export default function AudioStudio() {
  const [audioSource, setAudioSource] = useState<string | null>(null);
  const player = useAudioPlayer(audioSource ? { uri: audioSource } : null);
  const status = useAudioPlayerStatus(player);
  const [currentRoutineIndex, setCurrentRoutineIndex] = useState<number>(0);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);

  const duration = status.duration || 0;

  // Custom hooks
  const {
    routines,
    setRoutines,
    toggleRoutineSelection,
    getSelectedRoutines,
    handleSplit,
    handleMerge,
    selectRoutinesByIndices,
  } = useRoutines(duration);

  const { wakeTriggerAt, startWakeWordRecorder, stopWakeWordRecorder } =
    useWakeWordDetection(wakeWordEnabled, audioSource);

  const handleAudioAction = (action: AudioPlayerAction) => {
    if (!action) return;
    if (action.action === "stop") {
      try {
        player.pause();
      } catch {}
      return;
    }

    const indices = mapUserIdsToIndices(action.routines, routines.length);
    if (indices.length === 0) return;

    selectRoutinesByIndices(indices);

    const firstIndex = indices[0];
    const firstRoutine = routines[firstIndex];
    if (firstRoutine) {
      try {
        player.seekTo(firstRoutine.musicStartTime);
        setCurrentRoutineIndex(0);
        player.play();
      } catch (e) {
        console.warn("Failed to start playback from voice command", e);
      }
    }
  };

  const { recognizing, transcript, startSpeechRecognition } = useVoiceCommands({
    player,
    onAudioAction: handleAudioAction,
    onWakeWordRecorderStart: startWakeWordRecorder,
    onWakeWordRecorderStop: stopWakeWordRecorder,
  });

  // React to wake word detection
  useEffect(() => {
    if (!wakeTriggerAt) return;
    startSpeechRecognition();
  }, [wakeTriggerAt]);

  const loadAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const { uri } = result.assets[0];

        // Stop playback if currently playing
        if (player.playing) {
          try {
            player.pause();
          } catch {}
        }

        // Reset states for new song
        setCurrentRoutineIndex(0);

        // Set new audio source (this will trigger duration change and routines reset)
        setAudioSource(uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load audio file");
      console.error("Error loading audio:", error);
    }
  };

  const loadCountAudio = async () => {
    try {
      const selectedRoutines = getSelectedRoutines();

      if (selectedRoutines.length !== 1) {
        Alert.alert(
          "Selection Error",
          "Please select exactly one routine to add count audio."
        );
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const { uri } = result.assets[0];
        const routineId = selectedRoutines[0].id;

        // For now, set count timing to match music timing
        // In a real implementation, you might want to analyze the audio file
        // to determine the appropriate count timing
        setRoutines((prevRoutines) =>
          prevRoutines.map((r) =>
            r.id === routineId
              ? {
                  ...r,
                  countStartTime: r.musicStartTime,
                  countEndTime: r.musicEndTime,
                  countSource: uri,
                }
              : r
          )
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load count audio file");
      console.error("Error loading count audio:", error);
    }
  };

  const togglePlayback = () => {
    try {
      if (player.playing) {
        player.pause();
      } else {
        const selectedRoutines = getSelectedRoutines();

        if (selectedRoutines.length > 0) {
          // Use merged routines with padding for smoother playback
          const mergedRoutines = mergeConsecutiveRoutines(selectedRoutines);
          const paddedRoutines = addPaddingToMergedRoutines(
            mergedRoutines,
            duration,
            2
          );
          const firstRoutine = paddedRoutines[0];
          player.seekTo(firstRoutine.musicStartTime);
          setCurrentRoutineIndex(0);
        }

        player.play();
      }
    } catch (error) {
      console.error("Playback error:", error);
    }
  };

  const toggleWakeWordDetection = async () => {
    if (wakeWordEnabled) {
      await stopWakeWordRecorder();
      setWakeWordEnabled(false);
    } else {
      setWakeWordEnabled(true);
    }
  };

  return (
    <View style={styles.container}>
      <DisplayArea recognizing={recognizing} transcript={transcript} />

      <ControlBar
        isPlaying={player.playing}
        wakeWordEnabled={wakeWordEnabled}
        onLoadAudio={loadAudioFile}
        onLoadCountAudio={loadCountAudio}
        onTogglePlayback={togglePlayback}
        onSplit={() => handleSplit(player.currentTime)}
        onMerge={handleMerge}
        onToggleWakeWord={toggleWakeWordDetection}
      />

      <View style={styles.tracksContainer}>
        <MusicTrack
          player={player}
          duration={duration}
          routines={routines}
          onRoutinePress={toggleRoutineSelection}
          selectedRoutines={getSelectedRoutines()}
          currentRoutineIndex={currentRoutineIndex}
          onRoutineIndexChange={setCurrentRoutineIndex}
        />
        <CountTrack
          player={player}
          duration={duration}
          routines={routines}
          onRoutinePress={toggleRoutineSelection}
          selectedRoutines={getSelectedRoutines()}
          currentRoutineIndex={currentRoutineIndex}
          onRoutineIndexChange={setCurrentRoutineIndex}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tracksContainer: {
    flexDirection: "column",
    height: 200,
  },
});
