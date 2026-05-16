import { Stack } from "expo-router";
import { useUnistyles } from "react-native-unistyles";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function WishLayout() {
  const { theme } = useUnistyles();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    />
  );
}
