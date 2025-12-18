import { Button } from "@/components/button";
import { IconButton } from "@/components/icon-button";
import { ThemedText } from "@/components/themed-text";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface DisplayAreaProps {
  recognizing: boolean;
  transcript: string;
  onOpenCamera?: any;
}

export const DisplayArea: React.FunctionComponent<DisplayAreaProps> = ({
  recognizing,
  transcript,
  onOpenCamera,
}) => {
  return (
    <View style={styles.container}>
      <IconButton icon="camera.fill" iconSize={36} style={styles.icon} />

      <Button
        label="Open Camera"
        style={styles.button}
        onPress={onOpenCamera}
      />

      {recognizing && (
        <View style={styles.transcriptContainer}>
          <ThemedText type="h5">{transcript || "Listening..."}</ThemedText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    gap: theme.gap(2),
  },
  icon: {
    width: theme.gap(10),
    height: theme.gap(10),
  },
  button: {
    backgroundColor: theme.colors.primary,
  },
  transcriptContainer: {
    position: "absolute",
    bottom: theme.gap(2.5),
    alignSelf: "center",
    padding: theme.gap(2),
    borderRadius: theme.gap(2),
    backgroundColor: theme.colors.foreground,
    maxWidth: "90%",
  },
}));
