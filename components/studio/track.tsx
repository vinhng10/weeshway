// Track.tsx - Fixed version
import { PIXELS_PER_SECOND, TICK_INTERVAL } from "@/constants";
import { useAudioPlayerStore, type StudioStoreHook } from "@/hooks";
import { ItemType, TrackType } from "@/types";
import React, { useEffect, useMemo, useRef } from "react";
import { Dimensions, View } from "react-native";
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
import { Pressable } from "../pressable";
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
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const offset = useSharedValue(0);
  const isAnimatingRef = useRef(false);

  useDerivedValue(() => scrollTo(scrollRef, offset.value, 0, false));

  const { source, items, toggle, isActive, setActive } = useStudioStore(
    useShallow((state) => ({
      source: state.studio[type].source,
      items: state.studio[type].items,
      toggle: state.toggle,
      isActive: state.isActive(type),
      setActive: state.setActive,
    })),
  );

  const {
    player,
    pause,
    replace,
    shouldPlay,
    setShouldPlay,
    didJustFinish,
    playbackRate,
  } = useAudioPlayerStore(
    useShallow((state) => ({
      player: state.player,
      pause: state.pause,
      replace: state.replace,
      shouldPlay: state.shouldPlay,
      setShouldPlay: state.setShouldPlay,
      didJustFinish: state.didJustFinish(source),
      playbackRate: state.playbackRate,
    })),
  );

  styles.useVariants({ disabled: !isActive });

  const duration = useMemo(
    () => items[items.length - 1]?.endTime ?? 0,
    [items],
  );

  const sync = async (time: number) => {
    await player?.seekTo(time);
    offset.value = timeToOffset(time);
  };

  const createAnimations = (selectedItems: ItemType[], rate: number) => {
    return selectedItems.flatMap((item, i) => {
      const itemAnimation = withTiming(timeToOffset(item.endTime), {
        duration: ((item.endTime - item.startTime) * 1000) / rate,
        easing: Easing.linear,
      });

      const next = selectedItems[i + 1];
      if (next && item.endTime < next.startTime) {
        const seek = async () => {
          await player?.seekTo(next.startTime);
        };
        const gapAnimation = withTiming(
          timeToOffset(next.startTime),
          { duration: 0, easing: Easing.linear },
          () => {
            "worklet";
            scheduleOnRN(seek);
          },
        );
        return [itemAnimation, gapAnimation];
      }

      return [itemAnimation];
    });
  };

  const animateFrom = (fromTime: number, rate: number) => {
    const selectedItems = items
      .filter((item) => item.selected)
      .sort((a, b) => a.startTime - b.startTime);

    if (selectedItems.length > 0) {
      const remaining = selectedItems.filter((it) => it.endTime > fromTime);
      if (remaining.length === 0) return;

      const first = remaining[0];
      const clipped =
        fromTime > first.startTime
          ? [{ ...first, startTime: fromTime }, ...remaining.slice(1)]
          : remaining;

      const leadIn =
        fromTime < first.startTime
          ? [
              withTiming(timeToOffset(first.startTime), {
                duration: ((first.startTime - fromTime) * 1000) / rate,
                easing: Easing.linear,
              }),
            ]
          : [];

      const trailOut = withTiming(
        timeToOffset(clipped[clipped.length - 1].endTime + 5),
        { duration: 5000 / rate, easing: Easing.linear },
        (finished) => {
          "worklet";
          if (finished) {
            scheduleOnRN(pause);
            scheduleOnRN(setShouldPlay, false);
          }
        },
      );

      offset.value = withSequence(
        ...leadIn,
        ...createAnimations(clipped, rate),
        trailOut,
      );
    } else {
      const remainingTime = duration - fromTime;
      if (remainingTime <= 0) return;
      offset.value = withTiming(timeToOffset(duration), {
        duration: (remainingTime * 1000) / rate,
        easing: Easing.linear,
      });
    }
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

  // Handle playback start, stop, and rate changes
  useEffect(() => {
    if (!isActive || !shouldPlay) {
      cancelAnimation(offset);
      isAnimatingRef.current = false;
      return;
    }

    const rate = parseFloat(playbackRate);
    const wasAnimating = isAnimatingRef.current;
    isAnimatingRef.current = true;
    cancelAnimation(offset);

    if (!wasAnimating) {
      // Starting playback — seek to first selected item or play from cursor
      const selectedItems = items
        .filter((item) => item.selected)
        .sort((a, b) => a.startTime - b.startTime);

      if (selectedItems.length > 0) {
        (async () => {
          const leadInTime = Math.max(0, selectedItems[0].startTime - 5);
          await sync(leadInTime);
          animateFrom(leadInTime, rate);
        })();
      } else {
        animateFrom(offsetToTime(offset.value), rate);
      }
    } else {
      // Rate changed mid-playback — resume from current position
      animateFrom(offsetToTime(offset.value), rate);
    }
  }, [shouldPlay, isActive, playbackRate]);

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
      <ThemedText type="h4" style={styles.label}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </ThemedText>
      <Animated.View style={styles.track}>
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
                },
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
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    variants: {
      disabled: {
        true: { opacity: 0.2 },
      },
    },
  },
  label: {
    paddingHorizontal: theme.gap(1),
    paddingVertical: theme.gap(0.5),
    backgroundColor: theme.colors.foreground,
  },
  track: {
    height: theme.gap(11),
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
    backgroundColor: theme.colors.typography,
    zIndex: 10,
  },
}));
