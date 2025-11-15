import { type AudioPlayer, type AudioStatus } from "expo-audio";
import { create } from "zustand";

interface AudioPlayerState {
  player: AudioPlayer | null;
  status: AudioStatus | null;
  currentSource: string | null;
  setPlayer: (player: AudioPlayer, status: AudioStatus) => void;
  replace: (source: string) => void;
  play: (source: string) => void;
  pause: () => void;
  isPlaying: (source?: string) => boolean;
}

export const useAudioPlayerStore = create<AudioPlayerState>((set, get) => ({
  player: null,
  status: null,
  currentSource: null,
  setPlayer: (player: AudioPlayer, status: AudioStatus) => {
    set({ player, status });
  },
  replace: (source: string) => {
    const { player } = get();
    if (player) {
      player.replace(source);
      set({ currentSource: source });
    }
  },
  play: (source: string) => {
    const { player, status, currentSource } = get();
    if (!player || !status || !source) return;

    if (currentSource !== source) {
      player.replace(source);
      set({ currentSource: source });
    }

    player.seekTo(0);
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
    return status?.playing === true || status?.isLoaded === false;
  },
}));
