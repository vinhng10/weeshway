import { Branding, Button, TextInput, ThemedText } from "@/components";
import { useAuth } from "@/hooks";
import { Link, router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { StyleSheet } from "react-native-unistyles";

export default function SignIn() {
  const signIn = useAuth((state) => state.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setError("");

    try {
      await signIn(email, password);
    } catch (error: any) {
      if (error.message === "Email not confirmed") {
        router.replace({ pathname: "/verify-otp", params: { email } });
        return;
      }
      setError("Couldn't sign in. Please try again.");
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
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          type="h5"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Button
          label={"Sign In"}
          onPress={handleSignIn}
          style={[styles.button]}
        />

        <View style={styles.signup}>
          <ThemedText type="h5" color="dimmed">
            Don't have an account?
          </ThemedText>
          <Link allowFontScaling={false} href="/sign-up">
            <ThemedText type="h5" color="danger">
              Sign Up
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
  error: {
    textAlign: "center",
  },
  signup: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.gap(4),
    gap: theme.gap(1),
  },
}));
