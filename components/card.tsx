import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ImageBackground, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface CardProps {
  data: any;
  onBook?: any;
  onPlay?: any;
  onPress?: any;
}

export const Card: React.FunctionComponent<CardProps> = ({
  data,
  onBook,
  onPlay,
  onPress,
}) => {
  return (
    <Pressable onPress={() => onPress(data)}>
      <ImageBackground
        source={{ uri: data.backgroundImage }}
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
              source={{ uri: data.instructor.imageUrl }}
              size="large"
              shape="circle"
              bordered={true}
            />
            <ThemedText type="h3">{data.instructor.name}</ThemedText>
            <View style={styles.chipContainer}>
              <Chip label={data.style} type="light" />
              <Chip label={data.level} type="light" />
            </View>
          </View>

          {/* Middle Container */}
          <View style={styles.middleContainer}>
            {/* Song Info */}
            <View style={styles.rowGroup}>
              <ThemedText type="h3">{data.songTitle}</ThemedText>
              <ThemedText dimmed>{data.artist}</ThemedText>
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
                  <ThemedText>{data.studio}</ThemedText>
                </View>
                <ThemedText>${data.price.toFixed(2)}</ThemedText>
              </View>
              <View style={styles.row}>
                <View style={styles.infoRow}>
                  <IconSymbol
                    name="timer.circle.fill"
                    size={16}
                    color="#FFFFFF"
                  />
                  <ThemedText>
                    {data.date}, {data.time}
                  </ThemedText>
                </View>
                <ThemedText style={styles.highlight}>
                  {data.spots - data.books} spots left
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Bottom Container */}
          <View style={styles.bottomContainer}>
            <View style={styles.bookButton}>
              <Button label="Book" onPress={() => onBook(data)} />
            </View>
            <Pressable style={styles.playButton} onPress={() => onPlay(data)}>
              <IconSymbol
                name="play"
                size={36}
                color="rgba(255, 255, 255, 0.6)"
              />
            </Pressable>
          </View>
        </LinearGradient>
      </ImageBackground>
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
