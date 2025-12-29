import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Header } from "@/components/header";
import { IconButton } from "@/components/icon-button";
import { TextBoxInput } from "@/components/input/box-input";
import { Video } from "@/components/video";
import { useAuth } from "@/hooks/useAuth";
import { supabase, uploadMedia } from "@/supabase";
import {
  launchImageLibraryAsync,
  requestMediaLibraryPermissionsAsync,
} from "expo-image-picker";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Account() {
  const profile = useAuth((state) => state.profile);
  const fetchProfile = useAuth((state) => state.fetchProfile);
  const isLoggedIn = useAuth((state) => state.isLoggedIn);

  const [username, setUsername] = useState(profile?.username || "");
  const [fullName, setFullName] = useState(profile?.fullName || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarUri, setAvatarUri] = useState<string | null>(
    profile?.avatarUrl || null
  );
  const [videoUrls, setVideoUrls] = useState<string[]>(
    profile?.videoUrls || []
  );
  const [isSaving, setIsSaving] = useState(false);

  const isLocalUri = (uri: string): boolean => {
    return (
      uri.startsWith("file://") ||
      uri.startsWith("content://") ||
      uri.startsWith("ph://") ||
      uri.startsWith("assets-library://")
    );
  };

  const handleVideoPicker = async () => {
    // Prevent adding more than 3 videos
    if (videoUrls.length >= 3) {
      return;
    }

    try {
      // Request permissions
      const { status } = await requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        console.error("Error requesting media library permissions:", status);
        return;
      }

      // Launch video picker
      const result = await launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const uri = asset.uri;
        setVideoUrls((prev) => [...prev, uri]);
      }
    } catch (error) {
      console.error("Error picking video:", error);
    }
  };

  const handleRemoveVideo = (index: number) => {
    setVideoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!profile || !isLoggedIn) {
      console.error("Error: User not logged in");
      return;
    }

    setIsSaving(true);

    try {
      let avatarUrl = profile?.avatarUrl;

      if (avatarUri && avatarUri !== profile?.avatarUrl) {
        avatarUrl = await uploadMedia(
          "profiles",
          avatarUri,
          `${profile.id}/avatars`
        );
      }

      // Upload local videos and replace with uploaded URLs
      const finalVideoUrls = await Promise.all(
        videoUrls.map(async (videoUrl) => {
          if (isLocalUri(videoUrl)) {
            return await uploadMedia(
              "profiles",
              videoUrl,
              `${profile.id}/videos`
            );
          }
          return videoUrl;
        })
      );

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          username: username.trim(),
          full_name: fullName.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl,
          video_urls: finalVideoUrls,
        })
        .eq("id", profile.id);

      if (error) {
        throw error;
      }

      await fetchProfile();
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
        {/* Avatar */}
        <View style={styles.header}>
          <Avatar
            source={avatarUri}
            size="large"
            shape="circle"
            bordered
            onSourceChange={setAvatarUri}
          />
        </View>

        {/* Videos */}
        <View style={styles.videoContainer}>
          {videoUrls.map((videoUrl, index) => (
            <View key={`video-${index}`}>
              <Video source={videoUrl} />
              <View style={styles.overlay}>
                <IconButton
                  icon="xmark"
                  iconSize={32}
                  onPress={() => handleRemoveVideo(index)}
                />
              </View>
            </View>
          ))}
          {/* Placeholder with + button - only show if less than 3 videos */}
          {videoUrls.length < 3 && (
            <View key={`video-placeholder`}>
              <Video source={null} />
              <View style={styles.overlay}>
                <IconButton
                  icon="plus"
                  iconSize={32}
                  onPress={handleVideoPicker}
                />
              </View>
            </View>
          )}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextBoxInput
            label="Username"
            value={username}
            onValueChange={setUsername}
          />
          <TextBoxInput
            label="Full Name"
            value={fullName}
            onValueChange={setFullName}
          />
          <TextBoxInput
            label="Bio"
            value={bio}
            onValueChange={setBio}
            multiline
          />
        </View>
      </ScrollView>

      <Button
        label={"Save Changes"}
        onPress={handleSave}
        loading={isSaving}
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
    gap: theme.gap(2),
  },
  header: {
    alignItems: "center",
    marginTop: theme.gap(2),
  },
  form: {
    gap: theme.gap(2),
  },
  videoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.gap(1),
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
}));
