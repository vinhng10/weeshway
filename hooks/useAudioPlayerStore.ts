import { type AudioPlayer, type AudioStatus } from "expo-audio";
import { create } from "zustand";

interface AudioPlayerState {
  player?: AudioPlayer;
  status?: AudioStatus;
  currentSource?: string;
  setPlayer: (player: AudioPlayer, status: AudioStatus) => void;
  replace: (source?: string) => void;
  play: (source: string, fromBeginning?: boolean) => void;
  pause: () => void;
  isPlaying: (source?: string) => boolean;
  toggle: (source?: string, fromBeginning?: boolean) => void;
}

export const useAudioPlayerStore = create<AudioPlayerState>((set, get) => ({
  player: undefined,
  status: undefined,
  currentSource: undefined,
  setPlayer: (player: AudioPlayer, status: AudioStatus) => {
    set({ player, status });
  },
  replace: (source?: string) => {
    const { player } = get();
    if (player && source) {
      player.replace(source);
      set({ currentSource: source });
    }
  },
  play: (source: string, fromBeginning = true) => {
    const { player, status, currentSource } = get();
    if (!player || !status || !source) return;

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
    // Return true if actually playing OR if loading (not yet loaded)
    // This shows pause icon immediately when switching sources
    return status?.playing === true;
  },
  toggle: (source?: string, fromBeginning = true) => {
    const { isPlaying, play, pause, currentSource } = get();
    const targetSource = source ?? currentSource;
    if (!targetSource) return;
    isPlaying(targetSource) ? pause() : play(targetSource, fromBeginning);
  },
}));
