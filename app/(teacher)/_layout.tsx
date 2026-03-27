import { Avatar, IconSymbol } from "@/components";
import { useAuth } from "@/hooks";
import { Tabs } from "expo-router";
import { useUnistyles } from "react-native-unistyles";

export default function TabLayout() {
  const { theme } = useUnistyles();
  const { profile } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarInactiveTintColor: theme.colors.dimmed,
        tabBarActiveTintColor: theme.colors.typography,
        sceneStyle: {
          backgroundColor: theme.colors.background,
        },
        tabBarAllowFontScaling: false,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopWidth: 0,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="(home)"
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (navigation.isFocused()) {
              navigation.reset({
                index: 0,
                routes: [{ name: "(home)" }],
              });
            }
          },
        })}
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(explore)"
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (navigation.isFocused()) {
              navigation.reset({
                index: 0,
                routes: [{ name: "(explore)" }],
              });
            }
          },
        })}
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="compass" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(projects)"
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (navigation.isFocused()) {
              navigation.reset({
                index: 0,
                routes: [{ name: "(projects)" }],
              });
            }
          },
        })}
        options={{
          title: "Projects",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="grid" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (navigation.isFocused()) {
              navigation.reset({
                index: 0,
                routes: [{ name: "profile" }],
              });
            }
          },
        })}
        options={{
          title: "Profile",
          tabBarLabel: () => null,
          tabBarItemStyle: {
            flexDirection: "row",
            alignSelf: "center",
          },
          tabBarIcon: () => (
            <Avatar bordered shape="circle" source={profile?.avatarUrl} />
          ),
        }}
      />
    </Tabs>
  );
}
