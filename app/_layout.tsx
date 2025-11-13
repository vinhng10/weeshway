import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { Role } from "@/constants/options";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";

function RootNavigator() {
  const isLoggedIn = useAuth((state) => state.isLoggedIn);
  const initialize = useAuth((state) => state.initialize);
  const role = useRole((state) => state.role);

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

      {/* Screens for authenticated users with student role */}
      <Stack.Protected guard={isLoggedIn && role === Role.Student}>
        <Stack.Screen name="(student)" options={{ headerShown: false }} />
      </Stack.Protected>

      {/* Screens for authenticated users with teacher role */}
      <Stack.Protected guard={isLoggedIn && role === Role.Teacher}>
        <Stack.Screen name="(teacher)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function Root() {
  return (
    <GestureHandlerRootView>
      <RootNavigator />
    </GestureHandlerRootView>
  );
}
