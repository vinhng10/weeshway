import { Button } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { RETURN_URL } from "@/constants";
import { supabase } from "@/supabase";
import { useStripe } from "@stripe/stripe-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type PaymentIntentResponse = {
  paymentIntent: string;
  customerSessionClientSecret: string;
  customer: string;
  publishableKey?: string;
};

type CheckoutProps = {
  visible: boolean;
  onClose: () => void;
  amount: number;
  customerId?: string;
  teacherAccountId?: string;
  currency?: string;
  teacherName?: string;
  projectName?: string;
  applicationFeePercent?: number;
  onSuccess?: () => void;
};

export function Checkout({
  visible,
  onClose,
  amount,
  customerId,
  teacherAccountId,
  currency = "EUR",
  teacherName,
  projectName,
  applicationFeePercent = 0,
  onSuccess,
}: CheckoutProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isPreparing, setIsPreparing] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [sheetReady, setSheetReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const normalizedCurrency = currency.toUpperCase();
  const amountInCents = useMemo(
    () => Math.max(0, Math.round(amount * 100)),
    [amount]
  );
  const applicationFeeAmount = useMemo(() => {
    const percent = Math.max(0, applicationFeePercent);
    const fee = Math.round(amountInCents * percent);
    return Math.min(fee, amountInCents);
  }, [amountInCents, applicationFeePercent]);
  const formattedAmount = useMemo(() => {
    const value = Number.isFinite(amount) ? amount : 0;
    if (normalizedCurrency === "EUR") {
      return `€${value.toFixed(2)}`;
    }
    return `€${value.toFixed(2)}`;
  }, [amount, normalizedCurrency]);

  const resetState = useCallback(() => {
    setIsPreparing(false);
    setIsPresenting(false);
    setSheetReady(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, []);

  const initializePaymentSheet = useCallback(async () => {
    if (!visible) return;

    if (!customerId) {
      setErrorMessage(
        "We could not find a payment profile. Visit Wallet to link a card."
      );
      return;
    }

    if (!teacherAccountId) {
      setErrorMessage(
        "This instructor still needs to finish Stripe onboarding."
      );
      return;
    }

    if (amountInCents <= 0) {
      setErrorMessage("This class does not have a valid price yet.");
      return;
    }

    setIsPreparing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setSheetReady(false);

    try {
      const { data, error } =
        await supabase.functions.invoke<PaymentIntentResponse>("payment", {
          body: {
            customerId: customerId,
            accountId: teacherAccountId,
            amount: amountInCents,
            currency: normalizedCurrency.toLowerCase(),
            applicationFeeAmount,
          },
        });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.paymentIntent || !data.customerSessionClientSecret) {
        throw new Error(
          "Unable to start checkout. Missing Stripe client secrets."
        );
      }

      const initResult = await initPaymentSheet({
        merchantDisplayName: "DanceAI",
        paymentIntentClientSecret: data.paymentIntent,
        customerSessionClientSecret: data.customerSessionClientSecret,
        returnURL: RETURN_URL,
      });

      if (initResult.error) {
        throw new Error(initResult.error.message);
      }

      setSheetReady(true);
    } catch (err: any) {
      setErrorMessage(err.message ?? "Unable to prepare checkout.");
    } finally {
      setIsPreparing(false);
    }
  }, [
    applicationFeeAmount,
    amountInCents,
    customerId,
    initPaymentSheet,
    normalizedCurrency,
    teacherAccountId,
    visible,
  ]);

  useEffect(() => {
    if (visible) {
      initializePaymentSheet();
    } else {
      resetState();
    }
  }, [visible, initializePaymentSheet, resetState]);

  const handlePresentPaymentSheet = useCallback(async () => {
    if (!sheetReady || isPresenting) return;
    setIsPresenting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const { error } = await presentPaymentSheet();

    if (error) {
      setErrorMessage(error.message ?? "Payment canceled.");
      setIsPresenting(false);
      return;
    }

    setSuccessMessage("Payment completed!");
    setIsPresenting(false);
    onSuccess?.();
  }, [isPresenting, onSuccess, presentPaymentSheet, sheetReady]);

  const handleClose = useCallback(() => {
    onClose();
    resetState();
  }, [onClose, resetState]);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={styles.sheet}>
        <ThemedText type="h2">Checkout</ThemedText>
        <View style={styles.summary}>
          {projectName && <ThemedText type="h3">{projectName}</ThemedText>}
          {teacherName && (
            <ThemedText color="dimmed">with {teacherName}</ThemedText>
          )}
          <ThemedText type="h1">{formattedAmount}</ThemedText>
        </View>

        {isPreparing && (
          <View style={styles.feedbackRow}>
            <ActivityIndicator />
            <ThemedText>Connecting to Stripe…</ThemedText>
          </View>
        )}

        {errorMessage && (
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
        )}

        {successMessage && (
          <ThemedText style={styles.successText}>{successMessage}</ThemedText>
        )}

        <Button
          label={isPresenting ? "Processing…" : `Pay ${formattedAmount}`}
          onPress={handlePresentPaymentSheet}
          disabled={!sheetReady || isPresenting || !!successMessage}
          style={[
            styles.payButton,
            (!sheetReady || isPresenting || !!successMessage) &&
              styles.disabled,
          ]}
        />
        <Button
          label={successMessage ? "Done" : "Cancel"}
          onPress={handleClose}
          style={styles.cancelButton}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(3),
    borderTopLeftRadius: theme.gap(3),
    borderTopRightRadius: theme.gap(3),
    backgroundColor: theme.colors.background,
    gap: theme.gap(2),
  },
  summary: {
    gap: theme.gap(0.5),
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
  },
  errorText: {
    color: theme.colors.alert ?? "#FF5A5F",
  },
  successText: {
    color: "#2FBF71",
  },
  payButton: {
    opacity: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
}));
