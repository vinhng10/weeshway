import {
  Boundary,
  Button,
  Chip,
  Header,
  Photo,
  PhotoPicker,
  SelectBoxInput,
  TextBoxInput,
  TextInput,
  ThemedText,
} from "@/components";
import { STUDENT_REPORT_REASON } from "@/constants";
import { useAlert, useAuth, useSuspenseQuery } from "@/hooks";
import { supabase, uploadMedia } from "@/supabase";
import { ReportType } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function ReportContent() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const profile = useAuth((state) => state.profile);
  const showAlert = useAlert((state) => state.showAlert);
  const [description, setDescription] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data, refetch, isRefetching } = useSuspenseQuery<ReportType>({
    queryKey: ["reports", classId],
    queryFn: async () => {
      const { data } = await supabase
        .from("reports")
        .select("*")
        .eq("project_id", classId)
        .eq("user_id", profile?.id)
        .maybeSingle()
        .throwOnError();
      return data;
    },
  });

  if (data) {
    return (
      <View style={styles.container}>
        <Header title="Report" />

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          <View style={styles.section}>
            <ThemedText type="h4">Status</ThemedText>
            <Chip label={data.status} color="contrast" size="large" />
          </View>

          <View style={styles.section}>
            <ThemedText type="h4">Reason</ThemedText>
            <TextInput
              type="h5"
              value={data.description}
              editable={false}
              multiline
              numberOfLines={4}
            />
          </View>

          {data.photoUrls?.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="h4">Evidence</ThemedText>
              <View style={styles.photoContainer}>
                {data.photoUrls.map((url, index) => (
                  <Photo key={`photo-${index}`} source={url} />
                ))}
              </View>
            </View>
          )}

          {data.resolution && (
            <View style={styles.section}>
              <ThemedText type="h4">Resolution</ThemedText>
              <TextInput
                type="h5"
                value={data.resolution}
                editable={false}
                multiline
                numberOfLines={4}
              />
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  const handleSend = async () => {
    const finalDescription =
      description === STUDENT_REPORT_REASON.OTHER
        ? customDescription.trim()
        : description;

    if (!finalDescription) {
      showAlert("Missing Info", "Please select or enter a description.");
      return;
    }

    // Upload photos
    const finalPhotoUrls = await Promise.all(
      photoUrls.map((uri) =>
        uploadMedia("reports", uri, `${profile?.id}/${classId}`),
      ),
    );

    try {
      await supabase
        .from("reports")
        .insert({
          user_id: profile?.id,
          project_id: Number(classId),
          description: finalDescription,
          photo_urls: finalPhotoUrls,
        })
        .throwOnError();

      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes("reports"),
      });

      showAlert("Reported", "Thanks for letting us know. We'll review this.");
      router.back();
    } catch (error: any) {
      showAlert(
        "Report Failed",
        error?.message ?? "Couldn't send your report. Please try again.",
      );
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Report" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <ThemedText type="h4">Reason</ThemedText>
          <SelectBoxInput
            label="Options"
            value={description}
            options={STUDENT_REPORT_REASON}
            onValueChange={setDescription}
          />
          {description === STUDENT_REPORT_REASON.OTHER && (
            <TextBoxInput
              label="Description"
              value={customDescription}
              onValueChange={setCustomDescription}
              multiline
              numberOfLines={4}
            />
          )}
        </View>

        <View style={styles.section}>
          <ThemedText type="h4">Evidence</ThemedText>
          <PhotoPicker value={photoUrls} onValueChange={setPhotoUrls} />
        </View>
      </ScrollView>

      <Button stickyBottom label="Send" onPress={handleSend} />
    </View>
  );
}

export default function Report() {
  return (
    <Boundary>
      <ReportContent />
    </Boundary>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    padding: theme.gap(2),
    paddingBottom: theme.gap(16),
    gap: theme.gap(2),
  },
  section: {
    gap: theme.gap(1),
  },
  photoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.gap(1),
  },
}));
