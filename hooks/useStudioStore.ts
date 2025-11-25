import { StudioItemEnum } from "@/constants";
import { supabase } from "@/supabase";
import { ItemType } from "@/types";
import camelcaseKeys from "camelcase-keys";
import Storage from "expo-native-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface StudioState {
  songItems: ItemType[];
  countItems: ItemType[];

  toggle: (type: StudioItemEnum, index: number) => void;
  split: (type: StudioItemEnum, time: number) => void;
  merge: (type: StudioItemEnum) => void;
  syncToServer: () => Promise<void>;
  syncFromServer: () => Promise<void>;
}

const getItemsKey = (type: StudioItemEnum): "songItems" | "countItems" =>
  `${type}Items`;

export const createStudioStore = (projectId: number) =>
  create<StudioState>()(
    persist(
      immer((set, get) => ({
        songItems: [],
        countItems: [],

        toggle: (type, index) =>
          set((state) => {
            const items = state[getItemsKey(type)];
            if (items?.[index]) {
              items[index].selected = !items[index].selected;
            }
          }),

        split: (type, time) =>
          set((state) => {
            const items = state[getItemsKey(type)];
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
            const items = state[getItemsKey(type)];
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

        syncToServer: async () => {
          try {
            const { songItems, countItems } = get();

            const { error } = await supabase
              .from("projects")
              .update({
                song_items: songItems,
                count_items: countItems,
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
                state.songItems = result.songItems || [];
                state.countItems = result.countItems || [];
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
