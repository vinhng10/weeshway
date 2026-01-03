import { Stack } from "expo-router";
import { useUnistyles } from "react-native-unistyles";

export default function ProjectLayout() {
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
        name="studio"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
