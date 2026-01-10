import { useAuth, useLocales } from "@/hooks";
import { supabase } from "@/supabase";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ThemedText } from "../themed-text";
import { Button } from "./button";

export const LocationPermission = () => {
  const [visible, setVisible] = useState(false);

  const profile = useAuth((state) => state.profile);
  const fetchProfile = useAuth((state) => state.fetchProfile);
  const country = useLocales((state) => state.country);

  const updateLocation = async (status: Location.PermissionStatus) => {
    if (!profile?.id || !country) return;

    try {
      const updateData: { country: string; location: string | null } = {
        country,
        location: null,
      };

      if (status === Location.PermissionStatus.GRANTED) {
        const { coords } = await Location.getCurrentPositionAsync();
        updateData.location = `POINT(${coords.longitude} ${coords.latitude})`;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", profile.id);

      if (error) throw error;
      await fetchProfile();
    } catch (error) {
      throw error;
    }
  };

  const handleRequestPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      await updateLocation(status);
    } finally {
      setVisible(false);
    }
  };

  const handleClose = async () => {
    try {
      await updateLocation(Location.PermissionStatus.DENIED);
    } finally {
      setVisible(false);
    }
  };

  useEffect(() => {
    if (!profile?.id) return;

    async function checkAndUpdateLocation() {
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status === Location.PermissionStatus.UNDETERMINED) {
        setVisible(true);
      } else {
        await updateLocation(status);
      }
    }

    checkAndUpdateLocation();
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={handleClose}
    >
      <Pressable style={styles.container} onPress={handleClose} />
      <View style={styles.sheet}>
        <ThemedText type="h2">Location Access</ThemedText>
        <ThemedText type="h5" color="dimmed">
          Find fun classes nearby and let local teachers fulfill your dream
          classes by letting us know where you are.
        </ThemedText>

        <Button label="Allow" onPress={handleRequestPermission} />
        <Button outlined label="Not Now" onPress={handleClose} />
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
