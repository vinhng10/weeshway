import { Button } from "@/components/button";
import { ChipBar, ChipBarItemProps } from "@/components/chip-bar";
import { Header } from "@/components/header";
import { DateTimeInput, RowInput, TextInput } from "@/components/input";
import {
  FloatBoxInput,
  IntBoxInput,
  SelectBoxInput,
} from "@/components/input/box-input";
import { LocationInput } from "@/components/input/location-input";
import { SongSearch } from "@/components/song-search";
import { Tile } from "@/components/tile";
import { LevelEnum, ProjectStatusEnum, StyleEnum } from "@/constants";
import { LocationType, SongType } from "@/types";
import { router } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { StyleSheet } from "react-native-unistyles";

export default function CreateProject() {
  // Initialize state with project data or defaults
  const [song, setSong] = useState<SongType | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [status, setStatus] = useState(ProjectStatusEnum.Private);
  const [style, setStyle] = useState();
  const [level, setLevel] = useState();
  const [price, setPrice] = useState();
  const [spots, setSpots] = useState();
  const [audioFile, setAudioFile] = useState();
  const [startDateTime, setStartDateTime] = useState<Date | undefined>(
    undefined
  );
  const [endDateTime, setEndDateTime] = useState<Date | undefined>(undefined);
  const [location, setLocation] = useState<LocationType | undefined>(undefined);

  const options: ChipBarItemProps[] = [
    {
      label: "Status",
      value: status,
      options: ProjectStatusEnum,
      modal: false,
      onValueChange: setStatus,
    },
  ];

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
          value={projectName}
          onChangeText={setProjectName}
        />

        {/* Toggle Button Group for Visibility */}
        <ChipBar items={options} />

        {/* Style and Level Selects */}
        <View style={styles.row}>
          <View style={styles.column}>
            <SelectBoxInput
              label="Style"
              value={style}
              options={StyleEnum}
              onValueChange={setStyle}
            />
          </View>
          <View style={styles.column}>
            <SelectBoxInput
              label="Level"
              value={level}
              options={LevelEnum}
              onValueChange={setLevel}
            />
          </View>
        </View>

        {/* Price and Spots Info Fields */}
        <View style={styles.row}>
          <View style={styles.column}>
            <FloatBoxInput
              label="Price"
              value={price}
              onValueChange={setPrice}
            />
          </View>
          <View style={styles.column}>
            <IntBoxInput label="Spots" value={spots} onValueChange={setSpots} />
          </View>
        </View>

        {/* Audio File Selector */}
        <RowInput
          label="Audio File"
          icon="music.note"
          value={audioFile}
          onValueChange={() => setAudioFile(undefined)}
        />

        {/* Date & Time Row */}
        <DateTimeInput
          label="Date & Time"
          startDateTime={startDateTime}
          endDateTime={endDateTime}
          onValueChange={(startTime: Date, endTime: Date) => {
            setStartDateTime(startTime);
            setEndDateTime(endTime);
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
          value={projectDescription}
          onChangeText={setProjectDescription}
          multiline
          numberOfLines={4}
        />
      </KeyboardAwareScrollView>

      {/* Create Button */}
      <Button
        label="Create"
        onPress={() => {
          router.push("/(teacher)/project");
        }}
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
  column: {
    flex: 1,
  },
}));
