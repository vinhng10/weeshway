import { StudioItemEnum } from "@/constants";
import { supabase } from "@/supabase";
import { ItemType } from "@/types";
import camelcaseKeys from "camelcase-keys";
import Storage from "expo-native-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

type TrackState = {
  source?: string;
  items: ItemType[];
  time: number;
};

interface StudioState {
  studio: {
    song: TrackState;
    count: TrackState;
  };

  toggle: (type: StudioItemEnum, index: number) => void;
  split: (type: StudioItemEnum, time: number) => void;
  merge: (type: StudioItemEnum) => void;
  setTime: (type: StudioItemEnum, time: number) => void;
  reset: () => void;
  syncToServer: () => Promise<void>;
  syncFromServer: () => Promise<void>;
}

export const createStudioStore = (projectId: number) =>
  create<StudioState>()(
    persist(
      immer((set, get) => ({
        studio: {
          song: {
            source: undefined,
            items: [],
            time: 0,
          },
          count: {
            source: undefined,
            items: [],
            time: 0,
          },
        },

        toggle: (type, index) =>
          set((state) => {
            const items = state.studio[type].items;
            if (items?.[index]) {
              items[index].selected = !items[index].selected;
            }
          }),

        split: (type, time) =>
          set((state) => {
            const items = state.studio[type].items;
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
          }),

        merge: (type) =>
          set((state) => {
            const items = state.studio[type].items;
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
          }),

        setTime: (type, time) =>
          set((state) => {
            state.studio[type].time = time;
          }),

        reset: () =>
          set((state) => {
            state.studio.song.time = 0;
            state.studio.count.time = 0;
            state.studio.song.items.forEach((item) => {
              item.selected = false;
            });
            state.studio.count.items.forEach((item) => {
              item.selected = false;
            });
          }),

        syncToServer: async () => {
          try {
            const { studio } = get();
            const { error } = await supabase
              .from("projects")
              .update({
                song_items: studio.song.items,
                count_items: studio.count.items,
              })
              .eq("id", projectId);
            if (error) throw error;
          } catch (error) {}
        },

        syncFromServer: async () => {
          try {
            const { data, error } = await supabase
              .from("projects")
              .select(`*, song:songs(*)`)
              .eq("id", projectId)
              .single();

            if (error) throw error;

            if (data) {
              const result = camelcaseKeys(data, { deep: true });
              set((state) => {
                state.studio.song.source = result.song.previewUrl;
                state.studio.count.source =
                  "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/2f/cb/7f/2fcb7f4a-1f8e-5f4c-2b61-b0b62261e4eb/mzaf_6330452069109107949.plus.aac.ep.m4a";
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
