import { Tabs } from "expo-router";
import React from "react";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { RoleEnum } from "@/constants";
import { useRole } from "@/hooks/useRole";
import { useUnistyles } from "react-native-unistyles";

export default function TabLayout() {
  const { theme } = useUnistyles();
  const role = useRole((state) => state.role);

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
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen name="classes" options={{ href: null }} />
      <Tabs.Protected guard={role === RoleEnum.Student}>
        <Tabs.Screen
          name="wishes"
          options={{
            title: "Wishes",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="wand.and.sparkles" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: "Bookings",
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="circle.grid.2x2.fill" color={color} />
            ),
          }}
        />
      </Tabs.Protected>
      <Tabs.Protected guard={role === RoleEnum.Teacher}>
        <Tabs.Screen
          name="explore"
          options={{
            title: "Explore",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="wand.and.sparkles" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="projects"
          options={{
            title: "Projects",
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="circle.grid.2x2.fill" color={color} />
            ),
          }}
        />
      </Tabs.Protected>
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
