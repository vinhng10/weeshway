import { Button, TextInput, ThemedText } from "@/components";
import { useAuth } from "@/hooks";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Image, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { StyleSheet } from "react-native-unistyles";

export default function CreateAccountScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const signUp = useAuth((state) => state.signUp);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");

    try {
      await signUp(email, password);
      router.replace("/sign-in");
    } catch (error: any) {
      setError(
        error.message || "Couldn't create your account. Please try again."
      );
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.branding}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
          />
          <ThemedText type="h1">WeeshWay</ThemedText>
        </View>

        {error ? (
          <ThemedText type="h5" color="danger" style={styles.error}>
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
      </KeyboardAwareScrollView>
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
  },
  branding: {
    alignItems: "center",
    gap: theme.gap(1),
    paddingVertical: theme.gap(4),
  },
  logo: {
    width: theme.gap(10),
    height: theme.gap(10),
    borderRadius: theme.gap(2),
  },
  input: {
    marginBottom: theme.gap(2),
  },
  button: {
    marginTop: theme.gap(2),
  },
  error: {
    textAlign: "center",
  },
  signin: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.gap(4),
    gap: theme.gap(1),
  },
}));
