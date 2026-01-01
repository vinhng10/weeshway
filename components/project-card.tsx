import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Checkout } from "@/components/checkout";
import { Chip } from "@/components/chip";
import { IconButton } from "@/components/icon-button";
import { formatDate, formatTime } from "@/components/input";
import { ProjectStatus } from "@/components/project-status";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ProjectStatusEnum, StripePaymentStatusEnum } from "@/constants";
import { useAudioPlayerStore } from "@/hooks/useAudioPlayerStore";
import { useAuth } from "@/hooks/useAuth";
import { useLocales } from "@/hooks/useLocales";
import { ProjectEnrichedType } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useShallow } from "zustand/react/shallow";

interface CardProps {
  data: ProjectEnrichedType;
}

export const ProjectCard: React.FunctionComponent<CardProps> = ({ data }) => {
  const profile = useAuth((state) => state.profile);
  const queryClient = useQueryClient();
  const [visible, setVisible] = React.useState(false);
  const { isPlaying, toggle } = useAudioPlayerStore(
    useShallow((state) => ({
      isPlaying: state.isPlaying(data.song.previewUrl),
      toggle: state.toggle,
    }))
  );
  const formatMoney = useLocales((state) => state.formatMoney);
  const booked = data.bookings.some(
    (booking) =>
      booking.userId === profile?.id &&
      booking.projectId === data.id &&
      booking.status === StripePaymentStatusEnum.Succeeded
  );

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
    router.push(`/(tabs)/classes/${data.id}`);
  };

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
                  <ThemedText>{data.location?.name}</ThemedText>
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
              <Button
                label={
                  booked
                    ? "Booked"
                    : data.status === ProjectStatusEnum.Release
                    ? "Book"
                    : "Wish"
                }
                onPress={
                  data.status === ProjectStatusEnum.Release
                    ? handleBook
                    : handleWish
                }
                disabled={booked}
              />
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
