import { RETURN_URL } from "@/constants";
import { useLocales } from "@/hooks";
import { supabase } from "@/supabase";
import { ProfileType, ProjectEnrichedType } from "@/types";
import { useStripe } from "@stripe/stripe-react-native";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ThemedText } from "../themed-text";
import { Button } from "./button";

type PaymentIntentResponse = {
  paymentIntentClientSecret: string;
  customerSessionClientSecret: string;
  autoConfirmed?: boolean;
  status?: string;
};

type CheckoutProps = {
  visible: boolean;
  onExit: () => void;
  customer: ProfileType | null;
  project: ProjectEnrichedType;
};

export function Checkout({
  visible,
  onExit,
  customer,
  project,
}: CheckoutProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const formatMoney = useLocales((state) => state.formatMoney);

  // States to manage separate stages
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");

  const stripeCustomerId = customer?.stripeAccountId;
  const stripeProviderId = project.profile.stripeAccountId;
  const currency = project.currency;
  const amount = project.price ?? 0;
  const totalAmount = amount + 50;

  const fetchPaymentSheetParams = async () => {
    if (!stripeCustomerId || !stripeProviderId || amount <= 0) {
      throw new Error("Error occurred. Please try again.");
    }

    const { data, error } =
      await supabase.functions.invoke<PaymentIntentResponse>("payment", {
        body: {
          customer: {
            id: customer.id,
            stripeAccountId: stripeCustomerId,
          },
          project: {
            id: project.id,
            stripeAccountId: stripeProviderId,
          },
          amount: totalAmount,
          currency: currency,
        },
      });

    if (
      error ||
      !data?.paymentIntentClientSecret ||
      !data.customerSessionClientSecret
    ) {
      throw new Error("Error occurred. Please try again.");
    }

    return data;
  };

  const handlePay = async () => {
    if (loading) return;

    setStatus("idle");
    setStatusMessage("");
    setLoading(true);

    try {
      const paymentData = await fetchPaymentSheetParams();

      // Handle auto-confirmed payment with saved payment method
      if (paymentData.autoConfirmed && paymentData.status === "succeeded") {
        setStatus("success");
        setStatusMessage("Payment completed!");
        return;
      }

      // Initialize payment sheet if needed
      if (!isInitialized) {
        const { error } = await initPaymentSheet({
          merchantDisplayName: "DanceAI",
          paymentIntentClientSecret: paymentData.paymentIntentClientSecret,
          customerSessionClientSecret: paymentData.customerSessionClientSecret,
          returnURL: RETURN_URL,
          appearance: {
            colors: {
              primary: "#6B9C00",
            },
          },
          paymentMethodOrder: ["card"],
        });

        if (error) throw new Error(error.message);
        setIsInitialized(true);
      }

      // Present payment sheet for user interaction
      const { error } = await presentPaymentSheet();

      if (error) {
        setStatus("error");
        setStatusMessage(
          `Payment ${error.code.toLowerCase()}. Please try again.`
        );
        return;
      }

      setStatus("success");
      setStatusMessage("Payment completed!");
    } catch (err: any) {
      setStatus("error");
      setStatusMessage(err?.message ?? "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset when modal closes or when project/customer changes
    setLoading(false);
    setIsInitialized(false);
    setStatus("idle");
    setStatusMessage("");
  }, [visible, project.id, customer?.id]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={onExit}
    >
      <Pressable style={styles.container} onPress={onExit} />
      <View style={styles.sheet}>
        <ThemedText type="h2">Checkout</ThemedText>
        <View style={styles.summary}>
          {(project.name || project.song.name) && (
            <ThemedText type="h3">
              {project.name || project.song.name}
            </ThemedText>
          )}
          {project.profile.fullName && (
            <ThemedText color="dimmed">
              with {project.profile.fullName}
            </ThemedText>
          )}
        </View>

        <View style={styles.amountRow}>
          <ThemedText type="h1">{formatMoney(amount, currency)}</ThemedText>
          <ThemedText color="dimmed">
            + {formatMoney(50, currency)} fee
          </ThemedText>
        </View>

        {status === "error" && (
          <ThemedText color="danger">{statusMessage}</ThemedText>
        )}
        {status === "success" && (
          <ThemedText color="primary">{statusMessage}</ThemedText>
        )}

        <Button
          label={
            status === "success"
              ? "See you in class!"
              : `Pay ${formatMoney(totalAmount, currency)}`
          }
          onPress={handlePay}
          loading={loading}
          disabled={status === "success"}
        />
        <Button outlined label={"Cancel"} onPress={onExit} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
    opacity: 0.8,
  },
  sheet: {
    padding: theme.gap(2),
    borderTopLeftRadius: theme.gap(2),
    borderTopRightRadius: theme.gap(2),
    gap: theme.gap(2),
    backgroundColor: theme.colors.foreground,
  },
  summary: {
    gap: theme.gap(0.5),
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: theme.gap(1),
  },
}));
