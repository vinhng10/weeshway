import { type AudioPlayer, type AudioStatus } from "expo-audio";
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
}));
