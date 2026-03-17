import {
  Avatar,
  Button,
  Header,
  IconButton,
  TextBoxInput,
  Video,
} from "@/components";
import { useAlert, useAuth } from "@/hooks";
import { supabase, uploadMedia } from "@/supabase";
import {
  launchImageLibraryAsync,
  requestMediaLibraryPermissionsAsync,
} from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Account() {
  const profile = useAuth((state) => state.profile);
  const email = useAuth((state) => state.session?.user.email ?? "");
  const fetchProfile = useAuth((state) => state.fetchProfile);
  const deleteAccount = useAuth((state) => state.deleteAccount);
  const isLoggedIn = useAuth((state) => !!state.session && !!state.profile);
  const showAlert = useAlert((state) => state.showAlert);
  const [fullName, setFullName] = useState(profile?.fullName || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarUri, setAvatarUri] = useState<string | null>(
    profile?.avatarUrl || null,
  );
  const [videoUrls, setVideoUrls] = useState<string[]>(
    profile?.videoUrls || [],
  );

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
        showAlert(
          "Permission Needed",
          "Please allow access to your photo library to upload a video.",
        );
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
    } catch {
      showAlert("Upload Failed", "Couldn't load your video. Please try again.");
    }
  };

  const handleRemoveVideo = (index: number) => {
    setVideoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteAccount = () => {
    showAlert(
      "Delete Account",
      "1. Your account will be deactivated immediately.\n2. Your classes will be canceled, eligible bookings refunded, and any open reports dismissed.\n3. All your data will be permanently deleted shortly after.\n\nThis cannot be undone.",
      {
        confirmLabel: "Confirm",
        onConfirm: async () => {
          try {
            await deleteAccount();
            router.replace("../sign-in");
          } catch {
            showAlert(
              "Delete Failed",
              "Couldn't delete your account. Please try again.",
            );
          }
        },
      },
    );
  };

  const handleSave = async () => {
    if (!profile || !isLoggedIn) {
      showAlert(
        "Login Required",
        "Please sign in to your account to continue.",
      );
      return;
    }

    try {
      let avatarUrl = profile?.avatarUrl;

      if (avatarUri && avatarUri !== profile?.avatarUrl) {
        avatarUrl = await uploadMedia(
          "profiles",
          avatarUri,
          `${profile.id}/avatars`,
        );
      }

      // Upload local videos and replace with uploaded URLs
      const finalVideoUrls = await Promise.all(
        videoUrls.map(async (videoUrl) => {
          if (isLocalUri(videoUrl)) {
            return await uploadMedia(
              "profiles",
              videoUrl,
              `${profile.id}/videos`,
            );
          }
          return videoUrl;
        }),
      );

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
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
      router.back();
    } catch {
      showAlert(
        "Save Failed",
        "Couldn't save your profile changes. Please try again.",
      );
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
            editable={true}
          />
        </View>

        {/* Videos */}
        <View style={styles.videoContainer}>
          {videoUrls.map((videoUrl, index) => (
            <View key={`video-${index}`}>
              <Video source={videoUrl} />
              <View style={styles.overlay}>
                <IconButton
                  icon="close"
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
                  icon="add"
                  iconSize={32}
                  onPress={handleVideoPicker}
                />
              </View>
            </View>
          )}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextBoxInput label="Email" value={email} editable={false} />
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

        {/* Delete Account */}
        <Button label="Delete Account" onPress={handleDeleteAccount} outlined />
      </ScrollView>

      <Button label={"Save"} onPress={handleSave} stickyBottom />
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top,
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
