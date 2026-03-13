import { TRACK } from "@/constants";
import { supabase } from "@/supabase";
import { ItemType, TrackType } from "@/types";
import camelcaseKeys from "camelcase-keys";
import Storage from "expo-native-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export type TrackState = {
  source?: string;
  items: ItemType[];
};

interface StudioState {
  studio: {
    activeTrack: TrackType;
    song: TrackState;
    count: TrackState;
  };

  setActive: (type: TrackType) => void;
  isActive: (type: TrackType) => boolean;
  toggle: (index: number) => void;
  split: (time: number) => void;
  merge: () => void;
  reset: () => void;
  initialize: (trackState: TrackState) => void;
  syncToServer: () => Promise<void>;
  syncFromServer: () => Promise<void>;
}

export const createStudioStore = (projectId: string) =>
  create<StudioState>()(
    persist(
      immer((set, get) => ({
        studio: {
          activeTrack: TRACK.SONG,
          song: {
            source: undefined,
            items: [],
          },
          count: {
            source: undefined,
            items: [],
          },
        },

        setActive: (type) => {
          set((state) => {
            state.studio.activeTrack = type;
          });
        },

        isActive: (type) => {
          return get().studio.activeTrack === type;
        },

        toggle: (index) => {
          set((state) => {
            const track = state.studio.activeTrack;
            const items = state.studio[track].items;
            if (items?.[index]) {
              items[index].selected = !items[index].selected;
            }
          });
        },

        split: (time) => {
          set((state) => {
            const track = state.studio.activeTrack;
            const items = state.studio[track].items;
            if (!items) return;

            const idx = items.findIndex(
              (s) => time > s.startTime && time < s.endTime
            );
            if (idx === -1) return;

            const item = items[idx];
            items.splice(
              idx,
              1,
              { startTime: item.startTime, endTime: time, selected: false },
              { startTime: time, endTime: item.endTime, selected: false }
            );
          });
        },

        merge: () => {
          set((state) => {
            const track = state.studio.activeTrack;
            const items = state.studio[track].items;
            if (!items) return;

            const selected = items
              .map((item, i) => (item.selected ? i : -1))
              .filter((i) => i !== -1);
            if (selected.length < 2) return;
            if (selected.some((idx, i) => i > 0 && idx !== selected[i - 1] + 1))
              return;

            const [first, last] = [selected[0], selected[selected.length - 1]];

            items.splice(first, last - first + 1, {
              startTime: items[first].startTime,
              endTime: items[last].endTime,
              selected: true,
            });
          });
        },

        reset: () => {
          set((state) => {
            state.studio.activeTrack = TRACK.SONG;
            state.studio.song.items.forEach((item) => {
              item.selected = false;
            });
            state.studio.count.items.forEach((item) => {
              item.selected = false;
            });
          });
        },

        initialize: (trackState) => {
          set((state) => {
            const track = state.studio.activeTrack;
            state.studio[track] = trackState;
          });
        },

        syncToServer: async () => {
          try {
            const { studio } = get();
            await supabase
              .from("projects")
              .update({
                song_items: studio.song.items,
                count_items: studio.count.items,
              })
              .eq("id", projectId)
              .throwOnError();
          } catch (error) {}
        },

        syncFromServer: async () => {
          try {
            const { data } = await supabase
              .from("projects")
              .select(`*, song:songs(id, name, artist_name, preview_url, artwork_url)`)
              .eq("id", projectId)
              .single()
              .throwOnError();

            if (data) {
              const result = camelcaseKeys(data, { deep: true });
              set((state) => {
                state.studio.song.items = result.songItems;
                state.studio.count.items = result.countItems;
              });
            }
          } catch (error) {}
        },
      })),
      {
        name: `studio-${projectId}`,
        storage: createJSONStorage(() => Storage),
      }
    )
  );

export type StudioStoreHook = ReturnType<typeof createStudioStore>;
