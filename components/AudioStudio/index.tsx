import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as DocumentPicker from "expo-document-picker";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { ControlBar } from "./components/ControlBar";
import { DisplayArea } from "./components/DisplayArea";
import { Track } from "./components/Track";
import { useItemStore } from "./hooks/useState";
import { useVoiceCommands } from "./hooks/useVoiceCommands";
import { useWakeWordDetection } from "./hooks/useWakeWordDetection";
import { AudioPlayerAction } from "./types";
import {
  addPaddingToMergedItems,
  mapUserIdsToIndices,
  mergeConsecutiveItems,
} from "./utils";

export default function AudioStudio() {
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(0);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [type, setType] = useState<"musics" | "counts">("musics");

  // Zustand stores
  const {
    states,
    sources,
    initialize,
    split,
    merge,
    setSelectedByIndices,
    getSelected,
    setSource,
  } = useItemStore();
  const musicPlayer = useAudioPlayer(sources.musics);
  const musicStatus = useAudioPlayerStatus(musicPlayer);
  const countPlayer = useAudioPlayer(sources.counts);
  const countStatus = useAudioPlayerStatus(countPlayer);
  const player = { musics: musicPlayer, counts: countPlayer };
  const status = { musics: musicStatus, counts: countStatus };

  const { wakeTriggerAt, startWakeWordRecorder, stopWakeWordRecorder } =
    useWakeWordDetection(wakeWordEnabled, sources.musics);

  const handleAudioAction = (action: AudioPlayerAction) => {
    if (!action) return;
    if (action.action === "stop") {
      try {
        player[type].pause();
      } catch {}
      return;
    }

    const indices = mapUserIdsToIndices(action.routines, states.musics.length);
    if (indices.length === 0) return;

    setSelectedByIndices("musics", indices);

    const firstIndex = indices[0];
    const firstItem = states.musics[firstIndex];
    if (firstItem) {
      try {
        player[type].seekTo(firstItem.startTime);
        setCurrentItemIndex(0);
        player[type].play();
      } catch (e) {
        console.warn("Failed to start playback from voice command", e);
      }
    }
  };

  const { recognizing, transcript, startSpeechRecognition } = useVoiceCommands({
    player: player[type],
    onAudioAction: handleAudioAction,
    onWakeWordRecorderStart: startWakeWordRecorder,
    onWakeWordRecorderStop: stopWakeWordRecorder,
  });

  // Initialize routines when audio is loaded
  useEffect(() => {
    if (status[type].duration > 0 && states[type].length === 0) {
      initialize(type, status[type].duration);
    }
  }, [status[type].duration]);

  // React to wake word detection
  useEffect(() => {
    if (!wakeTriggerAt) return;
    startSpeechRecognition();
  }, [wakeTriggerAt]);

  const loadAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
      });

      if (!result.canceled && result.assets[0]) {
        const { uri } = result.assets[0];

        // Reset states for new song
        setCurrentItemIndex(0);

        // Set new audio source
        setSource(type, uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load audio file");
      console.error("Error loading audio:", error);
    }
  };

  const togglePlayback = () => {
    try {
      if (status[type].playing) {
        player[type].pause();
      } else {
        const selectedItems = getSelected(type);

        if (selectedItems.length > 0) {
          // Use merged routines with padding for smoother playback
          const mergedItems = mergeConsecutiveItems(selectedItems);
          const paddedItems = addPaddingToMergedItems(
            mergedItems,
            status[type].duration,
            2
          );
          const firstItem = paddedItems[0];
          player[type].seekTo(firstItem.startTime);
          setCurrentItemIndex(0);
        }

        player[type].play();
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
        type={type}
        isPlaying={status[type].playing}
        wakeWordEnabled={wakeWordEnabled}
        onLoadAudio={loadAudioFile}
        onTogglePlayback={togglePlayback}
        onSplit={() => split(type, status[type].currentTime)}
        onMerge={() => merge(type)}
        onToggleWakeWord={toggleWakeWordDetection}
        onToggleType={() => setType(type === "musics" ? "counts" : "musics")}
      />

      <View style={styles.tracksContainer}>
        <Track
          type="musics"
          player={musicPlayer}
          status={musicStatus}
          currentItemIndex={currentItemIndex}
          onItemIndexChange={setCurrentItemIndex}
        />
        <Track
          type="counts"
          player={countPlayer}
          status={countStatus}
          currentItemIndex={currentItemIndex}
          onItemIndexChange={setCurrentItemIndex}
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
