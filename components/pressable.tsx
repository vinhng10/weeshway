import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useRef } from "react";
import {
  Pressable as RNPressable,
  type GestureResponderEvent,
  type PressableProps,
} from "react-native";

export const Pressable: React.FunctionComponent<PressableProps> = ({
  onPress,
  ...rest
}) => {
  const navigation = useNavigation();
  const pressed = useRef(false);

  useEffect(() => {
    return navigation.addListener("focus", () => {
      pressed.current = false;
    });
  }, [navigation]);

  const handlePress = useCallback(
    async (e: GestureResponderEvent) => {
      if (pressed.current) return;
      pressed.current = true;
      try {
        await onPress?.(e);
      } finally {
        if (navigation.isFocused()) {
          pressed.current = false;
        }
      }
    },
    [onPress, navigation],
  );

  return <RNPressable onPress={handlePress} {...rest} />;
};
