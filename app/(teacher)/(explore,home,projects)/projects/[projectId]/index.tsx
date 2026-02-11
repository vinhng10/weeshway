import {
  Boundary,
  Button,
  ButtonGroup,
  ChipBar,
  ChipBarItemProps,
  DateTimeInput,
  FloatBoxInput,
  Header,
  IntBoxInput,
  LocationInput,
  SelectBoxInput,
  TextBoxInput,
  Tile,
} from "@/components";
import {
  LEVEL,
  PROJECT_STATUS,
  STRIPE_PAYMENT_STATUS,
  STYLE,
} from "@/constants";
import { useAlertStore, useAuth, useSuspenseQuery } from "@/hooks";
import { supabase } from "@/supabase";
import { ProjectEnrichedType, ProjectStatusType } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { RefreshControl, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { StyleSheet } from "react-native-unistyles";

function ProjectContent() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const profile = useAuth((state) => state.profile);
  const queryClient = useQueryClient();

  const { data, refetch, isRefetching } = useSuspenseQuery<ProjectEnrichedType>(
    {
      queryKey: ["projects", projectId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("projects")
          .select(
            `*, song:songs(*), location:locations(*), bookings:bookings(*)`
          )
          .eq("id", projectId)
          .eq("user_id", profile?.id)
          .eq("bookings.status", STRIPE_PAYMENT_STATUS.SUCCEEDED)
          .single();
        if (error) throw error;
        return data;
      },
    }
  );

  // Form State
  const [name, setName] = useState(data.name);
  const [description, setDescription] = useState(data.description);
  const [status, setStatus] = useState<ProjectStatusType>(data.status);
  const [style, setStyle] = useState(data.style);
  const [level, setLevel] = useState(data.level);
  const [price, setPrice] = useState(
    data.price ? (data.price * 0.01).toString() : ""
  );
  const [spots, setSpots] = useState(data.spots?.toString() ?? "");
  const [startAt, setStartAt] = useState(
    data.startAt ? new Date(data.startAt) : undefined
  );
  const [endAt, setEndAt] = useState(
    data.endAt ? new Date(data.endAt) : undefined
  );
  const [location, setLocation] = useState(data.location);

  // Logic Flags
  const wasReleased = data.status === PROJECT_STATUS.RELEASE;
  const wasCanceled = data.status === PROJECT_STATUS.CANCEL;
  const canEditDetails = !wasReleased && !wasCanceled;
  const canEditStatus = !wasCanceled;
  const isReleasable = !!(
    profile?.onboardingComplete &&
    style &&
    level &&
    Number(price) > 0 &&
    Number(spots) > 0 &&
    startAt &&
    endAt &&
    location
  );

  const handleSave = async () => {
    // Can't save once canceled
    if (wasCanceled) return;
    // Can't release if not all fields are filled
    if (status === PROJECT_STATUS.RELEASE && !isReleasable) return;
    // Can't go back to draft if already released
    if (status === PROJECT_STATUS.DRAFT && wasReleased) return;

    try {
      const { error } = await supabase
        .from("projects")
        .update({
          name: name ?? null,
          status: status ?? null,
          style: style ?? null,
          level: level ?? null,
          price: price ? Math.round(Number(price) * 100) : null,
          spots: spots ? Number(spots) : null,
          start_at: startAt ?? null,
          end_at: endAt ?? null,
          description: description ?? null,
          location_id: location?.id ?? null,
        })
        .eq("id", projectId);
      if (error) throw error;

      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes("projects"),
      });
      router.back();
    } catch {
      useAlertStore.getState().show("Save Failed", "Couldn't save your project changes. Please try again.");
    }
  };

  const options: ChipBarItemProps[] = [
    {
      label: "Status",
      value: status,
      options: PROJECT_STATUS,
      modal: false,
      onValueChange: canEditStatus ? setStatus : undefined,
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
        {/* Song Tile */}
        <Tile
          imageSource={data.song.artworkUrl}
          title={data.song.name}
          subtitle={data.song.artistName}
          previewUrl={data.song.previewUrl}
        />

        {/* Project Name Input */}
        <TextBoxInput
          label="Name"
          value={name}
          onValueChange={setName}
          editable={canEditDetails}
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
            value={spots}
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

      {/* Save Changes Buttons */}
      <ButtonGroup stickyBottom>
        <Button label="Save" onPress={handleSave} disabled={wasCanceled} />
        <Button
          label="Studio"
          onPress={() => router.navigate(`./${projectId}/studio`)}
          style={styles.primary}
        />
      </ButtonGroup>
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
    marginTop: rt.insets.top + theme.gap(1),
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
  primary: {
    backgroundColor: theme.colors.primary,
  },
}));
