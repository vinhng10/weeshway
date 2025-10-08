import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as DocumentPicker from "expo-document-picker";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { ControlBar } from "./components/ControlBar";
import { DisplayArea } from "./components/DisplayArea";
import { Track } from "./components/Track";
import { useAudioRoutines } from "./hooks/useAudioRoutines";
import { useVoiceCommands } from "./hooks/useVoiceCommands";
import { useWakeWordDetection } from "./hooks/useWakeWordDetection";
import { AudioPlayerAction, PIXELS_PER_SECOND } from "./types";
import {
  addPaddingToMergedRoutines,
  mapUserIdsToIndices,
  mergeConsecutiveRoutines,
} from "./utils";

export default function AudioStudio() {
  const [audioSource, setAudioSource] = useState<string | null>(null);
  const player = useAudioPlayer(audioSource ? { uri: audioSource } : null);
  const status = useAudioPlayerStatus(player);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isManualScrolling, setIsManualScrolling] = useState(false);
  const [displayTime, setDisplayTime] = useState<number>(0);
  const [currentRoutineIndex, setCurrentRoutineIndex] = useState<number>(0);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);

  const duration = status.duration || 0;
  const trackWidth = duration * PIXELS_PER_SECOND;

  // Custom hooks
  const {
    routines,
    toggleRoutineSelection,
    getSelectedRoutines,
    handleSplit,
    handleMerge,
    selectRoutinesByIndices,
  } = useAudioRoutines(duration);

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
        player.seekTo(firstRoutine.startTime);
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

  // Auto-scroll based on playback time
  useEffect(() => {
    if (player.playing && !isManualScrolling && duration > 0) {
      const interval = setInterval(() => {
        const currentTime = player.currentTime || 0;
        const scrollPosition = currentTime * PIXELS_PER_SECOND;

        setDisplayTime(currentTime);

        scrollViewRef.current?.scrollTo({
          x: scrollPosition,
          animated: false,
        });

        // Handle routine-based playback (consecutive routines are merged with padding)
        const selectedRoutines = getSelectedRoutines();
        if (selectedRoutines.length > 0) {
          // Merge consecutive routines and add padding for smoother transitions
          const mergedRoutines = mergeConsecutiveRoutines(selectedRoutines);
          const paddedRoutines = addPaddingToMergedRoutines(
            mergedRoutines,
            duration,
            2
          );
          const currentRoutine = paddedRoutines[currentRoutineIndex];

          if (currentRoutine && currentTime >= currentRoutine.endTime) {
            const nextIndex = currentRoutineIndex + 1;
            if (nextIndex < paddedRoutines.length) {
              const nextRoutine = paddedRoutines[nextIndex];
              player.seekTo(nextRoutine.startTime);
              setCurrentRoutineIndex(nextIndex);
            } else {
              player.pause();
              setCurrentRoutineIndex(0);
            }
          }
        }
      }, 10);

      return () => clearInterval(interval);
    }
  }, [
    player.playing,
    isManualScrolling,
    duration,
    currentRoutineIndex,
    routines,
  ]);

  // React to wake word detection
  useEffect(() => {
    if (!wakeTriggerAt) return;
    startSpeechRecognition();
  }, [wakeTriggerAt]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!isManualScrolling) return;

    const scrollPosition = event.nativeEvent.contentOffset.x;

    if (duration > 0 && trackWidth > 0) {
      const playbackTime = (scrollPosition / trackWidth) * duration;
      const clampedTime = Math.max(0, Math.min(playbackTime, duration));
      setDisplayTime(clampedTime);
    }
  };

  const handleScrollBegin = () => {
    setIsManualScrolling(true);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (duration > 0 && trackWidth > 0) {
      const scrollPosition = event.nativeEvent.contentOffset.x;
      const playbackTime = (scrollPosition / trackWidth) * duration;
      const clampedTime = Math.max(0, Math.min(playbackTime, duration));
      player.seekTo(clampedTime);
    }
    setIsManualScrolling(false);
  };

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
        setDisplayTime(0);
        setIsManualScrolling(false);

        // Set new audio source (this will trigger duration change and routines reset)
        setAudioSource(uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load audio file");
      console.error("Error loading audio:", error);
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
          player.seekTo(firstRoutine.startTime);
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
        onTogglePlayback={togglePlayback}
        onSplit={() => handleSplit(displayTime)}
        onMerge={handleMerge}
        onToggleWakeWord={toggleWakeWordDetection}
      />

      <Track
        ref={scrollViewRef}
        duration={duration}
        displayTime={displayTime}
        routines={routines}
        onScroll={handleScroll}
        onScrollBegin={handleScrollBegin}
        onScrollEnd={handleScrollEnd}
        onRoutinePress={toggleRoutineSelection}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
