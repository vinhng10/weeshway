import { supabase } from "@/supabase";
import React, { useCallback, useEffect, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { IconSymbol } from "./icon-symbol";
import { ThemedText } from "./themed-text";

const AnimatedIconSymbol = Animated.createAnimatedComponent(IconSymbol);

interface BadgeProps {
  show: boolean;
  label: string;
}

export function Badge({ show, label }: BadgeProps) {
  const { theme } = useUnistyles();
  const halfGap = theme.gap(2) / 2;

  const [contentHeight, setContentHeight] = useState(0);
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const margin = useSharedValue(-halfGap);

  const ready = show && contentHeight > 0;

  useEffect(() => {
    height.value = withTiming(ready ? contentHeight : 0, { duration: 400 });
    opacity.value = withTiming(ready ? 1 : 0, { duration: 600 });
    margin.value = withTiming(ready ? 0 : -halfGap, { duration: 400 });
  }, [ready, contentHeight, height, opacity, margin, halfGap]);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.3, { duration: 800 }), -1, true);
  }, [scale]);

  const wrapperStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
    overflow: "hidden" as const,
    marginVertical: margin.value,
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => setContentHeight(e.nativeEvent.layout.height),
    [],
  );

  const content = (
    <Animated.View style={styles.container}>
      <Animated.View style={sparkleStyle}>
        <AnimatedIconSymbol name="sparkles" size={18} style={styles.icon} />
      </Animated.View>
      <ThemedText type="h5">{label}</ThemedText>
      <Animated.View style={sparkleStyle}>
        <AnimatedIconSymbol name="sparkles" size={18} style={styles.icon} />
      </Animated.View>
    </Animated.View>
  );

  return (
    <Animated.View style={wrapperStyle}>
      {content}
      {!contentHeight && (
        <View style={styles.offscreen} onLayout={onLayout} pointerEvents="none">
          {content}
        </View>
      )}
    </Animated.View>
  );
}

interface VibeBadgeProps {
  songId: string;
}

export function VibeBadge({ songId }: VibeBadgeProps) {
  const [count, setCount] = useState<number>();

  useEffect(() => {
    supabase
      .rpc("count_nearby_wishes_by_song", { p_song_id: songId })
      .then(({ data }) => setCount(data ?? 0));
  }, [songId]);

  const label = `Vibing with ${count} ${count === 1 ? "wish" : "wishes"}`;

  return <Badge show={!!count} label={label} />;
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.gap(2),
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(0.8),
    borderRadius: theme.gap(2),
    backgroundColor: theme.colors.foreground,
  },
  icon: {
    color: theme.colors.typography,
  },
  offscreen: {
    position: "absolute",
    opacity: 0,
  },
}));
