import { Avatar, Blur, BlurProvider, IconSymbol } from "@/components";
import { useAuth } from "@/hooks";
import { Tabs } from "expo-router";
import { useUnistyles } from "react-native-unistyles";

export default function TabLayout() {
  const { theme } = useUnistyles();
  const { profile } = useAuth();

  return (
    <BlurProvider>
      <Tabs
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
            overflow: "hidden",
            backgroundColor: "transparent",
            height: theme.gap(8),
            borderTopWidth: 0,
            paddingBottom: 0,
            margin: theme.gap(2),
            borderRadius: theme.gap(4),
          },
          tabBarBackground: () => <Blur intensity={50} style={{ flex: 1 }} />,
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
            tabBarIcon: () => (
              <Avatar bordered shape="circle" source={profile?.avatarUrl} />
            ),
          }}
        />
      </Tabs>
    </BlurProvider>
  );
}
