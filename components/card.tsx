import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ClassType } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ImageBackground, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface ClassCardProps {
  classData: ClassType;
  onBook?: () => void;
  onPlay?: () => void;
}

export const ClassCard: React.FunctionComponent<ClassCardProps> = ({
  classData,
  onBook,
  onPlay,
}) => {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: classData.backgroundImage }}
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <LinearGradient
          style={styles.overlay}
          colors={["rgba(0, 0, 0, 0.1)", "rgba(0, 0, 0, 0.8)"]}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 0, y: 1 }}
        >
          {/* Top Container */}
          <View style={styles.topContainer}>
            <Avatar
              source={{ uri: classData.instructor.imageUrl }}
              size="large"
              shape="circle"
              bordered={true}
            />
            <ThemedText bold type="h3">
              {classData.instructor.name}
            </ThemedText>
            <View style={styles.chipContainer}>
              <Chip label={classData.style} type="light" />
              <Chip label={classData.level} type="light" />
            </View>
          </View>

          {/* Middle Container */}
          <View style={styles.middleContainer}>
            {/* Song Info */}
            <View style={styles.rowGroup}>
              <ThemedText bold type="h3">
                {classData.songTitle}
              </ThemedText>
              <ThemedText dimmed style={styles.artist}>
                {classData.artist}
              </ThemedText>
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
                  <ThemedText>{classData.studio}</ThemedText>
                </View>
                <ThemedText bold>${classData.price.toFixed(2)}</ThemedText>
              </View>
              <View style={styles.row}>
                <View style={styles.infoRow}>
                  <IconSymbol
                    name="timer.circle.fill"
                    size={16}
                    color="#FFFFFF"
                  />
                  <ThemedText>
                    {classData.date}, {classData.time}
                  </ThemedText>
                </View>
                <ThemedText bold style={styles.highlight}>
                  {classData.spotsLeft} spots left
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Bottom Container */}
          <View style={styles.bottomContainer}>
            <View style={styles.bookButton}>
              <Button label="Book" onPress={onBook || (() => {})} />
            </View>
            <Pressable style={styles.playButton} onPress={onPlay}>
              <IconSymbol
                name="play.circle.fill"
                size={48}
                color="rgba(255, 255, 255, 0.6)"
              />
            </Pressable>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    borderRadius: theme.gap(2),
    overflow: "hidden",
    backgroundColor: "red",
  },
  background: {
    width: "100%",
    height: "100%",
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
  artist: {
    color: "#CCCCCC",
  },
  rowGroup: {
    flexDirection: "column",
    gap: theme.gap(1),
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
  highlight: {
    color: theme.colors.highlight,
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
  playButton: {
    height: theme.gap(6),
    width: theme.gap(6),
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
}));
