import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { AudioPart, PIXELS_PER_SECOND } from "../types";

interface AudioPartItemProps {
  part: AudioPart;
  onPress: (partId: number) => void;
}

export const AudioPartItem: React.FC<AudioPartItemProps> = ({
  part,
  onPress,
}) => {
  const partStart = part.startTime * PIXELS_PER_SECOND;
  const partWidth = (part.endTime - part.startTime) * PIXELS_PER_SECOND;

  return (
    <Pressable
      style={[
        styles.part,
        part.selected && styles.partSelected,
        {
          left: partStart,
          width: partWidth,
        },
      ]}
      onPress={() => onPress(part.id)}
    >
      <Text style={styles.partIdText}>{part.id + 1}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  part: {
    position: "absolute",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#1a3a1a",
    borderWidth: 3,
    borderColor: "#2a5a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  partSelected: {
    borderColor: "#ffffff",
    borderWidth: 3,
  },
  partIdText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
});
