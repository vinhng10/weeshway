import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Hero } from "@/components/hero";
import { BoxInput, RowInput, TextInput } from "@/components/input";
import { ThemedText } from "@/components/themed-text";
import { classes } from "@/mocks/classes";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Class() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const classData = classes.find((c) => c.id === Number(classId));

  if (!classData) {
    return (
      <View style={styles.container}>
        <ThemedText>Class not found</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hero Section with Song Image */}
      <Hero
        source={{ uri: classData.backgroundImage }}
        title={classData.songTitle}
        subtitle={classData.artist}
        onShare={() => {}}
        onPlay={() => {}}
      />

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Song Card */}
        <View style={styles.teacherContainer}>
          <Avatar
            source={{ uri: classData.instructor.imageUrl }}
            size="large"
            shape="circle"
            bordered={true}
          />
          <ThemedText type="h3">{classData.instructor.name}</ThemedText>
        </View>

        {/* Style and Level Selects */}
        <View style={styles.row}>
          <BoxInput
            label="Style"
            type="type"
            value={classData.style}
            editable={false}
          />
          <BoxInput
            label="Level"
            type="type"
            value={classData.level}
            editable={false}
          />
        </View>

        {/* Price and Spots Info Fields */}
        <View style={styles.row}>
          <BoxInput
            label="Price"
            type="type"
            value={`$${classData.price}`}
            editable={false}
          />
          <BoxInput
            label="Spots"
            type="type"
            value={classData.spotsLeft.toString()}
            editable={false}
          />
        </View>

        {/* Date & Time Row */}
        <RowInput
          label="Date & Time"
          icon="timer.circle.fill"
          value={`${classData.date}, ${classData.time}`}
          editable={false}
        />

        {/* Location Row */}
        <RowInput
          label="Location"
          icon="location.app.fill"
          value={classData.studio}
          editable={false}
        />

        {/* Project Description Input */}
        <TextInput
          placeholder="Project description ..."
          value={classData.description}
          editable={false}
          multiline
          numberOfLines={4}
        />
      </ScrollView>

      {/* Book Button */}
      <View style={styles.buttonContainer}>
        <Button label="Book" onPress={() => {}} />
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
  teacherContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(2),
  },
}));
