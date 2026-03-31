import { useAlert } from "@/hooks";
import {
  launchCameraAsync,
  requestCameraPermissionsAsync,
} from "expo-image-picker";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Photo } from "../photo";
import { IconButton } from "./icon-button";

interface PhotoPickerProps {
  value: string[];
  onValueChange: (urls: string[]) => void;
  max?: number;
}

export function PhotoPicker({
  value,
  onValueChange,
  max = 3,
}: PhotoPickerProps) {
  const showAlert = useAlert((state) => state.showAlert);

  const handleTakePhoto = async () => {
    if (value.length >= max) return;

    try {
      const { status } = await requestCameraPermissionsAsync();
      if (status !== "granted") {
        showAlert("Camera Access Denied", "You can change this in Settings.");
        return;
      }

      const result = await launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onValueChange([...value, result.assets[0].uri]);
      }
    } catch {
      showAlert("Camera Error", "Couldn't take photo. Please try again.");
    }
  };

  const handleRemove = (index: number) => {
    onValueChange(value.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      {value.map((uri, index) => (
        <View key={`photo-${index}`}>
          <Photo source={uri} />
          <View style={styles.overlay}>
            <IconButton
              icon="close"
              iconSize={32}
              onPress={() => handleRemove(index)}
            />
          </View>
        </View>
      ))}
      {value.length < max && (
        <View key="photo-placeholder">
          <Photo source={null} />
          <View style={styles.overlay}>
            <IconButton icon="add" iconSize={32} onPress={handleTakePhoto} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.gap(1),
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
}));
