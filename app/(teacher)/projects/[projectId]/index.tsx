import {
  Boundary,
  Button,
  ChipBar,
  ChipBarItemProps,
  DateTimeInput,
  FloatBoxInput,
  Header,
  IntBoxInput,
  LocationInput,
  SelectBoxInput,
  TextInput,
  Tile,
} from "@/components";
import {
  LEVEL,
  PROJECT_STATUS,
  STRIPE_PAYMENT_STATUS,
  STYLE,
} from "@/constants";
import { useAuth, useSuspenseQuery } from "@/hooks";
import { supabase } from "@/supabase";
import { ProjectEnrichedType, ProjectStatusType } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { StyleSheet } from "react-native-unistyles";

function ProjectContent() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const profile = useAuth((state) => state.profile);
  const isLoggedIn = useAuth((state) => !!state.session && !!state.profile);
  const queryClient = useQueryClient();

  const { data } = useSuspenseQuery<ProjectEnrichedType>({
    queryKey: ["projects", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`*, song:songs(*), location:locations(*), bookings:bookings(*)`)
        .eq("id", projectId)
        .eq("user_id", profile?.id)
        .eq("bookings.status", STRIPE_PAYMENT_STATUS.SUCCEEDED)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Initialize state directly with project data - no useEffect needed!
  const [name, setName] = useState(data.name);
  const [description, setDescription] = useState(data.description);
  const [status, setStatus] = useState<ProjectStatusType>(data.status);
  const [style, setStyle] = useState(data.style);
  const [level, setLevel] = useState(data.level);
  const [price, setPrice] = useState(
    data.price ? (data.price * 0.01).toString() : ""
  );
  const [spots, setSpots] = useState<string>(
    data.spots ? data.spots.toString() : ""
  );
  const [startAt, setStartAt] = useState(
    data.startAt ? new Date(data.startAt) : undefined
  );
  const [endAt, setEndAt] = useState(
    data.endAt ? new Date(data.endAt) : undefined
  );
  const [song, setSong] = useState(data.song);
  const [location, setLocation] = useState(data.location);
  const [isSaving, setIsSaving] = useState(false);

  const options: ChipBarItemProps[] = [
    {
      label: "Status",
      value: status,
      options: PROJECT_STATUS,
      modal: false,
      onValueChange: setStatus,
    },
  ];

  const handleSave = async () => {
    if (!isLoggedIn || !profile || !projectId || !data) {
      console.error("Error: User not logged in or project ID missing");
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("projects")
        .update({
          name: name ?? null,
          status: status,
          style: style ?? null,
          level: level ?? null,
          price: price ? Math.round(Number(price) * 100) : null,
          spots: spots ? Number(spots) : null,
          start_at: startAt,
          end_at: endAt,
          description: description ?? null,
          location_id: location?.id,
        })
        .eq("id", projectId);

      if (error) throw error;

      // Invalidate and refetch the project query
      await queryClient.invalidateQueries({ queryKey: ["projects"] });

      // Navigate back to projects list
      router.push(`/(teacher)/projects/`);
    } catch (error: any) {
      console.error("Error updating project:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header title="Project" />

      {/* Scrollable Content */}
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Song Tile */}
        {song && (
          <Tile
            imageSource={song.artworkUrl}
            title={song.name}
            subtitle={song.artistName}
            previewUrl={song.previewUrl}
            onPress={() => {}}
          />
        )}

        {/* Project Name Input */}
        <TextInput
          placeholder="Project name..."
          value={name}
          onChangeText={setName}
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
          />
          <SelectBoxInput
            label="Level"
            value={level}
            options={LEVEL}
            onValueChange={setLevel}
          />
        </View>

        {/* Price and Spots Info Fields */}
        <View style={styles.row}>
          <FloatBoxInput label="Price" value={price} onValueChange={setPrice} />
          <IntBoxInput label="Spots" value={spots} onValueChange={setSpots} />
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
        />

        {/* Location Row */}
        <LocationInput
          label="Location"
          value={location}
          onValueChange={setLocation}
        />

        {/* Project Description Input */}
        <TextInput
          placeholder="Project description ..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
      </KeyboardAwareScrollView>

      {/* Save Changes Buttons */}
      <View style={[styles.buttonContainer, styles.row]}>
        <Button
          label={"Save Changes"}
          onPress={handleSave}
          loading={isSaving}
          style={styles.button}
        />
        <Button
          label={"Studio"}
          onPress={() => router.push(`/(teacher)/projects/${projectId}/studio`)}
          style={[styles.button, styles.primary]}
        />
      </View>
    </View>
  );
}

export default function Project() {
  return (
    <Boundary>
      <ProjectContent />
    </Boundary>
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
  buttonContainer: {
    position: "absolute",
    bottom: theme.gap(2),
    paddingHorizontal: theme.gap(2),
  },
  button: {
    flex: 1,
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
}));
