import Ionicons from "@expo/vector-icons/Ionicons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as DocumentPicker from "expo-document-picker";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ControlBar } from "./components/ControlBar";
import { DisplayArea } from "./components/DisplayArea";
import { ProjectList } from "./components/ProjectList";
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

export default function AudioStudio() {
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(0);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [type, setType] = useState<"music" | "count">("music");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [pendingPlayback, setPendingPlayback] = useState<{
    projectId: string;
    type: "music" | "count";
  } | null>(null);

  // Zustand stores
  const {
    projects,
    addProject,
    removeProject,
    initialize,
    split,
    merge,
    setSelectedByIndices,
    getSelected,
    setSource,
  } = useProjectStore();
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );
  const musicItems = selectedProject?.items.music ?? [];
  const countItems = selectedProject?.items.count ?? [];
  const musicPlayer = useAudioPlayer(selectedProject?.sources.music ?? null);
  const musicStatus = useAudioPlayerStatus(musicPlayer);
  const countPlayer = useAudioPlayer(selectedProject?.sources.count ?? null);
  const countStatus = useAudioPlayerStatus(countPlayer);
  const player = { music: musicPlayer, count: countPlayer };
  const status = { music: musicStatus, count: countStatus };

  const { wakeTriggerAt, startWakeWordRecorder, stopWakeWordRecorder } =
    useWakeWordDetection(
      wakeWordEnabled,
      selectedProject?.sources.music ?? null
    );

  const handleAudioAction = (action: IAudioPlayerAction) => {
    if (!selectedProject) return;
    if (!action) return;
    if (action.action === "stop") {
      try {
        player[action.type].pause();
      } catch {}
      return;
    }

    const projectItems = selectedProject.items[action.type] ?? [];
    const indices = mapToIndices(action.items, projectItems.length);
    if (indices.length === 0) return;

    setSelectedByIndices(selectedProject.id, action.type, indices);

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
    if (!selectedProject) return;

    if (musicStatus.duration > 0 && musicItems.length === 0) {
      initialize(selectedProject.id, "music", musicStatus.duration);
    }
    if (countStatus.duration > 0 && countItems.length === 0) {
      initialize(selectedProject.id, "count", countStatus.duration);
    }
  }, [
    selectedProject,
    selectedProject?.id,
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
    if (!selectedProject) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
      });

      if (!result.canceled && result.assets[0]) {
        const { uri } = result.assets[0];

        // Reset items for new song
        setCurrentItemIndex(0);

        // Set new audio source
        setSource(selectedProject.id, type, uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load audio file");
      console.error("Error loading audio:", error);
    }
  };

  const togglePlayback = () => {
    if (!selectedProject) return;
    try {
      if (status[type].playing) {
        player[type].pause();
      } else {
        const selectedItems = getSelected(selectedProject.id, type);

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
    setSelectedProjectId(null);
    setPendingPlayback(null);
    setCurrentItemIndex(0);
  };

  useEffect(() => {
    if (
      !pendingPlayback ||
      !selectedProject ||
      pendingPlayback.projectId !== selectedProject.id
    ) {
      return;
    }

    const isMusic = pendingPlayback.type === "music";
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
        setPendingPlayback(null);
      }
    }
  }, [
    pendingPlayback,
    selectedProject,
    selectedProject?.id,
    musicStatus.duration,
    countStatus.duration,
    musicPlayer,
    countPlayer,
  ]);

  useEffect(() => {
    if (!selectedProjectId) {
      setCurrentItemIndex(0);
    }
  }, [selectedProjectId]);

  if (!selectedProject) {
    return (
      <View style={styles.container}>
        <ProjectList
          projects={projects}
          selectedProjectId={selectedProjectId}
          musicPlayer={musicPlayer}
          countPlayer={countPlayer}
          onSetSelectedProjectId={setSelectedProjectId}
          onSetPendingPlayback={setPendingPlayback}
          onSetCurrentItemIndex={setCurrentItemIndex}
          onSetType={setType}
          addProject={addProject}
          removeProject={removeProject}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.studioHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToProjects}
        >
          <Ionicons name="chevron-back" size={22} color="#ffffff" />
          <Text style={styles.backButtonText}>Projects</Text>
        </TouchableOpacity>
        <Text style={styles.studioTitle}>{selectedProject.name}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <DisplayArea recognizing={recognizing} transcript={transcript} />

      <ControlBar
        type={type}
        isPlaying={status[type].playing}
        wakeWordEnabled={wakeWordEnabled}
        onLoadAudio={loadAudioFile}
        onTogglePlayback={togglePlayback}
        onSplit={() =>
          split(selectedProject.id, type, status[type].currentTime ?? 0)
        }
        onMerge={() => merge(selectedProject.id, type)}
        onToggleWakeWord={toggleWakeWordDetection}
        onToggleType={() => setType(type === "music" ? "count" : "music")}
      />

      <View style={styles.tracksContainer}>
        <Track
          type="music"
          projectId={selectedProject.id}
          items={musicItems}
          player={musicPlayer}
          status={musicStatus}
          currentItemIndex={currentItemIndex}
          onItemIndexChange={setCurrentItemIndex}
        />
        <Track
          type="count"
          projectId={selectedProject.id}
          items={countItems}
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
