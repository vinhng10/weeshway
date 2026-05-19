import { TEMPO } from "@/constants";
import { TrackState } from "@/hooks/useStudioStore";
import { TempoType } from "@/types";
import {
  AudioModule,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioRecorder,
  type AudioStatus,
  type RecorderState,
} from "expo-audio";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import { create } from "zustand";
import { useAlert } from "./useAlert";

interface AudioPlayerState {
  player?: AudioPlayer;
  status?: AudioStatus;
  currentSource?: string;
  shouldPlay: boolean;
  recorder?: AudioRecorder;
  recorderState?: RecorderState;
  setPlayer: (player: AudioPlayer, status: AudioStatus) => void;
  setShouldPlay: (shouldPlay: boolean) => void;
  setRecorder: (recorder: AudioRecorder, state: RecorderState) => void;
  replace: (source?: string) => void;
  play: (source: string, fromBeginning?: boolean) => void;
  pause: () => void;
  isPlaying: (source?: string) => boolean;
  isLoaded: (source?: string) => boolean;
  didJustFinish: (source?: string) => boolean;
  toggle: (source?: string, fromBeginning?: boolean) => void;
  pickAndLoadAudio: () => Promise<TrackState | null>;
  loadAudioFromUri: (uri: string) => Promise<TrackState | null>;
  requestRecordingPermission: () => Promise<boolean>;
  startRecording: () => Promise<void>;
  stopRecording: (previousSource?: string) => Promise<TrackState | null>;
  playbackRate: TempoType;
  setPlaybackRate: (rate: TempoType) => void;
}

const persistAudioFile = (uri: string) => {
  const sourceFile = new File(uri);
  const appDir = new Directory(Paths.document, "audio_files");

  if (!appDir.exists) appDir.create({ intermediates: true });

  const extension = sourceFile.extension ?? "m4a";
  const baseName = sourceFile.md5 ?? `recording-${Date.now()}`;
  const destFile = new File(appDir, `${baseName}.${extension}`);

  if (!destFile.exists) sourceFile.copy(destFile);
  return destFile;
};

const pollDuration = async (getState: () => AudioPlayerState) => {
  let duration = 0;
  for (let i = 0; i < 10; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const { status } = getState();
    if (status?.duration && status.duration > 0) {
      duration = status.duration;
      break;
    }
  }
  return duration;
};

export const useAudioPlayerStore = create<AudioPlayerState>((set, get) => ({
  player: undefined,
  status: undefined,
  currentSource: undefined,
  shouldPlay: false,
  recorder: undefined,
  recorderState: undefined,
  playbackRate: TEMPO["1.0"],
  setPlayer: (player: AudioPlayer, status: AudioStatus) => {
    set({ player, status });
  },
  setRecorder: (recorder: AudioRecorder, state: RecorderState) => {
    set({ recorder, recorderState: state });
  },
  setShouldPlay: (shouldPlay: boolean) => {
    set({ shouldPlay });
  },
  replace: (source?: string) => {
    const { player } = get();
    if (player && source) {
      player.replace(source);
      set({ currentSource: source });
    }
  },
  play: (source: string, fromBeginning = true) => {
    const { player, currentSource } = get();
    if (!player || !source) return;

    if (currentSource !== source) {
      player.replace(source);
      set({ currentSource: source });
    }

    if (fromBeginning) {
      player.seekTo(0);
    }
    player.play();
  },
  pause: () => {
    const { player } = get();
    player?.pause();
  },
  isPlaying: (source?: string) => {
    const { currentSource, status } = get();
    if (currentSource !== source) return false;
    return status?.playing === true;
  },
  isLoaded: (source?: string) => {
    const { currentSource, status } = get();
    if (currentSource !== source) return false;
    return status?.isLoaded === true;
  },
  didJustFinish: (source?: string) => {
    const { currentSource, status } = get();
    if (currentSource !== source) return false;
    return status?.didJustFinish === true;
  },
  toggle: (source?: string, fromBeginning = true) => {
    const { isPlaying, play, pause, currentSource } = get();
    const targetSource = source ?? currentSource;
    if (!targetSource) return;
    isPlaying(targetSource) ? pause() : play(targetSource, fromBeginning);
  },
  loadAudioFromUri: async (uri: string) => {
    try {
      const destFile = persistAudioFile(uri);
      const { player } = get();
      player?.replace(destFile.uri);
      set({ currentSource: destFile.uri });

      const duration = await pollDuration(get);

      return {
        source: destFile.uri,
        items: [{ startTime: 0, endTime: duration, selected: false }],
      };
    } catch (error) {
      useAlert
        .getState()
        .showAlert(
          "Playback Error",
          "Couldn't load the audio file. Please try again.",
        );
      return null;
    }
  },
  pickAndLoadAudio: async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "audio/*" });
      if (result.canceled || !result.assets[0]) return null;

      return await get().loadAudioFromUri(result.assets[0].uri);
    } catch (error) {
      useAlert
        .getState()
        .showAlert(
          "Playback Error",
          "Couldn't load the audio file. Please try again.",
        );
      return null;
    }
  },
  requestRecordingPermission: async () => {
    const status = await AudioModule.requestRecordingPermissionsAsync();
    if (!status.granted) {
      console.warn("Permission to access microphone was denied");
      return false;
    }
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
    });
    return true;
  },
  startRecording: async () => {
    const { recorder } = get();
    if (!recorder) return;
    await recorder.prepareToRecordAsync();
    recorder.record();
  },
  stopRecording: async (previousSource?: string) => {
    const { recorder } = get();
    if (!recorder) return null;
    await recorder.stop();
    if (!recorder.uri) return null;
    const trackState = await get().loadAudioFromUri(recorder.uri);
    if (trackState && previousSource && previousSource !== trackState.source) {
      try {
        const file = new File(previousSource);
        if (file.exists) file.delete();
      } catch (error) {
        console.warn("Failed to remove previous recording:", error);
      }
    }
    return trackState;
  },
  setPlaybackRate: (rate: TempoType) => {
    if (get().status?.playing) return;
    const { player } = get();
    const numericRate = parseFloat(rate);
    if (player && !isNaN(numericRate)) {
      player.shouldCorrectPitch = true;
      player.setPlaybackRate(numericRate, "high");
    }
    set({ playbackRate: rate });
  },
}));
