import { Header } from "@/components/header";
import { ControlBar, DisplayArea, Track } from "@/components/studio";
import { PIXELS_PER_SECOND, StudioItemEnum } from "@/constants";
import { useAudioPlayerStore } from "@/hooks/useAudioPlayerStore";
import { createStudioStore } from "@/hooks/useStudioStore";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
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
  const songOffset = useSharedValue(0);
  const countOffset = useSharedValue(0);

  const getTime = (type: StudioItemEnum) => {
    const offset =
      type === StudioItemEnum.Song ? songOffset.value : countOffset.value;
    return offset / PIXELS_PER_SECOND;
  };

  useEffect(() => {
    syncFromServer();
    return () => {
      pause();
      syncToServer();
    };
  }, []);

  useEffect(() => {
    if (!songUrl || !countUrl) return;
    replace(currentType === StudioItemEnum.Song ? songUrl : countUrl);
  }, [songUrl, countUrl]);

  const handleSplit = () => {
    split(currentType, getTime(currentType));
  };

  const handleMerge = () => {
    merge(currentType);
  };

  const handleToggleType = useCallback(() => {
    if (currentType === StudioItemEnum.Song) {
      setCurrentType(StudioItemEnum.Count);
      replace(countUrl);
      player?.seekTo(getTime(StudioItemEnum.Count));
    } else {
      setCurrentType(StudioItemEnum.Song);
      replace(songUrl);
      player?.seekTo(getTime(StudioItemEnum.Song));
    }
    pause();
  }, [songUrl, countUrl]);

  const handleTogglePlayback = () => {
    const currentSource =
      currentType === StudioItemEnum.Song ? songUrl : countUrl;
    if (!currentSource) return;
    toggleAudio(currentSource, false);
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
          onToggleType={handleToggleType}
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
            source={songUrl}
            offset={songOffset}
            items={songItems}
            onItemPress={toggle}
          />
          <Track
            type={StudioItemEnum.Count}
            source={countUrl}
            offset={countOffset}
            items={countItems}
            onItemPress={toggle}
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
