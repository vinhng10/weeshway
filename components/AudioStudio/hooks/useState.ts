import { Directory, File, Paths } from "expo-file-system";
import Storage from "expo-native-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Routine } from "../types";

interface RoutineState {
  routines: Routine[];
  audioSource: string | null;
  initialize: (duration: number) => void;
  split: (splitTime: number) => void;
  merge: () => void;
  setSelected: (index: number) => void;
  getSelected: () => Routine[];
  getSelectedWithCount: () => Routine[];
  setSelectedByIndices: (indices: number[]) => void;
  setAudioSource: (uri: string) => void;
  setCountSource: (uri: string) => void;
  initializeCountTimes: (duration: number) => void;
}

export const useRoutineStore = create<RoutineState>()(
  persist(
    (set, get) => ({
      routines: [],
      audioSource: null,
      initialize: (duration: number) => {
        set(() => ({
          routines: [
            {
              musicStartTime: 0,
              musicEndTime: duration,
              selected: false,
            },
          ],
        }));
      },
      split: (time: number) => {
        // Get routines
        const routines = get().routines;

        // Find the routine that contains the split time
        const routineIndex = routines.findIndex(
          (seg) => time > seg.musicStartTime && time < seg.musicEndTime
        );
        if (routineIndex === -1) return;
        const routineToSplit = routines[routineIndex];

        // Create two new routines
        const newRoutines = [...routines];
        newRoutines.splice(
          routineIndex,
          1,
          {
            musicStartTime: routineToSplit.musicStartTime,
            musicEndTime: time,
            selected: false,
          },
          {
            musicStartTime: time,
            musicEndTime: routineToSplit.musicEndTime,
            selected: false,
          }
        );

        // Set new routines
        set(() => ({
          routines: newRoutines,
        }));
      },
      merge: () => {
        // Get routines
        const routines = get().routines;

        // Find indices of selected routines
        const selectedIndices = routines
          .map((routine, index) => (routine.selected ? index : -1))
          .filter((index) => index !== -1)
          .sort((a, b) => a - b);

        // Need at least two routines to merge
        if (selectedIndices.length < 2) return;

        // Check if all selected routines are consecutive
        for (let i = 1; i < selectedIndices.length; i++)
          if (selectedIndices[i] !== selectedIndices[i - 1] + 1) return;

        // Get the routines to merge
        const firstIndex = selectedIndices[0];
        const lastIndex = selectedIndices[selectedIndices.length - 1];
        const routinesToMerge = routines.slice(firstIndex, lastIndex + 1);

        // Create merged routine
        const merged: Routine = {
          musicStartTime: routinesToMerge[0].musicStartTime,
          musicEndTime:
            routinesToMerge[routinesToMerge.length - 1].musicEndTime,
          selected: true,
        };

        // Create new routines array with merged routine
        const newRoutines = [
          ...routines.slice(0, firstIndex),
          merged,
          ...routines.slice(lastIndex + 1),
        ];

        // Set new routines
        set(() => ({
          routines: newRoutines,
        }));
      },
      setSelectedByIndices: (indices: number[]) =>
        set((state) => ({
          routines: state.routines.map((routine, index) => ({
            ...routine,
            selected: indices.includes(index),
          })),
        })),
      setSelected: (index: number) =>
        set((state) => ({
          routines: state.routines.map((routine, i) =>
            i === index ? { ...routine, selected: !routine.selected } : routine
          ),
        })),
      getSelected: () => {
        return get().routines.filter((routine) => routine.selected);
      },
      getSelectedWithCount: () => {
        return get().routines.filter(
          (routine) => routine.selected && routine.countSource
        );
      },
      setAudioSource: async (uri: string) => {
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
        const routines =
          destinationFile.uri === get().audioSource ? get().routines : [];
        set(() => ({ audioSource: destinationFile.uri, routines }));
      },
      setCountSource: async (uri: string) => {
        // Get currently selected routines
        const selectedRoutines = get().getSelected();

        // Only proceed if exactly one routine is selected
        if (selectedRoutines.length !== 1) {
          console.warn("setCountSource: Exactly one routine must be selected");
          return;
        }

        const sourceFile = new File(uri);
        const { md5 } = sourceFile.info({ md5: true });

        // Create app-specific directory for count files
        const appDir = new Directory(Paths.document, "count_files");

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

        // Find the index of the selected routine and update its countSource
        const routines = get().routines;
        const selectedIndex = routines.findIndex((routine) => routine.selected);

        if (selectedIndex !== -1) {
          set((state) => ({
            routines: state.routines.map((routine, index) =>
              index === selectedIndex
                ? { ...routine, countSource: destinationFile.uri }
                : routine
            ),
          }));
        }
      },
      initializeCountTimes: (duration: number) => {
        // Get currently selected routines
        const selectedRoutines = get().getSelected();

        // Only proceed if exactly one routine is selected
        if (selectedRoutines.length !== 1) {
          console.warn(
            "initializeCountTimes: Exactly one routine must be selected"
          );
          return;
        }

        // Validate duration
        if (duration <= 0) {
          console.warn("initializeCountTimes: Duration must be greater than 0");
          return;
        }

        // Find the index of the selected routine and initialize its count times
        const routines = get().routines;
        const selectedIndex = routines.findIndex((routine) => routine.selected);

        if (selectedIndex !== -1) {
          set((state) => ({
            routines: state.routines.map((routine, index) =>
              index === selectedIndex
                ? {
                    ...routine,
                    countStartTime: 0,
                    countEndTime: duration,
                  }
                : routine
            ),
          }));
        }
      },
    }),
    {
      name: "routine-storage",
      storage: createJSONStorage(() => Storage),
      partialize: (state) => ({
        routines: state.routines,
        audioSource: state.audioSource,
      }),
    }
  )
);
