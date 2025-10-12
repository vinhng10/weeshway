import { Pressable, StyleSheet, Text } from "react-native";
import { PIXELS_PER_SECOND, Routine } from "../types";

interface RoutineItemProps {
  index: number;
  routine: Routine;
  onPress?: (index: number) => void;
}

export const RoutineItem = ({ index, routine, onPress }: RoutineItemProps) => {
  const routineStart = routine.musicStartTime * PIXELS_PER_SECOND;
  const routineWidth =
    (routine.musicEndTime - routine.musicStartTime) * PIXELS_PER_SECOND;

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
      onPress={() => onPress?.(index)}
    >
      <Text style={styles.routineIdText}>{index + 1}</Text>
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
