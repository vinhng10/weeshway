import { getArtworkUrl, pickImage } from "@/utils";
import { Image, type ImageProps } from "expo-image";
import React from "react";
import { View } from "react-native";
import {
  StyleSheet,
  type UnistylesVariants,
  withUnistyles,
} from "react-native-unistyles";
import { IconSymbol } from "./icon-symbol";
import { Pressable } from "./pressable";

const UniImage = withUnistyles(Image);

export type AvatarProps = ImageProps &
  UnistylesVariants<typeof styles> & {
    onSourceChange?: (uri: string) => void;
    editable?: boolean;
  };

export const Avatar = React.memo(
  function Avatar({
    style,
    source,
    size,
    bordered,
    shape,
    onSourceChange,
    editable,
    ...rest
  }: AvatarProps) {
    styles.useVariants({ size, bordered, shape });

    const handleImagePicker = async () => {
      if (!editable || !onSourceChange) return;
      const uri = await pickImage();
      if (uri) onSourceChange(uri);
    };

    return (
      <Pressable
        onPress={handleImagePicker}
        disabled={!editable || !onSourceChange}
      >
        <UniImage
          source={getArtworkUrl(source as string, size === "large" ? 100 : 60)}
          style={[styles.avatar, style]}
          {...rest}
        />
        {editable && onSourceChange && (
          <View style={styles.iconContainer}>
            <IconSymbol name="camera" size={16} style={styles.icon} />
          </View>
        )}
      </Pressable>
    );
  },
  (prev, next) =>
    prev.source === next.source &&
    prev.size === next.size &&
    prev.bordered === next.bordered &&
    prev.shape === next.shape &&
    prev.editable === next.editable,
);

const styles = StyleSheet.create((theme) => ({
  avatar: {
    variants: {
      bordered: {
        true: {
          borderRadius: theme.gap(2),
          borderColor: theme.colors.contrast,
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
          width: theme.gap(8),
          height: theme.gap(8),
        },
      },
    },
  },
  iconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: theme.gap(3),
    height: theme.gap(3),
    borderRadius: 999,
    backgroundColor: theme.colors.contrast,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    color: theme.colors.typographyContrast,
  },
}));
