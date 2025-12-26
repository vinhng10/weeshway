import { Avatar } from "@/components/avatar";
import { Boundary } from "@/components/boundary";
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
import { ProjectStatusEnum } from "@/constants";
import { useSuspenseQuery } from "@/hooks/useSuspenseQuery";
import { supabase } from "@/supabase";
import { ProjectEnrichedType } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function ClassContent() {
  const { classId } = useLocalSearchParams<{ classId: string }>();

  const { data } = useSuspenseQuery<ProjectEnrichedType>({
    queryKey: ["projects", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`*, profile:profiles(*), song:songs(*), location:locations(*)`)
        .eq("id", classId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleBook = async () => {};

  const handleWish = async () => {};

  return (
    <View style={styles.container}>
      {/* Hero Section with Song Image */}
      <Hero data={data.song} onShare={() => {}} />

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Song Card */}
        <Pressable
          style={styles.teacherContainer}
          onPress={() => {
            router.push(`/(tabs)/class/teacher/${data.profile.id}`);
          }}
        >
          <Avatar
            source={data.profile.avatarUrl}
            size="large"
            shape="circle"
            bordered={true}
          />
          <ThemedText type="h3">{data.profile.fullName}</ThemedText>
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
          value={data.location}
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

      {/* Button */}

      <Button
        stickyBottom
        label={data.status === ProjectStatusEnum.Release ? "Book" : "Wish"}
        onPress={
          data.status === ProjectStatusEnum.Release ? handleBook : handleWish
        }
      />
    </View>
  );
}

export default function Class() {
  return (
    <Boundary>
      <ClassContent />
    </Boundary>
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
