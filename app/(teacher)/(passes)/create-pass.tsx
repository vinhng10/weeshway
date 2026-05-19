import {
  Button,
  ChipBar,
  ChipBarItemProps,
  FloatBoxInput,
  Header,
  IntBoxInput,
  TextBoxInput,
} from "@/components";
import { IconSymbol } from "@/components/icon-symbol";
import { Pressable } from "@/components/pressable";
import { ThemedText } from "@/components/themed-text";
import { useAlert, useAuth, useLocales } from "@/hooks";
import { supabase, uploadMedia } from "@/supabase";
import { pickImage } from "@/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { StyleSheet } from "react-native-unistyles";

const ACTIVE_OPTIONS = { Active: "Active", Inactive: "Inactive" } as const;

export default function CreatePass() {
  const profile = useAuth((state) => state.profile);
  const currency = useLocales((state) => state.currency);
  const queryClient = useQueryClient();
  const showAlert = useAlert((state) => state.showAlert);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sessions, setSessions] = useState("");
  const [price, setPrice] = useState("");
  const [expiryDays, setExpiryDays] = useState("30");
  const [active, setActive] = useState(true);
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  const handlePhotoPress = async () => {
    const uri = await pickImage();
    if (uri) setPhotoUri(uri);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      showAlert("Name required", "Please enter a pass name.");
      return;
    }
    if (!sessions || parseInt(sessions) <= 0) {
      showAlert(
        "Sessions required",
        "Please enter a valid number of sessions.",
      );
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      showAlert("Price required", "Please enter a valid price.");
      return;
    }

    try {
      const { data: pass } = await supabase
        .from("passes")
        .insert({
          user_id: profile!.id,
          name: name.trim(),
          description: description.trim() || null,
          sessions: parseInt(sessions),
          price: Math.round(parseFloat(price) * 100),
          currency,
          expiry_days: parseInt(expiryDays),
          active,
        })
        .select()
        .single()
        .throwOnError();

      if (photoUri) {
        const photoUrl = await uploadMedia("passes", photoUri, pass!.id);
        await supabase
          .from("passes")
          .update({ photo_url: photoUrl })
          .eq("id", pass!.id)
          .throwOnError();
      }

      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes("passes"),
      });

      router.back();
    } catch (error) {
      showAlert(
        "Create Failed",
        error instanceof Error
          ? error.message
          : "Couldn't create the pass. Please try again.",
      );
    }
  };

  const statusItems: ChipBarItemProps[] = [
    {
      label: "Status",
      value: active ? "Active" : "Inactive",
      options: ACTIVE_OPTIONS,
      modal: false,
      onValueChange: (v: string) => setActive(v === "Active"),
    },
  ];

  return (
    <View style={styles.container}>
      <Header title="Create Pass" />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.photoPicker} onPress={handlePhotoPress}>
          {photoUri ? (
            <Image source={photoUri} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <IconSymbol name="camera" size={32} />
              <ThemedText type="h5" color="dimmed">
                Add photo
              </ThemedText>
            </View>
          )}
        </Pressable>

        <ChipBar items={statusItems} />

        <TextBoxInput label="Name" value={name} onValueChange={setName} />

        <View style={styles.row}>
          <IntBoxInput
            label="Sessions"
            value={sessions}
            onValueChange={setSessions}
          />
          <FloatBoxInput
            label={`Price`}
            value={price}
            onValueChange={setPrice}
          />
        </View>

        <IntBoxInput
          label="Valid for (days)"
          value={expiryDays}
          onValueChange={setExpiryDays}
        />

        <TextBoxInput
          label="Description"
          value={description}
          onValueChange={setDescription}
          multiline
          numberOfLines={3}
        />
      </KeyboardAwareScrollView>

      <Button label="Create" onPress={handleCreate} position="stickyBottom" />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: theme.gap(2),
    paddingBottom: theme.gap(32),
    gap: theme.gap(2),
  },
  row: {
    flexDirection: "row",
    gap: theme.gap(2),
  },
  photoPicker: {
    height: theme.gap(20),
    borderRadius: theme.gap(2),
    overflow: "hidden",
    backgroundColor: theme.colors.foreground,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: theme.gap(1),
  },
}));
