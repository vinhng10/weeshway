import { Stack } from "expo-router";
import React from "react";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "./ctx";

function RootNavigator() {
  const { isLoggedIn } = useAuth();

  return (
    <React.Fragment>
      <Stack>
        <Stack.Protected guard={isLoggedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={!isLoggedIn}>
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="sign-up" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </React.Fragment>
  );
}

export default function Root() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
