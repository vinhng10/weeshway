import {
  BlurTargetView,
  BlurView,
  type BlurViewProps,
} from "expo-blur";
import { createContext, useContext, useRef } from "react";
import { Platform, View, type ViewProps } from "react-native";

const isAndroid = Platform.OS === "android";

const BlurTargetContext = createContext<React.RefObject<View | null> | undefined>(
  undefined,
);

export function BlurProvider({ children, style, ...props }: ViewProps) {
  const targetRef = useRef<View | null>(null);
  const Container = isAndroid ? BlurTargetView : View;

  return (
    <BlurTargetContext.Provider value={isAndroid ? targetRef : undefined}>
      <Container ref={targetRef} style={[{ flex: 1 }, style]} {...props}>
        {children}
      </Container>
    </BlurTargetContext.Provider>
  );
}

export type BlurProps = BlurViewProps;

export function Blur({ style, blurTarget, ...props }: BlurProps) {
  const contextTarget = useContext(BlurTargetContext);
  const target = blurTarget ?? contextTarget;

  if (isAndroid && !target) {
    const tintColors = {
      light: "rgba(255,255,255,0.7)",
      dark: "rgba(0,0,0,0.5)",
    } as const;
    return (
      <View
        style={[style, { backgroundColor: tintColors[props.tint as keyof typeof tintColors] ?? "rgba(128,128,128,0.5)" }]}
      />
    );
  }

  return (
    <BlurView
      {...props}
      style={style}
      {...(isAndroid && { blurTarget: target, blurMethod: "dimezisBlurView" })}
    />
  );
}
