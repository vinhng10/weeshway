import { useAuth } from "@/app/ctx";
import { Avatar } from "@/components/avatar";
import { ProfileMenuItem } from "@/components/profile-menu-item";
import { ThemedText } from "@/components/themed-text";
import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function ProfileScreen() {
  const { profile, session, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace("../sign-in");
  };

  // Get user data from profile or session
  const userName = profile?.full_name || profile?.username || "John Smith";
  const userDescription = profile?.bio || "I dance & talk about stuff";
  const avatarUrl = profile?.avatar_url || "https://picsum.photos/200/300";

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Avatar
          source={avatarUrl}
          size="large"
          shape="circle"
          bordered
        />
        <ThemedText type="h3">{userName}</ThemedText>
        <ThemedText dimmed>{userDescription}</ThemedText>
      </View>

      {/* Menu Items */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <ProfileMenuItem
          icon="person.fill"
          label="Account"
          onPress={() => {
            // Navigate to account settings
            console.log("Navigate to Account");
          }}
        />
        <ProfileMenuItem
          icon="bell"
          label="Notifications"
          onPress={() => {
            // Navigate to notifications
            console.log("Navigate to Notifications");
          }}
        />
        <ProfileMenuItem
          icon="wallet.pass"
          label="Wallet"
          onPress={() => {
            // Navigate to wallet
            console.log("Navigate to Wallet");
          }}
        />
        <ProfileMenuItem
          icon="shield.fill"
          label="Data Privacy"
          onPress={() => {
            // Navigate to data privacy
            console.log("Navigate to Data Privacy");
          }}
        />
        <ProfileMenuItem
          icon="rectangle.portrait.and.arrow.right"
          label="Sign Out"
          onPress={handleSignOut}
          showChevron={false}
          color="highlight"
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
    gap: theme.gap(1),
  },
}));
