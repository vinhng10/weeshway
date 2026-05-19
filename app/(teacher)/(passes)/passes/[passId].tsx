import {
  Boundary,
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
import { PASS_PURCHASE_ACTIVE_STATUSES } from "@/constants";
import { useAlert, useAuth, useSuspenseQuery } from "@/hooks";
import { supabase, uploadMedia } from "@/supabase";
import { PassType } from "@/types";
import { pickImage } from "@/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { RefreshControl, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { StyleSheet } from "react-native-unistyles";

const ACTIVE_OPTIONS = { Active: "Active", Inactive: "Inactive" } as const;

type PassWithCount = PassType & {
  passPurchases: { count: number }[];
};

function PassEditContent() {
  const { passId } = useLocalSearchParams<{ passId: string }>();
  const profile = useAuth((state) => state.profile);
  const queryClient = useQueryClient();
  const showAlert = useAlert((state) => state.showAlert);

  const { data, refetch, isRefetching } = useSuspenseQuery<PassWithCount>({
    queryKey: ["passes", passId],
    queryFn: async () => {
      const { data } = await supabase
        .from("passes")
        .select("*, pass_purchases(count)")
        .in("pass_purchases.status", PASS_PURCHASE_ACTIVE_STATUSES)
        .eq("id", passId)
        .eq("user_id", profile!.id)
        .single()
        .throwOnError();
      return data as any;
    },
  });

  const purchaseCount = data.passPurchases?.[0]?.count ?? 0;
  const economicLocked = purchaseCount > 0;

  const [name, setName] = useState(data.name);
  const [description, setDescription] = useState(data.description ?? "");
  const [sessions, setSessions] = useState(data.sessions.toString());
  const [price, setPrice] = useState((data.price * 0.01).toString());
  const [expiryDays, setExpiryDays] = useState(data.expiryDays.toString());
  const [active, setActive] = useState(data.active);
  const [photoUri, setPhotoUri] = useState<string | undefined>(
    data.photoUrl ?? undefined,
  );

  const handlePhotoPress = async () => {
    const uri = await pickImage();
    if (uri) setPhotoUri(uri);
  };

  const persistSave = async () => {
    try {
      let photoUrl = data.photoUrl;
      if (photoUri && photoUri !== data.photoUrl) {
        photoUrl = await uploadMedia("passes", photoUri, data.id);
      }

      await supabase
        .from("passes")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          active,
          photo_url: photoUrl,
          ...(economicLocked
            ? {}
            : {
                sessions: parseInt(sessions),
                price: Math.round(parseFloat(price) * 100),
                expiry_days: parseInt(expiryDays),
              }),
        })
        .eq("id", data.id)
        .throwOnError();

      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes("passes"),
      });

      router.back();
    } catch (error) {
      showAlert(
        "Save Failed",
        error instanceof Error
          ? error.message
          : "Couldn't save the pass. Please try again.",
      );
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      showAlert("Name required", "Please enter a pass name.");
      return;
    }

    const isDeactivating = data.active && !active;
    if (isDeactivating && purchaseCount > 0) {
      const noun = purchaseCount === 1 ? "student has" : "students have";
      showAlert(
        "Deactivate pass?",
        `${purchaseCount} ${noun} remaining sessions and will keep redeeming them.`,
        { confirmLabel: "Confirm", onConfirm: persistSave },
      );
      return;
    }

    persistSave();
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
    <>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
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
            editable={!economicLocked}
          />
          <FloatBoxInput
            label={`Price`}
            value={price}
            onValueChange={setPrice}
            editable={!economicLocked}
          />
        </View>

        <IntBoxInput
          label="Valid for (days)"
          value={expiryDays}
          onValueChange={setExpiryDays}
          editable={!economicLocked}
        />

        <TextBoxInput
          label="Description"
          value={description}
          onValueChange={setDescription}
          multiline
          numberOfLines={3}
        />
      </KeyboardAwareScrollView>

      <Button label="Save" onPress={handleSave} position="stickyBottom" />
    </>
  );
}

export default function EditPass() {
  return (
    <View style={styles.container}>
      <Header title="Pass" />
      <Boundary>
        <PassEditContent />
      </Boundary>
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
