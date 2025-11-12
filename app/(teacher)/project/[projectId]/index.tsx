import { Button } from "@/components/button";
import { ChipBar } from "@/components/chip-bar";
import { Header } from "@/components/header";
import { BoxInput, RowInput, TextInput } from "@/components/input";
import { Tile } from "@/components/tile";
import { projects } from "@/mocks/projects";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Project() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const project = useMemo(
    () => projects.find((p) => p.id === Number(projectId)),
    [projectId]
  );

  // Initialize state with project data or defaults
  const [searchQuery, setSearchQuery] = useState(project?.songTitle || "");
  const [projectName, setProjectName] = useState(project?.songTitle || "");
  const [projectDescription, setProjectDescription] = useState(
    project?.description || ""
  );
  const [visibility, setVisibility] = useState(project?.status ?? "private");
  const [style, setStyle] = useState(project?.style ?? "hiphop");
  const [level, setLevel] = useState(project?.level ?? "intermediate");
  const [price, setPrice] = useState(
    project?.price ? `$${project.price.toFixed(2)}` : "$0.00"
  );
  const [spots, setSpots] = useState(project?.spots.toString() || "0");
  const [audioFile, setAudioFile] = useState<string | undefined>();
  const [dateTime, setDateTime] = useState(
    project ? `${project.date}, ${project.time}` : ""
  );
  const [location, setLocation] = useState(project?.studio ?? "");

  const visibilityOptions = [
    { id: "private", label: "Private" },
    { id: "public", label: "Public" },
    { id: "release", label: "Release" },
  ];

  const styleOptions = [
    { label: "Hip Hop", value: "Hip Hop" },
    { label: "Urban", value: "Urban" },
    { label: "House", value: "House" },
    { label: "Pop", value: "Pop" },
    { label: "Ballet", value: "Ballet" },
    { label: "Contemporary", value: "Contemporary" },
    { label: "Jazz", value: "Jazz" },
  ];

  const levelOptions = [
    { label: "Beginner", value: "Beginner" },
    { label: "Intermediate", value: "Intermediate" },
    { label: "Advanced", value: "Advanced" },
    { label: "Open Level", value: "Open Level" },
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
        {/* Song Card */}
        <Tile
          imageSource={project?.backgroundImage}
          title={project?.songTitle ?? ""}
          subtitle={project?.artist ?? ""}
          onPress={() => {}}
        />

        {/* Project Name Input */}
        <TextInput
          placeholder="Project name..."
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
        stickyBottom
        label="Studio"
        onPress={() => router.push(`/(teacher)/project/${projectId}/studio`)}
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
