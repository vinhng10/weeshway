import {
  Avatar,
  Boundary,
  Button,
  ButtonGroup,
  Checkout,
  Chip,
  DateTimeInput,
  FloatBoxInput,
  Hero,
  IntBoxInput,
  LocationInput,
  TextBoxInput,
  ThemedText,
} from "@/components";
import { PROJECT_STATUS, STRIPE_PAYMENT_STATUS } from "@/constants";
import { useAuth, useLocales, useSuspenseQuery } from "@/hooks";
import { supabase } from "@/supabase";
import { ProjectEnrichedType } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function ClassContent() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const profile = useAuth((state) => state.profile);
  const [visible, setVisible] = useState(false);
  const queryClient = useQueryClient();
  const formatMoney = useLocales((state) => state.formatMoney);

  const { data, refetch, isRefetching } = useSuspenseQuery<ProjectEnrichedType>(
    {
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
            watchings:watchings(*)
          `
          )
          .eq("id", classId)
          .in("bookings.status", [
            STRIPE_PAYMENT_STATUS.SUCCEEDED,
            STRIPE_PAYMENT_STATUS.REFUNDING,
          ])
          .eq("watchings.user_id", profile?.id)
          .single();

        if (error) throw error;
        return data;
      },
    }
  );

  const userBooking = data.bookings.find((b) => b.userId === profile?.id);
  const isBooked = !!userBooking;
  const isRefunding = userBooking?.status === STRIPE_PAYMENT_STATUS.REFUNDING;
  const isReleased = data.status === PROJECT_STATUS.RELEASE;
  const isWatching = data.watchings.some((w) => w.userId === profile?.id);
  const isCanceled = data.status === PROJECT_STATUS.CANCEL;

  const succeededBookingsCount = data.bookings
    .filter((b) => b.status === STRIPE_PAYMENT_STATUS.SUCCEEDED)
    .reduce((acc, b) => acc + (b.spots || 0), 0);

  const handleBook = () => setVisible(true);

  const handleWatch = async () => {
    if (!profile?.id) return;
    try {
      const watching = data.watchings.find((w) => w.userId === profile.id);
      const { error } = watching
        ? await supabase.from("watchings").delete().eq("id", watching.id)
        : await supabase.from("watchings").insert({
            user_id: profile.id,
            project_id: data.id,
          });

      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
    } catch (error) {
      console.error("Error toggling wish:", error);
    }
  };

  const handleCheckoutExit = async () => {
    setVisible(false);
    await queryClient.invalidateQueries({ queryKey: ["classes"] });
  };

  const handleRefund = async () => {
    if (!userBooking?.id) return;
    try {
      await supabase
        .from("bookings")
        .update({ status: STRIPE_PAYMENT_STATUS.REFUNDING })
        .eq("id", userBooking.id)
        .throwOnError();

      await queryClient.invalidateQueries({ queryKey: ["classes"] });
    } catch (error) {
      console.error("Refund error:", error);
    }
  };

  const buttonLabel = isBooked
    ? `Booked x${userBooking.spots}`
    : isReleased
      ? "Book"
      : isWatching
        ? "Unwatch"
        : "Watch";

  const handlePress = isBooked
    ? undefined
    : isReleased
      ? handleBook
      : handleWatch;

  return (
    <View style={styles.container}>
      {/* Hero Section with Song Image */}
      <Hero data={data.song} onShare={() => {}} />

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Avatar and Name */}
        <Pressable
          style={styles.teacherContainer}
          onPress={() => router.navigate(`../teacher/${data.profile.id}`)}
        >
          <Avatar
            source={data.profile.avatarUrl}
            size="large"
            shape="circle"
            bordered
          />
          <ThemedText type="h3">{data.profile.fullName}</ThemedText>
        </Pressable>

        {/* Project Name */}
        {data.name && (
          <TextBoxInput label="Name" value={data.name} editable={false} />
        )}

        <View style={styles.row}>
          <Chip label={data.status} color="light" size="large" />
        </View>

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
            value={`${succeededBookingsCount} / ${data.spots ?? 0}`}
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
        <TextBoxInput
          label="Description"
          value={data.description}
          editable={false}
          multiline
          numberOfLines={4}
        />
      </ScrollView>

      {isCanceled ? null : isRefunding ? (
        <Button stickyBottom label="Refunding" disabled />
      ) : isBooked ? (
        <ButtonGroup stickyBottom>
          <Button outlined label="Refund" onPress={handleRefund} />
          <Button label={buttonLabel} onPress={handlePress} disabled />
        </ButtonGroup>
      ) : (
        <Button
          stickyBottom
          label={buttonLabel}
          onPress={handlePress}
          disabled={isBooked}
        />
      )}

      <Checkout
        visible={visible && !isBooked}
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
