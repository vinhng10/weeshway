import { Button } from "@/components/button";
import { ChipBar, ChipBarItemProps } from "@/components/chip-bar";
import { Header } from "@/components/header";
import { BoxInput, RowInput, TextInput } from "@/components/input";
import { Tile } from "@/components/tile";
import { LevelEnum, ProjectStatusEnum, StyleEnum } from "@/constants";
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
  const [status, setStatus] = useState<string>(
    project?.status ?? ProjectStatusEnum.Private
  );
  const [style, setStyle] = useState<StyleEnum>(project?.style as StyleEnum);
  const [level, setLevel] = useState<LevelEnum>(project?.level as LevelEnum);
  const [price, setPrice] = useState<string>(
    `$${project?.price?.toFixed(2) ?? "$0.00"}`
  );
  const [spots, setSpots] = useState<string>(project?.spots.toString() ?? "0");
  const [audioFile, setAudioFile] = useState<string | undefined>();
  const [dateTime, setDateTime] = useState<string>(
    `${project?.date}, ${project?.time ?? ""}`
  );
  const [location, setLocation] = useState<string>(project?.studio ?? "");

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
