import { Button } from "@/components/button";
import { ChipBar, ChipBarItemProps } from "@/components/chip-bar";
import { Header } from "@/components/header";
import { BoxInput, RowInput, TextInput } from "@/components/input";
import { SongSearch } from "@/components/song-search";
import { Tile } from "@/components/tile";
import { LevelEnum, ProjectStatusEnum, StyleEnum } from "@/constants";
import { SongType } from "@/types";
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
  const [status, setStatus] = useState<string>(ProjectStatusEnum.Private);
  const [style, setStyle] = useState<StyleEnum>(StyleEnum.HipHop);
  const [level, setLevel] = useState<LevelEnum>(LevelEnum.Beginner);
  const [price, setPrice] = useState("$0.00");
  const [spots, setSpots] = useState("0");
  const [audioFile, setAudioFile] = useState<string | undefined>();
  const [dateTime, setDateTime] = useState("");
  const [location, setLocation] = useState("");

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

        {/* StyleEnum and LevelEnum Selects */}
        <View style={styles.row}>
          <BoxInput
            label="Style"
            type="select"
            value={style}
            options={StyleEnum}
            onValueChange={setStyle}
          />
          <BoxInput
            label="Level"
            type="select"
            value={level}
            options={LevelEnum}
            onValueChange={setLevel}
          />
        </View>

        {/* Price and Spots Info Fields */}
        <View style={styles.row}>
          <BoxInput
            label="Price"
            type="text"
            value={price}
            onValueChange={setPrice}
          />
          <BoxInput
            label="Spots"
            type="text"
            value={spots}
            onValueChange={setSpots}
          />
        </View>

        {/* Audio File Selector */}
        <RowInput
          label="Audio File"
          icon="music.note"
          value={audioFile || "No file selected"}
          onValueChange={setAudioFile}
        />

        {/* Date & Time Row */}
        <RowInput
          label="Date & Time"
          icon="timer.circle.fill"
          value={dateTime}
          onValueChange={setDateTime}
        />

        {/* Location Row */}
        <RowInput
          label="Location"
          icon="location.app.fill"
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
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.gap(2),
  },
}));
