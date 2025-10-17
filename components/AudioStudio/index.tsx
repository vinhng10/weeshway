import Ionicons from "@expo/vector-icons/Ionicons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ControlBar } from "./components/ControlBar";
import { DisplayArea } from "./components/DisplayArea";
import { Track } from "./components/Track";
import { useProjectStore } from "./hooks/useProjectStore";
import { useVoiceCommands } from "./hooks/useVoiceCommands";
import { useWakeWordDetection } from "./hooks/useWakeWordDetection";
import { IAudioPlayerAction } from "./types";
import {
  addPaddingToMergedItems,
  mapToIndices,
  mergeConsecutiveItems,
} from "./utils";

interface AudioStudioProps {
  projectId: string;
  initialType?: "music" | "count";
  autoPlay?: boolean;
}

export default function AudioStudio({
  projectId,
  initialType = "music",
  autoPlay = false,
}: AudioStudioProps) {
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(0);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [type, setType] = useState<"music" | "count">(initialType);
  const [autoPlaybackType, setAutoPlaybackType] = useState<
    "music" | "count" | null
  >(autoPlay ? initialType : null);
  const router = useRouter();

  // Zustand store selectors
  const project = useProjectStore(
    (state) => state.projects.find((item) => item.id === projectId) ?? null
  );
  const initialize = useProjectStore((state) => state.initialize);
  const split = useProjectStore((state) => state.split);
  const merge = useProjectStore((state) => state.merge);
  const setSelectedByIndices = useProjectStore(
    (state) => state.setSelectedByIndices
  );
  const getSelected = useProjectStore((state) => state.getSelected);
  const setSource = useProjectStore((state) => state.setSource);

  useEffect(() => {
    setType(initialType);
  }, [initialType]);

  useEffect(() => {
    if (autoPlay) {
      setAutoPlaybackType(initialType);
    } else {
      setAutoPlaybackType(null);
    }
  }, [autoPlay, initialType]);

  useEffect(() => {
    setCurrentItemIndex(0);
  }, [projectId]);
  const musicItems = project?.items.music ?? [];
  const countItems = project?.items.count ?? [];
  const musicPlayer = useAudioPlayer(project?.sources.music ?? null);
  const musicStatus = useAudioPlayerStatus(musicPlayer);
  const countPlayer = useAudioPlayer(project?.sources.count ?? null);
  const countStatus = useAudioPlayerStatus(countPlayer);
  const player = { music: musicPlayer, count: countPlayer };
  const status = { music: musicStatus, count: countStatus };

  const { wakeTriggerAt, startWakeWordRecorder, stopWakeWordRecorder } =
    useWakeWordDetection(wakeWordEnabled, project?.sources.music ?? null);

  const handleAudioAction = (action: IAudioPlayerAction) => {
    if (!project) return;
    if (!action) return;
    if (action.action === "stop") {
      try {
        player[action.type].pause();
      } catch {}
      return;
    }

    const projectItems = project.items[action.type] ?? [];
    const indices = mapToIndices(action.items, projectItems.length);
    if (indices.length === 0) return;

    setSelectedByIndices(project.id, action.type, indices);

    const firstIndex = indices[0];
    const firstItem = projectItems[firstIndex];
    if (firstItem) {
      try {
        player[action.type].seekTo(firstItem.startTime);
        setCurrentItemIndex(0);
        player[action.type].play();
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

  // Initialize items when audio is loaded
  useEffect(() => {
    if (!project) return;

    if (musicStatus.duration > 0 && musicItems.length === 0) {
      initialize(project.id, "music", musicStatus.duration);
    }
    if (countStatus.duration > 0 && countItems.length === 0) {
      initialize(project.id, "count", countStatus.duration);
    }
  }, [
    project,
    project?.id,
    musicItems.length,
    countItems.length,
    musicStatus.duration,
    countStatus.duration,
    initialize,
  ]);

  // React to wake word detection
  useEffect(() => {
    if (!wakeTriggerAt) return;
    startSpeechRecognition();
  }, [wakeTriggerAt]);

  const loadAudioFile = async () => {
    if (!project) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
      });

      if (!result.canceled && result.assets[0]) {
        const { uri } = result.assets[0];

        // Reset items for new song
        setCurrentItemIndex(0);

        // Set new audio source
        setSource(project.id, type, uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load audio file");
      console.error("Error loading audio:", error);
    }
  };

  const togglePlayback = () => {
    if (!project) return;
    try {
      if (status[type].playing) {
        player[type].pause();
      } else {
        const selectedItems = getSelected(project.id, type);

        if (selectedItems.length > 0) {
          // Use merged items with padding for smoother playback
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

  const handleBackToProjects = () => {
    try {
      player.music.pause();
      player.count.pause();
    } catch {}
    setCurrentItemIndex(0);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/project");
    }
  };

  useEffect(() => {
    if (!project || !autoPlaybackType) {
      return;
    }

    setType(autoPlaybackType);

    const isMusic = autoPlaybackType === "music";
    const targetPlayer = isMusic ? musicPlayer : countPlayer;
    const targetDuration = isMusic
      ? musicStatus.duration
      : countStatus.duration;

    if (targetDuration > 0) {
      try {
        targetPlayer.seekTo(0);
        targetPlayer.play();
      } catch (error) {
        console.warn("Failed to start playback for project shortcut", error);
      } finally {
        setAutoPlaybackType(null);
      }
    }
  }, [
    autoPlaybackType,
    project,
    musicStatus.duration,
    countStatus.duration,
    musicPlayer,
    countPlayer,
  ]);

  if (!project) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Project not found</Text>
          <Text style={styles.emptyStateSubtitle}>
            Select a project from the list to start editing audio.
          </Text>
          <TouchableOpacity
            style={[styles.createButton, styles.emptyCreateButton]}
            onPress={() => router.replace("/(tabs)/project")}
          >
            <Ionicons name="albums" size={20} color="#ffffff" />
            <Text style={styles.createButtonText}>Back to Projects</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.studioHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToProjects}
        >
          <Ionicons name="chevron-back" size={22} color="#ffffff" />
          <Text style={styles.backButtonText}>Projects</Text>
        </TouchableOpacity>
        <Text style={styles.studioTitle}>{project.name}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <DisplayArea recognizing={recognizing} transcript={transcript} />

      <ControlBar
        type={type}
        isPlaying={status[type].playing}
        wakeWordEnabled={wakeWordEnabled}
        onLoadAudio={loadAudioFile}
        onTogglePlayback={togglePlayback}
        onSplit={() => split(project.id, type, status[type].currentTime ?? 0)}
        onMerge={() => merge(project.id, type)}
        onToggleWakeWord={toggleWakeWordDetection}
        onToggleType={() => setType(type === "music" ? "count" : "music")}
      />

      <View style={styles.tracksContainer}>
        <Track
          type="music"
          projectId={project.id}
          items={musicItems}
          player={musicPlayer}
          status={musicStatus}
          currentItemIndex={currentItemIndex}
          onItemIndexChange={setCurrentItemIndex}
        />
        <Track
          type="count"
          projectId={project.id}
          items={countItems}
          player={countPlayer}
          status={countStatus}
          currentItemIndex={currentItemIndex}
          onItemIndexChange={setCurrentItemIndex}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  projectListWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    backgroundColor: "#0f0f0f",
  },
  projectListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  projectListTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
  },
  projectList: {
    paddingBottom: 24,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#2b6be6",
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: "#b5b5b5",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyCreateButton: {
    backgroundColor: "#2b6be6",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#1d1d1d",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 16,
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333333",
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#ffffff",
    backgroundColor: "#121212",
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 24,
  },
  modalButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 12,
  },
  modalCancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  modalConfirmButton: {
    backgroundColor: "#2b6be6",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  studioHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#121212",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 4,
  },
  studioTitle: {
    flex: 1,
    textAlign: "center",
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 72,
  },
  tracksContainer: {
    flexDirection: "column",
    height: 200,
  },
});
