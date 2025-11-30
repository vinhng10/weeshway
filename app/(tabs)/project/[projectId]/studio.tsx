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

  const { studio, split, merge, reset, syncToServer, syncFromServer } =
    useStudioStore(
      useShallow((state) => ({
        studio: state.studio,
        split: state.split,
        merge: state.merge,
        reset: state.reset,
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
  } = useAudioPlayerStore(
    useShallow((state) => ({
      player: state.player,
      isPlaying: state.isPlaying(activeSource),
      toggle: state.toggle,
      pause: state.pause,
      shouldPlay: state.shouldPlay,
      setShouldPlay: state.setShouldPlay,
    }))
  );

  useEffect(() => {
    syncFromServer();
    return () => {
      pause();
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
    setShouldPlay(!shouldPlay);
    toggleAudio(activeSource, false);
  };

  return (
    <View style={styles.container}>
      <Header title="Studio" />

      <View style={styles.studioContainer}>
        <DisplayArea recognizing={true} transcript="" />

        <ControlBar
          isPlaying={isPlaying}
          onLoadAudio={() => {}}
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
