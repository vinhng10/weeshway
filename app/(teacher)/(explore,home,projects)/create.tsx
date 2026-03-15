import {
  Button,
  ChipBar,
  ChipBarItemProps,
  DateTimeInput,
  FloatBoxInput,
  Header,
  Hero,
  IntBoxInput,
  LocationSearch,
  SelectBoxInput,
  SongSearch,
  TextBoxInput,
  VibeBadge,
} from "@/components";
import {
  LEVEL,
  PROJECT_ACTION_TO_STATUS,
  PROJECT_STATUS,
  PROJECT_STATUS_TO_ACTION,
  STYLE,
} from "@/constants";
import { useAlert, useAuth, useLocales, useTempDataStore } from "@/hooks";
import { supabase, uploadMedia } from "@/supabase";
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
  const showAlert = useAlert((state) => state.showAlert);

  // Initialize state with project data or defaults
  const [description, setDescription] = useState<string>();
  const [status, setStatus] = useState<ProjectStatusType>(PROJECT_STATUS.DRAFT);
  const [style, setStyle] = useState<StyleType>();
  const [level, setLevel] = useState<LevelType>();
  const [price, setPrice] = useState<string>();
  const [spots, setSpots] = useState<string>();
  const [startAt, setStartAt] = useState<Date>();
  const [endAt, setEndAt] = useState<Date>();
  const [song, setSong] = useState<SongType>();
  const [artworkUri, setArtworkUri] = useState<string>();
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
      value: PROJECT_STATUS_TO_ACTION[status],
      options: PROJECT_STATUS_TO_ACTION,
      modal: false,
      onValueChange: (verb: string) =>
        setStatus(PROJECT_ACTION_TO_STATUS[verb] as ProjectStatusType),
    },
  ];

  const handleCreate = async () => {
    if (!isLoggedIn || !profile) {
      showAlert(
        "Login Required",
        "Please sign in to your account to continue.",
      );
      return;
    }

    if (!song) {
      showAlert(
        "Song Required",
        "Please search and select a song before creating a project.",
      );
      return;
    }

    if (status === PROJECT_STATUS.RELEASED && !profile.onboardingComplete) {
      showAlert(
        "Wallet Setup Required",
        "To release a class, you need to set up your wallet so students can book and pay you. Head to Wallet to get started.",
      );
      return;
    }

    try {
      const { data: projectId } = await supabase
        .rpc("create_project_with_song", {
          p_song_data: {
            id: song.id,
            name: song.name,
            artist_name: song.artistName,
            artwork_url: song.artworkUrl,
            preview_url: song.previewUrl,
            genre: song.genre,
          },
          p_project_data: {
            status: status,
            style: style,
            level: level,
            price: price,
            spots: spots,
            description: description?.trim(),
            start_at: startAt,
            end_at: endAt,
            location_id: location?.id,
            currency: currency,
          },
        })
        .throwOnError();

      // Upload artwork after project exists (storage policy checks ownership)
      if (artworkUri) {
        const artworkUrl = await uploadMedia(
          "projects",
          artworkUri,
          `${projectId}`,
        );
        await supabase
          .from("projects")
          .update({ artwork_url: artworkUrl })
          .eq("id", projectId)
          .throwOnError();
      }

      // Invalidate and refetch the project query
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes("projects"),
      });

      // Reset temporary data store before navigating
      reset();

      // Navigate back to projects list
      router.back();
    } catch {
      showAlert(
        "Creation Failed",
        "Couldn't create your project. Please try again.",
      );
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
        {/* Song Hero */}
        {song && (
          <Hero
            data={song}
            artworkUrl={artworkUri}
            artworkEditable
            onArtworkChange={setArtworkUri}
          />
        )}

        {song?.id && <VibeBadge songId={song.id} />}

        {/* Song Search */}
        <SongSearch onSongPress={setSong} />

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
        <LocationSearch
          label="Location"
          value={location}
          onValueChange={setLocation}
        />

        {/* Project Description Input */}
        <TextBoxInput
          label="Description"
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
    marginTop: rt.insets.top,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    paddingHorizontal: theme.gap(2),
    paddingBottom: theme.gap(16),
    gap: theme.gap(2),
  },
  row: {
    flexDirection: "row",
    gap: theme.gap(2),
  },
}));
