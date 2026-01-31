import { syncLocation, syncPushToken } from "@/components";
import { ROLE, STRIPE_PUBLISHABLE_KEY } from "@/constants";
import {
  useAudioPlayerStore,
  useAuth,
  useLocales,
  useNotificationObserver,
  useRole,
} from "@/hooks";
import { StripeProvider } from "@stripe/stripe-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Stack, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});

const queryClient = new QueryClient();

function RootNavigator() {
  const isLoggedIn = useAuth((state) => !!state.session && !!state.profile);
  const initialize = useAuth((state) => state.initialize);
  const profile = useAuth((state) => state.profile);
  const country = useLocales((state) => state.country);
  const setPlayer = useAudioPlayerStore((state) => state.setPlayer);
  const pause = useAudioPlayerStore((state) => state.pause);
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const role = useRole((state) => state.role);
  const segments = useSegments();
  useNotificationObserver();

  // Initialize audio player on mount
  useEffect(() => {
    setPlayer(player, status);
  }, [player, status, setPlayer]);

  // Initialize auth store on mount
  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  // Sync location once when user is logged in
  useEffect(() => {
    syncLocation(profile, country);
  }, [isLoggedIn, country]);

  // Sync push token once when user is logged in
  useEffect(() => {
    syncPushToken(profile);
  }, [isLoggedIn]);

  // Pause audio player on navigation
  useEffect(() => {
    pause();
  }, [segments]);

  return (
    <Stack>
      {/* Screens for unauthenticated users */}
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
      </Stack.Protected>

      {/* Screens for authenticated users */}
      <Stack.Protected guard={isLoggedIn && role === ROLE.STUDENT}>
        <Stack.Screen name="(student)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={isLoggedIn && role === ROLE.TEACHER}>
        <Stack.Screen name="(teacher)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function Root() {
  return (
    <GestureHandlerRootView>
      <KeyboardProvider>
        <StripeProvider
          publishableKey={STRIPE_PUBLISHABLE_KEY}
          merchantIdentifier="merchant.com.anonymous.danceai"
          urlScheme="danceai"
        >
          <QueryClientProvider client={queryClient}>
            <RootNavigator />
          </QueryClientProvider>
        </StripeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
