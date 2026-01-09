import {
  Avatar,
  ChipBar,
  ChipBarItemProps,
  MenuItem,
  ThemedText,
} from "@/components";
import { ROLE } from "@/constants";
import { useAuth, useRole } from "@/hooks";
import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Profile() {
  const profile = useAuth((state) => state.profile);
  const signOut = useAuth((state) => state.signOut);
  const router = useRouter();

  const role = useRole((state) => state.role);
  const setRole = useRole((state) => state.setRole);
  const rolePath = role === ROLE.STUDENT ? "student" : "teacher";

  const handleAccount = () => {
    router.push(`/(${rolePath})/profile/account`);
  };

  const handleNotifications = () => {
    // router.push("/(tabs)/profile/notifications");
  };

  const handleWallet = () => {
    router.push(`/(${rolePath})/profile/wallet`);
  };

  const handleDataPrivacy = () => {
    // router.push("/(tabs)/profile/data-privacy");
  };

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
        <MenuItem icon="person.fill" label="Account" onPress={handleAccount} />
        <MenuItem
          icon="bell"
          label="Notifications"
          onPress={handleNotifications}
        />
        <MenuItem icon="wallet.pass" label="Wallet" onPress={handleWallet} />
        <MenuItem
          icon="shield.fill"
          label="Data Privacy"
          onPress={handleDataPrivacy}
        />
        <MenuItem
          icon="rectangle.portrait.and.arrow.right"
          label="Sign Out"
          onPress={handleSignOut}
          showChevron={false}
          color="danger"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
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
