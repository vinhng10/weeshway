import {
  Canvas,
  Circle,
  Paragraph,
  Skia,
  TextAlign,
  useFonts,
} from "@shopify/react-native-skia";
import React, { useMemo, useRef } from "react";
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

// Predefined color palette for bubbles
const BUBBLE_COLORS = [
  { color: "rgba(106, 156, 0, 0.95)", stroke: "rgb(82, 121, 0)" },
  { color: "rgba(192, 70, 74, 0.95)", stroke: "rgb(153, 47, 53)" },
  { color: "rgba(199, 136, 0, 0.95)", stroke: "rgb(151, 103, 0)" },
  { color: "rgba(16, 164, 142, 0.95)", stroke: "rgb(14, 142, 123)" },
];

export interface BubbleData {
  label: string;
  value: number;
}

interface BubbleChartProps {
  data: BubbleData[];
}

interface BubbleProps {
  bubble: {
    x: SharedValue<number>;
    y: SharedValue<number>;
    radius: number;
    color: { color: string; stroke: string };
    label: string;
    value: number;
  };
  offsetX: SharedValue<number>;
  offsetY: SharedValue<number>;
  scale: SharedValue<number>;
}

function Bubble({ bubble, offsetX, offsetY, scale }: BubbleProps) {
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
    const para = Skia.ParagraphBuilder.Make(paragraphStyle, fontMgr)
      .pushStyle(textStyle)
      .addText(`${bubble.label}\n`)
      .addText(`${bubble.value} wishes`)
      .build();

    para.layout(width);
    return para;
  }, [fontMgr, bubble.label]);

  const cx = useDerivedValue(
    () => offsetX.value + bubble.x.value * scale.value
  );
  const cy = useDerivedValue(
    () => offsetY.value + bubble.y.value * scale.value
  );
  const r = useDerivedValue(() => bubble.radius * scale.value);

  const pw = paragraph ? paragraph.getLongestLine() : 0;
  const ph = paragraph ? paragraph.getHeight() : 0;
  const px = useDerivedValue(() => cx.value - width / 2);
  const py = useDerivedValue(() => cy.value - ph / 2);

  return (
    paragraph && (
      <>
        <Circle cx={cx} cy={cy} r={r} color={Skia.Color(bubble.color.color)} />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          color={Skia.Color(bubble.color.stroke)}
          style="stroke"
          strokeWidth={2}
        />
        <Paragraph paragraph={paragraph} x={px} y={py} width={width} />
      </>
    )
  );
}

export function BubbleChart({ data }: BubbleChartProps) {
  const size = useSharedValue({ width: 0, height: 0 });
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const savedOffsetX = useSharedValue(0);
  const savedOffsetY = useSharedValue(0);

  // Create bubble shared values ONCE
  const bubblesRef = useRef<any[] | null>(null);
  if (!bubblesRef.current) {
    bubblesRef.current = data.map((d) => ({
      ...d,
      color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
      radius: Math.sqrt(d.value) * 15,
      x: useSharedValue((Math.random() - 0.5) * 200),
      y: useSharedValue((Math.random() - 0.5) * 200),
      vx: useSharedValue(0),
      vy: useSharedValue(0),
      dragging: useSharedValue(false),
      // NEW: values to support stable dragging
      // pointerStart = screen coords where drag started
      pointerStartX: useSharedValue(0),
      pointerStartY: useSharedValue(0),
      // start bubble world coords at drag start
      startX: useSharedValue(0),
      startY: useSharedValue(0),
      // scale at drag start (so zooming during drag doesn't change mapping)
      startScale: useSharedValue(1),
    }));
  }
  const bubbles = bubblesRef.current;

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

  // Pan background (unchanged)
  const pan = Gesture.Pan()
    .onStart(() => {
      "worklet";
      savedOffsetX.value = offsetX.value;
      savedOffsetY.value = offsetY.value;
    })
    .onUpdate((e) => {
      "worklet";
      if (!bubbles.some((b) => b.dragging.value)) {
        offsetX.value = savedOffsetX.value + e.translationX;
        offsetY.value = savedOffsetY.value + e.translationY;
      }
    });

  // Pinch zoom (unchanged)
  const pinch = Gesture.Pinch()
    .onStart(() => {
      "worklet";
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      "worklet";
      scale.value = Math.min(5, Math.max(0.5, savedScale.value * e.scale));
    });

  // Drag bubble — FIXED: store pointer & bubble starts, use startScale when converting delta
  const drag = Gesture.Pan()
    .maxPointers(1)
    .onBegin((e) => {
      "worklet";
      // compute world pointer pos for hit test
      const wx = (e.x - offsetX.value) / scale.value;
      const wy = (e.y - offsetY.value) / scale.value;

      bubbles.forEach((b) => {
        const dx = wx - b.x.value;
        const dy = wy - b.y.value;
        if (Math.sqrt(dx * dx + dy * dy) < b.radius) {
          // save drag start state
          b.dragging.value = true;
          b.pointerStartX.value = e.x;
          b.pointerStartY.value = e.y;
          b.startX.value = b.x.value;
          b.startY.value = b.y.value;
          b.startScale.value = scale.value; // important
        }
      });
    })
    .onUpdate((e) => {
      "worklet";
      bubbles.forEach((b) => {
        if (b.dragging.value) {
          // compute screen delta since drag start
          const dxScreen = e.x - b.pointerStartX.value;
          const dyScreen = e.y - b.pointerStartY.value;
          // convert screen delta to world delta using the scale at drag start
          const dxWorld = dxScreen / (b.startScale.value || 1);
          const dyWorld = dyScreen / (b.startScale.value || 1);

          b.x.value = b.startX.value + dxWorld;
          b.y.value = b.startY.value + dyWorld;
          b.vx.value = 0;
          b.vy.value = 0;
        }
      });
    })
    .onEnd(() => {
      "worklet";
      bubbles.forEach((b) => (b.dragging.value = false));
    });

  const composed = Gesture.Simultaneous(pinch, pan, drag);

  // Physics
  useFrameCallback(() => {
    const gravity = 0.4;
    const damping = 0.85;

    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      if (!b.dragging.value) {
        const dx = -b.x.value;
        const dy = -b.y.value;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        b.vx.value += (dx / dist) * gravity;
        b.vy.value += (dy / dist) * gravity;
        b.vx.value *= damping;
        b.vy.value *= damping;

        b.x.value += b.vx.value;
        b.y.value += b.vy.value;
      }

      // collisions - allow more overlap by reducing minDist threshold
      for (let j = i + 1; j < bubbles.length; j++) {
        const o = bubbles[j];
        const dx = o.x.value - b.x.value;
        const dy = o.y.value - b.y.value;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        // Allow bubbles to overlap by up to 40% before collision detection
        const minDist = (b.radius + o.radius) * 0.9;

        if (dist < minDist) {
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;

          b.x.value -= nx * overlap;
          b.y.value -= ny * overlap;
          o.x.value += nx * overlap;
          o.y.value += ny * overlap;
        }
      }
    }
    return true;
  });

  return (
    <GestureDetector gesture={composed}>
      <View style={[styles.container]}>
        <Canvas style={{ flex: 1 }} onSize={size}>
          {bubbles.map((bubble, i) => (
            <Bubble
              key={i}
              bubble={bubble}
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
