import { useAlert } from "@/hooks";
import { Image, type ImageProps } from "expo-image";
import {
  launchImageLibraryAsync,
  requestMediaLibraryPermissionsAsync,
} from "expo-image-picker";
import { Pressable, View } from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";
import { IconSymbol } from "./icon-symbol";

export type AvatarProps = ImageProps &
  UnistylesVariants<typeof styles> & {
    onSourceChange?: (uri: string) => void;
    editable?: boolean;
  };

export function Avatar({
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
  const showAlert = useAlert((state) => state.showAlert);

  const handleImagePicker = async () => {
    if (!editable || !onSourceChange) return;

    try {
      // Request permissions
      const { status } = await requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showAlert(
          "Permission Needed",
          "Please allow access to your photo library to upload an image."
        );
        return;
      }

      // Launch image picker
      const result = await launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const uri = asset.uri;
        onSourceChange(uri);
      }
    } catch {
      showAlert("Upload Failed", "Couldn't load your image. Please try again.");
    }
  };

  return (
    <Pressable onPress={handleImagePicker}>
      <Image source={source} style={[styles.avatar, style]} {...rest} />
      {editable && onSourceChange && (
        <View style={styles.cameraButton}>
          <IconSymbol name="camera" size={16} />
        </View>
      )}
    </Pressable>
  );
}

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
  cameraButton: {
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
}));
