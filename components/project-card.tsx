import { PROJECT_STATUS, STRIPE_PAYMENT_STATUS } from "@/constants";
import { useAudioPlayerStore, useAuth, useLocales } from "@/hooks";
import { ProjectEnrichedType } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useShallow } from "zustand/react/shallow";
import { Avatar } from "./avatar";
import { Chip } from "./chip";
import { Button, Checkout, formatDate, formatTime, IconButton } from "./input";
import { ProjectStatus } from "./project-status";
import { ThemedText } from "./themed-text";
import { IconSymbol } from "./ui/icon-symbol";

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
    }))
  );
  const formatMoney = useLocales((state) => state.formatMoney);

  const handleAudioPlayer = (e?: any) => {
    if (!data.song.previewUrl) return;
    e?.stopPropagation?.();
    toggle(data.song.previewUrl);
  };

  const handleBook = () => {
    setVisible(true);
  };

  const handleWish = async () => {
    // TODO: Implement wish functionality
  };

  const handleCheckoutExit = async () => {
    setVisible(false);
    await queryClient.invalidateQueries({
      queryKey: ["classes"],
    });
  };

  const handlePress = () => {
    router.push(`/(student)/classes/${data.id}`);
  };

  const { booked, label, onPress } = useMemo(() => {
    const userBooking = data.bookings.find(
      (b) =>
        b.userId === profile?.id &&
        b.projectId === data.id &&
        b.status === STRIPE_PAYMENT_STATUS.SUCCEEDED
    );
    const spots = userBooking?.spots ?? 0;
    const booked = !!userBooking;
    const released = data.status === PROJECT_STATUS.RELEASE;

    return {
      booked,
      label: booked ? `Booked x${spots}` : released ? "Book" : "Wish",
      onPress: booked ? undefined : released ? handleBook : handleWish,
    };
  }, [data.bookings, data.id, data.status, profile?.id]);

  return (
    <Pressable onPress={handlePress}>
      <ImageBackground
        source={data.song.artworkUrl}
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <LinearGradient
          style={styles.overlay}
          colors={["rgba(255, 255, 255, 0.1)", "rgba(0, 0, 0, 0.9)"]}
          start={{ x: 0.0, y: 0.3 }}
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
              {data.style && <Chip label={data.style} color="light" />}
              {data.level && <Chip label={data.level} color="light" />}
            </View>
          </View>

          {/* Middle Container */}
          <View style={styles.middleContainer}>
            {/* Song Info */}
            <View style={styles.rowGroup}>
              <ThemedText type="h3">{data.song.name}</ThemedText>
              <ThemedText color="dimmed">{data.song.artistName}</ThemedText>
            </View>

            {/* Location and DateTime Info */}
            <View style={styles.rowGroup}>
              <View style={styles.row}>
                <View style={styles.infoRow}>
                  <IconSymbol
                    name="location.app.fill"
                    size={16}
                    color="#FFFFFF"
                  />
                  <ThemedText>{data.location?.displayName}</ThemedText>
                </View>
                <ThemedText>
                  {formatMoney(data.price, data.currency)}
                </ThemedText>
              </View>
              <View style={styles.row}>
                <View style={styles.infoRow}>
                  <IconSymbol
                    name="timer.circle.fill"
                    size={16}
                    color="#FFFFFF"
                  />
                  <ThemedText>
                    {data.startAt && data.endAt
                      ? `${formatDate(
                          new Date(data.startAt),
                          true
                        )}, ${formatTime(
                          new Date(data.startAt)
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
        </LinearGradient>
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
    gap: theme.gap(0.5),
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
