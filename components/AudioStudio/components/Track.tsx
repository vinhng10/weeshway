import { AudioPlayer, AudioStatus } from "expo-audio";
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
import { useItemStore } from "../hooks/useState";
import { PIXELS_PER_SECOND } from "../types";
import {
  addPaddingToMergedItems,
  formatTime,
  mergeConsecutiveItems,
} from "../utils";
import { Item } from "./Item";

const { width: screenWidth } = Dimensions.get("window");

interface TrackProps {
  type: string;
  player: AudioPlayer;
  status: AudioStatus;
  currentItemIndex?: number;
  onItemIndexChange?: (index: number) => void;
}

export const Track = ({
  type,
  player,
  status,
  currentItemIndex = 0,
  onItemIndexChange,
}: TrackProps) => {
  const { states, getSelected } = useItemStore();
  const selectedItems = getSelected(type);
  const duration = status.duration;
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
    if (player.playing && !isManualScrolling && duration > 0) {
      const interval = setInterval(() => {
        const scrollPosition = player.currentTime * PIXELS_PER_SECOND;

        // Use internal ref for auto-scrolling
        internalScrollRef.current?.scrollTo({
          x: scrollPosition,
          animated: false,
        });

        // Handle item-based playback (consecutive items are merged with padding)
        if (selectedItems.length > 0) {
          // Merge consecutive items and add padding for smoother transitions
          const mergedItems = mergeConsecutiveItems(selectedItems);
          const paddedItems = addPaddingToMergedItems(mergedItems, duration, 2);
          const currentItem = paddedItems[currentItemIndex];

          if (currentItem && player.currentTime >= currentItem.endTime) {
            const nextIndex = currentItemIndex + 1;
            if (nextIndex < paddedItems.length) {
              const nextItem = paddedItems[nextIndex];
              player.seekTo(nextItem.startTime);
              onItemIndexChange?.(nextIndex);
            } else {
              player.pause();
              onItemIndexChange?.(0);
            }
          }
        }
      }, 10);

      return () => clearInterval(interval);
    }
  }, [player, duration, isManualScrolling, currentItemIndex, selectedItems]);

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
                        style={[styles.tick, { left: position }]}
                      >
                        <Text style={styles.labelText}>{formatTime(time)}</Text>
                      </View>
                    );
                  }
                )}
            </View>

            {/* Items */}
            <View style={[styles.track, { width: trackWidth }]}>
              {states[type].map((item, index) => (
                <Item key={index} index={index} type={type} />
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
  tick: {
    position: "absolute",
    top: 0,
    height: "100%",
    justifyContent: "flex-start",
    alignItems: "center",
    transform: [{ translateX: "-50%" }],
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
