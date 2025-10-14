import { Directory, File, Paths } from "expo-file-system";
import Storage from "expo-native-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Item } from "../types";

interface ItemState {
  items: { [type: string]: Item[] };
  sources: { [type: string]: string | null };
  initialize: (type: string, duration: number) => void;
  split: (type: string, splitTime: number) => void;
  merge: (type: string) => void;
  setSelected: (type: string, index: number) => void;
  getSelected: (type: string) => Item[];
  setSelectedByIndices: (type: string, indices: number[]) => void;
  setSource: (type: string, uri: string) => void;
}

export const useItemStore = create<ItemState>()(
  persist(
    (set, get) => ({
      items: { music: [], count: [] },
      sources: { music: null, count: null },
      initialize: (type: string, duration: number) => {
        set(() => ({
          items: {
            ...get().items,
            [type]: [
              {
                startTime: 0,
                endTime: duration,
                selected: false,
              },
            ],
          },
        }));
      },
      split: (type: string, time: number) => {
        // Get items
        const items = get().items[type];

        // Find the item that contains the split time
        const itemIndex = items.findIndex(
          (seg) => time > seg.startTime && time < seg.endTime
        );
        if (itemIndex === -1) return;
        const itemToSplit = items[itemIndex];

        // Create two new items
        const newItems = [...items];
        newItems.splice(
          itemIndex,
          1,
          {
            startTime: itemToSplit.startTime,
            endTime: time,
            selected: false,
          },
          {
            startTime: time,
            endTime: itemToSplit.endTime,
            selected: false,
          }
        );

        // Set new items
        set(() => ({
          items: {
            ...get().items,
            [type]: newItems,
          },
        }));
      },
      merge: (type: string) => {
        // Get items
        const items = get().items[type];

        // Find indices of selected items
        const selectedIndices = items
          .map((item, index) => (item.selected ? index : -1))
          .filter((index) => index !== -1)
          .sort((a, b) => a - b);

        // Need at least two items to merge
        if (selectedIndices.length < 2) return;

        // Check if all selected items are consecutive
        for (let i = 1; i < selectedIndices.length; i++)
          if (selectedIndices[i] !== selectedIndices[i - 1] + 1) return;

        // Get the items to merge
        const firstIndex = selectedIndices[0];
        const lastIndex = selectedIndices[selectedIndices.length - 1];
        const itemsToMerge = items.slice(firstIndex, lastIndex + 1);

        // Create merged item
        const merged: Item = {
          startTime: itemsToMerge[0].startTime,
          endTime: itemsToMerge[itemsToMerge.length - 1].endTime,
          selected: true,
        };

        // Create new items array with merged item
        const newItems = [
          ...items.slice(0, firstIndex),
          merged,
          ...items.slice(lastIndex + 1),
        ];

        // Set new items
        set(() => ({
          items: {
            ...get().items,
            [type]: newItems,
          },
        }));
      },
      setSelectedByIndices: (type: string, indices: number[]) =>
        set((state) => ({
          items: {
            ...state.items,
            [type]: state.items[type].map((item, index) => ({
              ...item,
              selected: indices.includes(index),
            })),
          },
        })),
      setSelected: (type: string, index: number) =>
        set((state) => ({
          items: {
            ...state.items,
            [type]: state.items[type].map((item, i) =>
              i === index ? { ...item, selected: !item.selected } : item
            ),
          },
        })),
      getSelected: (type: string) => {
        return get().items[type].filter((item) => item.selected);
      },
      setSource: async (type: string, uri: string) => {
        const sourceFile = new File(uri);
        const { md5 } = sourceFile.info({ md5: true });

        // Create app-specific directory for audio files
        const appDir = new Directory(Paths.document, "audio_files");

        // Ensure the directory exists
        if (!appDir.exists) {
          appDir.create({ intermediates: true });
        }

        // Generate unique filename to avoid conflicts
        const uniqueName = `${md5}.${uri.split(".").pop()}`;
        const destinationFile = new File(appDir, uniqueName);

        // Copy the file to the app's directory using the latest API
        if (!destinationFile.exists) {
          sourceFile.copy(destinationFile);
        }

        // Update state with the new file URI
        const items =
          destinationFile.uri === get().sources[type] ? get().items[type] : [];
        set(() => ({
          sources: { ...get().sources, [type]: destinationFile.uri },
          items: { ...get().items, [type]: items },
        }));
      },
    }),
    {
      name: "item-storage",
      storage: createJSONStorage(() => Storage),
      partialize: (state) => ({
        items: state.items,
        sources: state.sources,
      }),
    }
  )
);
