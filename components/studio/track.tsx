import { Item } from "@/components/studio/item";
import { ThemedText } from "@/components/themed-text";
import { PIXELS_PER_SECOND } from "@/constants";
import { ItemType } from "@/types";
import React from "react";
import { Dimensions, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

const { width } = Dimensions.get("window");

const Cursor = () => {
  return <View style={styles.cursor} />;
};

const Spacer = () => {
  return <View style={styles.spacer} />;
};

const Ticks = ({
  duration,
  interval = 5,
}: {
  duration: number;
  interval?: number;
}) => {
  return (
    <View style={[styles.tickRow]}>
      {Array.from({ length: Math.ceil(duration / interval) }, (_, index) => {
        const time = index * interval;
        const left = time * PIXELS_PER_SECOND;
        return (
          <ThemedText key={index} style={[styles.tick, { left }]}>
            {formatTime(time)}
          </ThemedText>
        );
      })}
    </View>
  );
};

const Items = ({
  items,
  onItemPress,
}: {
  items: ItemType[];
  onItemPress: (index: number) => void;
}) => {
  return (
    <View style={[styles.itemRow]}>
      {items.map((item, index) => (
        <Item
          key={index}
          index={index}
          item={item}
          onPress={() => onItemPress(index)}
        />
      ))}
    </View>
  );
};

export const Track = ({
  items,
  onItemPress,
}: {
  items: ItemType[];
  onItemPress: (index: number) => void;
}) => {
  const duration = items[items.length - 1]?.endTime ?? 0;
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Spacer />
        <View>
          <Ticks duration={duration} />
          <Items items={items} onItemPress={onItemPress} />
        </View>
        <Spacer />
      </ScrollView>
      <Cursor />
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    height: theme.gap(11),
  },
  spacer: {
    width: width / 2,
  },
  tickRow: {
    height: theme.gap(3),
    flexDirection: "row",
    alignItems: "center",
  },
  tick: {
    position: "absolute",
    transform: [{ translateX: "-50%" }],
  },
  itemRow: {
    flex: 1,
    flexDirection: "row",
  },
  cursor: {
    position: "absolute",
    left: "50%",
    height: "100%",
    width: theme.gap(0.25),
    backgroundColor: "#FFFFFF",
    zIndex: 10,
  },
}));
