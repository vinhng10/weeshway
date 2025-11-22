import { useAudioPlayerStore } from "@/hooks/useAudioPlayerStore";
import { useAuth } from "@/hooks/useAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";

const queryClient = new QueryClient();

function RootNavigator() {
  const isLoggedIn = useAuth((state) => state.isLoggedIn);
  const initialize = useAuth((state) => state.initialize);
  const setPlayer = useAudioPlayerStore((state) => state.setPlayer);
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);

  // Initialize audio player on mount
  useEffect(() => {
    setPlayer(player, status);
  }, [player, status, setPlayer]);

  // Initialize auth store on mount
  useEffect(() => {
    const cleanup = initialize();
    return cleanup;
  }, [initialize]);

  return (
    <Stack>
      {/* Screens for unauthenticated users */}
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
      </Stack.Protected>

      {/* Screens for authenticated users */}
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function Root() {
  return (
    <GestureHandlerRootView>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <RootNavigator />
        </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
