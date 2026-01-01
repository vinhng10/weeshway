import { Stack } from "expo-router";
import React from "react";
import { useUnistyles } from "react-native-unistyles";

export default function ClassLayout() {
  const { theme } = useUnistyles();

  return (
    <Stack
      screenOptions={{
        headerTitleStyle: {
          color: theme.colors.typography,
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[classId]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="teacher"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
