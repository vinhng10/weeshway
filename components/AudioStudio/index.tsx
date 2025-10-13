import * as DocumentPicker from "expo-document-picker";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import React, { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { ControlBar } from "./components/ControlBar";
import { CountTrack, CountTrackHandle } from "./components/CountTrack";
import { DisplayArea } from "./components/DisplayArea";
import { MusicTrack } from "./components/MusicTrack";
import { useRoutineStore } from "./hooks/useState";
import { useVoiceCommands } from "./hooks/useVoiceCommands";
import { useWakeWordDetection } from "./hooks/useWakeWordDetection";
import { AudioPlayerAction } from "./types";
import {
  addPaddingToMergedRoutines,
  mapUserIdsToIndices,
  mergeConsecutiveRoutines,
} from "./utils";

export default function AudioStudio() {
  const [currentRoutineIndex, setCurrentRoutineIndex] = useState<number>(0);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const countTrackRef = useRef<CountTrackHandle>(null);

  // Zustand stores
  const {
    routines,
    audioSource,
    initialize,
    split,
    merge,
    setSelectedByIndices,
    getSelected,
    getSelectedWithCount,
    setAudioSource,
    setCountSource,
  } = useRoutineStore();
  const player = useAudioPlayer(audioSource);
  const status = useAudioPlayerStatus(player);

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

    setSelectedByIndices(indices);

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

  // Initialize routines when audio is loaded
  useEffect(() => {
    if (status.duration > 0 && routines.length === 0) {
      initialize(status.duration);
    }
  }, [status.duration]);

  // React to wake word detection
  useEffect(() => {
    if (!wakeTriggerAt) return;
    startSpeechRecognition();
  }, [wakeTriggerAt]);

  const loadMusicFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
      });

      if (!result.canceled && result.assets[0]) {
        const { uri } = result.assets[0];

        // Stop playback if currently playing
        if (status.playing) {
          try {
            player.pause();
          } catch {}
        }

        // Reset states for new song
        setCurrentRoutineIndex(0);

        // Set new audio source
        setAudioSource(uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load audio file");
      console.error("Error loading audio:", error);
    }
  };

  const loadCountFile = async () => {
    try {
      // Check if exactly one routine is selected
      const selectedRoutines = getSelected();
      if (selectedRoutines.length !== 1) {
        Alert.alert(
          "Selection Required",
          "Please select exactly one routine to add count audio to."
        );
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
      });

      if (!result.canceled && result.assets[0]) {
        const { uri } = result.assets[0];

        // Set count source for the selected routine
        setCountSource(uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load count audio file");
      console.error("Error loading count audio:", error);
    }
  };

  const playSelectedCountAudio = () => {
    const routinesWithCount = getSelectedWithCount();

    if (routinesWithCount.length === 0) {
      Alert.alert(
        "No count audio",
        "Select at least one routine with count audio to play."
      );
      return;
    }

    countTrackRef.current?.playSelectedCounts();
  };

  const togglePlayback = () => {
    try {
      if (status.playing) {
        player.pause();
      } else {
        countTrackRef.current?.stopSelectedCounts();
        const selectedRoutines = getSelected();

        if (selectedRoutines.length > 0) {
          // Use merged routines with padding for smoother playback
          const mergedRoutines = mergeConsecutiveRoutines(selectedRoutines);
          const paddedRoutines = addPaddingToMergedRoutines(
            mergedRoutines,
            status.duration,
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
        isPlaying={status.playing}
        wakeWordEnabled={wakeWordEnabled}
        onLoadAudio={loadMusicFile}
        onLoadCountAudio={loadCountFile}
        onPlayCountAudio={playSelectedCountAudio}
        onTogglePlayback={togglePlayback}
        onSplit={() => split(status.currentTime)}
        onMerge={merge}
        onToggleWakeWord={toggleWakeWordDetection}
      />

      <View style={styles.tracksContainer}>
        <MusicTrack
          player={player}
          status={status}
          currentRoutineIndex={currentRoutineIndex}
          onRoutineIndexChange={setCurrentRoutineIndex}
        />
        <CountTrack
          player={player}
          status={status}
          currentRoutineIndex={currentRoutineIndex}
          onRoutineIndexChange={setCurrentRoutineIndex}
          ref={countTrackRef}
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
