import { Avatar, IconSymbol } from "@/components";
import { useAuth } from "@/hooks";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { useUnistyles } from "react-native-unistyles";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function TabLayout() {
  const { theme } = useUnistyles();
  const { profile } = useAuth();

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarInactiveTintColor: theme.colors.dimmed,
        tabBarActiveTintColor: theme.colors.typography,
        sceneStyle: {
          backgroundColor: theme.colors.background,
        },
        tabBarAllowFontScaling: false,
        tabBarItemStyle: {
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarStyle: {
          position: "absolute",
          height: theme.gap(8),
          borderTopWidth: 0,
          paddingBottom: theme.gap(0.5),
          margin: theme.gap(1.5),
          marginBottom: theme.gap(0.5),
          borderRadius: theme.gap(4),
          shadowColor: "#787878",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.2,
          shadowRadius: 4.65,
          elevation: 8,
        },
        tabBarBackground: () => (
          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.background,
              opacity: 0.95,
              borderRadius: theme.gap(4),
            }}
          />
        ),
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="home" color={color} />
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
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="ticket" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(passes)"
        options={{
          title: "Passes",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="card" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: () => null,
          tabBarIcon: () => (
            <Avatar bordered shape="circle" source={profile?.avatarUrl} />
          ),
        }}
      />
    </Tabs>
  );
}
