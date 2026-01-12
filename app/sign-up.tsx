import { Button, TextInput, ThemedText } from "@/components";
import { useAuth } from "@/hooks";
import { Link, router } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function CreateAccountScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const signUp = useAuth((state) => state.signUp);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters");
      return;
    }

    setError("");

    try {
      await signUp(email, password);
      router.replace("/sign-in");
    } catch (error: any) {
      setError(error.message || "Failed to create account");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="h1" style={styles.title}>
          Sign Up
        </ThemedText>

        {error ? (
          <ThemedText color="danger" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}

        <TextInput
          type="h5"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          autoCorrect={false}
        />

        <TextInput
          type="h5"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password-new"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          type="h5"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="password-new"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Button
          label={"Create Account"}
          onPress={handleSignUp}
          style={[styles.button]}
        />

        <View style={styles.signin}>
          <ThemedText type="h5" color="dimmed">
            Already have an account?
          </ThemedText>
          <Link href="/sign-in">
            <ThemedText type="h5" color="danger">
              Sign In
            </ThemedText>
          </Link>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: theme.gap(2),
    gap: theme.gap(2),
  },
  title: {
    textAlign: "center",
    padding: theme.gap(4),
  },
  input: {
    marginBottom: theme.gap(2),
  },
  button: {
    marginTop: theme.gap(2),
  },
  error: {
    textAlign: "center",
    marginBottom: theme.gap(2),
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    padding: theme.gap(2),
    borderRadius: theme.gap(2),
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.2)",
  },
  signin: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.gap(4),
    gap: theme.gap(1),
  },
}));
