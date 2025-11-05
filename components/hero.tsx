import { Header } from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ImageBackground,
  ImageSourcePropType,
  Pressable,
  View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface HeroProps {
  source: ImageSourcePropType;
  title: string;
  subtitle: string;
  onShare?: () => void;
  onPlay?: () => void;
}

export const Hero: React.FunctionComponent<HeroProps> = ({
  source,
  title,
  subtitle,
  onShare,
  onPlay,
}) => {
  return (
    <ImageBackground source={source} style={styles.background}>
      <LinearGradient
        style={styles.overlay}
        colors={["rgba(0, 0, 0, 0.3)", "#0C0C0C"]}
        start={{ x: 0, y: 0.3 }}
        end={{ x: 0, y: 1 }}
      >
        <Header />
        <View style={styles.contentContainer}>
          <View style={styles.songInfo}>
            <ThemedText type="h1">{title}</ThemedText>
            <ThemedText dimmed type="h3">
              {subtitle}
            </ThemedText>
          </View>
          <View style={styles.buttonContainer}>
            <Pressable style={styles.button} onPress={onShare}>
              <IconSymbol
                name="square.and.arrow.up"
                size={24}
                color="rgba(255, 255, 255, 0.6)"
              />
            </Pressable>
            <Pressable style={styles.button} onPress={onPlay}>
              <IconSymbol
                name="play"
                size={36}
                color="rgba(255, 255, 255, 0.6)"
              />
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

const styles = StyleSheet.create((theme) => ({
  background: {
    height: theme.gap(32),
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  contentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(1),
  },
  songInfo: {
    width: "70%",
    gap: theme.gap(0.5),
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
  },
  button: {
    width: theme.gap(6),
    height: theme.gap(6),
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
}));
