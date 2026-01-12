import { IconSymbol } from "@/components";
import { Tabs } from "expo-router";
import { useUnistyles } from "react-native-unistyles";

export default function TabLayout() {
  const { theme } = useUnistyles();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarInactiveTintColor: theme.colors.tint,
        tabBarActiveTintColor: theme.colors.activeTint,
        sceneStyle: {
          backgroundColor: theme.colors.background,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopWidth: 0,
        },
      }}
    >
      <Tabs.Screen
        name="(classes)"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(wishes)"
        options={{
          title: "Wishes",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="sparkles" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(bookings)"
        options={{
          title: "Bookings",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="circle.grid.2x2.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}
