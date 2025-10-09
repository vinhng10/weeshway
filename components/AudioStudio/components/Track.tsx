import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PIXELS_PER_SECOND, Routine } from "../types";
import {
  addPaddingToMergedRoutines,
  formatTime,
  mergeConsecutiveRoutines,
} from "../utils";
import { RoutineItem } from "./RoutineItem";

const { width: screenWidth } = Dimensions.get("window");

interface TrackProps {
  player?: any; // expo-audio player instance
  routines: Routine[];
  onRoutinePress?: (routineId: number) => void;
  duration?: number;
  // Auto-scrolling props
  selectedRoutines?: Routine[];
  currentRoutineIndex?: number;
  onRoutineIndexChange?: (index: number) => void;
}

export const Track = ({
  player,
  routines,
  onRoutinePress,
  duration = 0,
  selectedRoutines = [],
  currentRoutineIndex = 0,
  onRoutineIndexChange,
}: TrackProps) => {
  const trackWidth = duration * PIXELS_PER_SECOND;
  const internalScrollRef = useRef<ScrollView>(null);
  const [isManualScrolling, setIsManualScrolling] = useState(false);

  const handleScrollBegin = () => {
    setIsManualScrolling(true);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (duration > 0 && trackWidth > 0) {
      const scrollPosition = event.nativeEvent.contentOffset.x;
      const playbackTime = (scrollPosition / trackWidth) * duration;
      const clampedTime = Math.max(0, Math.min(playbackTime, duration));
      player?.seekTo(clampedTime);
    }
    setIsManualScrolling(false);
  };

  // Auto-scroll based on playback time
  useEffect(() => {
    if (player?.playing && !isManualScrolling && duration > 0) {
      const interval = setInterval(() => {
        const scrollPosition = player.currentTime * PIXELS_PER_SECOND;

        // Use internal ref for auto-scrolling
        internalScrollRef.current?.scrollTo({
          x: scrollPosition,
          animated: false,
        });

        // Handle routine-based playback (consecutive routines are merged with padding)
        if (selectedRoutines.length > 0) {
          // Merge consecutive routines and add padding for smoother transitions
          const mergedRoutines = mergeConsecutiveRoutines(selectedRoutines);
          const paddedRoutines = addPaddingToMergedRoutines(
            mergedRoutines,
            duration,
            2
          );
          const currentRoutine = paddedRoutines[currentRoutineIndex];

          if (
            currentRoutine &&
            player.currentTime >= currentRoutine.musicEndTime
          ) {
            const nextIndex = currentRoutineIndex + 1;
            if (nextIndex < paddedRoutines.length) {
              const nextRoutine = paddedRoutines[nextIndex];
              player.seekTo(nextRoutine.musicStartTime);
              onRoutineIndexChange?.(nextIndex);
            } else {
              player.pause();
              onRoutineIndexChange?.(0);
            }
          }
        }
      }, 10);

      return () => clearInterval(interval);
    }
  }, [
    player,
    isManualScrolling,
    duration,
    currentRoutineIndex,
    selectedRoutines,
    onRoutineIndexChange,
  ]);

  return (
    <View style={styles.trackContainer}>
      <ScrollView
        ref={internalScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScrollBeginDrag={handleScrollBegin}
        onMomentumScrollEnd={handleScrollEnd}
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

            {/* Track track - routines */}
            <View style={[styles.track, { width: trackWidth }]}>
              {routines.map((routine) => (
                <RoutineItem
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
};

const styles = StyleSheet.create({
  trackContainer: {
    height: "50%",
    // backgroundColor: "#111",
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
