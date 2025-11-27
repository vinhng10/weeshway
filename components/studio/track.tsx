import { Item } from "@/components/studio/item";
import { ThemedText } from "@/components/themed-text";
import { PIXELS_PER_SECOND, StudioItemEnum } from "@/constants";
import { useAudioPlayerStore } from "@/hooks/useAudioPlayerStore";
import type { StudioStoreHook } from "@/hooks/useStudioStore";
import React, { useCallback, useEffect } from "react";
import { Dimensions, Pressable, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useDerivedValue,
  useSharedValue,
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

const Cursor = () => {
  return <View style={styles.cursor} />;
};

const Spacer = () => {
  return <View style={styles.spacer} />;
};

export const Track = ({
  type,
  useStudioStore,
  disabled,
  onPress,
}: TrackProps) => {
  const { source, items, time, setTime, toggle } = useStudioStore(
    useShallow((state) => ({
      source: state.studio[type].source,
      items: state.studio[type].items,
      time: state.studio[type].time,
      setTime: state.setTime,
      toggle: state.toggle,
    }))
  );
  const duration = items[items.length - 1]?.endTime ?? 0;
  const ref = useAnimatedRef<Animated.ScrollView>();
  const offset = useSharedValue(time * PIXELS_PER_SECOND);
  const { player, isPlaying, currentSource } = useAudioPlayerStore(
    useShallow((state) => ({
      player: state.player,
      status: state.status,
      isPlaying: state.isPlaying(source),
      currentSource: state.currentSource,
    }))
  );

  const sync = useCallback(
    (o: number) => {
      const time = o / PIXELS_PER_SECOND;
      setTime(type, time);
      player?.seekTo(time);
    },
    [player]
  );

  // Use derived value to scroll whenever position changes
  useDerivedValue(() => {
    scrollTo(ref, offset.value, 0, false);
  });

  useEffect(() => {
    if (!isPlaying || duration <= 0) return;

    // Use the current scroll position to calculate the remaining time
    const currentTime = offset.value / PIXELS_PER_SECOND;
    const remainingTime = duration - currentTime;
    const targetPosition = duration * PIXELS_PER_SECOND;

    // Animate from current scroll position to the end of the track
    offset.value = withTiming(targetPosition, {
      duration: remainingTime * 1000,
      easing: Easing.linear,
    });

    return () => {
      cancelAnimation(offset);
      sync(offset.value);
    };
  }, [isPlaying]);

  const scrollHandler = useAnimatedScrollHandler({
    onMomentumEnd: (event) => {
      offset.value = event.contentOffset.x;
      scheduleOnRN(sync, event.contentOffset.x);
    },
  });

  styles.useVariants({
    disabled: disabled,
  });

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <Animated.ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEnabled={!disabled}
      >
        <Spacer />
        <View>
          <View style={[styles.tickRow]}>
            {Array.from({ length: Math.ceil(duration / 5) }, (_, index) => {
              const time = index * 5;
              const left = time * PIXELS_PER_SECOND;
              return (
                <ThemedText key={index} style={[styles.tick, { left }]}>
                  {formatTime(time)}
                </ThemedText>
              );
            })}
          </View>
          <View style={[styles.itemRow]}>
            {items.map((item, index) => (
              <Item
                key={index}
                index={index}
                item={item}
                onPress={() => toggle(type, index)}
                disabled={disabled}
              />
            ))}
          </View>
        </View>
        <Spacer />
      </Animated.ScrollView>
      <Cursor />
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    height: theme.gap(11),
    variants: {
      disabled: {
        true: {
          opacity: 0.2,
        },
      },
    },
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
