import {
  Boundary,
  ChipBar,
  ChipBarItemProps,
  DateTimeInput,
  FAB,
  FABItem,
  FloatBoxInput,
  Header,
  Hero,
  IntBoxInput,
  LocationInput,
  SelectBoxInput,
  TextBoxInput,
} from "@/components";
import {
  BOOKING_ACTIVE_STATUSES,
  LEVEL,
  PROJECT_ACTION_TO_STATUS,
  PROJECT_STATUS,
  PROJECT_STATUS_TO_ACTION,
  PROJECT_STATUS_TRANSITIONS,
  STYLE,
} from "@/constants";
import { useAlert, useAuth, useLocales, useSuspenseQuery } from "@/hooks";
import { supabase, uploadMedia } from "@/supabase";
import { ProjectEnrichedType, ProjectStatusType } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { RefreshControl, Share, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { StyleSheet } from "react-native-unistyles";

function ProjectContent() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const profile = useAuth((state) => state.profile);
  const queryClient = useQueryClient();
  const transactionFee = useLocales((state) => state.transactionFee);
  const showAlert = useAlert((state) => state.showAlert);

  const { data, refetch, isRefetching } = useSuspenseQuery<ProjectEnrichedType>(
    {
      queryKey: ["projects", projectId],
      queryFn: async () => {
        const { data } = await supabase
          .from("projects")
          .select(
            `*, song:songs(*), location:locations(*), bookings:bookings(*)`,
          )
          .eq("id", projectId)
          .eq("user_id", profile?.id)
          .in("bookings.status", BOOKING_ACTIVE_STATUSES)
          .single()
          .throwOnError();
        return data;
      },
    },
  );

  // Form State
  const [description, setDescription] = useState(data.description);
  const [status, setStatus] = useState<ProjectStatusType>(data.status);
  const [style, setStyle] = useState(data.style);
  const [level, setLevel] = useState(data.level);
  const [price, setPrice] = useState(
    data.price ? (data.price * 0.01).toString() : "",
  );
  const [spots, setSpots] = useState(data.spots?.toString() ?? "");
  const [startAt, setStartAt] = useState(
    data.startAt ? new Date(data.startAt) : undefined,
  );
  const [endAt, setEndAt] = useState(
    data.endAt ? new Date(data.endAt) : undefined,
  );
  const [artworkUri, setArtworkUri] = useState<string | undefined>(
    data.artworkUrl,
  );
  const [location, setLocation] = useState(data.location);

  const succeededBookingsCount = data.bookings
    .filter((b) => BOOKING_ACTIVE_STATUSES.includes(b.status))
    .reduce((acc, b) => acc + (b.spots || 0), 0);

  // Logic Flags
  const wasReleased = data.status === PROJECT_STATUS.RELEASED;
  const wasCanceled = data.status === PROJECT_STATUS.CANCELED;
  const wasDeleted = data.status === PROJECT_STATUS.DELETED;
  const canEditDetails = !wasReleased && !wasCanceled && !wasDeleted;
  const isOnboarded = !!profile?.onboardingComplete;
  const isFieldsComplete = !!(
    style &&
    level &&
    Number(price) > 0 &&
    Number(spots) > 0 &&
    startAt &&
    endAt &&
    location
  );

  const handleSave = async () => {
    if (wasDeleted) {
      showAlert(
        "Project Deleted",
        "This project has been deleted and can no longer be edited.",
      );
      return;
    }
    if (wasCanceled) {
      showAlert(
        "Project Canceled",
        "This project has been canceled and can no longer be edited. You can delete it if you no longer need it.",
      );
      return;
    }
    if (status === PROJECT_STATUS.DRAFT && wasReleased) {
      showAlert(
        "Already Released",
        "This project has already been released to students and can't be moved back to draft.",
      );
      return;
    }
    if (status === PROJECT_STATUS.RELEASED && !isOnboarded) {
      showAlert(
        "Wallet Setup Required",
        "To release a class, you need to set up your wallet so students can book and pay you. Head to Wallet to get started.",
      );
      return;
    }
    if (status === PROJECT_STATUS.RELEASED && !isFieldsComplete) {
      showAlert(
        "Not Ready to Release",
        "Before releasing, make sure you've filled in the style, level, price, spots, date, and location.",
      );
      return;
    }

    const doSave = async () => {
      try {
        let artworkUrl = artworkUri;
        if (artworkUri && artworkUri !== data.artworkUrl) {
          artworkUrl = await uploadMedia(
            "projects",
            artworkUri,
            `${projectId}`,
          );
        }

        await supabase
          .from("projects")
          .update({
            status: status ?? null,
            style: style ?? null,
            level: level ?? null,
            price: price ? Math.round(Number(price) * 100) : null,
            spots: spots ? Number(spots) : null,
            start_at: startAt ?? null,
            end_at: endAt ?? null,
            description: description ?? null,
            location_id: location?.id ?? null,
            artwork_url: artworkUrl ?? null,
          })
          .eq("id", projectId)
          .throwOnError();

        await queryClient.invalidateQueries({
          predicate: (query) => query.queryKey.includes("projects"),
        });
        router.back();
      } catch {
        showAlert(
          "Save Failed",
          "Couldn't save your project changes. Please try again.",
        );
      }
    };

    if (wasReleased && status === PROJECT_STATUS.CANCELED) {
      showAlert(
        "Cancel This Project?",
        `Cancellations are subject to a ${transactionFee}% penalty fee per booking. This cannot be undone.`,
        { confirmLabel: "Confirm", onConfirm: doSave },
      );
      return;
    }

    await doSave();
  };

  const options: ChipBarItemProps[] = [
    {
      label: "Status",
      value: PROJECT_STATUS_TO_ACTION[status],
      options: Object.fromEntries(
        PROJECT_STATUS_TRANSITIONS[data.status].map((s) => [
          s,
          PROJECT_STATUS_TO_ACTION[s],
        ]),
      ),
      modal: false,
      onValueChange: !wasDeleted
        ? (verb: string) =>
            setStatus(PROJECT_ACTION_TO_STATUS[verb] as ProjectStatusType)
        : undefined,
    },
  ];

  const handleStudio = () => {
    router.navigate(`./${projectId}/studio`);
  };

  const handleCheckin = () => {
    if (wasReleased) {
      router.navigate(`./${projectId}/checkin`);
    } else {
      showAlert(
        "Not Available",
        "Check-in is only available for released projects.",
      );
    }
  };

  const handleReport = () => {
    router.navigate(`./${projectId}/report`);
  };

  const handleShare = async () => {
    await Share.share({
      message: `Check out this class: ${data.song?.name ?? "Untitled"}`,
    });
  };

  const fabItems: FABItem[] = [
    {
      icon: "checkmark-circle",
      label: "Save",
      onPress: handleSave,
    },
    {
      icon: "flask",
      label: "Studio",
      onPress: handleStudio,
    },
    {
      icon: "qr-code",
      label: "Check-in",
      onPress: handleCheckin,
    },
    {
      icon: "flag",
      label: "Report",
      onPress: handleReport,
    },
    {
      icon: "share-social-sharp",
      label: "Share",
      onPress: handleShare,
    },
  ];

  return (
    <>
      {/* Scrollable Content */}
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Song Hero */}
        <Hero
          data={data.song}
          artworkUrl={artworkUri}
          artworkEditable={canEditDetails}
          onArtworkChange={setArtworkUri}
        />

        {/* Toggle Button Group for Status */}
        <ChipBar items={options} />

        {/* Style and Level Selects */}
        <View style={styles.row}>
          <SelectBoxInput
            label="Style"
            value={style}
            options={STYLE}
            onValueChange={setStyle}
            editable={canEditDetails}
          />
          <SelectBoxInput
            label="Level"
            value={level}
            options={LEVEL}
            onValueChange={setLevel}
            editable={canEditDetails}
          />
        </View>

        {/* Price and Spots Info Fields */}
        <View style={styles.row}>
          <FloatBoxInput
            label="Price"
            value={price}
            onValueChange={setPrice}
            editable={canEditDetails}
          />
          <IntBoxInput
            label="Spots"
            value={
              wasReleased
                ? `${succeededBookingsCount} / ${data.spots ?? 0}`
                : spots
            }
            onValueChange={setSpots}
            editable={canEditDetails}
          />
        </View>

        {/* Date & Time Row */}
        <DateTimeInput
          label="Date & Time"
          startAt={startAt}
          endAt={endAt}
          onValueChange={(startTime: Date, endTime: Date) => {
            setStartAt(startTime);
            setEndAt(endTime);
          }}
          editable={canEditDetails}
        />

        {/* Location Row */}
        <LocationInput
          label="Location"
          value={location}
          onValueChange={setLocation}
          editable={canEditDetails}
        />

        {/* Project Description Input */}
        <TextBoxInput
          label="Description"
          value={description}
          onValueChange={setDescription}
          multiline
          numberOfLines={4}
          editable={canEditDetails}
        />
      </KeyboardAwareScrollView>

      <FAB label="Actions" items={fabItems} />
    </>
  );
}

export default function Project() {
  return (
    <View style={styles.container}>
      <Header title="Project" />
      <Boundary>
        <ProjectContent />
      </Boundary>
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
    padding: theme.gap(2),
    paddingBottom: theme.gap(16),
    gap: theme.gap(2),
  },
  row: {
    flexDirection: "row",
    gap: theme.gap(2),
  },
}));
