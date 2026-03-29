import { Alert, syncLocation, syncPushToken } from "@/components";
import { ROLE, STRIPE_PUBLISHABLE_KEY } from "@/constants";
import {
  useAudioPlayerStore,
  useAuth,
  useLocales,
  useNotificationObserver,
  useOnboarding,
  useRole,
} from "@/hooks";
import { StripeProvider } from "@stripe/stripe-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootNavigator() {
  const isLoggedIn = useAuth((state) => !!state.session && !!state.profile);
  const isLoading = useAuth((state) => state.isLoading);
  const initialize = useAuth((state) => state.initialize);
  const profile = useAuth((state) => state.profile);
  const country = useLocales((state) => state.country);
  const currency = useLocales((state) => state.currency);
  const syncLocales = useLocales((state) => state.syncLocales);
  const initFees = useLocales((state) => state.initFees);
  const setPlayer = useAudioPlayerStore((state) => state.setPlayer);
  const pause = useAudioPlayerStore((state) => state.pause);
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const role = useRole((state) => state.role);
  const roleSelected = useOnboarding((state) => state.prompted.role);
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

  // Fetch spot fee and USD exchange rates on mount
  useEffect(() => {
    initFees();
  }, [initFees]);

  // Sync country and currency
  useEffect(() => {
    syncLocales(profile);
  }, [isLoggedIn, country, currency]);

  // Sync GPS location if permission granted
  useEffect(() => {
    syncLocation(profile);
  }, [isLoggedIn]);

  // Sync push token once when user is logged in
  useEffect(() => {
    syncPushToken(profile);
  }, [isLoggedIn]);

  // Pause audio player on navigation
  useEffect(() => {
    pause();
  }, [segments]);

  // Hide splash screen once auth state is determined.
  // We always render the Stack so Android doesn't consume the deep link intent
  // before the navigator is ready.
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hide();
    }
  }, [isLoading]);

  return (
    <Stack>
      {/* Screens for unauthenticated users */}
      <Stack.Protected guard={!isLoading && !isLoggedIn}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
        <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
      </Stack.Protected>

      {/* Onboarding screen for users who haven't selected a role */}
      <Stack.Protected guard={isLoggedIn && !roleSelected}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>

      {/* Screens for authenticated users */}
      <Stack.Protected
        guard={isLoggedIn && roleSelected && role === ROLE.STUDENT}
      >
        <Stack.Screen name="(student)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected
        guard={isLoggedIn && roleSelected && role === ROLE.TEACHER}
      >
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
          merchantIdentifier="merchant.com.weeshway.weeshway"
          urlScheme={Constants.expoConfig?.scheme as string}
        >
          <QueryClientProvider client={queryClient}>
            <StatusBar style="auto" />
            <RootNavigator />
            <Alert />
          </QueryClientProvider>
        </StripeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
