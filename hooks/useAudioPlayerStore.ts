import { TrackState } from "@/hooks/useStudioStore";
import { type AudioPlayer, type AudioStatus } from "expo-audio";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import { create } from "zustand";

interface AudioPlayerState {
  player?: AudioPlayer;
  status?: AudioStatus;
  currentSource?: string;
  shouldPlay: boolean;
  setPlayer: (player: AudioPlayer, status: AudioStatus) => void;
  setShouldPlay: (shouldPlay: boolean) => void;
  replace: (source?: string) => void;
  play: (source: string, fromBeginning?: boolean) => void;
  pause: () => void;
  isPlaying: (source?: string) => boolean;
  isLoaded: (source?: string) => boolean;
  toggle: (source?: string, fromBeginning?: boolean) => void;
  pickAndLoadAudio: () => Promise<TrackState | null>;
}

export const useAudioPlayerStore = create<AudioPlayerState>((set, get) => ({
  player: undefined,
  status: undefined,
  currentSource: undefined,
  shouldPlay: false,
  setPlayer: (player: AudioPlayer, status: AudioStatus) => {
    set({ player, status });
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
  toggle: (source?: string, fromBeginning = true) => {
    const { isPlaying, play, pause, currentSource } = get();
    const targetSource = source ?? currentSource;
    if (!targetSource) return;
    isPlaying(targetSource) ? pause() : play(targetSource, fromBeginning);
  },
  pickAndLoadAudio: async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "audio/*" });
      if (result.canceled || !result.assets[0]) return null;

      const sourceFile = new File(result.assets[0].uri);
      const appDir = new Directory(Paths.document, "audio_files");

      if (!appDir.exists) appDir.create({ intermediates: true });

      const destFile = new File(
        appDir,
        `${sourceFile.md5}.${sourceFile.extension}`
      );
      if (!destFile.exists) sourceFile.copy(destFile);

      const { player } = get();
      player?.replace(destFile.uri);
      set({ currentSource: destFile.uri });

      // Poll for duration
      let duration = 0;
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const { status } = get();
        if (status?.duration && status.duration > 0) {
          duration = status.duration;
          break;
        }
      }

      return {
        source: destFile.uri,
        items: [{ startTime: 0, endTime: duration, selected: false }],
      };
    } catch (error) {
      console.error("Error picking and loading audio file:", error);
      return null;
    }
  },
}));
