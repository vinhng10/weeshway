import AudioStudio from "@/components/AudioStudio";
import React from "react";
import { StyleSheet, View } from "react-native";

export default function ProjectScreen() {
  return (
    <View style={styles.container}>
      <AudioStudio />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
});
