import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Hero } from "@/components/hero";
import {
  DateTimeInput,
  FloatBoxInput,
  IntBoxInput,
  TextBoxInput,
  TextInput,
} from "@/components/input";
import { LocationInput } from "@/components/input/location-input";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabase";
import { ProjectEnrichedType } from "@/types";
import { useQuery } from "@tanstack/react-query";
import camelcaseKeys from "camelcase-keys";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Class() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const profile = useAuth((state) => state.profile);
  const isLoggedIn = useAuth((state) => state.isLoggedIn);

  const { data, isPending, error } = useQuery<ProjectEnrichedType>({
    queryKey: ["projects", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`*, profiles(*), songs(*), locations(*)`)
        .eq("id", classId)
        .single();

      if (error) throw error;
      if (!data) return null;

      const result = camelcaseKeys(data, { deep: true });
      return result;
    },
    enabled: isLoggedIn && !!profile && !!classId,
  });

  if (isPending) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <ThemedText>Class not found</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hero Section with Song Image */}
      <Hero data={data.songs} onShare={() => {}} />

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Song Card */}
        <Pressable
          style={styles.teacherContainer}
          onPress={() => {
            router.push(`/(student)/class/teacher/${data.profiles.id}`);
          }}
        >
          <Avatar
            source={data.profiles.avatarUrl}
            size="large"
            shape="circle"
            bordered={true}
          />
          <ThemedText type="h3">{data.profiles.fullName}</ThemedText>
        </Pressable>

        {/* Style and Level Selects */}
        <View style={styles.row}>
          <TextBoxInput label="Style" value={data.style} editable={false} />
          <TextBoxInput label="Level" value={data.level} editable={false} />
        </View>

        {/* Price and Spots Info Fields */}
        <View style={styles.row}>
          <FloatBoxInput
            label="Price"
            value={`$${data.price?.toFixed(2) ?? "0.00"}`}
            editable={false}
          />
          <IntBoxInput
            label="Spots"
            value={`${data.spots ?? 0}`}
            editable={false}
          />
        </View>

        {/* Date & Time Row */}
        <DateTimeInput
          label="Date & Time"
          startAt={data.startAt ? new Date(data.startAt) : undefined}
          endAt={data.endAt ? new Date(data.endAt) : undefined}
          editable={false}
        />

        {/* Location Row */}
        <LocationInput
          label="Location"
          value={data.locations}
          editable={false}
        />

        {/* Project Description Input */}
        <TextInput
          placeholder="Project description ..."
          value={data.description}
          editable={false}
          multiline
          numberOfLines={4}
        />
      </ScrollView>

      {/* Book Button */}
      <Button stickyBottom label="Book" onPress={() => {}} />
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
  teacherContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(2),
  },
}));
