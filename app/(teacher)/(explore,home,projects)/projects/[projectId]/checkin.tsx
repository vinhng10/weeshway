import { Boundary, CameraPermission, Header, ThemedText } from "@/components";
import { SCAN_DELAY_MS } from "@/constants";
import { supabase } from "@/supabase";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

function CheckinContent() {
  const [permission, requestPermission] = useCameraPermissions();
  const lastScannedId = useRef<number | null>(null);
  const isProcessing = useRef(false);
  const bannerOpacity = useSharedValue(0);
  const bannerTranslateY = useSharedValue(20);
  const [banner, setBanner] = useState({ message: "", success: true });

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

    let bookingId: number, checkInToken: string;
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
    } catch (err: any) {
      flash(err?.message ?? "Check-in failed", false);
    } finally {
      isProcessing.current = false;
    }
  };

  if (!permission) return null;

  if (!permission.granted) {
    return <CameraPermission />;
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={styles.camera}
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
        <Ionicons
          name={banner.success ? "checkmark-circle" : "close-circle"}
          size={22}
          color="#FFFFFF"
        />
        <ThemedText type="h4" bold style={styles.bannerText}>
          {banner.message}
        </ThemedText>
      </Animated.View>
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
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  banner: {
    position: "absolute",
    bottom: rt.insets.bottom + theme.gap(2),
    left: theme.gap(2),
    right: theme.gap(2),
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1.5),
    paddingVertical: theme.gap(2),
    paddingHorizontal: theme.gap(2.5),
    borderRadius: theme.gap(2),
  },
  bannerSuccess: {
    backgroundColor: theme.colors.primary,
  },
  bannerError: {
    backgroundColor: theme.colors.danger,
  },
  bannerText: {
    color: theme.colors.typography,
    flexShrink: 1,
  },
}));
