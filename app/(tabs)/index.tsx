import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AudioPlayer from "@/components/AudioPlayer";
import { ThemedView } from "@/components/ThemedView";
import React from "react";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        <AudioPlayer />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
