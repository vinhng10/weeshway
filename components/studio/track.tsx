import { Item } from "@/components/studio/item";
import { ThemedText } from "@/components/themed-text";
import { PIXELS_PER_SECOND, StudioItemEnum } from "@/constants";
import { useAudioPlayerStore } from "@/hooks/useAudioPlayerStore";
import { ItemType } from "@/types";
import React, { useCallback, useEffect } from "react";
import { Dimensions, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  scrollTo,
  SharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useDerivedValue,
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
  source?: string;
  offset: SharedValue<number>;
  items: ItemType[];
  onItemPress: (type: StudioItemEnum, index: number) => void;
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
  source,
  offset,
  items,
  onItemPress,
}: TrackProps) => {
  const duration = items[items.length - 1]?.endTime ?? 0;
  const ref = useAnimatedRef<Animated.ScrollView>();
  const { player, isPlaying, currentSource } = useAudioPlayerStore(
    useShallow((state) => ({
      player: state.player,
      status: state.status,
      isPlaying: state.isPlaying(source),
      currentSource: state.currentSource,
    }))
  );

  const seekTo = useCallback(
    (time: number) => {
      if (!player || currentSource !== source) return;
      player.seekTo(time);
    },
    [source, currentSource]
  );

  useEffect(() => {
    seekTo(0);
  }, []);

  // Use derived value to scroll whenever position changes
  useDerivedValue(() => {
    scrollTo(ref, offset.value, 0, false);
  });

  // Sync scroll position with player
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
    };
  }, [isPlaying]);

  const scrollHandler = useAnimatedScrollHandler({
    onMomentumEnd: (event) => {
      offset.value = event.contentOffset.x;
      const time = event.contentOffset.x / PIXELS_PER_SECOND;
      scheduleOnRN(seekTo, time);
    },
  });

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
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
                onPress={() => onItemPress(type, index)}
              />
            ))}
          </View>
        </View>
        <Spacer />
      </Animated.ScrollView>
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
