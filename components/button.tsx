import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet, UnistylesVariants } from "react-native-unistyles";
import { useAnimatedVariantColor } from "react-native-unistyles/reanimated";
import { ThemedText } from "./themed-text";

interface ButtonProps extends UnistylesVariants<typeof style> {
  label: string;
  onPress(): void;
}

export const Button: React.FunctionComponent<ButtonProps> = ({
  label,
  accent,
  onPress,
}) => {
  style.useVariants({
    accent: accent,
  });

  const color = useAnimatedVariantColor(style.buttonColor, "backgroundColor");
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(color.value, {
      duration: 500,
    }),
  }));

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[animatedStyle, style.button]}>
        <ThemedText bold>{label}</ThemedText>
      </Animated.View>
    </Pressable>
  );
};

const style = StyleSheet.create((theme) => ({
  button: {
    width: "100%",
    padding: theme.gap(2),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: theme.gap(1),
  },
  buttonColor: {
    variants: {
      accent: {
        banana: {
          backgroundColor: theme.colors.accents.banana,
        },
        pumpkin: {
          backgroundColor: theme.colors.accents.pumpkin,
        },
        apple: {
          backgroundColor: theme.colors.accents.apple,
        },
        grass: {
          backgroundColor: theme.colors.accents.grass,
        },
        storm: {
          backgroundColor: theme.colors.accents.storm,
        },
        default: {
          backgroundColor: theme.colors.accents.banana,
        },
      },
    },
  },
}));
