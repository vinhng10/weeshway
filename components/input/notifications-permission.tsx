import { ROLE } from "@/constants";
import { useAlert, useAuth, useOnboarding, useRole } from "@/hooks";
import { supabase } from "@/supabase";
import { ProfileType } from "@/types";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Modal, Platform, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Bullet } from "../bullet";
import { ThemedText } from "../themed-text";
import { Button } from "./button";
import { ButtonGroup } from "./button-group";

export async function syncPushToken(
  profile: ProfileType | null,
): Promise<void> {
  if (!profile?.id) return;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    let token = null;

    if (status === Notifications.PermissionStatus.GRANTED) {
      // IMPORTANT: Android 13+ requires a channel to exist before/during permission prompts
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
        });
      }

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;
      if (projectId) {
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      }
    }

    // Only hit Supabase if the token has actually changed
    if (profile.expoPushToken !== token) {
      await supabase
        .from("profiles")
        .update({ expo_push_token: token })
        .eq("id", profile.id)
        .throwOnError();
    }
  } catch {}
}

export const NotificationsPermission = () => {
  const prompted = useOnboarding((state) => state.prompted.notifications);
  const setPrompted = useOnboarding((state) => state.setPrompted);
  const profile = useAuth((state) => state.profile);
  const fetchProfile = useAuth((state) => state.fetchProfile);
  const role = useRole((state) => state.role);
  const showAlert = useAlert((state) => state.showAlert);

  if (prompted) return null;

  const handleAction = async (request: boolean) => {
    try {
      if (request) {
        await Notifications.requestPermissionsAsync();
      }
      await syncPushToken(profile);
      await fetchProfile();
    } catch {
      showAlert(
        "Notifications",
        "Something went wrong enabling notifications. Please try again later.",
      );
    } finally {
      // This is the source of truth that prevents it from ever showing again
      setPrompted("notifications", true);
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
        <ThemedText type="h2">Stay Notified</ThemedText>
        <ThemedText type="h5" color="dimmed">
          Enable notifications to:
        </ThemedText>
        {role === ROLE.STUDENT ? (
          <>
            <Bullet text={"Know when we've found classes you'll love"} />
            <Bullet text={"Get reminders before your classes start"} />
          </>
        ) : (
          <>
            <Bullet text={"Get reminders before your classes start"} />
          </>
        )}

        <ButtonGroup>
          <Button outlined label="Later" onPress={() => handleAction(false)} />
          <Button label="Allow" onPress={() => handleAction(true)} />
        </ButtonGroup>
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
