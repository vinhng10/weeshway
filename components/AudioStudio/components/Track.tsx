import React, { forwardRef } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AudioRoutine, PIXELS_PER_SECOND } from "../types";
import { formatTime } from "../utils";
import { AudioRoutineItem } from "./AudioRoutineItem";

const { width: screenWidth } = Dimensions.get("window");

interface TrackProps {
  duration: number;
  displayTime: number;
  routines: AudioRoutine[];
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollBegin: () => void;
  onScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onRoutinePress: (routineId: number) => void;
}

export const Track = forwardRef<ScrollView, TrackProps>(
  (
    {
      duration,
      displayTime,
      routines,
      onScroll,
      onScrollBegin,
      onScrollEnd,
      onRoutinePress,
    },
    ref
  ) => {
    const trackWidth = duration * PIXELS_PER_SECOND;

    return (
      <View style={styles.trackContainer}>
        {/* Timestamp at top-right corner */}
        <View style={styles.timestampContainer}>
          <Text style={styles.labelText}>
            {formatTime(displayTime)}/{formatTime(duration || 0)}
          </Text>
        </View>

        <ScrollView
          ref={ref}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          onScrollBeginDrag={onScrollBegin}
          onMomentumScrollEnd={onScrollEnd}
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
                          <Text style={styles.labelText}>
                            {formatTime(time)}
                          </Text>
                        </View>
                      );
                    }
                  )}
              </View>

              {/* Track track - routines */}
              <View style={[styles.track, { width: trackWidth }]}>
                {routines.map((routine) => (
                  <AudioRoutineItem
                    key={routine.id}
                    routine={routine}
                    onPress={onRoutinePress}
                  />
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
  }
);

const styles = StyleSheet.create({
  trackContainer: {
    height: 200,
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
    top: 26,
    height: 60,
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
  timestampContainer: {
    position: "absolute",
    top: 6,
    right: 12,
    zIndex: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  cursor: {
    position: "absolute",
    top: 40,
    bottom: 0,
    left: "50%",
    width: 2,
    backgroundColor: "#ffffff",
    zIndex: 10,
  },
});
