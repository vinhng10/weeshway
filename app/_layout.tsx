import { Stack } from "expo-router";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { useRole } from "@/hooks/useRole";
import { AuthProvider, useAuth } from "./ctx";

function RootNavigator() {
  const { isLoggedIn } = useAuth();
  const role = useRole((state) => state.role);

  return (
    <Stack>
      {/* Screens for unauthenticated users */}
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
      </Stack.Protected>

      {/* Screens for authenticated users with student role */}
      <Stack.Protected guard={isLoggedIn && role === "student"}>
        <Stack.Screen name="(student)" options={{ headerShown: false }} />
      </Stack.Protected>

      {/* Screens for authenticated users with teacher role */}
      <Stack.Protected guard={isLoggedIn && role === "teacher"}>
        <Stack.Screen name="(teacher)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function Root() {
  return (
    <GestureHandlerRootView>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
