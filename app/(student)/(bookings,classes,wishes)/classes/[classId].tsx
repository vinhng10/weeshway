import {
  Avatar,
  Boundary,
  Button,
  Checkout,
  Chip,
  DateTimeInput,
  FAB,
  FABItem,
  FloatBoxInput,
  Header,
  Hero,
  IntBoxInput,
  LocationSearch,
  QRCode,
  TextBoxInput,
  ThemedText,
} from "@/components";
import {
  BOOKING_ACTIVE_STATUSES,
  BOOKING_STATUS,
  PROJECT_STATUS,
} from "@/constants";
import { useAlert, useAuth, useLocales, useSuspenseQuery } from "@/hooks";
import { supabase } from "@/supabase";
import { ProjectEnrichedType } from "@/types";
import { share } from "@/utils";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function ClassContent() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const profile = useAuth((state) => state.profile);
  const [visible, setVisible] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const queryClient = useQueryClient();
  const formatMoney = useLocales((state) => state.formatMoney);
  const transactionFee = useLocales((state) => state.transactionFee);
  const showAlert = useAlert((state) => state.showAlert);

  const { data, refetch, isRefetching } = useSuspenseQuery<ProjectEnrichedType>(
    {
      queryKey: ["classes", classId],
      queryFn: async () => {
        const { data } = await supabase
          .from("projects")
          .select(
            `*,
            profile:profiles(*),
            song:songs(id, name, artist_name, preview_url, artwork_url),
            location:locations(*),
            bookings:bookings(*, secret:booking_secrets(*)),
            watchings:watchings(*)
          `,
          )
          .eq("id", classId)
          .in("bookings.status", [
            ...BOOKING_ACTIVE_STATUSES,
            BOOKING_STATUS.REFUNDING,
          ])
          .eq("watchings.user_id", profile?.id)
          .single()
          .throwOnError();
        return data;
      },
    },
  );

  const userBooking = data.bookings.find((b) => b.userId === profile?.id);
  const isBooked = !!userBooking;
  const isRefunding = userBooking?.status === BOOKING_STATUS.REFUNDING;
  const isReleased = data.status === PROJECT_STATUS.RELEASED;
  const isWatching = data.watchings.some((w) => w.userId === profile?.id);
  const isCanceled = data.status === PROJECT_STATUS.CANCELED;

  const succeededBookingsCount = data.bookings
    .filter((b) => BOOKING_ACTIVE_STATUSES.includes(b.status))
    .reduce((acc, b) => acc + (b.spots || 0), 0);

  const handleBook = () => setVisible(true);

  const handleWatch = async () => {
    if (!profile?.id) return;
    try {
      const watching = data.watchings.find((w) => w.userId === profile.id);
      watching
        ? await supabase
            .from("watchings")
            .delete()
            .eq("id", watching.id)
            .throwOnError()
        : await supabase
            .from("watchings")
            .insert({
              user_id: profile.id,
              project_id: data.id,
            })
            .throwOnError();
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes("classes"),
      });
    } catch {
      showAlert(
        "Watch List",
        "Couldn't update your watch list. Please try again.",
      );
    }
  };

  const handleCheckoutExit = async () => {
    setVisible(false);
    await queryClient.invalidateQueries({
      predicate: (query) => query.queryKey.includes("classes"),
    });
  };

  const doCancel = async () => {
    if (!userBooking?.id) return;
    try {
      await supabase
        .from("bookings")
        .update({ status: BOOKING_STATUS.REFUNDING })
        .eq("id", userBooking.id)
        .throwOnError();

      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes("classes"),
      });
    } catch (error: any) {
      showAlert(
        "Cancel Failed",
        error?.message ??
          "Couldn't process your refund request. Please try again.",
      );
    }
  };

  const handleCancel = () => {
    showAlert(
      "Cancel Your Booking?",
      `A ${transactionFee}% cancellation fee applies. The booking fee is non-refundable. This cannot be undone.`,
      { confirmLabel: "Confirm", onConfirm: doCancel },
    );
  };

  const handleCheckin = () => {
    if (isBooked && userBooking.secret) {
      setQrVisible(true);
    } else {
      showAlert(
        "Not Available",
        "Check-in is only available after you've booked this class.",
      );
    }
  };

  const handleReport = () => {
    router.navigate(`./report?classId=${classId}`);
  };

  const handleShare = () => share(data);

  const fabItems: FABItem[] = [
    {
      icon: "close-circle",
      label: "Cancel Booking",
      onPress: !isRefunding && !isCanceled ? handleCancel : undefined,
    },
    {
      icon: "qr-code",
      label: "Check-in",
      onPress: !isCanceled ? handleCheckin : undefined,
    },
    {
      icon: "flag",
      label: "Report",
      onPress: handleReport,
    },
    {
      icon: "share-social-sharp",
      label: "Share",
      onPress: handleShare,
    },
  ];

  const buttonLabel = isReleased ? "Book" : isWatching ? "Unwatch" : "Watch";
  const handlePress = isReleased ? handleBook : handleWatch;

  return (
    <View style={styles.container}>
      <Header title="Class" />

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Hero Section */}
        <Hero data={data.song} artworkUrl={data.artworkUrl} />

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
          <View style={styles.teacherInfo}>
            <ThemedText type="h3" numberOfLines={1}>
              {data.profile.fullName}
            </ThemedText>
            {data.profile.bio && (
              <ThemedText type="h5" color="dimmed" numberOfLines={1}>
                {data.profile.bio}
              </ThemedText>
            )}
          </View>
        </Pressable>

        <View style={styles.row}>
          <Chip label={data.status} color="contrast" size="large" />
          {isBooked && (
            <Chip
              label={isRefunding ? "Refunding" : `Booked x${userBooking.spots}`}
              color={isRefunding ? "danger" : "contrast"}
              size="large"
            />
          )}
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
        <LocationSearch
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

      {isBooked ? (
        <FAB label="Actions" items={fabItems} />
      ) : (
        <Button stickyBottom label={buttonLabel} onPress={handlePress} />
      )}

      <Checkout
        visible={visible && !isBooked}
        onExit={handleCheckoutExit}
        customer={profile}
        project={data}
      />

      {isBooked && userBooking.secret && (
        <QRCode
          visible={qrVisible}
          onClose={() => setQrVisible(false)}
          value={JSON.stringify({
            bookingId: userBooking.id,
            checkInToken: userBooking.secret.checkInToken,
          })}
          title="Check-in QR Code"
          description="Show this to your teacher to check in"
        />
      )}
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
    marginTop: rt.insets.top,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    paddingHorizontal: theme.gap(2),
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
  teacherInfo: {
    width: "70%",
    justifyContent: "center",
    gap: theme.gap(0.2),
  },
}));
