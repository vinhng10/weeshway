import { Branding, ThemedText } from "@/components";
import { ROLE } from "@/constants";
import { useOnboarding, useRole } from "@/hooks";
import { RoleType } from "@/types";
import { Pressable, View } from "react-native";
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
          <ThemedText type="h2" color="dark">
            Student
          </ThemedText>
          <ThemedText type="h5" color="dark">
            Browse and book dance classes
          </ThemedText>
        </Pressable>

        <Pressable
          style={styles.roleButton}
          onPress={() => handleSelectRole(ROLE.TEACHER)}
        >
          <ThemedText type="h2" color="dark">
            Teacher
          </ThemedText>
          <ThemedText type="h5" color="dark">
            Create classes and teach students
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
    backgroundColor: theme.colors.typography,
    alignItems: "center",
    gap: theme.gap(0.5),
  },
}));
