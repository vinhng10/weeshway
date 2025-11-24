import { Button } from "@/components/button";
import { ChipBar, ChipBarItemProps } from "@/components/chip-bar";
import { Header } from "@/components/header";
import {
  DateTimeInput,
  FloatBoxInput,
  IntBoxInput,
  SelectBoxInput,
  TextInput,
} from "@/components/input";
import { LocationInput } from "@/components/input/location-input";
import { Tile } from "@/components/tile";
import { LevelEnum, ProjectStatusEnum, StyleEnum } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabase";
import { LocationType, ProjectEnrichedType, SongType } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import camelcaseKeys from "camelcase-keys";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { StyleSheet } from "react-native-unistyles";

export default function Project() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const profile = useAuth((state) => state.profile);
  const isLoggedIn = useAuth((state) => state.isLoggedIn);
  const queryClient = useQueryClient();

  const { data, isPending, error } = useQuery<ProjectEnrichedType>({
    queryKey: ["projects", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`*, song:songs(*), location:locations(*)`)
        .eq("id", projectId)
        .eq("user_id", profile?.id)
        .single();

      if (error) throw error;
      if (!data) return null;

      const result = camelcaseKeys(data, { deep: true });
      return result;
    },
    enabled: isLoggedIn && !!profile && !!projectId,
  });

  // Initialize state with project data or defaults
  const [name, setName] = useState<string | undefined>();
  const [description, setDescription] = useState<string | undefined>();
  const [status, setStatus] = useState<ProjectStatusEnum | undefined>();
  const [style, setStyle] = useState<StyleEnum | undefined>();
  const [level, setLevel] = useState<LevelEnum | undefined>();
  const [price, setPrice] = useState<string | undefined>();
  const [spots, setSpots] = useState<string | undefined>();
  const [startAt, setStartAt] = useState<Date | undefined>();
  const [endAt, setEndAt] = useState<Date | undefined>();
  const [song, setSong] = useState<SongType | undefined>();
  const [location, setLocation] = useState<LocationType | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  // Update state when project data is loaded
  useEffect(() => {
    if (data) {
      setName(data.name);
      setDescription(data.description);
      setStatus(data.status);
      setStyle(data.style);
      setLevel(data.level);
      setPrice(data.price?.toString());
      setSpots(data.spots?.toString());
      setStartAt(data.startAt ? new Date(data.startAt) : undefined);
      setEndAt(data.endAt ? new Date(data.endAt) : undefined);
      setSong(data.song);
      setLocation(data.location);
    }
  }, [data]);

  const options: ChipBarItemProps[] = [
    {
      label: "Status",
      value: status,
      options: ProjectStatusEnum,
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
          id: data.id,
          name: name,
          status: status,
          style: style,
          level: level,
          price: price,
          spots: spots,
          start_at: startAt,
          end_at: endAt,
          description: description,
          location_id: location?.id,
        })
        .eq("id", projectId)
        .eq("user_id", profile.id);

      if (error) {
        throw error;
      }

      // Invalidate and refetch the project query
      await queryClient.invalidateQueries({
        queryKey: ["projects"],
      });

      // Navigate back to projects list
      router.push(`/(tabs)/project/`);
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
        {/* Song Card */}
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

        {/* Toggle Button Group for Visibility */}
        <ChipBar items={options} />

        {/* StyleEnum and LevelEnum Selects */}
        <View style={styles.row}>
          <SelectBoxInput
            label="Style"
            value={style}
            options={StyleEnum}
            onValueChange={setStyle}
          />
          <SelectBoxInput
            label="Level"
            value={level}
            options={LevelEnum}
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
          label={isSaving ? "Saving..." : "Save Changes"}
          onPress={handleSave}
          disabled={isSaving}
          style={styles.saveButton}
        />
        <Button
          label={"Studio"}
          onPress={() => router.push(`/(tabs)/project/${projectId}/studio`)}
          style={styles.studioButton}
        />
      </View>
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
  buttonContainer: {
    position: "absolute",
    bottom: theme.gap(2),
    paddingHorizontal: theme.gap(2),
  },
  saveButton: {
    flex: 1,
  },
  studioButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
}));
