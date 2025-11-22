import { Button } from "@/components/button";
import { ChipBar, ChipBarItemProps } from "@/components/chip-bar";
import { Header } from "@/components/header";
import { DateTimeInput, TextInput } from "@/components/input";
import {
  FloatBoxInput,
  IntBoxInput,
  SelectBoxInput,
} from "@/components/input/box-input";
import { LocationInput } from "@/components/input/location-input";
import { SongSearch } from "@/components/song-search";
import { Tile } from "@/components/tile";
import { LevelEnum, ProjectStatusEnum, StyleEnum } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabase";
import { LocationType, SongType } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { StyleSheet } from "react-native-unistyles";

export default function CreateProject() {
  const profile = useAuth((state) => state.profile);
  const isLoggedIn = useAuth((state) => state.isLoggedIn);
  const queryClient = useQueryClient();

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
  const [isCreating, setIsCreating] = useState(false);

  const options: ChipBarItemProps[] = [
    {
      label: "Status",
      value: status,
      options: ProjectStatusEnum,
      modal: false,
      onValueChange: setStatus,
    },
  ];

  const handleCreate = async () => {
    if (!isLoggedIn || !profile) {
      console.error("Error: User not logged in");
      return;
    }

    if (!song) {
      console.error("Error: Song is required");
      return;
    }

    setIsCreating(true);

    try {
      const { data, error } = await supabase.rpc("create_project_with_song", {
        p_song_data: {
          id: song.id,
          name: song.name,
          artist_name: song.artistName,
          artwork_url: song.artworkUrl,
          preview_url: song.previewUrl,
        },
        p_project_data: {
          name: name?.trim(),
          status: status,
          style: style,
          level: level,
          price: price,
          spots: spots,
          description: description?.trim(),
          start_at: startAt,
          end_at: endAt,
          location_id: location?.id,
        },
      });

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
      console.error("Error creating project:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsCreating(false);
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
        {/* Song Search */}
        <SongSearch onSongPress={(song) => setSong(song)} />

        {/* Song Tile */}
        {song && (
          <Tile
            imageSource={song.artworkUrl}
            title={song.name}
            subtitle={song.artistName}
            previewUrl={song.previewUrl}
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

        {/* Style and Level Selects */}
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

      {/* Create Button */}
      <Button
        label={isCreating ? "Creating..." : "Create"}
        onPress={handleCreate}
        disabled={isCreating}
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
    padding: theme.gap(2),
    paddingBottom: theme.gap(16),
    gap: theme.gap(2),
  },
  row: {
    flexDirection: "row",
    gap: theme.gap(2),
  },
}));
