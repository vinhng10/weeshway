import { Header } from "@/components/header";
import { ControlBar, DisplayArea, Track } from "@/components/studio";
import { TrackRef } from "@/components/studio/track";
import { StudioItemEnum } from "@/constants";
import { useAudioPlayerStore } from "@/hooks/useAudioPlayerStore";
import { createStudioStore } from "@/hooks/useStudioStore";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useShallow } from "zustand/react/shallow";

export default function Studio() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const songRef = useRef<TrackRef>(null);
  const countRef = useRef<TrackRef>(null);
  const trackRefs = {
    [StudioItemEnum.Song]: songRef,
    [StudioItemEnum.Count]: countRef,
  };
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
  const [currentType, setCurrentType] = useState<StudioItemEnum>(
    StudioItemEnum.Song
  );
  const {
    player,
    replace,
    isPlaying,
    toggle: toggleAudio,
    pause,
  } = useAudioPlayerStore(
    useShallow((state) => ({
      player: state.player,
      replace: state.replace,
      isPlaying: state.isPlaying(studio[currentType].source),
      toggle: state.toggle,
      pause: state.pause,
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

  useEffect(() => {
    if (!studio.song.source || !studio.count.source) return;
    replace(studio[currentType].source);
  }, [studio.song.source, studio.count.source]);

  const handleSplit = () => {
    if (!player) return;
    split(currentType, player.currentTime);
  };

  const handleMerge = () => {
    merge(currentType);
  };

  const handleTogglePlayback = useCallback(async () => {
    if (!trackRefs[currentType].current) return;
    await trackRefs[currentType].current.handleAutoScroll();
    toggleAudio(studio[currentType].source, false);
  }, [studio, currentType]);

  const handleTrackPress = useCallback((type: StudioItemEnum) => {
    Object.entries(trackRefs).forEach(([trackType, ref]) => {
      if (trackType !== type && ref.current) {
        ref.current.cancelAnimation();
      }
    });
    setCurrentType(type);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header title="Studio" />

      <View style={styles.studioContainer}>
        <DisplayArea recognizing={true} transcript={""} />

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
          <Track
            ref={songRef}
            type={StudioItemEnum.Song}
            useStudioStore={useStudioStore}
            disabled={currentType !== StudioItemEnum.Song}
            onPress={handleTrackPress}
          />
          <Track
            ref={countRef}
            type={StudioItemEnum.Count}
            useStudioStore={useStudioStore}
            disabled={currentType !== StudioItemEnum.Count}
            onPress={handleTrackPress}
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
