import { RETURN_URL } from "@/constants";
import { useLocales } from "@/hooks";
import { supabase } from "@/supabase";
import { ProfileType, ProjectEnrichedType } from "@/types";
import { PaymentMethodLayout, useStripe } from "@stripe/stripe-react-native";
import React, { useEffect, useState } from "react";
import { Modal, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Header } from "../header";
import { ThemedText } from "../themed-text";
import { IconSymbol } from "../ui/icon-symbol";
import { Button } from "./button";
import { IconButton } from "./icon-button";

type PaymentIntentResponse = {
  customerId: string;
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
  const [spots, setSpots] = useState(1);

  const currency = project.currency;
  const amount = project.price ?? 0;
  const spotAmount = amount * spots;
  const feeAmount = 50 * spots;
  const totalAmount = spotAmount + feeAmount;

  const fetchPaymentSheetParams = async () => {
    if (amount <= 0) {
      throw new Error("Error occurred. Please try again.");
    }

    const { data, error } =
      await supabase.functions.invoke<PaymentIntentResponse>("payment", {
        body: { projectId: project.id, spots },
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
      const {
        customerId,
        paymentIntentClientSecret,
        customerSessionClientSecret,
        autoConfirmed,
        status,
      } = await fetchPaymentSheetParams();

      // Handle auto-confirmed payment with saved payment method
      if (autoConfirmed && status === "succeeded") {
        setStatus("success");
        setStatusMessage("Payment completed!");
        return;
      }

      // Initialize payment sheet if needed
      if (!isInitialized) {
        const { error } = await initPaymentSheet({
          merchantDisplayName: "DanceAI",
          customerId,
          paymentIntentClientSecret,
          customerSessionClientSecret,
          returnURL: RETURN_URL,
          paymentMethodOrder: ["card"],
          paymentMethodLayout: PaymentMethodLayout.Horizontal,
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
    setSpots(1);
  }, [visible, project.id, customer?.id]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={onExit}
    >
      <View style={styles.container}>
        <Header title="Checkout" onPress={onExit} />

        <View style={styles.content}>
          {/* Class Info */}
          <View style={styles.classInfo}>
            {project.name ? (
              <ThemedText type="h2">{project.name}</ThemedText>
            ) : (
              <>
                <ThemedText type="h2">{project.song.name}</ThemedText>
                {project.song.artistName && (
                  <ThemedText color="dimmed" type="h4">
                    {project.song.artistName}
                  </ThemedText>
                )}
              </>
            )}
            {project.profile.fullName && (
              <ThemedText color="dimmed" type="h4">
                with {project.profile.fullName}
              </ThemedText>
            )}
          </View>

          {/* Price and Quantity Row */}
          <View style={[styles.row, styles.priceQuantityRow]}>
            <View style={[styles.row, styles.spotsLabel]}>
              <IconSymbol name="person.fill" size={20} color="#FFFFFF" />
              <ThemedText type="h3">Spots</ThemedText>
            </View>
            <View style={[styles.row, styles.quantitySelector]}>
              <IconButton
                icon="minus"
                onPress={
                  spots <= 1 || loading
                    ? undefined
                    : () => setSpots(Math.max(1, spots - 1))
                }
                iconSize={20}
                type="transparent"
                style={
                  spots <= 1 || loading ? styles.disabledButton : undefined
                }
              />
              <ThemedText type="h3">{spots}</ThemedText>
              <IconButton
                icon="plus"
                onPress={loading ? undefined : () => setSpots(spots + 1)}
                iconSize={20}
                type="transparent"
                style={[loading ? styles.disabledButton : undefined]}
              />
            </View>
          </View>

          {/* Price Breakdown */}
          <View style={styles.priceBreakdown}>
            <View style={[styles.row, styles.priceRow]}>
              <ThemedText type="h3">Price</ThemedText>
              <ThemedText type="h3">
                {formatMoney(spotAmount, currency)}
              </ThemedText>
            </View>
            <View style={[styles.row, styles.priceRow]}>
              <ThemedText type="h3" color="dimmed">
                Fee
              </ThemedText>
              <ThemedText type="h3" color="dimmed">
                {formatMoney(feeAmount, currency)}
              </ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <ThemedText type="h1">
                {formatMoney(totalAmount, currency)}
              </ThemedText>
            </View>
          </View>

          {/* Status Messages */}
          <View style={styles.statusContainer}>
            {status === "error" && (
              <ThemedText type="h5" color="danger">
                {statusMessage}
              </ThemedText>
            )}
            {status === "success" && (
              <ThemedText type="h5" color="primary">
                {statusMessage}
              </ThemedText>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            label={status === "success" ? "See you in class!" : "Pay"}
            onPress={handlePay}
            loading={loading}
            disabled={status === "success"}
          />
          <Button outlined label="Cancel" onPress={onExit} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.gap(2),
    gap: theme.gap(3),
  },
  classInfo: {
    gap: theme.gap(0.5),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceQuantityRow: {
    justifyContent: "space-between",
  },
  spotsLabel: {
    gap: theme.gap(1),
  },
  quantitySelector: {
    backgroundColor: theme.colors.foreground,
    borderRadius: theme.gap(2),
    gap: theme.gap(1),
  },
  disabledButton: {
    opacity: 0.5,
  },
  priceBreakdown: {
    gap: theme.gap(1.5),
    marginTop: theme.gap(2),
  },
  priceRow: {
    justifyContent: "space-between",
  },
  divider: {
    height: theme.gap(0.25),
    backgroundColor: theme.colors.foreground,
    marginVertical: theme.gap(1),
  },
  totalRow: {
    alignItems: "flex-end",
    marginTop: theme.gap(1),
  },
  statusContainer: {
    alignItems: "center",
    marginTop: theme.gap(1),
  },
  buttonContainer: {
    padding: theme.gap(2),
    gap: theme.gap(2),
    paddingBottom: rt.insets.bottom + theme.gap(2),
  },
}));
