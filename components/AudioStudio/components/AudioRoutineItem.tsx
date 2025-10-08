import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { AudioRoutine, PIXELS_PER_SECOND } from "../types";

interface AudioRoutineItemProps {
  routine: AudioRoutine;
  onPress: (routineId: number) => void;
}

export const AudioRoutineItem: React.FC<AudioRoutineItemProps> = ({
  routine,
  onPress,
}) => {
  const routineStart = routine.startTime * PIXELS_PER_SECOND;
  const routineWidth =
    (routine.endTime - routine.startTime) * PIXELS_PER_SECOND;

  return (
    <Pressable
      style={[
        styles.routine,
        routine.selected && styles.routineSelected,
        {
          left: routineStart,
          width: routineWidth,
        },
      ]}
      onPress={() => onPress(routine.id)}
    >
      <Text style={styles.routineIdText}>{routine.id + 1}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  routine: {
    position: "absolute",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#1a3a1a",
    borderWidth: 3,
    borderColor: "#2a5a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  routineSelected: {
    borderColor: "#ffffff",
    borderWidth: 3,
  },
  routineIdText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
});
