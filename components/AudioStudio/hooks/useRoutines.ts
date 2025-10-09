import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { Routine } from "../types";

export const useRoutines = (duration: number) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const previousDurationRef = useRef<number>(0);

  // Initialize or reset routines when audio is loaded or changed
  useEffect(() => {
    if (duration > 0) {
      // Reset routines if duration changed (new song loaded) or if routines is empty
      if (
        routines.length === 0 ||
        Math.abs(previousDurationRef.current - duration) > 0.1
      ) {
        setRoutines([
          {
            id: 0,
            musicStartTime: 0,
            musicEndTime: duration,
            selected: false,
          },
        ]);
        previousDurationRef.current = duration;
      }
    }
  }, [duration]);

  const toggleRoutineSelection = (routineId: number) => {
    setRoutines((prevRoutines) =>
      prevRoutines.map((seg) =>
        seg.id === routineId ? { ...seg, selected: !seg.selected } : seg
      )
    );
  };

  const getSelectedRoutines = () => {
    return routines
      .filter((seg) => seg.selected)
      .sort((a, b) => a.musicStartTime - b.musicStartTime);
  };

  const handleSplit = (splitTime: number) => {
    // Find the routine that contains the current time
    const routineIndex = routines.findIndex(
      (seg) => splitTime > seg.musicStartTime && splitTime < seg.musicEndTime
    );

    if (routineIndex === -1) {
      Alert.alert(
        "Cannot Split",
        "Please position the cursor within a routine to split it."
      );
      return;
    }

    const routineToSplit = routines[routineIndex];

    // Create two new routines
    const newRoutines = [...routines];
    newRoutines.splice(
      routineIndex,
      1,
      {
        id: routineIndex,
        musicStartTime: routineToSplit.musicStartTime,
        musicEndTime: splitTime,
        selected: false,
      },
      {
        id: routineIndex + 1,
        musicStartTime: splitTime,
        musicEndTime: routineToSplit.musicEndTime,
        selected: false,
      }
    );

    // Reassign IDs to maintain sequential order
    const reassignedRoutines = newRoutines.map((routine, index) => ({
      ...routine,
      id: index,
    }));

    setRoutines(reassignedRoutines);
  };

  const handleMerge = () => {
    // Find indices of selected routines
    const selectedIndices = routines
      .map((routine, index) => (routine.selected ? index : -1))
      .filter((index) => index !== -1)
      .sort((a, b) => a - b);

    // Need at least two routines to merge
    if (selectedIndices.length < 2) return;

    // Check if all selected routines are consecutive
    for (let i = 1; i < selectedIndices.length; i++) {
      if (selectedIndices[i] !== selectedIndices[i - 1] + 1) {
        return;
      }
    }

    // Get the routines to merge
    const firstIndex = selectedIndices[0];
    const lastIndex = selectedIndices[selectedIndices.length - 1];
    const routinesToMerge = routines.slice(firstIndex, lastIndex + 1);

    // Create merged routine
    const merged: Routine = {
      id: firstIndex,
      musicStartTime: routinesToMerge[0].musicStartTime,
      musicEndTime: routinesToMerge[routinesToMerge.length - 1].musicEndTime,
      selected: true,
    };

    // Create new routines array with merged routine
    const newRoutines = [
      ...routines.slice(0, firstIndex),
      merged,
      ...routines.slice(lastIndex + 1),
    ];

    // Reassign IDs to maintain sequential order
    const reassignedRoutines = newRoutines.map((routine, index) => ({
      ...routine,
      id: index,
    }));

    setRoutines(reassignedRoutines);
  };

  const selectRoutinesByIndices = (indices: number[]) => {
    setRoutines((prev) =>
      prev.map((routine, idx) => ({
        ...routine,
        selected: indices.includes(idx),
      }))
    );
  };

  return {
    routines,
    setRoutines,
    toggleRoutineSelection,
    getSelectedRoutines,
    handleSplit,
    handleMerge,
    selectRoutinesByIndices,
  };
};
