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
        <Avatar source={avatarUrl} size="large" shape="circle" bordered />
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
          onPress={() => {}}
        />
        <ProfileMenuItem icon="bell" label="Notifications" onPress={() => {}} />
        <ProfileMenuItem icon="wallet.pass" label="Wallet" onPress={() => {}} />
        <ProfileMenuItem
          icon="shield.fill"
          label="Data Privacy"
          onPress={() => {}}
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
