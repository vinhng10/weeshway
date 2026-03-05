import { BOOKING_ACTIVE_STATUSES, PROJECT_STATUS } from "@/constants";
import { useAlert, useAudioPlayerStore, useAuth, useLocales } from "@/hooks";
import { supabase } from "@/supabase";
import { ProjectEnrichedType } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { useShallow } from "zustand/react/shallow";
import { Avatar } from "./avatar";
import { Chip } from "./chip";
import { IconSymbol } from "./icon-symbol";
import { Button, Checkout, formatDate, formatTime, IconButton } from "./input";
import { ProjectStatus } from "./project-status";
import { ThemedText } from "./themed-text";

const UniLinearGradient = withUnistyles(LinearGradient, (theme) => ({
  colors: ["rgba(255, 255, 255, 0)", theme.colors.foreground] as const,
}));

interface CardProps {
  data: ProjectEnrichedType;
}

export const ProjectCard = ({ data }: CardProps) => {
  const profile = useAuth((state) => state.profile);
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);
  const { isPlaying, toggle } = useAudioPlayerStore(
    useShallow((state) => ({
      isPlaying: state.isPlaying(data.song.previewUrl),
      toggle: state.toggle,
    })),
  );
  const formatMoney = useLocales((state) => state.formatMoney);
  const showAlert = useAlert((state) => state.showAlert);

  const handleAudioPlayer = (e?: any) => {
    if (!data.song.previewUrl) return;
    e?.stopPropagation?.();
    toggle(data.song.previewUrl);
  };

  const handleBook = () => {
    setVisible(true);
  };

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

  const handlePress = () => {
    router.navigate(`./classes/${data.id}`);
  };

  // Compute booking and wish status
  const userBooking = data.bookings.find(
    (b) =>
      b.userId === profile?.id &&
      b.projectId === data.id &&
      BOOKING_ACTIVE_STATUSES.includes(b.status),
  );
  const booked = !!userBooking;
  const watching = data.watchings.some((w) => w.userId === profile?.id);
  const spots = userBooking?.spots ?? 0;
  const released = data.status === PROJECT_STATUS.RELEASED;
  const label = booked
    ? `Booked x${spots}`
    : released
      ? "Book"
      : watching
        ? "Unwatch"
        : "Watch";
  const onPress = booked ? undefined : released ? handleBook : handleWatch;

  return (
    <Pressable onPress={handlePress}>
      <ImageBackground
        source={data.song.artworkUrl}
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <UniLinearGradient
          style={styles.overlay}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 0, y: 1 }}
        >
          {/* Top Container */}
          <View style={styles.topContainer}>
            <Avatar
              source={data.profile.avatarUrl}
              size="large"
              shape="circle"
              bordered={true}
            />
            <ThemedText type="h3">{data.profile.fullName}</ThemedText>
            <View style={styles.chipContainer}>
              {data.style && <Chip label={data.style} color="contrast" />}
              {data.level && <Chip label={data.level} color="contrast" />}
            </View>
          </View>

          {/* Middle Container */}
          <View style={styles.middleContainer}>
            {/* Song Info */}
            <View style={styles.rowGroup}>
              <ThemedText type="h3" numberOfLines={1} ellipsizeMode="tail">
                {data.song.name}
              </ThemedText>
              <ThemedText
                type="h5"
                color="dimmed"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {data.song.artistName}
              </ThemedText>
            </View>

            {/* Location and DateTime Info */}
            <View style={styles.rowGroup}>
              <View style={styles.row}>
                <View style={styles.infoRow}>
                  <IconSymbol name="location-sharp" size={16} />
                  <ThemedText type="h5">
                    {data.location?.displayName}
                  </ThemedText>
                </View>
                <ThemedText type="h5">
                  {formatMoney(data.price, data.currency)}
                </ThemedText>
              </View>
              <View style={styles.row}>
                <View style={styles.infoRow}>
                  <IconSymbol name="time" size={16} />
                  <ThemedText type="h5">
                    {data.startAt && data.endAt
                      ? `${formatDate(
                          new Date(data.startAt),
                          true,
                        )}, ${formatTime(
                          new Date(data.startAt),
                        )} - ${formatTime(new Date(data.endAt))}`
                      : ""}
                  </ThemedText>
                </View>
                <ProjectStatus data={data} />
              </View>
            </View>
          </View>

          {/* Bottom Container */}
          <View style={styles.bottomContainer}>
            <View style={styles.bookButton}>
              <Button label={label} onPress={onPress} disabled={booked} />
            </View>
            <IconButton
              icon={isPlaying ? "pause" : "play"}
              iconSize={36}
              onPress={handleAudioPlayer}
            />
          </View>
        </UniLinearGradient>
      </ImageBackground>

      <Checkout
        visible={visible && !booked}
        onExit={handleCheckoutExit}
        customer={profile}
        project={data}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  background: {
    flex: 1,
  },
  backgroundImage: {
    borderRadius: theme.gap(2),
  },
  overlay: {
    flex: 1,
    padding: theme.gap(1),
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: theme.gap(2),
  },
  topContainer: {
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.gap(0.5),
  },
  chipContainer: {
    flexDirection: "row",
    gap: theme.gap(1),
  },
  middleContainer: {
    width: "100%",
    gap: theme.gap(2.5),
  },
  rowGroup: {
    flexDirection: "column",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(0.5),
  },
  bottomContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.gap(1),
  },
  bookButton: {
    flex: 1,
  },
}));
