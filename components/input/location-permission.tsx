import { ROLE } from "@/constants";
import { useAuth, useLocales, useOnboarding, useRole } from "@/hooks";
import { supabase } from "@/supabase";
import { ProfileType } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Bullet } from "../bullet";
import { ThemedText } from "../themed-text";
import { Button } from "./button";

export async function syncLocation(
  profile: ProfileType | null,
  country: string | null
): Promise<void> {
  if (!profile?.id || !country) return;

  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    let newLocation: string | null = null;

    if (status === Location.PermissionStatus.GRANTED) {
      const { coords } = await Location.getCurrentPositionAsync();
      newLocation = `POINT(${coords.longitude} ${coords.latitude})`;
    }

    // Only update if country or location has changed
    const countryChanged = profile.country !== country;
    const locationChanged = profile.location !== newLocation;

    if (!countryChanged && !locationChanged) return;

    const data = { country, location: newLocation };

    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", profile.id);

    if (error) throw error;
  } catch (error) {
    console.error("Location update failed:", error);
  }
}

export const LocationPermission = () => {
  const prompted = useOnboarding((state) => state.prompted.location);
  const setPrompted = useOnboarding((state) => state.setPrompted);
  const profile = useAuth((state) => state.profile);
  const fetchProfile = useAuth((state) => state.fetchProfile);
  const country = useLocales((state) => state.country);
  const role = useRole((state) => state.role);
  const queryClient = useQueryClient();

  if (prompted) return null;

  const handleAction = async (request: boolean) => {
    try {
      if (request) {
        await Location.requestForegroundPermissionsAsync();
      }
      await syncLocation(profile, country);
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
    <Modal
      visible={!prompted}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={() => handleAction(false)}
    >
      <Pressable style={styles.container} onPress={() => handleAction(false)} />
      <View style={styles.sheet}>
        <ThemedText type="h2">Explore What's Nearby</ThemedText>
        <ThemedText type="h5" color="dimmed">
          Share your location to:
        </ThemedText>
        {role === ROLE.STUDENT ? (
          <>
            <Bullet text={"Find fun classes around the corner"} />
            <Bullet
              text={"Let local teachers bring your dream classes to life"}
            />
          </>
        ) : (
          <>
            <Bullet text={"Explore what your local students are wishing for"} />
            <Bullet text={"Launch new classes where the demand is highest"} />
          </>
        )}

        <View style={styles.row}>
          <Button
            style={styles.button}
            outlined
            label="Later"
            onPress={() => handleAction(false)}
          />
          <Button
            style={styles.button}
            label="Allow"
            onPress={() => handleAction(true)}
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
    opacity: 0.8,
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
