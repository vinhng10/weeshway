import { Button } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export default function SettingsAccentScreen() {
  const { theme } = useUnistyles();
  const allAccents = theme.colors.accents;
  const [selectedAccent, setSelectedAccent] = useState("banana");

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.row}>
          {Object.entries(allAccents).map(([accentName, accentColor]) => (
            <Pressable
              key={accentName}
              style={styles.item}
              onPress={() => {
                setSelectedAccent(accentName as keyof typeof allAccents);
              }}
            >
              <View
                style={styles.box(accentColor, accentName === selectedAccent)}
              />
              <ThemedText bold>{accentName}</ThemedText>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <Button
          label="Save"
          accent={selectedAccent}
          onPress={() => {
            router.back();
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    gap: theme.gap(2),
    paddingTop: theme.gap(2),
    paddingHorizontal: theme.gap(2),
  },
  box: (accentColor: string, isSelected: boolean) => ({
    height: 40,
    width: 40,
    backgroundColor: accentColor,
    borderRadius: 10,
    borderWidth: isSelected ? 2 : 0,
    borderColor: theme.colors.tint,
  }),
  row: {
    flexWrap: "wrap",
    flexDirection: "row",
    gap: theme.gap(2),
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(2),
    paddingVertical: theme.gap(2),
    width: "100%",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.dimmed,
  },
  buttonContainer: {
    marginBottom: rt.insets.bottom,
    paddingHorizontal: theme.gap(2),
  },
}));
