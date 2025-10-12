import { AudioPlayer, AudioStatus } from "expo-audio";
import React, { useRef } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRoutineStore } from "../hooks/useState";
import { PIXELS_PER_SECOND } from "../types";
import { formatTime } from "../utils";
import { CountItem } from "./CountItem";

const { width: screenWidth } = Dimensions.get("window");

interface TrackProps {
  player: AudioPlayer;
  status: AudioStatus;
  currentRoutineIndex?: number;
  onRoutineIndexChange?: (index: number) => void;
}

export const CountTrack = ({
  player,
  status,
  currentRoutineIndex = 0,
  onRoutineIndexChange,
}: TrackProps) => {
  const { getSelectedWithCount } = useRoutineStore();
  const routines = getSelectedWithCount();

  // duration should be the sum of all count durations of routines
  const duration = routines.reduce((sum, routine) => {
    const countStart = routine.countStartTime ?? 0;
    const countEnd = routine.countEndTime ?? 0;
    return sum + Math.max(0, countEnd - countStart);
  }, 0);
  const trackWidth = duration * PIXELS_PER_SECOND;
  const internalScrollRef = useRef<ScrollView>(null);

  return (
    <View style={styles.trackContainer}>
      <ScrollView
        ref={internalScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <View style={styles.trackWrapper}>
          <View style={styles.spacer} />
          <View style={styles.trackContent}>
            {/* Top ticks row */}
            <View style={[styles.ticksRow, { width: trackWidth }]}>
              {duration > 0 &&
                Array.from(
                  { length: Math.floor(duration / 5) + 1 },
                  (_, index) => {
                    const time = index * 5;
                    const position = time * PIXELS_PER_SECOND;

                    return (
                      <View
                        key={index}
                        style={[styles.marker, { left: position }]}
                      >
                        <Text style={styles.labelText}>{formatTime(time)}</Text>
                      </View>
                    );
                  }
                )}
            </View>

            {/* Count Item */}
            <View style={[styles.track, { width: trackWidth }]}>
              {routines.map((_, index) => (
                <CountItem key={index} index={index} />
              ))}
            </View>
          </View>
          <View style={styles.spacer} />
        </View>
      </ScrollView>

      {/* Cursor */}
      <View style={styles.cursor} />
    </View>
  );
};

const styles = StyleSheet.create({
  trackContainer: {
    height: "50%",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
  trackWrapper: {
    flexDirection: "row",
  },
  trackContent: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "stretch",
  },
  ticksRow: {
    height: 24,
    position: "relative",
    top: 6,
  },
  spacer: {
    width: screenWidth / 2,
  },
  track: {
    top: 12,
    height: 54,
    position: "relative",
    overflow: "hidden",
  },
  marker: {
    position: "absolute",
    top: 0,
    height: "100%",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  labelText: {
    color: "#c9c9c9",
    fontSize: 12,
    fontWeight: "600",
  },
  cursor: {
    position: "absolute",
    top: 24,
    bottom: 4,
    left: "50%",
    width: 2,
    backgroundColor: "#ffffff",
    zIndex: 10,
  },
});
