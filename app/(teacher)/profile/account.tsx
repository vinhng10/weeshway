import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { TextField } from "@/components/field";
import { Header } from "@/components/header";
import { useAuth } from "@/hooks/useAuth";
import { supabase, uploadImage } from "@/supabase";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Account() {
  const profile = useAuth((state) => state.profile);
  const fetchProfile = useAuth((state) => state.fetchProfile);
  const session = useAuth((state) => state.session);
  const isLoggedIn = useAuth((state) => state.isLoggedIn);

  const [username, setUsername] = useState(profile?.username || "");
  const [fullName, setFullName] = useState(profile?.fullName || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarUri, setAvatarUri] = useState<string | null>(
    profile?.avatarUrl || null
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!profile || !isLoggedIn) {
      console.error("Error: User not logged in");
      return;
    }

    setIsSaving(true);

    try {
      let avatarUrl = profile?.avatarUrl;

      if (avatarUri && avatarUri !== profile?.avatarUrl) {
        avatarUrl = await uploadImage(avatarUri, `profiles/${profile.id}/avatars`);
      }

      // 5) Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          username: username.trim(),
          full_name: fullName.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl,
        })
        .eq("id", profile.id);

      if (error) {
        throw error;
      }

      await fetchProfile(session);
    } catch (error: any) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Account" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.header}>
          <Avatar
            source={avatarUri}
            size="large"
            shape="circle"
            bordered
            onSourceChange={setAvatarUri}
          />
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <TextField
            label="Username"
            value={username}
            onValueChange={setUsername}
            placeholder="Username"
          />
          <TextField
            label="Full Name"
            value={fullName}
            onValueChange={setFullName}
            placeholder="Full Name"
          />
          <TextField
            label="Bio"
            value={bio}
            onValueChange={setBio}
            placeholder="Bio"
            multiline
          />
        </View>
      </ScrollView>

      <Button
        label={isSaving ? "Saving..." : "Save Changes"}
        onPress={handleSave}
        disabled={isSaving}
        stickyBottom
      />
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    paddingHorizontal: theme.gap(2),
    paddingBottom: theme.gap(16),
  },
  header: {
    alignItems: "center",
    marginTop: theme.gap(2),
    marginBottom: theme.gap(2),
  },
  formSection: {
    gap: theme.gap(2),
  },
}));
