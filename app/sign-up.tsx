import { Branding, Button, TextInput, ThemedText } from "@/components";
import { WEBSITE_URL } from "@/constants";
import { useAuth } from "@/hooks";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Linking, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { StyleSheet } from "react-native-unistyles";

export default function CreateAccountScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const signUp = useAuth((state) => state.signUp);

  const handleSignUp = async () => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (
      !trimmedName ||
      !trimmedEmail ||
      !trimmedPassword ||
      !trimmedConfirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    if (trimmedPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");

    try {
      await signUp(trimmedEmail, trimmedPassword, trimmedName);
      router.replace({
        pathname: "/verify-otp",
        params: { email: trimmedEmail },
      });
    } catch (error: any) {
      setError("Couldn't create your account. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Branding />

        <ThemedText type="h5" color="danger" style={styles.error}>
          {error}
        </ThemedText>

        <TextInput
          type="h5"
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
          autoComplete="name"
          autoCorrect={false}
        />

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

        <View style={styles.consent}>
          <ThemedText type="h5" color="dimmed">
            By continuing, you agree to our
          </ThemedText>
          <ThemedText type="h5" color="dimmed">
            <ThemedText
              type="h5"
              onPress={() => Linking.openURL(`${WEBSITE_URL}/terms`)}
            >
              Terms
            </ThemedText>{" "}
            and{" "}
            <ThemedText
              type="h5"
              onPress={() => Linking.openURL(`${WEBSITE_URL}/privacy`)}
            >
              Privacy
            </ThemedText>
            .
          </ThemedText>
        </View>

        <View style={styles.signin}>
          <ThemedText type="h5" color="dimmed">
            Already have an account?
          </ThemedText>
          <Link allowFontScaling={false} href="/sign-in">
            <ThemedText type="h5" color="danger">
              Sign In
            </ThemedText>
          </Link>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
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
  button: {
    marginTop: theme.gap(2),
  },
  consent: {
    alignItems: "center",
    gap: theme.gap(0.5),
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
