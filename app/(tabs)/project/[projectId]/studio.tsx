// Studio.tsx
import { Header } from "@/components/header";
import { ControlBar, DisplayArea, Track } from "@/components/studio";
import { TrackEnum } from "@/constants";
import { useAudioPlayerStore } from "@/hooks/useAudioPlayerStore";
import { createStudioStore } from "@/hooks/useStudioStore";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useShallow } from "zustand/react/shallow";

export default function Studio() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();

  const useStudioStore = useMemo(
    () => createStudioStore(Number(projectId)),
    [projectId]
  );

  const {
    studio,
    split,
    merge,
    reset,
    initialize,
    syncToServer,
    syncFromServer,
  } = useStudioStore(
    useShallow((state) => ({
      studio: state.studio,
      split: state.split,
      merge: state.merge,
      reset: state.reset,
      initialize: state.initialize,
      syncToServer: state.syncToServer,
      syncFromServer: state.syncFromServer,
    }))
  );

  const activeSource = studio[studio.activeTrack].source;

  const {
    player,
    isPlaying,
    toggle: toggleAudio,
    pause,
    shouldPlay,
    setShouldPlay,
    pickAndLoadAudio,
    didJustFinish,
  } = useAudioPlayerStore(
    useShallow((state) => ({
      player: state.player,
      isPlaying: state.isPlaying(activeSource),
      toggle: state.toggle,
      pause: state.pause,
      shouldPlay: state.shouldPlay,
      setShouldPlay: state.setShouldPlay,
      pickAndLoadAudio: state.pickAndLoadAudio,
      didJustFinish: state.didJustFinish(activeSource),
    }))
  );

  useEffect(() => {
    syncFromServer();
    return () => {
      setShouldPlay(false);
      pause();
      player?.seekTo(0);
      reset();
      syncToServer();
    };
  }, []);

  const handleSplit = () => {
    if (!player) return;
    split(player.currentTime);
  };

  const handleMerge = () => {
    merge();
  };

  const handleTogglePlayback = () => {
    if (didJustFinish) return;
    setShouldPlay(!shouldPlay);
    toggleAudio(activeSource, false);
  };

  const handleLoadAudio = async () => {
    try {
      // Pick and load audio file (handles file picking, copying, and audio player replacement)
      const trackState = await pickAndLoadAudio();

      if (trackState) {
        // Save the new source and items to the studio store
        initialize(trackState);
      }
    } catch (error) {
      console.error("Error picking audio file:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Studio" />

      <View style={styles.studioContainer}>
        <DisplayArea recognizing={true} transcript="" />

        <ControlBar
          isPlaying={isPlaying}
          onLoadAudio={handleLoadAudio}
          onTogglePlayback={handleTogglePlayback}
          onSplit={handleSplit}
          onMerge={handleMerge}
          wakeWordEnabled={false}
          onToggleWakeWord={() => {}}
        />

        <View style={styles.tracksContainer}>
          <Track type={TrackEnum.Song} useStudioStore={useStudioStore} />
          <Track type={TrackEnum.Count} useStudioStore={useStudioStore} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
  },
  studioContainer: {
    flex: 1,
  },
  tracksContainer: {
    flexDirection: "column",
    gap: theme.gap(2),
  },
}));
