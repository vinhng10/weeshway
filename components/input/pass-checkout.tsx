import { MERCHANT_COUNTRY_CODE } from "@/constants";
import { useLocales } from "@/hooks";
import { supabase } from "@/supabase";
import { PassType, PaymentIntentResponse } from "@/types";
import { createStripeAppearance, parseFunctionsError } from "@/utils";
import { PaymentMethodLayout, useStripe } from "@stripe/stripe-react-native";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Header } from "../header";
import { Modal } from "../modal";
import { ThemedText } from "../themed-text";
import { Button } from "./button";
import { ButtonGroup } from "./button-group";

interface PassCheckoutProps {
  visible: boolean;
  onExit: () => void;
  pass: PassType;
  teacherName?: string;
}

export function PassCheckout({
  visible,
  onExit,
  pass,
  teacherName,
}: PassCheckoutProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { theme } = useUnistyles();
  const formatMoney = useLocales((state) => state.formatMoney);
  const bookingFee = useLocales((state) => state.bookingFee);
  const exchange = useLocales((state) => state.exchange);

  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const feePerSession = exchange(bookingFee, "USD", pass.currency);
  const totalFee = feePerSession * pass.sessions;
  const total = pass.price + totalFee;

  const handlePay = async () => {
    if (loading) return;
    setStatus("idle");
    setStatusMessage("");
    setLoading(true);

    try {
      const { data, error } =
        await supabase.functions.invoke<PaymentIntentResponse>("pass-payment", {
          body: { passId: pass.id },
        });

      if (error) throw new Error(await parseFunctionsError(error));

      if (
        !data?.paymentIntentClientSecret ||
        !data.customerSessionClientSecret
      ) {
        throw new Error("Error occurred. Please try again.");
      }

      if (!isInitialized) {
        const { error: initError } = await initPaymentSheet({
          merchantDisplayName: "WeeshWay",
          customerId: data.customerId,
          paymentIntentClientSecret: data.paymentIntentClientSecret,
          customerSessionClientSecret: data.customerSessionClientSecret,
          paymentMethodOrder: ["card"],
          paymentMethodLayout: PaymentMethodLayout.Horizontal,
          applePay: { merchantCountryCode: MERCHANT_COUNTRY_CODE },
          googlePay: { merchantCountryCode: MERCHANT_COUNTRY_CODE },
          appearance: createStripeAppearance(theme),
        });
        if (initError) throw new Error(initError.message);
        setIsInitialized(true);
      }

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        setStatus("error");
        setStatusMessage(
          `Payment ${presentError.code.toLowerCase()}. Please try again.`,
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
    setLoading(false);
    setIsInitialized(false);
    setStatus("idle");
    setStatusMessage("");
  }, [visible, pass.id]);

  return (
    <Modal visible={visible} onRequestClose={onExit}>
      <Header title="Checkout" onPress={onExit} />

      <View style={styles.content}>
        <View style={styles.passInfo}>
          <ThemedText type="h2">{pass.name}</ThemedText>
          {teacherName && (
            <ThemedText color="dimmed" type="h4">
              with {teacherName}
            </ThemedText>
          )}
          <ThemedText color="dimmed" type="h4">
            {pass.sessions} sessions · valid {pass.expiryDays} days
          </ThemedText>
        </View>

        <View style={styles.priceBreakdown}>
          <View style={[styles.row, styles.priceRow]}>
            <ThemedText type="h3">Price</ThemedText>
            <ThemedText type="h3">
              {formatMoney(pass.price, pass.currency)}
            </ThemedText>
          </View>
          <View style={[styles.row, styles.priceRow]}>
            <ThemedText type="h3" color="dimmed">
              Fees ({pass.sessions}×)
            </ThemedText>
            <ThemedText type="h3" color="dimmed">
              {formatMoney(totalFee, pass.currency)}
            </ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <ThemedText type="h1">
              {formatMoney(total, pass.currency)}
            </ThemedText>
          </View>
        </View>

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

      <ButtonGroup direction="column" position="stickyBottomAbsolute">
        <Button
          label={status === "success" ? "Done!" : "Pay"}
          onPress={handlePay}
          disabled={status === "success"}
        />
        <Button outlined label="Cancel" onPress={onExit} />
      </ButtonGroup>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    flex: 1,
    paddingHorizontal: theme.gap(2),
    gap: theme.gap(3),
  },
  passInfo: {
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
