import { Header } from "@/components/header";
import { ControlBar, DisplayArea, Track } from "@/components/studio";
import { StudioItemEnum } from "@/constants";
import { useAudioPlayerStore } from "@/hooks/useAudioPlayerStore";
import { createStudioStore } from "@/hooks/useStudioStore";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
    songUrl,
    countUrl,
    songItems,
    countItems,
    toggle,
    split,
    merge,
    syncToServer,
    syncFromServer,
  } = useStudioStore(
    useShallow((state) => ({
      songUrl: state.songUrl,
      countUrl: state.countUrl,
      songItems: state.songItems,
      countItems: state.countItems,
      toggle: state.toggle,
      split: state.split,
      merge: state.merge,
      syncToServer: state.syncToServer,
      syncFromServer: state.syncFromServer,
    }))
  );
  const player = useAudioPlayerStore((state) => state.player);
  const {
    toggle: toggleAudio,
    pause,
    status,
  } = useAudioPlayerStore(
    useShallow((state) => ({
      toggle: state.toggle,
      pause: state.pause,
      status: state.status,
    }))
  );
  const [currentType, setCurrentType] = useState<StudioItemEnum>(
    StudioItemEnum.Song
  );
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    syncFromServer();
    return () => {
      pause();
      syncToServer();
    };
  }, []);

  const handleItemPress = (index: number) => {
    toggle(currentType, index);
  };

  const handleScrollEnd = (time: number) => {
    setCurrentTime(time);
    player?.seekTo(time);
  };

  const handleSplit = () => {
    split(currentType, currentTime);
  };

  const handleMerge = () => {
    merge(currentType);
  };

  const handleToggleType = () => {
    setCurrentType((prev) =>
      prev === StudioItemEnum.Song ? StudioItemEnum.Count : StudioItemEnum.Song
    );
  };

  const handleTogglePlayback = () => {
    const currentSource =
      currentType === StudioItemEnum.Song ? songUrl : countUrl;
    if (!currentSource) return;
    toggleAudio(currentSource);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header title="Studio" />

      <View style={styles.studioContainer}>
        <DisplayArea recognizing={true} transcript={""} />

        <ControlBar
          type={currentType}
          isPlaying={status?.playing ?? false}
          wakeWordEnabled={false}
          onLoadAudio={() => {}}
          onTogglePlayback={handleTogglePlayback}
          onSplit={handleSplit}
          onMerge={handleMerge}
          onToggleWakeWord={() => {}}
          onToggleType={handleToggleType}
        />

        <View style={styles.tracksContainer}>
          <Track
            items={songItems}
            onItemPress={handleItemPress}
            onScrollEnd={handleScrollEnd}
          />
          <Track
            items={countItems}
            onItemPress={handleItemPress}
            onScrollEnd={handleScrollEnd}
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
