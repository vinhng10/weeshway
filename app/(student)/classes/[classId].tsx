import {
  Avatar,
  Boundary,
  Button,
  Checkout,
  DateTimeInput,
  FloatBoxInput,
  Hero,
  IntBoxInput,
  LocationInput,
  TextBoxInput,
  TextInput,
  ThemedText,
} from "@/components";
import { PROJECT_STATUS, STRIPE_PAYMENT_STATUS } from "@/constants";
import { useAuth, useLocales, useSuspenseQuery } from "@/hooks";
import { supabase } from "@/supabase";
import { ProjectEnrichedType } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function ClassContent() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const profile = useAuth((state) => state.profile);
  const [visible, setVisible] = useState(false);
  const queryClient = useQueryClient();
  const formatMoney = useLocales((state) => state.formatMoney);

  const { data } = useSuspenseQuery<ProjectEnrichedType>({
    queryKey: ["classes", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(
          `*, 
          profile:profiles(*), 
          song:songs(*), 
          location:locations(*), 
          bookings:bookings(*),
          wishings:wishings(*)
        `
        )
        .eq("id", classId)
        .eq("bookings.status", STRIPE_PAYMENT_STATUS.SUCCEEDED)
        .eq("wishings.user_id", profile?.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleBook = () => {
    setVisible(true);
  };

  const handleWish = async () => {
    if (!profile?.id) return;

    try {
      const wishing = data.wishings.find((w) => w.userId === profile.id);
      const { error } = wishing
        ? await supabase.from("wishings").delete().eq("id", wishing.id)
        : await supabase.from("wishings").insert({
            user_id: profile.id,
            project_id: data.id,
          });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["classes"] });
    } catch (error: any) {
      console.error("Error toggling wish:", error);
    }
  };

  const handleCheckoutExit = async () => {
    setVisible(false);
    await queryClient.invalidateQueries({
      queryKey: ["classes"],
    });
  };

  const userBooking = data.bookings.find(
    (b) =>
      b.userId === profile?.id &&
      b.projectId === data.id &&
      b.status === STRIPE_PAYMENT_STATUS.SUCCEEDED
  );
  const booked = !!userBooking;
  const wished = data.wishings.some((w) => w.userId === profile?.id);
  const spots = userBooking?.spots ?? 0;
  const released = data.status === PROJECT_STATUS.RELEASE;
  const label = booked
    ? `Booked x${spots}`
    : released
    ? "Book"
    : wished
    ? "Unwish"
    : "Wish";
  const onPress = booked ? undefined : released ? handleBook : handleWish;

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
            router.push(`/(student)/classes/teacher/${data.profile.id}`);
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
            value={formatMoney(data.price, data.currency)}
            editable={false}
          />
          <IntBoxInput
            label="Spots"
            value={`${data.bookings.length} / ${data.spots ?? 0}`}
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
      <Button stickyBottom label={label} onPress={onPress} disabled={booked} />

      <Checkout
        visible={visible && !booked}
        onExit={handleCheckoutExit}
        customer={profile}
        project={data}
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
