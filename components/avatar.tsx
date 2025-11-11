import { Image, type ImageProps } from "expo-image";
import { Pressable } from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";

export type AvatarProps = ImageProps &
  UnistylesVariants<typeof styles> & {
    onPress?: any;
  };

export function Avatar({
  style,
  source,
  size,
  bordered,
  shape,
  onPress,
  ...rest
}: AvatarProps) {
  styles.useVariants({
    size,
    bordered,
    shape,
  });
  return (
    <Pressable onPress={onPress}>
      <Image source={source} style={[styles.avatar, style]} {...rest} />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  avatar: {
    variants: {
      bordered: {
        true: {
          borderRadius: theme.gap(2),
          borderColor: "#FFFFFF",
          borderWidth: 2,
        },
      },
      shape: {
        square: {
          borderRadius: theme.gap(2),
        },
        circle: {
          borderRadius: 999,
        },
      },
      size: {
        default: {
          width: theme.gap(5),
          height: theme.gap(5),
        },
        large: {
          width: theme.gap(10),
          height: theme.gap(10),
        },
      },
    },
  },
}));
