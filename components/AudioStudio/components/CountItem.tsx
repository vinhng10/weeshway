import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useRoutineStore } from "../hooks/useState";
import { PIXELS_PER_SECOND } from "../types";

interface CountItemProps {
  index: number;
}

export const CountItem = ({ index }: CountItemProps) => {
  const { getSelectedWithCount, initializeCountTimes } = useRoutineStore();
  const routines = getSelectedWithCount();
  const routine = routines[index];

  // Handle positioning - use default values if count times not initialized
  // Compute countStart as the sum of count durations of all previous routines with countStartTime/countEndTime
  const countStart =
    routines
      .slice(0, index)
      .reduce(
        (sum, r) =>
          r.countStartTime !== undefined && r.countEndTime !== undefined
            ? sum + (r.countEndTime - r.countStartTime)
            : sum,
        0
      ) * PIXELS_PER_SECOND;
  const countWidth =
    routine.countStartTime !== undefined && routine.countEndTime !== undefined
      ? (routine.countEndTime - routine.countStartTime) * PIXELS_PER_SECOND
      : 0;

  // Create audio player and status for count source
  const player = useAudioPlayer(routine.countSource);
  const status = useAudioPlayerStatus(player);

  // Initialize count times
  useEffect(() => {
    if (
      !routine.countStartTime &&
      !routine.countEndTime &&
      status.duration > 0
    ) {
      initializeCountTimes(status.duration);
    }
  }, [status.duration]);

  return (
    <Pressable
      style={[
        styles.count,
        routine.selected && styles.countSelected,
        {
          left: countStart,
          width: countWidth,
        },
      ]}
    >
      <Text style={styles.countIdText}>{index + 1}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  count: {
    position: "absolute",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#1a3a1a",
    borderWidth: 3,
    borderColor: "#2a5a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  countSelected: {
    borderColor: "#ffffff",
    borderWidth: 3,
  },
  countIdText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
});
