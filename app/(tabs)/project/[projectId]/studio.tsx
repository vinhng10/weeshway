import { Header } from "@/components/header";
import { ControlBar, DisplayArea, Track } from "@/components/studio";
import { StudioItemEnum } from "@/constants";
import { useAudioPlayerStore } from "@/hooks/useAudioPlayerStore";
import { createStudioStore } from "@/hooks/useStudioStore";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  const {
    player,
    replace,
    status,
    toggle: toggleAudio,
    pause,
  } = useAudioPlayerStore(
    useShallow((state) => ({
      player: state.player,
      replace: state.replace,
      status: state.status,
      toggle: state.toggle,
      pause: state.pause,
    }))
  );
  const [currentType, setCurrentType] = useState<StudioItemEnum>(
    StudioItemEnum.Song
  );
  const nextType = {
    [StudioItemEnum.Song]: StudioItemEnum.Count,
    [StudioItemEnum.Count]: StudioItemEnum.Song,
  };

  useEffect(() => {
    syncFromServer();
    return () => {
      pause();
      reset();
      syncToServer();
    };
  }, []);

  useEffect(() => {
    if (!studio.song.source || !studio.count.source) return;
    replace(studio[currentType].source);
  }, [studio.song.source, studio.count.source]);

  useEffect(() => {
    if (!status?.didJustFinish) return;
    pause();
  }, [status?.didJustFinish]);

  const handleSplit = () => {
    split(currentType, studio[currentType].time);
  };

  const handleMerge = () => {
    merge(currentType);
  };

  const handleToggleType = useCallback(
    (type: StudioItemEnum) => {
      if (type === currentType) return;
      const next = nextType[currentType];
      setCurrentType(next);
      replace(studio[next].source);
      player?.seekTo(studio[next].time);
      pause();
    },
    [studio, currentType]
  );

  const handleTogglePlayback = useCallback(() => {
    toggleAudio(studio[currentType].source, false);
  }, [studio, currentType]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header title="Studio" />

      <View style={styles.studioContainer}>
        <DisplayArea recognizing={true} transcript={""} />

        <ControlBar
          isPlaying={status?.playing ?? false}
          onLoadAudio={() => {}}
          onTogglePlayback={handleTogglePlayback}
          onSplit={handleSplit}
          onMerge={handleMerge}
          wakeWordEnabled={false}
          onToggleWakeWord={() => {}}
        />

        <View style={styles.tracksContainer}>
          <Track
            type={StudioItemEnum.Song}
            useStudioStore={useStudioStore}
            disabled={currentType !== StudioItemEnum.Song}
            onPress={() => handleToggleType(StudioItemEnum.Song)}
          />
          <Track
            type={StudioItemEnum.Count}
            useStudioStore={useStudioStore}
            disabled={currentType !== StudioItemEnum.Count}
            onPress={() => handleToggleType(StudioItemEnum.Count)}
          />
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
