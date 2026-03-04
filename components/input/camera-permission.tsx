import { useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { Linking, Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Bullet } from "../bullet";
import { ThemedText } from "../themed-text";
import { Button } from "./button";

export const CameraPermission = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();

  if (!permission || permission.granted) return null;

  const denied = !permission.canAskAgain;

  const handleAllow = async () => {
    if (denied) {
      await Linking.openSettings();
    } else {
      await requestPermission();
    }
  };

  return (
    <Modal
      visible={!permission.granted}
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
        <View style={styles.row}>
          <Button
            style={styles.button}
            outlined
            label="Later"
            onPress={() => router.back()}
          />
          <Button
            style={styles.button}
            label={denied ? "Settings" : "Allow"}
            onPress={handleAllow}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
    opacity: 0.95,
  },
  sheet: {
    padding: theme.gap(2),
    borderTopLeftRadius: theme.gap(2),
    borderTopRightRadius: theme.gap(2),
    gap: theme.gap(2),
    backgroundColor: theme.colors.foreground,
  },
  row: {
    flexDirection: "row",
    gap: theme.gap(2),
  },
  button: {
    flex: 1,
  },
}));
