import { Button } from "@/components/button";
import { ChipBar, ChipBarItemProps } from "@/components/chip-bar";
import { Header } from "@/components/header";
import { BoxInput, RowInput, TextInput } from "@/components/input";
import { Tile } from "@/components/tile";
import { Level, ProjectStatus, Style } from "@/constants/options";
import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function MakeAWish() {
  // Initialize state with project data or defaults
  const [searchQuery, setSearchQuery] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [status, setStatus] = useState<string>(ProjectStatus.Private);
  const [style, setStyle] = useState<Style>(Style.HipHop);
  const [level, setLevel] = useState<Level>(Level.Beginner);
  const [price, setPrice] = useState("$0.00");
  const [spots, setSpots] = useState("0");
  const [audioFile, setAudioFile] = useState<string | undefined>();
  const [dateTime, setDateTime] = useState("");
  const [location, setLocation] = useState("");

  const filters: ChipBarItemProps[] = [
    {
      label: "Status",
      value: status,
      options: ProjectStatus,
      modal: false,
      onValueChange: setStatus,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header title="Project" />

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Input */}
        <TextInput
          placeholder="Search song..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Song Card */}
        <Tile
          imageSource="https://i.scdn.co/image/ab67616d0000b2737d469421bb0b23b32b4851da"
          title="Echoes of the Night"
          subtitle="Liam Carter"
          onPress={() => {}}
        />

        {/* Project Name Input */}
        <TextInput
          placeholder="Project name..."
          value={projectName}
          onChangeText={setProjectName}
        />

        {/* Toggle Button Group for Visibility */}
        <ChipBar items={filters} />

        {/* Style and Level Selects */}
        <View style={styles.row}>
          <BoxInput
            label="Style"
            type="select"
            value={style}
            options={Style}
            onValueChange={setStyle}
          />
          <BoxInput
            label="Level"
            type="select"
            value={level}
            options={Level}
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
      </ScrollView>

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
