import { Pressable, StyleSheet, Text } from "react-native";
import { useItemStore } from "../hooks/useState";
import { PIXELS_PER_SECOND } from "../types";

interface ItemProps {
  index: number;
  type: string;
}

export const Item = ({ index, type }: ItemProps) => {
  const { states, setSelected } = useItemStore();
  const item = states[type][index];
  const start = item.startTime * PIXELS_PER_SECOND;
  const width = (item.endTime - item.startTime) * PIXELS_PER_SECOND;

  return (
    <Pressable
      style={[
        styles.item,
        item.selected && styles.itemSelected,
        {
          left: start,
          width: width,
        },
      ]}
      onPress={() => setSelected(type, index)}
    >
      <Text style={styles.itemIdText}>{index + 1}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  item: {
    position: "absolute",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#1a3a1a",
    borderWidth: 3,
    borderColor: "#2a5a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  itemSelected: {
    borderColor: "#ffffff",
    borderWidth: 3,
  },
  itemIdText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
});
