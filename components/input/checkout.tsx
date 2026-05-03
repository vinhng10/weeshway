import { MERCHANT_COUNTRY_CODE } from "@/constants";
import { useFeatureFlags, useLocales } from "@/hooks";
import { supabase } from "@/supabase";
import { ProfileType, ProjectEnrichedType } from "@/types";
import { PaymentMethodLayout, useStripe } from "@stripe/stripe-react-native";
import { FunctionsHttpError } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Header } from "../header";
import { Modal } from "../modal";
import { ThemedText } from "../themed-text";
import { Button } from "./button";
import { ButtonGroup } from "./button-group";
import { SpotsSelector } from "./spots-selector";

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
  const { theme } = useUnistyles();
  const stripeEnabled = useFeatureFlags((s) => s.isEnabled("stripe"));
  const formatMoney = useLocales((state) => state.formatMoney);
  const bookingFee = useLocales((state) => state.bookingFee);
  const exchange = useLocales((state) => state.exchange);

  // States to manage separate stages
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [spots, setSpots] = useState(1);

  const currency = project.currency;
  const amount = project.price ?? 0;
  const price = amount * spots;
  const fee = exchange(bookingFee, "USD", currency) * spots;
  const total = price + fee;

  const fetchPaymentSheetParams = async () => {
    if (amount <= 0) {
      throw new Error("Error occurred. Please try again.");
    }

    const { data, error } =
      await supabase.functions.invoke<PaymentIntentResponse>("payment", {
        body: { projectId: project.id, spots },
      });

    if (error) {
      if (error instanceof FunctionsHttpError) {
        const errorMessage = await error.context.json();
        throw new Error(errorMessage.error);
      } else {
        throw new Error("Error occurred. Please try again.");
      }
    }

    if (!data?.paymentIntentClientSecret || !data.customerSessionClientSecret) {
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
          merchantDisplayName: "WeeshWay",
          customerId,
          paymentIntentClientSecret,
          customerSessionClientSecret,
          paymentMethodOrder: ["card"],
          paymentMethodLayout: PaymentMethodLayout.Horizontal,
          applePay: {
            merchantCountryCode: MERCHANT_COUNTRY_CODE,
          },
          googlePay: {
            merchantCountryCode: MERCHANT_COUNTRY_CODE,
          },
          appearance: {
            colors: {
              primary: theme.colors.primary,
              background: theme.colors.background,
              componentBackground: theme.colors.foreground,
              componentBorder: theme.colors.dimmed,
              componentDivider: theme.colors.dimmed,
              primaryText: theme.colors.typography,
              secondaryText: theme.colors.dimmed,
              componentText: theme.colors.typography,
              placeholderText: theme.colors.dimmed,
              icon: theme.colors.dimmed,
              error: theme.colors.danger,
            },
            shapes: {
              borderRadius: theme.gap(2),
            },
            primaryButton: {
              colors: {
                background: theme.colors.contrast,
                text: theme.colors.typographyContrast,
              },
              shapes: {
                borderRadius: theme.gap(2),
              },
            },
          },
        });

        if (error) throw new Error(error.message);
        setIsInitialized(true);
      }

      if (stripeEnabled) {
        const { error } = await presentPaymentSheet();
        if (error) {
          setStatus("error");
          setStatusMessage(
            `Payment ${error.code.toLowerCase()}. Please try again.`,
          );
          return;
        }
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
    <Modal visible={visible} onRequestClose={onExit}>
      <Header title="Checkout" onPress={onExit} />

      <View style={styles.content}>
        {/* Class Info */}
        <View style={styles.classInfo}>
          <ThemedText type="h2">{project.song.name}</ThemedText>
          {project.song.artistName && (
            <ThemedText color="dimmed" type="h4">
              {project.song.artistName}
            </ThemedText>
          )}
          {project.profile.fullName && (
            <ThemedText color="dimmed" type="h4">
              with {project.profile.fullName}
            </ThemedText>
          )}
        </View>

        {/* Price and Quantity Row */}
        <SpotsSelector
          spots={spots}
          onSpotsChange={setSpots}
          loading={loading}
          disabled={status === "success"}
        />

        {/* Price Breakdown */}
        <View style={styles.priceBreakdown}>
          <View style={[styles.row, styles.priceRow]}>
            <ThemedText type="h3">Price</ThemedText>
            <ThemedText type="h3">{formatMoney(price, currency)}</ThemedText>
          </View>
          <View style={[styles.row, styles.priceRow]}>
            <ThemedText type="h3" color="dimmed">
              Fee
            </ThemedText>
            <ThemedText type="h3" color="dimmed">
              {formatMoney(fee, currency)}
            </ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <ThemedText type="h1">{formatMoney(total, currency)}</ThemedText>
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
      <ButtonGroup direction="column" position="stickyBottomAbsolute">
        <Button
          label={status === "success" ? "See you in class!" : "Pay"}
          onPress={handlePay}
          disabled={status === "success"}
        />
        <Button outlined label="Cancel" onPress={onExit} />
      </ButtonGroup>
    </Modal>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  content: {
    flex: 1,
    paddingHorizontal: theme.gap(2),
    gap: theme.gap(3),
  },
  classInfo: {
    gap: theme.gap(0.5),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
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
}));
