import {
  Button,
  ChipBar,
  ChipBarItemProps,
  DateTimeInput,
  FloatBoxInput,
  Header,
  IntBoxInput,
  LocationInput,
  SelectBoxInput,
  SongSearch,
  TextInput,
  Tile,
} from "@/components";
import { LEVEL, PROJECT_STATUS, STYLE } from "@/constants";
import { useAuth, useLocales, useTempDataStore } from "@/hooks";
import { supabase } from "@/supabase";
import {
  LevelType,
  LocationType,
  ProjectStatusType,
  SongType,
  StyleType,
  WishEnrichedType,
} from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { StyleSheet } from "react-native-unistyles";

export default function CreateProject() {
  const profile = useAuth((state) => state.profile);
  const isLoggedIn = useAuth((state) => !!state.session && !!state.profile);
  const currency = useLocales((state) => state.currency);
  const queryClient = useQueryClient();
  const getData = useTempDataStore((state) => state.getData);
  const reset = useTempDataStore((state) => state.reset);

  // Initialize state with project data or defaults
  const [name, setName] = useState<string>();
  const [description, setDescription] = useState<string>();
  const [status, setStatus] = useState<ProjectStatusType>(PROJECT_STATUS.DRAFT);
  const [style, setStyle] = useState<StyleType>();
  const [level, setLevel] = useState<LevelType>();
  const [price, setPrice] = useState<string>();
  const [spots, setSpots] = useState<string>();
  const [startAt, setStartAt] = useState<Date>();
  const [endAt, setEndAt] = useState<Date>();
  const [song, setSong] = useState<SongType>();
  const [location, setLocation] = useState<LocationType>();
  const hasInitialized = useRef(false);

  // Initialize form with wish data from store when component mounts
  useEffect(() => {
    if (hasInitialized.current) return;

    const wishData = getData<WishEnrichedType>();

    if (wishData) {
      hasInitialized.current = true;

      // Capture the data before resetting
      const data = wishData;

      if (data.song) setSong(data.song);
      if (data.style) setStyle(data.style as StyleType);
      if (data.level) setLevel(data.level as LevelType);

      // Reset the store after loading the data
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const options: ChipBarItemProps[] = [
    {
      label: "Status",
      value: status,
      options: PROJECT_STATUS,
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

    try {
      const { error } = await supabase.rpc("create_project_with_song", {
        p_song_data: {
          id: song.id,
          name: song.name,
          artist_name: song.artistName,
          artwork_url: song.artworkUrl,
          preview_url: song.previewUrl,
          genre: song.genre,
        },
        p_project_data: {
          name: name?.trim(),
          status: status,
          style: style,
          level: level,
          price: price ?? Math.round(Number(price) * 100),
          spots: spots,
          description: description?.trim(),
          start_at: startAt,
          end_at: endAt,
          location_id: location?.id,
          currency: currency,
        },
      });

      if (error) throw error;

      // Invalidate and refetch the project query
      await queryClient.invalidateQueries({ queryKey: ["projects"] });

      // Reset temporary data store before navigating
      reset();

      // Navigate back to projects list
      router.push(`/(teacher)/projects/`);
    } catch (error: any) {
      console.error("Error creating project:", error);
      // You might want to show an error message to the user here
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
        <SongSearch onSongPress={setSong} />

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

      {/* Create Button */}
      <Button label={"Create"} onPress={handleCreate} stickyBottom />
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
