import { Button } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { RETURN_URL } from "@/constants";
import { supabase } from "@/supabase";
import { ProfileType, ProjectEnrichedType } from "@/types";
import { useStripe } from "@stripe/stripe-react-native";
import React, { useEffect, useState } from "react";
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
  customer: ProfileType | null;
  project: ProjectEnrichedType;
  currency?: string;
  applicationFeePercent?: number;
  onSuccess?: () => void;
};

export function Checkout({
  visible,
  onClose,
  customer,
  project,
  currency = "EUR",
  applicationFeePercent = 0,
  onSuccess,
}: CheckoutProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const stripeCustomerId = customer?.stripeAccountId;
  const stripeProviderId = project.profile.stripeAccountId;
  const amount = project.price ?? 0;
  const amountInCents = Math.max(0, Math.round(amount * 100));
  const percent = Math.max(0, applicationFeePercent);
  const applicationFeeAmount = Math.min(
    Math.round(amountInCents * percent),
    amountInCents
  );
  const formattedAmount = `€${amount.toFixed(2)}`;

  const fetchPaymentSheetParams = async () => {
    if (!stripeCustomerId) {
      throw new Error("Customer not found.");
    }

    if (!stripeProviderId) {
      throw new Error("Provider not found.");
    }

    if (amountInCents <= 0) {
      throw new Error("This class does not have a valid price yet.");
    }

    const { data, error } =
      await supabase.functions.invoke<PaymentIntentResponse>("payment", {
        body: {
          customer: {
            id: customer?.id,
            stripeAccountId: stripeCustomerId,
          },
          project: {
            id: project.id,
            stripeAccountId: stripeProviderId,
          },
          amount: amountInCents,
          currency: currency.toLowerCase(),
          applicationFeeAmount,
        },
      });

    if (error) {
      console.error("===> error", error.message);
      throw new Error(error.message);
    }

    if (!data?.paymentIntent || !data.customerSessionClientSecret) {
      throw new Error(
        "Unable to start checkout. Missing Stripe client secrets."
      );
    }

    return {
      paymentIntent: data.paymentIntent,
      customerSessionClientSecret: data.customerSessionClientSecret,
      customer: data.customer,
    };
  };

  const initializePaymentSheet = async () => {
    if (!visible) return;

    setLoading(true);
    setStatusMessage(null);

    try {
      const { paymentIntent, customerSessionClientSecret } =
        await fetchPaymentSheetParams();

      const { error } = await initPaymentSheet({
        merchantDisplayName: "DanceAI",
        paymentIntentClientSecret: paymentIntent,
        customerSessionClientSecret: customerSessionClientSecret,
        returnURL: RETURN_URL,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        message: err.message ?? "Unable to prepare checkout.",
      });
    } finally {
      setLoading(false);
    }
  };

  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();

    if (error) {
      setStatusMessage({
        type: "error",
        message: error.message ?? "Payment canceled.",
      });
    } else {
      setStatusMessage({
        type: "success",
        message: "Payment completed!",
      });
      onSuccess?.();
    }
  };

  const handleClose = () => {
    onClose();
    setLoading(false);
    setStatusMessage(null);
  };

  useEffect(() => {
    if (visible) {
      initializePaymentSheet();
    } else {
      setLoading(false);
      setStatusMessage(null);
    }
  }, [visible]);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <Pressable style={styles.container} onPress={handleClose} />
      <View style={styles.sheet}>
        <ThemedText type="h2">Checkout</ThemedText>
        <View style={styles.summary}>
          {project.name && <ThemedText type="h3">{project.name}</ThemedText>}
          {project.profile.fullName && (
            <ThemedText color="dimmed">
              with {project.profile.fullName}
            </ThemedText>
          )}
          <ThemedText type="h1">{formattedAmount}</ThemedText>
        </View>

        {loading && (
          <View style={styles.feedbackRow}>
            <ActivityIndicator />
            <ThemedText>Connecting to Stripe…</ThemedText>
          </View>
        )}

        {statusMessage && (
          <ThemedText
            color={statusMessage.type === "error" ? "danger" : "primary"}
          >
            {statusMessage.message}
          </ThemedText>
        )}

        <Button
          label={`Pay ${formattedAmount}`}
          onPress={openPaymentSheet}
          disabled={loading || !!statusMessage}
          style={[(loading || !!statusMessage) && styles.disabled]}
        />
        <Button
          label={statusMessage?.type === "success" ? "Done" : "Cancel"}
          onPress={handleClose}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
    opacity: 0.95,
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.gap(2),
    borderTopLeftRadius: theme.gap(2),
    borderTopRightRadius: theme.gap(2),
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
  disabled: {
    opacity: 0.5,
  },
}));
