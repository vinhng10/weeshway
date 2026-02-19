// Studio.tsx
import { Button, ControlBar, Header, Track } from "@/components";
import { TRACK } from "@/constants";
import { createStudioStore, useAlert, useAudioPlayerStore } from "@/hooks";
import {
  RecordingPresets,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";
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
    setRecorder,
    isRecording,
    requestRecordingPermission,
    startRecording,
    stopRecording,
    playbackRate,
    setPlaybackRate,
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
      setRecorder: state.setRecorder,
      isRecording: state.recorderState?.isRecording === true,
      requestRecordingPermission: state.requestRecordingPermission,
      startRecording: state.startRecording,
      stopRecording: state.stopRecording,
      playbackRate: state.playbackRate,
      setPlaybackRate: state.setPlaybackRate,
      didJustFinish: state.didJustFinish(activeSource),
    }))
  );

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  useEffect(() => {
    setRecorder(audioRecorder, recorderState);
  }, [audioRecorder, recorderState, setRecorder]);

  useFocusEffect(
    useCallback(() => {
      syncFromServer();
      requestRecordingPermission();

      return () => {
        setShouldPlay(false);
        pause();
        player?.seekTo(0);
        reset();
      };
    }, [])
  );

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
    } catch {
      useAlert
        .getState()
        .show(
          "Playback Error",
          "Couldn't load the audio file. Please try again."
        );
    }
  };

  const handleRecordAudio = async () => {
    if (studio.activeTrack !== TRACK.COUNT) return;

    if (isRecording) {
      const trackState = await stopRecording(studio.count.source);
      if (trackState) initialize(trackState);
      return;
    }

    await startRecording();
  };

  return (
    <View style={styles.container}>
      <Header title="Studio" />

      <View style={styles.studioContainer}>
        <Button label="Save" stickyBottom onPress={syncToServer} />

        <ControlBar
          isPlaying={isPlaying}
          isRecording={isRecording}
          playbackRate={playbackRate}
          onPlaybackRateChange={setPlaybackRate}
          onLoadAudio={handleLoadAudio}
          onRecordAudio={handleRecordAudio}
          onTogglePlayback={handleTogglePlayback}
          onSplit={handleSplit}
          onMerge={handleMerge}
          wakeWordEnabled={false}
          onToggleWakeWord={() => {}}
        />

        <View style={styles.tracksContainer}>
          <Track type={TRACK.SONG} useStudioStore={useStudioStore} />
          <Track type={TRACK.COUNT} useStudioStore={useStudioStore} />
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
