import {
  Avatar,
  ChipBar,
  ChipBarItemProps,
  MenuItem,
  ThemedText,
} from "@/components";
import { ROLE } from "@/constants";
import { useAuth, useRole } from "@/hooks";
import { router } from "expo-router";
import { Linking, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Profile() {
  const profile = useAuth((state) => state.profile);
  const signOut = useAuth((state) => state.signOut);

  const role = useRole((state) => state.role);
  const setRole = useRole((state) => state.setRole);
  const rolePath = role === ROLE.STUDENT ? "student" : "teacher";

  const handleAccount = () => {
    router.navigate(`/(${rolePath})/profile/account`);
  };

  const handleDeviceSettings = async () => await Linking.openSettings();

  const handleWallet = () => {
    router.navigate(`/(${rolePath})/profile/wallet`);
  };

  const handlePolicies = () =>
    router.navigate(`/(${rolePath})/profile/policies`);

  const handleSignOut = async () => {
    await signOut();
    router.replace("../sign-in");
  };

  const options: ChipBarItemProps[] = [
    {
      label: "Role",
      value: role,
      options: ROLE,
      modal: false,
      onValueChange: setRole,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Avatar
          source={profile?.avatarUrl}
          size="large"
          shape="circle"
          bordered
        />
        <ThemedText type="h3">{profile?.fullName}</ThemedText>
        <ThemedText color="dimmed">{profile?.bio}</ThemedText>
        <ChipBar padding items={options} />
      </View>

      {/* Menu Items */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <MenuItem icon="person-sharp" title="Account" onPress={handleAccount} />
        <MenuItem icon="wallet" title="Wallet" onPress={handleWallet} />
        <MenuItem
          icon="settings"
          title="Settings"
          onPress={handleDeviceSettings}
        />
        <MenuItem icon="shield" title="Policies" onPress={handlePolicies} />
        <MenuItem
          icon="log-out"
          title="Sign Out"
          onPress={handleSignOut}
          showChevron={false}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: theme.gap(2),
    gap: theme.gap(1),
    marginBottom: theme.gap(2),
  },
  scrollContainer: {
    paddingHorizontal: theme.gap(2),
    paddingBottom: theme.gap(16),
    gap: theme.gap(1),
  },
}));
