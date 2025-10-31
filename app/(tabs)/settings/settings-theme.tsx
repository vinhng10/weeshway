import { SettingOptionRadio } from "@/components/setting-option-radio";
import { ThemeColor } from "@/components/theme-color";
import React from "react";
import { ScrollView, View } from "react-native";
import {
  StyleSheet,
  UnistylesRuntime,
  useUnistyles,
} from "react-native-unistyles";

export default function SettingsThemeScreen() {
  const { rt } = useUnistyles();
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SettingOptionRadio
        label="System"
        isSelected={rt.hasAdaptiveThemes}
        onPress={() => {
          if (rt.hasAdaptiveThemes) {
            return;
          }

          UnistylesRuntime.setAdaptiveThemes(true);
        }}
      />
      <SettingOptionRadio
        label="User"
        isSelected={!rt.hasAdaptiveThemes}
        onPress={() => {
          if (rt.hasAdaptiveThemes) {
            UnistylesRuntime.setAdaptiveThemes(false);
          }
        }}
      />
      {!rt.hasAdaptiveThemes && (
        <View style={styles.row}>
          <ThemeColor
            label="light"
            onPress={() => UnistylesRuntime.setTheme("light")}
          />
          <ThemeColor
            label="dark"
            onPress={() => UnistylesRuntime.setTheme("dark")}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    gap: theme.gap(2),
    marginTop: rt.insets.top,
    paddingHorizontal: theme.gap(2),
  },
  row: {
    justifyContent: "center",
    flexDirection: "row",
    gap: theme.gap(2),
  },
}));
