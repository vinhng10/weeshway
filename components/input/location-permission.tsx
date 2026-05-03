import { ROLE } from "@/constants";
import { useAuth, useOnboarding, useRole } from "@/hooks";
import { supabase } from "@/supabase";
import { ProfileType } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Bullet } from "../bullet";
import { Modal } from "../modal";
import { Pressable } from "../pressable";
import { ThemedText } from "../themed-text";
import { Button } from "./button";

export async function syncLocation(profile: ProfileType | null): Promise<void> {
  if (!profile?.id) return;

  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) return;

    const { coords } = await Location.getCurrentPositionAsync();
    const newLocation = `POINT(${coords.longitude} ${coords.latitude})`;

    if (profile.location === newLocation) return;

    await supabase
      .from("profiles")
      .update({ location: newLocation })
      .eq("id", profile.id)
      .throwOnError();
  } catch {}
}

export const LocationPermission = () => {
  const prompted = useOnboarding((state) => state.prompted.location);
  const setPrompted = useOnboarding((state) => state.setPrompted);
  const profile = useAuth((state) => state.profile);
  const fetchProfile = useAuth((state) => state.fetchProfile);
  const role = useRole((state) => state.role);
  const queryClient = useQueryClient();

  if (prompted) return null;

  const handleAction = async (request: boolean) => {
    try {
      if (request) {
        await Location.requestForegroundPermissionsAsync();
      }
      await syncLocation(profile);
      await fetchProfile();
    } finally {
      // This is the source of truth that prevents it from ever showing again
      setPrompted("location", true);
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes("classes"),
      });
    }
  };

  return (
    <Modal visible={!prompted} onRequestClose={() => handleAction(true)}>
      <Pressable style={styles.container} onPress={() => handleAction(true)} />
      <View style={styles.sheet}>
        <ThemedText type="h2">Explore What's Nearby</ThemedText>
        <ThemedText type="h5" color="dimmed">
          Share your location to:
        </ThemedText>
        {role === ROLE.STUDENT ? (
          <>
            <Bullet text={"Find dance classes near you"} />
            <Bullet text={"Help local teachers discover your wishes"} />
          </>
        ) : (
          <>
            <Bullet text={"Explore what your local students are wishing for"} />
            <Bullet text={"Help students discover your classes"} />
          </>
        )}

        <Button label="Continue" onPress={() => handleAction(true)} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
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
