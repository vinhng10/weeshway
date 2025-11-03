import { Avatar } from "@/components/avatar";
import { LinearGradient, LinearGradientProps } from "expo-linear-gradient";
import React, { ReactNode } from "react";
import { ImageSourcePropType, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ThemedText } from "./themed-text";

interface TileProps {
  imageSource: ImageSourcePropType;
  title: string;
  subtitle?: string;
  metadata?: string;
  backgroundColor?: "available" | "granted";
  rightContent?: ReactNode;
  onPress(): void;
}

export const Tile: React.FunctionComponent<TileProps> = ({
  imageSource,
  title,
  subtitle,
  metadata,
  backgroundColor,
  rightContent,
  onPress,
}) => {
  const getBackgroundColor = (): LinearGradientProps["colors"] => {
    switch (backgroundColor) {
      case "available":
        return ["#FF5154", "#D7137B"];
      case "granted":
        return ["#558200", "#135700"];
      default:
        return ["#1B1B1B", "#1B1B1B"];
    }
  };

  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        style={styles.container}
        colors={getBackgroundColor()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.leftContainer}>
          <Avatar source={imageSource} size="large" shape="square" />
          <View style={styles.textContainer}>
            <ThemedText bold type="h5" numberOfLines={1} ellipsizeMode="tail">
              {title}
            </ThemedText>
            {subtitle && (
              <ThemedText dimmed numberOfLines={1} ellipsizeMode="tail">
                {subtitle}
              </ThemedText>
            )}
            {metadata && (
              <ThemedText numberOfLines={1} ellipsizeMode="tail">
                {metadata}
              </ThemedText>
            )}
          </View>
        </View>

        <View style={styles.rightContainer}>
          {rightContent ? rightContent : <></>}
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.gap(1),
    borderRadius: theme.gap(2),
  },
  leftContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: theme.gap(1),
    width: "70%",
  },
  rightContainer: {
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    height: theme.gap(8),
    gap: theme.gap(0.5),
  },
  textContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: theme.gap(0.5),
    minWidth: 0,
  },
}));
