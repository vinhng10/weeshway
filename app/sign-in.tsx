import { Button, TextInput, ThemedText } from "@/components";
import { useAuth } from "@/hooks";
import { Link } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function SignIn() {
  const signIn = useAuth((state) => state.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    if (loading) return;

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signIn(email, password);
    } catch (error: any) {
      setError(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="h1" style={styles.title}>
          Sign In
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
          loading={loading}
        />

        <View style={styles.signup}>
          <ThemedText type="h5" color="dimmed">
            Don't have an account?
          </ThemedText>
          <Link href="/sign-up">
            <ThemedText type="h5" color="danger">
              Sign Up
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
  signup: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.gap(4),
    gap: theme.gap(1),
  },
}));
