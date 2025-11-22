import { ThemedText } from "@/components/themed-text";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Home() {
  return (
    <View style={styles.container}>
      <ThemedText type="h1">Home</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
  },
}));
