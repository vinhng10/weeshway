import { Pressable, StyleSheet, Text } from "react-native";
import { useProjectStore } from "../hooks/useProjectStore";
import { IItem, PIXELS_PER_SECOND } from "../types";

interface ItemProps {
  index: number;
  type: string;
  projectId: string;
  item: IItem;
}

export const Item = ({ index, type, projectId, item }: ItemProps) => {
  const setSelected = useProjectStore((state) => state.setSelected);
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
      onPress={() => setSelected(projectId, type, index)}
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
