import {
  Canvas,
  Circle,
  Paragraph,
  Skia,
  TextAlign,
  useFonts,
} from "@shopify/react-native-skia";
import React, { useMemo } from "react";
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

export interface BubbleType {
  label: number;
  value: number;
}

interface BubbleChartProps {
  data: BubbleType[];
  onBubbleTap?: (bubbleData: BubbleType) => void;
}

interface BubbleData {
  label: number;
  value: number;
  color: { color: string; stroke: string };
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
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
}

function Bubble({ index, bubbles, offsetX, offsetY, scale }: BubbleProps) {
  const width = 100;
  const fontMgr = useFonts({
    MomoTrustDisplay: [require("@/assets/fonts/MomoTrustDisplay-Regular.ttf")],
  });

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
    () => offsetX.value + bubbles.value[index].x * scale.value
  );
  const cy = useDerivedValue(
    () => offsetY.value + bubbles.value[index].y * scale.value
  );
  const r = useDerivedValue(() => bubbles.value[index].radius * scale.value);

  const ph = paragraph ? paragraph.getHeight() : 0;
  const px = useDerivedValue(() => cx.value - width / 2);
  const py = useDerivedValue(() => cy.value - ph / 2);

  // Get color values (these don't change, so we can access them once)
  const { color, stroke } = bubbles.value[index].color;

  return (
    paragraph && (
      <>
        <Circle cx={cx} cy={cy} r={r} color={Skia.Color(color)} />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          color={Skia.Color(stroke)}
          style="stroke"
          strokeWidth={2}
        />
        <Paragraph paragraph={paragraph} x={px} y={py} width={width} />
      </>
    )
  );
}

export function BubbleChart({ data, onBubbleTap }: BubbleChartProps) {
  const size = useSharedValue({ width: 0, height: 0 });
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const savedOffsetX = useSharedValue(0);
  const savedOffsetY = useSharedValue(0);

  // Single shared value containing all bubble data
  const bubbles = useSharedValue<BubbleData[]>(
    data.map((d) => ({
      ...d,
      color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
      radius: Math.sqrt(d.value) * 15,
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200,
      vx: 0,
      vy: 0,
      dragging: false,
      pointerStartX: 0,
      pointerStartY: 0,
      startX: 0,
      startY: 0,
      startScale: 1,
    }))
  );

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
    }
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
    for (let b of bubbles.value) {
      const dx = wx - b.x;
      const dy = wy - b.y;
      const distSq = dx * dx + dy * dy;
      if (distSq <= b.radius * b.radius) {
        scheduleOnRN(onBubbleTap, { label: b.label, value: b.value });
        break;
      }
    }
  });

  const composed = Gesture.Simultaneous(
    pinch,
    pan,
    Gesture.Exclusive(drag, tap)
  );

  // Physics
  useFrameCallback(() => {
    "worklet";
    const gravity = 0.4;
    const damping = 0.85;

    bubbles.modify((bubblesArray) => {
      "worklet";
      for (let i = 0; i < bubblesArray.length; i++) {
        const b = bubblesArray[i];
        if (!b.dragging) {
          const dx = -b.x;
          const dy = -b.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          b.vx += (dx / dist) * gravity;
          b.vy += (dy / dist) * gravity;
          b.vx *= damping;
          b.vy *= damping;

          b.x += b.vx;
          b.y += b.vy;
        }

        // collisions - allow more overlap by reducing minDist threshold
        for (let j = i + 1; j < bubblesArray.length; j++) {
          const o = bubblesArray[j];
          const dx = o.x - b.x;
          const dy = o.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          // Allow bubbles to overlap by up to 40% before collision detection
          const minDist = (b.radius + o.radius) * 0.9;

          if (dist < minDist) {
            const overlap = (minDist - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;

            b.x -= nx * overlap;
            b.y -= ny * overlap;
            o.x += nx * overlap;
            o.y += ny * overlap;
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
          {data.map((_, i) => (
            <Bubble
              key={i}
              index={i}
              bubbles={bubbles}
              offsetX={offsetX}
              offsetY={offsetY}
              scale={scale}
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
