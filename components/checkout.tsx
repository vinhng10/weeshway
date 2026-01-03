import { Button } from "@/components/input/button";
import { ThemedText } from "@/components/themed-text";
import { RETURN_URL } from "@/constants";
import { useLocales } from "@/hooks/useLocales";
import { supabase } from "@/supabase";
import { ProfileType, ProjectEnrichedType } from "@/types";
import { useStripe } from "@stripe/stripe-react-native";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type PaymentIntentResponse = {
  paymentIntentClientSecret: string;
  customerSessionClientSecret: string;
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const initializePaymentSheet = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const { paymentIntentClientSecret, customerSessionClientSecret } =
        await fetchPaymentSheetParams();

      const { error } = await initPaymentSheet({
        merchantDisplayName: "DanceAI",
        paymentIntentClientSecret: paymentIntentClientSecret,
        customerSessionClientSecret: customerSessionClientSecret,
        returnURL: RETURN_URL,
      });

      if (error) {
        throw new Error(error.message);
      }

      setIsInitialized(true);
      return true;
    } catch (err: any) {
      setErrorMessage("Error occurred. Please try again.");
      setIsInitialized(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (loading) return;

    if (!isInitialized) {
      const ok = await initializePaymentSheet();
      if (!ok) return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const { error } = await presentPaymentSheet();

      if (error) {
        setErrorMessage(
          `Payment ${error.code.toLowerCase()}. Please try again.`
        );
        return;
      }

      setErrorMessage(null);
      setSuccessMessage("Payment completed!");
    } catch (err: any) {
      setErrorMessage(err?.message ?? "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset when modal closes or when project/customer changes
    setLoading(false);
    setIsInitialized(false);
    setErrorMessage(null);
    setSuccessMessage(null);
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

        {errorMessage && <ThemedText color="danger">{errorMessage}</ThemedText>}
        {successMessage && (
          <ThemedText color="primary">{successMessage}</ThemedText>
        )}

        <Button
          label={`Pay ${formatMoney(totalAmount, currency)}`}
          onPress={handlePay}
          loading={loading}
          disabled={successMessage !== null}
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
