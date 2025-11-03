import { Button } from "@/components/button";
import { ChipBar } from "@/components/chip-bar";
import { Header } from "@/components/header";
import { BoxInput, RowInput, TextInput } from "@/components/input";
import { Tile } from "@/components/tile";
import React, { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState("Levitating");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [style, setStyle] = useState("hiphop");
  const [level, setLevel] = useState("intermediate");
  const [price, setPrice] = useState("$19.99");
  const [spots, setSpots] = useState("25");
  const [audioFile, setAudioFile] = useState<string | undefined>();
  const [dateTime, setDateTime] = useState("July 25, 19:00 - 20:30");
  const [location, setLocation] = useState("Dance Studio Pro");

  const visibilityOptions = [
    { id: "private", label: "Private" },
    { id: "public", label: "Public" },
    { id: "release", label: "Release" },
  ];

  const styleOptions = [
    { label: "Hip Hop", value: "hiphop" },
    { label: "Ballet", value: "ballet" },
    { label: "Contemporary", value: "contemporary" },
    { label: "Jazz", value: "jazz" },
  ];

  const levelOptions = [
    { label: "Beginner", value: "beginner" },
    { label: "Intermediate", value: "intermediate" },
    { label: "Advanced", value: "advanced" },
  ];

  const handleCreate = () => {
    if (!projectName.trim()) {
      Alert.alert("Validation Error", "Please enter a project name");
      return;
    }

    Alert.alert("Success", "Project created successfully!", [
      {
        text: "OK",
        onPress: () => {
          // Reset form or navigate
          console.log("Project created:", {
            projectName,
            visibility,
            style,
            level,
            audioFile,
            dateTime,
            location,
            projectDescription,
          });
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header title="Create Project" />

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
          imageSource={{
            uri: "https://i.scdn.co/image/ab67616d0000b2737d469421bb0b23b32b4851da",
          }}
          title="Echoes of the Night"
          subtitle="Liam Carter"
          onPress={() => {}}
        />

        {/* Project Name Input */}
        <TextInput
          placeholder="Project name ..."
          value={projectName}
          onChangeText={setProjectName}
        />

        {/* Toggle Button Group for Visibility */}
        <ChipBar
          options={visibilityOptions}
          activeOption={visibility}
          onPress={setVisibility}
        />

        {/* Style and Level Selects */}
        <View style={styles.row}>
          <BoxInput
            label="Style"
            type="select"
            value={style}
            options={styleOptions}
            onValueChange={setStyle}
          />
          <BoxInput
            label="Level"
            type="select"
            value={level}
            options={levelOptions}
            onValueChange={setLevel}
          />
        </View>

        {/* Price and Spots Info Fields */}
        <View style={styles.row}>
          <BoxInput
            label="Price"
            type="type"
            value={price}
            onValueChange={setPrice}
          />
          <BoxInput
            label="Spots"
            type="type"
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
      <View style={styles.buttonContainer}>
        <Button label="Create" onPress={handleCreate} />
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
  scrollContent: {
    padding: theme.gap(2),
    gap: theme.gap(2),
    paddingBottom: theme.gap(4),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.gap(2),
  },
  buttonContainer: {
    width: "70%",
    position: "absolute",
    alignSelf: "center",
    bottom: theme.gap(2),
  },
}));
