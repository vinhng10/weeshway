import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { AudioPart } from "../types";

export const useAudioParts = (duration: number) => {
  const [parts, setParts] = useState<AudioPart[]>([]);

  // Initialize parts when audio is loaded
  useEffect(() => {
    if (duration > 0 && parts.length === 0) {
      setParts([
        {
          id: 0,
          startTime: 0,
          endTime: duration,
          selected: false,
        },
      ]);
    }
  }, [duration]);

  const togglePartSelection = (partId: number) => {
    setParts((prevParts) =>
      prevParts.map((seg) =>
        seg.id === partId ? { ...seg, selected: !seg.selected } : seg
      )
    );
  };

  const getSelectedParts = () => {
    return parts
      .filter((seg) => seg.selected)
      .sort((a, b) => a.startTime - b.startTime);
  };

  const handleSplit = (splitTime: number) => {
    // Find the part that contains the current time
    const partIndex = parts.findIndex(
      (seg) => splitTime > seg.startTime && splitTime < seg.endTime
    );

    if (partIndex === -1) {
      Alert.alert(
        "Cannot Split",
        "Please position the cursor within a part to split it."
      );
      return;
    }

    const partToSplit = parts[partIndex];

    // Create two new parts
    const newParts = [...parts];
    newParts.splice(
      partIndex,
      1,
      {
        id: partIndex,
        startTime: partToSplit.startTime,
        endTime: splitTime,
        selected: false,
      },
      {
        id: partIndex + 1,
        startTime: splitTime,
        endTime: partToSplit.endTime,
        selected: false,
      }
    );

    // Reassign IDs to maintain sequential order
    const reassignedParts = newParts.map((part, index) => ({
      ...part,
      id: index,
    }));

    setParts(reassignedParts);
  };

  const handleMerge = () => {
    // Find indices of selected parts
    const selectedIndices = parts
      .map((part, index) => (part.selected ? index : -1))
      .filter((index) => index !== -1)
      .sort((a, b) => a - b);

    // Need at least two parts to merge
    if (selectedIndices.length < 2) return;

    // Check if all selected parts are consecutive
    for (let i = 1; i < selectedIndices.length; i++) {
      if (selectedIndices[i] !== selectedIndices[i - 1] + 1) {
        return;
      }
    }

    // Get the parts to merge
    const firstIndex = selectedIndices[0];
    const lastIndex = selectedIndices[selectedIndices.length - 1];
    const partsToMerge = parts.slice(firstIndex, lastIndex + 1);

    // Create merged part
    const merged: AudioPart = {
      id: firstIndex,
      startTime: partsToMerge[0].startTime,
      endTime: partsToMerge[partsToMerge.length - 1].endTime,
      selected: true,
    };

    // Create new parts array with merged part
    const newParts = [
      ...parts.slice(0, firstIndex),
      merged,
      ...parts.slice(lastIndex + 1),
    ];

    // Reassign IDs to maintain sequential order
    const reassignedParts = newParts.map((part, index) => ({
      ...part,
      id: index,
    }));

    setParts(reassignedParts);
  };

  const selectPartsByIndices = (indices: number[]) => {
    setParts((prev) =>
      prev.map((part, idx) => ({ ...part, selected: indices.includes(idx) }))
    );
  };

  return {
    parts,
    setParts,
    togglePartSelection,
    getSelectedParts,
    handleSplit,
    handleMerge,
    selectPartsByIndices,
  };
};
