import { Branding, Pressable, ThemedText } from "@/components";
import { ROLE } from "@/constants";
import { useOnboarding, useRole } from "@/hooks";
import { RoleType } from "@/types";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function OnboardingScreen() {
  const setRole = useRole((state) => state.setRole);
  const setPrompted = useOnboarding((state) => state.setPrompted);

  const handleSelectRole = (role: RoleType) => {
    setRole(role);
    setPrompted("role", true);
  };

  return (
    <View style={styles.container}>
      <Branding />

      <ThemedText type="h3" style={styles.prompt}>
        I am a...
      </ThemedText>

      <View style={styles.buttons}>
        <Pressable
          style={styles.roleButton}
          onPress={() => handleSelectRole(ROLE.STUDENT)}
        >
          <ThemedText type="h2" color="contrast">
            Student
          </ThemedText>
          <ThemedText type="h5" color="contrast">
            Browse and book dance classes
          </ThemedText>
        </Pressable>

        <Pressable
          style={styles.roleButton}
          onPress={() => handleSelectRole(ROLE.TEACHER)}
        >
          <ThemedText type="h2" color="contrast">
            Teacher
          </ThemedText>
          <ThemedText type="h5" color="contrast">
            Create and teach dance classes
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    padding: theme.gap(2),
  },
  prompt: {
    textAlign: "center",
    marginBottom: theme.gap(3),
  },
  buttons: {
    gap: theme.gap(2),
  },
  roleButton: {
    padding: theme.gap(1.5),
    borderRadius: theme.gap(2),
    backgroundColor: theme.colors.contrast,
    alignItems: "center",
    gap: theme.gap(0.5),
  },
}));
