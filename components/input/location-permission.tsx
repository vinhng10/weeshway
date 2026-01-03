import { Button, ThemedText } from "@/components";
import { useAuth } from "@/hooks";
import { supabase } from "@/supabase";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export const LocationPermission = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const profile = useAuth((state) => state.profile);

  useEffect(() => {
    async function checkLocationPermission() {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        setVisible(true);
      } else {
        // Permission already granted, update location
        await updateLocation();
      }
    }
    checkLocationPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const handleRequestPermission = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        await updateLocation();
        setVisible(false);
      } else {
        setErrorMessage(
          "Location permission denied. You can enable it in Settings."
        );
      }
    } catch (error) {
      setErrorMessage("Failed to get location. Please try again.");
      console.error("Location permission error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = async () => {
    if (!profile?.id) return;

    try {
      const location = await Location.getCurrentPositionAsync({});
      const { error } = await supabase
        .from("profiles")
        .update({
          location: `POINT(${location.coords.longitude} ${location.coords.latitude})`,
        })
        .eq("id", profile.id);
      if (error) throw error;
      console.log("Location updated:", location);
    } catch (error) {
      setErrorMessage("Failed to update location. Please try again.");
      console.error("Location update error:", error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={() => setVisible(false)}
    >
      <Pressable style={styles.container} onPress={() => setVisible(false)} />
      <View style={styles.sheet}>
        <ThemedText type="h2">Location Access</ThemedText>
        <ThemedText type="h5" color="dimmed">
          Find fun classes nearby and let local teachers fulfill your dream
          classes by letting us know where you are.
        </ThemedText>

        {errorMessage && <ThemedText color="danger">{errorMessage}</ThemedText>}

        <Button
          label="Allow"
          onPress={handleRequestPermission}
          loading={loading}
        />
        <Button outlined label="Not Now" onPress={() => setVisible(false)} />
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
