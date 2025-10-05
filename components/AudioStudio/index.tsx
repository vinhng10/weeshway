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
import { useAudioParts } from "./hooks/useAudioParts";
import { useVoiceCommands } from "./hooks/useVoiceCommands";
import { useWakeWordDetection } from "./hooks/useWakeWordDetection";
import { AudioPlayerAction, PIXELS_PER_SECOND } from "./types";
import { mapUserIdsToIndices } from "./utils";

export default function AudioStudio() {
  const [audioSource, setAudioSource] = useState<string | null>(null);
  const player = useAudioPlayer(audioSource ? { uri: audioSource } : null);
  const status = useAudioPlayerStatus(player);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isManualScrolling, setIsManualScrolling] = useState(false);
  const [displayTime, setDisplayTime] = useState<number>(0);
  const scrollTimeoutRef = useRef<number | null>(null);
  const [currentPartIndex, setCurrentPartIndex] = useState<number>(0);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);

  const duration = status.duration || 0;
  const trackWidth = duration * PIXELS_PER_SECOND;

  // Custom hooks
  const {
    parts,
    togglePartSelection,
    getSelectedParts,
    handleSplit,
    handleMerge,
    selectPartsByIndices,
  } = useAudioParts(duration);

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

    const indices = mapUserIdsToIndices(action.parts, parts.length);
    if (indices.length === 0) return;

    selectPartsByIndices(indices);

    const firstIndex = indices[0];
    const firstPart = parts[firstIndex];
    if (firstPart) {
      try {
        player.seekTo(firstPart.startTime);
        setCurrentPartIndex(0);
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

        // Handle part-based playback
        const selectedParts = getSelectedParts();
        if (selectedParts.length > 0) {
          const currentPart = selectedParts[currentPartIndex];

          if (currentPart && currentTime >= currentPart.endTime) {
            const nextIndex = currentPartIndex + 1;
            if (nextIndex < selectedParts.length) {
              const nextPart = selectedParts[nextIndex];
              player.seekTo(nextPart.startTime);
              setCurrentPartIndex(nextIndex);
            } else {
              player.pause();
              setCurrentPartIndex(0);
            }
          }
        }
      }, 10);

      return () => clearInterval(interval);
    }
  }, [player.playing, isManualScrolling, duration, currentPartIndex, parts]);

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
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (duration > 0 && trackWidth > 0) {
        const playbackTime = (scrollPosition / trackWidth) * duration;
        const clampedTime = Math.max(0, Math.min(playbackTime, duration));
        player.seekTo(clampedTime);
      }
      setIsManualScrolling(false);
    }, 100);
  };

  const loadAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const { uri } = result.assets[0];
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
        const selectedParts = getSelectedParts();

        if (selectedParts.length > 0) {
          const firstPart = selectedParts[0];
          player.seekTo(firstPart.startTime);
          setCurrentPartIndex(0);
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
        parts={parts}
        onScroll={handleScroll}
        onScrollBegin={handleScrollBegin}
        onScrollEnd={handleScrollEnd}
        onPartPress={togglePartSelection}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
