import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Header } from "@/components/header";
import { TextInput } from "@/components/input/text-input";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabase";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Account() {
  const profile = useAuth((state) => state.profile);
  const fetchProfile = useAuth((state) => state.fetchProfile);
  const session = useAuth((state) => state.session);
  const isLoggedIn = useAuth((state) => state.isLoggedIn);

  const [username, setUsername] = useState(profile.username);
  const [fullName, setFullName] = useState(profile.full_name);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUri, setAvatarUri] = useState<string | null>(profile.avatar_url);
  const [isSaving, setIsSaving] = useState(false);

  const handleImagePicker = async () => {
    try {
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        console.error("Error requesting media library permissions:", status);
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const uri = asset.uri;
        setAvatarUri(uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const handleSave = async () => {
    if (!isLoggedIn) {
      console.error("Error: User not logged in");
      return;
    }

    setIsSaving(true);

    try {
      let avatarUrl = profile.avatar_url;

      if (avatarUri && avatarUri !== profile.avatar_url) {
        const response = await fetch(avatarUri);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();

        // 2) Define bucket and path
        const filePath = `${profile.id}/avatars/${Date.now()}.${
          blob.type.split("/")[1]
        }`;

        // 3) Upload the file
        const { error } = await supabase.storage
          .from("images")
          .upload(filePath, arrayBuffer, {
            contentType: blob.type,
            upsert: false,
          });

        if (error) {
          throw error;
        }

        // 4) Build the public URL (or the path) to store in your profiles table
        const {
          data: { publicUrl },
        } = supabase.storage.from("images").getPublicUrl(filePath);

        avatarUrl = publicUrl;
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
          <View style={styles.avatarContainer}>
            <Avatar
              source={avatarUri}
              size="large"
              shape="circle"
              bordered
            />
            <Pressable style={styles.cameraButton} onPress={handleImagePicker}>
              <View style={styles.cameraIconContainer}>
                <IconSymbol name="camera.fill" size={16} color="#000000" />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
          />
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full Name"
          />
          <TextInput
            value={bio}
            onChangeText={setBio}
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
  avatarContainer: {
    position: "relative",
    marginBottom: theme.gap(1),
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  cameraIconContainer: {
    width: theme.gap(3),
    height: theme.gap(3),
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  formSection: {
    gap: theme.gap(2),
  },
}));
