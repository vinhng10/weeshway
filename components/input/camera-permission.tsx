import { PermissionResponse } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState, Linking, Modal, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Bullet } from "../bullet";
import { Pressable } from "../pressable";
import { ThemedText } from "../themed-text";
import { Button } from "./button";
import { ButtonGroup } from "./button-group";

interface CameraPermissionProps {
  permission: PermissionResponse;
  requestPermission: () => Promise<PermissionResponse>;
}

export const CameraPermission = ({
  permission,
  requestPermission,
}: CameraPermissionProps) => {
  const router = useRouter();
  const denied = !permission.canAskAgain;
  const openedSettings = useRef(false);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active" && openedSettings.current) {
        openedSettings.current = false;
        requestPermission();
      }
    });
    return () => sub.remove();
  }, [requestPermission]);

  const handleAllow = async () => {
    if (denied) {
      openedSettings.current = true;
      await Linking.openSettings();
    } else {
      await requestPermission();
    }
  };

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={() => router.back()}
    >
      <Pressable style={styles.container} onPress={() => router.back()} />
      <View style={styles.sheet}>
        <ThemedText type="h2">Check In Students</ThemedText>
        <ThemedText type="h5" color="dimmed">
          Allow camera access to:
        </ThemedText>
        <Bullet text="Scan booking QR code. You only get paid for checked-in bookings." />
        <Button
          label={denied ? "Settings" : "Continue"}
          onPress={handleAllow}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top,
    backgroundColor: theme.colors.background,
    opacity: 0.95,
  },
  sheet: {
    padding: theme.gap(2),
    borderTopLeftRadius: theme.gap(2),
    borderTopRightRadius: theme.gap(2),
    gap: theme.gap(1),
    backgroundColor: theme.colors.foreground,
  },
}));
