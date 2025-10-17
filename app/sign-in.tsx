import { Link } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "./ctx";

export default function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signIn(email, password);
    } catch (error) {
      setError(error as string);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Sign In</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#b5b5b5"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#b5b5b5"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#000000" size="small" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.linkContainer}>
          <Text style={styles.linkText}>Don't have an account? </Text>
          <Link href="../sign-up" style={styles.link}>
            <Text style={styles.linkTextBold}>Sign Up</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1b1b1b",
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  button: {
    backgroundColor: "#FFD700",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "rgba(255, 215, 0, 0.5)",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.2)",
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  linkText: {
    fontSize: 16,
    color: "#b5b5b5",
  },
  link: {
    fontSize: 16,
  },
  linkTextBold: {
    color: "#FFD700",
    fontWeight: "bold",
  },
});
