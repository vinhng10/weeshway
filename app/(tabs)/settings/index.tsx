import { SettingTile } from "@/components/setting-tile";
import { ThemedText } from "@/components/themed-text";
import { router } from "expo-router";
import { ScrollView, View } from "react-native";
import {
  StyleSheet,
  UnistylesRuntime,
  withUnistyles,
} from "react-native-unistyles";

const StyledScrollView = withUnistyles(ScrollView);

export default function SettingsScreen() {
  const systemTheme = UnistylesRuntime.hasAdaptiveThemes;

  return (
    <StyledScrollView contentContainerStyle={styles.scrollView}>
      <ThemedText type="title">Appearance</ThemedText>
      <View style={styles.settingsContainer}>
        <SettingTile
          settingName="Theme"
          selectedValue="Light"
          description={systemTheme ? "System" : "User"}
          onPress={() => router.push("/(tabs)/settings/settings-theme")}
        />
        <SettingTile
          settingName="App accent"
          selectedValue="Default"
          description="Primary app color"
          onPress={() => router.push("/(tabs)/settings/settings-accent")}
        />
      </View>
    </StyledScrollView>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  scrollView: {
    marginTop: rt.insets.top + theme.gap(3),
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.gap(2),
  },
  settingsContainer: {
    marginTop: theme.gap(4),
    gap: theme.gap(4),
  },
}));
