import { Stack } from "expo-router";
import React from "react";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "./ctx";

function RootNavigator() {
  const { user } = useAuth();

  return (
    <Stack>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={!user}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function Root() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
