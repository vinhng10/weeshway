import {
  Avatar,
  Boundary,
  CameraPermission,
  Header,
  IconSymbol,
  ThemedActivityIndicator,
  ThemedText,
} from "@/components";
import {
  BOOKING_ACTIVE_STATUSES,
  BOOKING_STATUS,
  SCAN_DELAY_MS,
} from "@/constants";
import { useSuspenseQuery } from "@/hooks";
import { supabase } from "@/supabase";
import { BookingCheckinEnrichedType } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

function CheckinContent() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const lastScannedId = useRef<string | null>(null);
  const isProcessing = useRef(false);
  const bannerOpacity = useSharedValue(0);
  const bannerTranslateY = useSharedValue(20);
  const [banner, setBanner] = useState({ message: "", success: true });

  const {
    data: bookings,
    refetch,
    isRefetching,
  } = useSuspenseQuery<BookingCheckinEnrichedType[]>({
    queryKey: ["checkin", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select(`*, profile:profiles(*)`)
        .eq("project_id", projectId)
        .in("status", BOOKING_ACTIVE_STATUSES)
        .throwOnError();
      return data;
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: bannerOpacity.value,
    transform: [{ translateY: bannerTranslateY.value }],
  }));

  const flash = (message: string, success: boolean) => {
    setBanner({ message, success });
    bannerOpacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(1, { duration: SCAN_DELAY_MS }),
      withTiming(0, { duration: 300 }),
    );
    bannerTranslateY.value = withSequence(
      withTiming(0, { duration: 150 }),
      withTiming(0, { duration: SCAN_DELAY_MS }),
      withTiming(20, { duration: 300 }),
    );
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (isProcessing.current) return;

    let bookingId: string, checkInToken: string;
    try {
      ({ bookingId, checkInToken } = JSON.parse(data));
      if (!bookingId || !checkInToken) return;
    } catch {
      return;
    }

    if (lastScannedId.current === bookingId) return;
    isProcessing.current = true;
    lastScannedId.current = bookingId;
    setTimeout(() => (lastScannedId.current = null), SCAN_DELAY_MS);

    try {
      const { data: result, error } = await supabase.rpc("check_in", {
        p_booking_id: bookingId,
        p_check_in_token: checkInToken,
      });

      if (error) throw new Error(error.message ?? "Check-in failed");

      const { spots } = result as { spots: number };
      flash(`Checked in x${spots}`, true);

      await queryClient.invalidateQueries({
        queryKey: ["checkin", projectId],
      });
    } catch (err: any) {
      flash(err?.message ?? "Check-in failed", false);
    } finally {
      isProcessing.current = false;
    }
  };

  if (!permission) {
    return <ThemedActivityIndicator size="large" style={styles.fill} />;
  }

  if (!permission.granted) {
    return (
      <CameraPermission
        permission={permission}
        requestPermission={requestPermission}
      />
    );
  }

  const checkedInCount = bookings.filter(
    (b) => b.status === BOOKING_STATUS.CHECKED_IN,
  ).length;

  const renderBooking = ({ item }: { item: BookingCheckinEnrichedType }) => {
    const isCheckedIn = item.status === BOOKING_STATUS.CHECKED_IN;
    return (
      <View style={styles.row}>
        <Avatar source={item.profile.avatarUrl} shape="circle" bordered />
        <View style={styles.rowText}>
          <ThemedText type="h5" numberOfLines={1} ellipsizeMode="tail">
            {item.profile.fullName ?? item.profile.username ?? "Student"}
          </ThemedText>
          <ThemedText color="dimmed" numberOfLines={1}>
            {item.spots} {item.spots === 1 ? "spot" : "spots"}
          </ThemedText>
        </View>
        {isCheckedIn && (
          <IconSymbol name="checkmark-circle" size={16} color="#6B9C00" />
        )}
      </View>
    );
  };

  return (
    <View style={[styles.content, styles.fill]}>
      {/* Camera */}
      <View style={styles.section}>
        <ThemedText type="h4">QR Scanner</ThemedText>
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.fill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={handleBarCodeScanned}
          />
          <Animated.View
            style={[
              styles.banner,
              banner.success ? styles.bannerSuccess : styles.bannerError,
              animatedStyle,
            ]}
            pointerEvents="none"
          >
            <IconSymbol
              name={banner.success ? "checkmark-circle" : "close-circle"}
              size={20}
            />
            <ThemedText type="h4" style={styles.bannerText}>
              {banner.message}
            </ThemedText>
          </Animated.View>
        </View>
      </View>

      {/* Bookings */}
      <View style={[styles.section, styles.fill]}>
        <ThemedText type="h4">
          Bookings ({checkedInCount} / {bookings.length})
        </ThemedText>
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBooking}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        />
      </View>
    </View>
  );
}

export default function Checkin() {
  return (
    <View style={styles.container}>
      <Header title="Check-in" />
      <Boundary>
        <CheckinContent />
      </Boundary>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.gap(2),
    gap: theme.gap(2),
  },
  cameraContainer: {
    width: "100%",
    aspectRatio: 1.25,
    alignSelf: "center",
    borderRadius: theme.gap(2),
    overflow: "hidden",
  },
  fill: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
    padding: theme.gap(1),
    borderRadius: theme.gap(2),
    backgroundColor: theme.colors.foreground,
  },
  rowText: {
    flex: 1,
    gap: theme.gap(0.25),
  },
  section: {
    gap: theme.gap(1),
  },
  list: {
    gap: theme.gap(1),
    paddingBottom: theme.gap(16),
  },
  banner: {
    position: "absolute",
    bottom: theme.gap(2),
    left: theme.gap(2),
    right: theme.gap(2),
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
    padding: theme.gap(1),
    borderRadius: theme.gap(2),
  },
  bannerSuccess: {
    backgroundColor: theme.colors.primary,
  },
  bannerError: {
    backgroundColor: theme.colors.danger,
  },
  bannerText: {
    flexShrink: 1,
  },
}));
