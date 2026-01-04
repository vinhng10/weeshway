// Track.tsx - Fixed version
import { PIXELS_PER_SECOND, TICK_INTERVAL } from "@/constants";
import { useAudioPlayerStore, type StudioStoreHook } from "@/hooks";
import { ItemType, TrackType } from "@/types";
import React, { useEffect, useMemo } from "react";
import { Dimensions, Pressable, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { scheduleOnRN } from "react-native-worklets";
import { useShallow } from "zustand/react/shallow";
import { ThemedText } from "../themed-text";
import { Item } from "./item";

const { width } = Dimensions.get("window");

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

const timeToOffset = (time: number) => {
  "worklet";
  return time * PIXELS_PER_SECOND;
};

const offsetToTime = (offset: number) => {
  "worklet";
  return offset / PIXELS_PER_SECOND;
};

type TrackProps = {
  type: TrackType;
  useStudioStore: StudioStoreHook;
};

const Cursor = () => <View style={styles.cursor} />;

export default function Track({ type, useStudioStore }: TrackProps) {
  const { source, items, toggle, isActive, setActive } = useStudioStore(
    useShallow((state) => ({
      source: state.studio[type].source,
      items: state.studio[type].items,
      toggle: state.toggle,
      isActive: state.isActive(type),
      setActive: state.setActive,
    }))
  );

  const { player, pause, replace, shouldPlay, setShouldPlay, didJustFinish } =
    useAudioPlayerStore(
      useShallow((state) => ({
        player: state.player,
        pause: state.pause,
        replace: state.replace,
        shouldPlay: state.shouldPlay,
        setShouldPlay: state.setShouldPlay,
        didJustFinish: state.didJustFinish(source),
      }))
    );

  styles.useVariants({ disabled: !isActive });

  const duration = useMemo(
    () => items[items.length - 1]?.endTime ?? 0,
    [items]
  );

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const offset = useSharedValue(0);

  useDerivedValue(() => scrollTo(scrollRef, offset.value, 0, false));

  const sync = async (time: number) => {
    await player?.seekTo(time);
    offset.value = timeToOffset(time);
  };

  const createAnimations = (selectedItems: ItemType[]) => {
    return selectedItems.flatMap((item, i) => {
      const isLast = i === selectedItems.length - 1;
      const duration = (item.endTime - item.startTime) * 1000;
      const targetOffset = timeToOffset(item.endTime);

      const itemAnimation = withTiming(
        targetOffset,
        { duration, easing: Easing.linear },
        isLast
          ? (finished) => {
              "worklet";
              if (finished) {
                scheduleOnRN(pause);
                scheduleOnRN(setShouldPlay, false);
              }
            }
          : undefined
      );

      const nextItem = selectedItems[i + 1];
      const hasGap = nextItem && item.endTime < nextItem.startTime;

      if (hasGap) {
        const nextStartTime = nextItem.startTime;
        const seek = async () => {
          await player?.seekTo(nextStartTime);
        };
        const gapAnimation = withTiming(
          timeToOffset(nextStartTime),
          { duration: 0, easing: Easing.linear },
          () => {
            "worklet";
            scheduleOnRN(seek);
          }
        );
        return [itemAnimation, gapAnimation];
      }

      return [itemAnimation];
    });
  };

  const handlePress = async () => {
    if (isActive) return;
    setShouldPlay(false);
    pause();
    setActive(type);
    replace(source);
    await sync(offsetToTime(offset.value));
  };

  const scrollHandler = useAnimatedScrollHandler({
    onMomentumEnd: (event) => {
      const time = offsetToTime(event.contentOffset.x);
      scheduleOnRN(sync, time);
    },
  });

  // Handle playback state changes from parent
  useEffect(() => {
    if (!isActive || !shouldPlay) {
      cancelAnimation(offset);
      return;
    }

    // Start playback - use the ref to get latest items
    (async () => {
      const selectedItems = items
        .filter((item) => item.selected)
        .sort((a, b) => a.startTime - b.startTime);

      if (selectedItems.length > 0) {
        await sync(selectedItems[0].startTime);
        offset.value = withSequence(...createAnimations(selectedItems));
      } else {
        const currentTime = offsetToTime(offset.value);
        const remainingTime = duration - currentTime;
        offset.value = withTiming(timeToOffset(duration), {
          duration: remainingTime * 1000,
          easing: Easing.linear,
        });
      }
    })();
  }, [shouldPlay, isActive]);

  useEffect(() => {
    if (didJustFinish) {
      setShouldPlay(false);
      pause();
    }
  }, [didJustFinish]);

  useEffect(() => {
    if (!isActive) return;
    setShouldPlay(false);
    pause();
    replace(source);
    sync(0);
  }, [source]);

  return (
    <Animated.View style={styles.container}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEnabled={isActive}
      >
        <Pressable onPress={handlePress} style={styles.scrollContent}>
          <Animated.View style={styles.tickRow}>
            {Array.from(
              { length: Math.ceil(duration / TICK_INTERVAL) },
              (_, i) => {
                const time = i * TICK_INTERVAL;
                return (
                  <ThemedText
                    key={i}
                    style={[styles.tick, { left: timeToOffset(time) }]}
                  >
                    {formatTime(time)}
                  </ThemedText>
                );
              }
            )}
          </Animated.View>
          <Animated.View style={styles.itemRow}>
            {items.map((item, i) => (
              <Item
                key={i}
                index={i}
                item={item}
                onPress={() => toggle(i)}
                disabled={!isActive}
              />
            ))}
          </Animated.View>
        </Pressable>
      </Animated.ScrollView>
      <Cursor />
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    height: theme.gap(11),
    variants: {
      disabled: {
        true: { opacity: 0.2 },
      },
    },
  },
  scrollContent: {
    paddingHorizontal: width / 2,
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
