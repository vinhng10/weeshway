import { Button, ThemedText } from "@/components";
import * as Location from "expo-location";
import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface LocationPermissionProps {
  visible: boolean;
  onClose: () => void;
  onPermissionGranted?: (location: Location.LocationObject) => void;
  onPermissionDenied?: () => void;
}

export const LocationPermission: React.FunctionComponent<
  LocationPermissionProps
> = ({ visible, onClose, onPermissionGranted, onPermissionDenied }) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRequestPermission = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        onPermissionGranted?.(location);
        onClose();
      } else {
        setErrorMessage(
          "Location permission denied. You can enable it in Settings."
        );
        onPermissionDenied?.();
      }
    } catch (error) {
      setErrorMessage("Failed to get location. Please try again.");
      console.error("Location permission error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.container} onPress={onClose} />
      <View style={styles.sheet}>
        <ThemedText type="h2">Location Access</ThemedText>
        <ThemedText type="h5" color="dimmed">
          Discover the best classes around you by allowing location access.
        </ThemedText>

        {errorMessage && <ThemedText color="danger">{errorMessage}</ThemedText>}

        <Button
          label="Allow"
          onPress={handleRequestPermission}
          loading={loading}
        />
        <Button outlined label="Not Now" onPress={onClose} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
    opacity: 0.8,
  },
  sheet: {
    padding: theme.gap(2),
    borderTopLeftRadius: theme.gap(2),
    borderTopRightRadius: theme.gap(2),
    gap: theme.gap(2),
    backgroundColor: theme.colors.foreground,
  },
}));
