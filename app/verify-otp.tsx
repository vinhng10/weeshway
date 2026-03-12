import { Branding, Button, TextInput, ThemedText } from "@/components";
import { useAuth } from "@/hooks";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { StyleSheet } from "react-native-unistyles";

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const verifyOtp = useAuth((state) => state.verifyOtp);
  const resendOtp = useAuth((state) => state.resendOtp);

  const handleVerify = async () => {
    const trimmed = token.trim();
    if (!trimmed) {
      setError("Please enter the verification code.");
      return;
    }

    setError("");

    try {
      await verifyOtp(email, trimmed);
    } catch (e: any) {
      setError(e.message || "Invalid code. Please try again.");
    }
  };

  const handleResend = async () => {
    setError("");
    setResent(false);

    try {
      await resendOtp(email);
      setResent(true);
    } catch (e: any) {
      setError(e.message || "Couldn't resend code. Please try again.");
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

        <ThemedText type="h5" color="dimmed" style={styles.subtitle}>
          Enter the 6-digit code sent to {email}
        </ThemedText>

        {error ? (
          <ThemedText type="h5" color="danger" style={styles.centered}>
            {error}
          </ThemedText>
        ) : null}

        {resent ? (
          <ThemedText type="h5" color="dimmed" style={styles.centered}>
            Code resent! Check your inbox.
          </ThemedText>
        ) : null}

        <TextInput
          type="h5"
          placeholder="Verification Code"
          value={token}
          onChangeText={setToken}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          autoCorrect={false}
          maxLength={6}
        />

        <Button
          label="Verify Email"
          onPress={handleVerify}
          style={styles.button}
        />

        <Button
          label="Resend Code"
          onPress={handleResend}
          outlined
        />
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
  subtitle: {
    textAlign: "center",
  },
  centered: {
    textAlign: "center",
  },
  button: {
    marginTop: theme.gap(2),
  },
}));
