import { BubbleType } from "@/types";
import {
  Canvas,
  Circle,
  Paragraph,
  Skia,
  TextAlign,
  useFonts,
} from "@shopify/react-native-skia";
import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { scheduleOnRN } from "react-native-worklets";

// Predefined color palette for bubbles
const BUBBLE_COLORS = [
  { color: "rgba(106, 156, 0, 0.95)", stroke: "rgb(82, 121, 0)" },
  { color: "rgba(192, 70, 74, 0.95)", stroke: "rgb(153, 47, 53)" },
  { color: "rgba(199, 136, 0, 0.95)", stroke: "rgb(151, 103, 0)" },
  { color: "rgba(16, 164, 142, 0.95)", stroke: "rgb(14, 142, 123)" },
];
// Physics — tuned to match landing page stabilization
const GRAVITY_STRENGTH = 0.003; // distance-proportional: weaker near center, auto-damps overshoot
const ROTATE_STRENGTH = 0.0003; // perpendicular orbital drift, prevents chaotic bouncing
const DAMPING = 0.9;
const COLLISION_STRENGTH = 0.5;

interface BubbleChartProps {
  data: BubbleType[];
  onBubbleTap?: (bubbleData: BubbleType) => void;
}

interface BubbleData {
  label: number;
  value: number;
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  selected: boolean;
  dragging: boolean;
  pointerStartX: number;
  pointerStartY: number;
  startX: number;
  startY: number;
  startScale: number;
}

interface BubbleProps {
  index: number;
  bubbles: SharedValue<BubbleData[]>;
  offsetX: SharedValue<number>;
  offsetY: SharedValue<number>;
  scale: SharedValue<number>;
  fontMgr: ReturnType<typeof useFonts>;
}

function Bubble({
  index,
  bubbles,
  offsetX,
  offsetY,
  scale,
  fontMgr,
}: BubbleProps) {
  const width = 100;

  const paragraph = useMemo(() => {
    if (!fontMgr) {
      return null;
    }
    const paragraphStyle = {
      textAlign: TextAlign.Center,
    };
    const textStyle = {
      color: Skia.Color("#FFFFFF"),
      fontFamilies: ["MomoTrustDisplay"],
      fontSize: 12,
    };
    // Use initial bubble data for text that doesn't change
    const { label, value } = bubbles.value[index];
    const para = Skia.ParagraphBuilder.Make(paragraphStyle, fontMgr)
      .pushStyle(textStyle)
      .addText(`${value} wishes`)
      .build();

    para.layout(width);
    return para;
  }, [fontMgr, index]);

  // Access bubble properties directly from the array to ensure reactivity
  const cx = useDerivedValue(
    () => offsetX.value + (bubbles.value[index]?.x ?? 0) * scale.value,
  );
  const cy = useDerivedValue(
    () => offsetY.value + (bubbles.value[index]?.y ?? 0) * scale.value,
  );
  const r = useDerivedValue(
    () => (bubbles.value[index]?.radius ?? 0) * scale.value,
  );

  const ph = paragraph ? paragraph.getHeight() : 0;
  const px = useDerivedValue(() => cx.value - width / 2);
  const py = useDerivedValue(() => cy.value - ph / 2);

  const { color, stroke } = BUBBLE_COLORS[index % BUBBLE_COLORS.length];

  const isDimmed = useDerivedValue(
    () =>
      bubbles.value.some((b) => b.selected) &&
      !(bubbles.value[index]?.selected ?? false),
  );
  const fillColor = useDerivedValue(() =>
    isDimmed.value ? "rgba(160, 160, 160, 0.35)" : color,
  );
  const strokeColor = useDerivedValue(() =>
    isDimmed.value
      ? "rgba(130, 130, 130, 0.35)"
      : (bubbles.value[index]?.selected ?? false)
        ? "#FFFFFF"
        : stroke,
  );

  return (
    paragraph && (
      <>
        <Circle cx={cx} cy={cy} r={r} color={fillColor} />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          color={strokeColor}
          style="stroke"
          strokeWidth={2}
        />
        <Paragraph paragraph={paragraph} x={px} y={py} width={width} />
      </>
    )
  );
}

function makeBubbleEntry(d: BubbleType): BubbleData {
  return {
    ...d,
    radius: Math.max(Math.sqrt(d.value) * 15, 1),
    x: (Math.random() - 0.5) * 200,
    y: (Math.random() - 0.5) * 200,
    vx: 0,
    vy: 0,
    selected: false,
    dragging: false,
    pointerStartX: 0,
    pointerStartY: 0,
    startX: 0,
    startY: 0,
    startScale: 1,
  };
}

export function BubbleChart({ data, onBubbleTap }: BubbleChartProps) {
  const fontMgr = useFonts({
    MomoTrustDisplay: [require("@/assets/fonts/MomoTrustDisplay-Regular.ttf")],
  });

  const validData = useMemo(() => data.filter((d) => d.value > 0), [data]);

  const size = useSharedValue({ width: 0, height: 0 });
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const savedOffsetX = useSharedValue(0);
  const savedOffsetY = useSharedValue(0);

  const bubbles = useSharedValue<BubbleData[]>(validData.map(makeBubbleEntry));

  useEffect(() => {
    bubbles.value = validData.map(makeBubbleEntry);
  }, [validData]);

  // Initialize offsets when size changes
  useAnimatedReaction(
    () => size.value,
    (currentSize) => {
      if (currentSize.width > 0 && currentSize.height > 0) {
        if (offsetX.value === 0 && offsetY.value === 0) {
          offsetX.value = currentSize.width / 2;
          offsetY.value = currentSize.height / 2;
        }
      }
    },
  );

  // Pan background
  const pan = Gesture.Pan()
    .onStart(() => {
      "worklet";
      savedOffsetX.value = offsetX.value;
      savedOffsetY.value = offsetY.value;
    })
    .onUpdate((e) => {
      "worklet";
      if (!bubbles.value.some((b) => b.dragging)) {
        offsetX.value = savedOffsetX.value + e.translationX;
        offsetY.value = savedOffsetY.value + e.translationY;
      }
    });

  // Pinch zoom
  const pinch = Gesture.Pinch()
    .onStart(() => {
      "worklet";
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      "worklet";
      scale.value = Math.min(5, Math.max(0.5, savedScale.value * e.scale));
    });

  // Drag bubble
  const drag = Gesture.Pan()
    .maxPointers(1)
    .minDistance(10)
    .onBegin((e) => {
      "worklet";
      // compute world pointer pos for hit test
      const wx = (e.x - offsetX.value) / scale.value;
      const wy = (e.y - offsetY.value) / scale.value;

      bubbles.modify((bubblesArray) => {
        "worklet";
        bubblesArray.forEach((b) => {
          const dx = wx - b.x;
          const dy = wy - b.y;
          if (Math.sqrt(dx * dx + dy * dy) < b.radius) {
            // save drag start state
            b.dragging = true;
            b.pointerStartX = e.x;
            b.pointerStartY = e.y;
            b.startX = b.x;
            b.startY = b.y;
            b.startScale = scale.value;
          }
        });
        return bubblesArray;
      });
    })
    .onUpdate((e) => {
      "worklet";
      bubbles.modify((bubblesArray) => {
        "worklet";
        bubblesArray.forEach((b) => {
          if (b.dragging) {
            // compute screen delta since drag start
            const dxScreen = e.x - b.pointerStartX;
            const dyScreen = e.y - b.pointerStartY;
            // convert screen delta to world delta using the scale at drag start
            const dxWorld = dxScreen / (b.startScale || 1);
            const dyWorld = dyScreen / (b.startScale || 1);

            b.x = b.startX + dxWorld;
            b.y = b.startY + dyWorld;
            b.vx = 0;
            b.vy = 0;
          }
        });
        return bubblesArray;
      });
    })
    .onFinalize(() => {
      "worklet";
      bubbles.modify((bubblesArray) => {
        "worklet";
        bubblesArray.forEach((b) => (b.dragging = false));
        return bubblesArray;
      });
    });

  // Tap bubble
  const tap = Gesture.Tap().onEnd((e) => {
    "worklet";
    if (!onBubbleTap) return;
    // Convert screen coordinates to world coords
    const wx = (e.x - offsetX.value) / scale.value;
    const wy = (e.y - offsetY.value) / scale.value;

    // Hit testing bubbles
    bubbles.modify((bubblesArray) => {
      "worklet";
      for (let b of bubblesArray) {
        const dx = wx - b.x;
        const dy = wy - b.y;
        const distSq = dx * dx + dy * dy;
        if (distSq <= b.radius * b.radius) {
          b.selected = !b.selected;
          scheduleOnRN(onBubbleTap, { label: b.label, value: b.value });
        } else {
          b.selected = false;
        }
      }
      return bubblesArray;
    });
  });

  const composed = Gesture.Simultaneous(
    pinch,
    pan,
    Gesture.Exclusive(drag, tap),
  );

  useFrameCallback(() => {
    "worklet";
    bubbles.modify((bubblesArray) => {
      "worklet";
      for (let i = 0; i < bubblesArray.length; i++) {
        const b = bubblesArray[i];
        if (!b.dragging) {
          // Distance-proportional gravity toward center (0,0)
          b.vx += -b.x * GRAVITY_STRENGTH;
          b.vy += -b.y * GRAVITY_STRENGTH;

          // Slow orbital drift (perpendicular push)
          b.vx -= b.y * ROTATE_STRENGTH;
          b.vy += b.x * ROTATE_STRENGTH;

          b.vx *= DAMPING;
          b.vy *= DAMPING;

          b.x += b.vx;
          b.y += b.vy;
        }

        for (let j = i + 1; j < bubblesArray.length; j++) {
          const o = bubblesArray[j];
          const dx = o.x - b.x;
          const dy = o.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = (b.radius + o.radius) * 0.9;

          if (dist < minDist) {
            const overlap = (minDist - dist) / dist;
            const moveX = dx * overlap * COLLISION_STRENGTH;
            const moveY = dy * overlap * COLLISION_STRENGTH;

            if (!b.dragging) {
              b.x -= moveX;
              b.y -= moveY;
              b.vx -= moveX * 0.1;
              b.vy -= moveY * 0.1;
            }
            if (!o.dragging) {
              o.x += moveX;
              o.y += moveY;
              o.vx += moveX * 0.1;
              o.vy += moveY * 0.1;
            }
          }
        }
      }
      return bubblesArray;
    });
    return true;
  });

  return (
    <GestureDetector gesture={composed}>
      <View style={[styles.container]}>
        <Canvas style={{ flex: 1 }} onSize={size}>
          {validData.map((_, i) => (
            <Bubble
              key={i}
              index={i}
              bubbles={bubbles}
              offsetX={offsetX}
              offsetY={offsetY}
              scale={scale}
              fontMgr={fontMgr}
            />
          ))}
        </Canvas>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.foreground,
    borderRadius: theme.gap(2),
    overflow: "hidden",
    alignSelf: "center",
    aspectRatio: 1,
    width: "100%",
  },
}));
