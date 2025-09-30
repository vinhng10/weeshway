import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AudioStudio from "@/components/AudioStudio";
import React from "react";

export default function ProjectScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <AudioStudio />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
