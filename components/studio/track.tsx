import { Item } from "@/components/studio/item";
import { ThemedText } from "@/components/themed-text";
import { PIXELS_PER_SECOND, StudioItemEnum } from "@/constants";
import { useAudioPlayerStore } from "@/hooks/useAudioPlayerStore";
import type { StudioStoreHook } from "@/hooks/useStudioStore";
import React, { forwardRef, useCallback, useImperativeHandle } from "react";
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

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

type TrackProps = {
  type: StudioItemEnum;
  useStudioStore: StudioStoreHook;
  disabled?: boolean;
  onPress?: any;
};

const { width } = Dimensions.get("window");

export type TrackRef = {
  handleAutoScroll: () => Promise<void>;
  cancelAnimation: () => void;
};

const Cursor = () => <View style={styles.cursor} />;

const Track = forwardRef<TrackRef, TrackProps>(
  ({ type, useStudioStore, disabled, onPress }, ref) => {
    styles.useVariants({ disabled });
    const { source, items, toggle } = useStudioStore(
      useShallow((state) => ({
        source: state.studio[type].source,
        items: state.studio[type].items,
        toggle: state.toggle,
      }))
    );
    const { player, isPlaying, pause, replace } = useAudioPlayerStore(
      useShallow((state) => ({
        player: state.player,
        isPlaying: state.isPlaying(source),
        pause: state.pause,
        replace: state.replace,
      }))
    );
    const duration = items[items.length - 1]?.endTime ?? 0;
    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const offset = useSharedValue(0);

    useDerivedValue(() => scrollTo(scrollRef, offset.value, 0, false));

    const sync = useCallback(
      async (value: { time: number } | { offset: number }) => {
        const time =
          "time" in value ? value.time : value.offset / PIXELS_PER_SECOND;
        await player?.seekTo(time);
        offset.value = time * PIXELS_PER_SECOND;
      },
      [player, offset]
    );

    const createItemAnimation = useCallback(
      (item: any, isLast: boolean) => {
        const duration = (item.endTime - item.startTime) * 1000;
        const targetOffset = item.endTime * PIXELS_PER_SECOND;

        return withTiming(
          targetOffset,
          { duration, easing: Easing.linear },
          isLast
            ? () => {
                "worklet";
                scheduleOnRN(pause);
                scheduleOnRN(sync, { offset: offset.value });
              }
            : undefined
        );
      },
      [pause, sync, offset]
    );

    const createGapAnimation = useCallback(
      (nextStartTime: number) => {
        const seek = async () => {
          await player?.seekTo(nextStartTime);
        };
        return withTiming(
          nextStartTime * PIXELS_PER_SECOND,
          { duration: 0, easing: Easing.linear },
          () => {
            "worklet";
            scheduleOnRN(seek);
          }
        );
      },
      [player]
    );

    const playSelectedItems = useCallback(
      async (selectedItems: any[]) => {
        await sync({ time: selectedItems[0].startTime });

        const animations = selectedItems.flatMap((item, i) => {
          const isLast = i === selectedItems.length - 1;
          const nextItem = selectedItems[i + 1];
          const hasGap = nextItem && item.endTime < nextItem.startTime;

          return [
            createItemAnimation(item, isLast),
            ...(hasGap ? [createGapAnimation(nextItem.startTime)] : []),
          ];
        });

        offset.value = withSequence(...animations);
      },
      [sync, createItemAnimation, createGapAnimation, offset]
    );

    const playFromCurrent = useCallback(() => {
      const currentTime = offset.value / PIXELS_PER_SECOND;
      const remainingTime = duration - currentTime;

      offset.value = withTiming(duration * PIXELS_PER_SECOND, {
        duration: remainingTime * 1000,
        easing: Easing.linear,
      });
    }, [offset, duration]);

    const handlePress = async () => {
      pause();
      onPress(type);
      replace(source);
      await sync({ offset: offset.value });
    };

    useImperativeHandle(
      ref,
      () => ({
        handleAutoScroll: async () => {
          if (isPlaying) {
            cancelAnimation(offset);
            await sync({ offset: offset.value });
          } else {
            const selectedItems = items
              .filter((item) => item.selected)
              .sort((a, b) => a.startTime - b.startTime);

            if (selectedItems.length > 0) {
              await playSelectedItems(selectedItems);
            } else {
              playFromCurrent();
            }
          }
        },
        cancelAnimation: () => {
          cancelAnimation(offset);
        },
      }),
      [isPlaying, items, offset, sync, playSelectedItems, playFromCurrent]
    );

    const scrollHandler = useAnimatedScrollHandler({
      onMomentumEnd: (event) =>
        scheduleOnRN(sync, { offset: event.contentOffset.x }),
    });

    return (
      <View style={styles.container}>
        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEnabled={!disabled}
        >
          <Pressable onPress={handlePress} style={styles.scrollContent}>
            <View style={styles.tickRow}>
              {Array.from({ length: Math.ceil(duration / 5) }, (_, i) => {
                const time = i * 5;
                return (
                  <ThemedText
                    key={i}
                    style={[styles.tick, { left: time * PIXELS_PER_SECOND }]}
                  >
                    {formatTime(time)}
                  </ThemedText>
                );
              })}
            </View>
            <View style={styles.itemRow}>
              {items.map((item, i) => (
                <Item
                  key={i}
                  index={i}
                  item={item}
                  onPress={() => toggle(type, i)}
                  disabled={disabled}
                />
              ))}
            </View>
          </Pressable>
        </Animated.ScrollView>
        <Cursor />
      </View>
    );
  }
);

export default Track;

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
