import { MERCHANT_COUNTRY_CODE } from "@/constants";
import { useFeatureFlags, useLocales, useSuspenseQuery } from "@/hooks";
import { supabase } from "@/supabase";
import {
  PassPurchaseStatus,
  PassType,
  PaymentIntentResponse,
  ProfileType,
  ProjectEnrichedType,
} from "@/types";
import { createStripeAppearance, parseFunctionsError } from "@/utils";
import { PaymentMethodLayout, useStripe } from "@stripe/stripe-react-native";
import { useQueryClient } from "@tanstack/react-query";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Carousel } from "../carousel";
import { Chip } from "../chip";
import { Header } from "../header";
import { Modal } from "../modal";
import {
  PassPurchaseCard,
  PassPurchaseCardData,
  PassSummaryCard,
} from "../pass-card";
import { ThemedText } from "../themed-text";
import { Button } from "./button";
import { ButtonGroup } from "./button-group";
import { PassCheckout } from "./pass-checkout";
import { SpotsSelector } from "./spots-selector";

type Tab = "pass" | "card";

type EligiblePass = {
  id: string;
  sessions: number;
  remainingSessions: number;
  expiresAt: string;
  status: PassPurchaseStatus;
  price: number;
  createdAt: string;
  passes: {
    id: string;
    name: string;
    photoUrl: string | null;
    userId: string;
  };
};

type CheckoutProps = {
  visible: boolean;
  onExit: () => void;
  customer: ProfileType | null;
  project: ProjectEnrichedType;
};

export function Checkout(props: CheckoutProps) {
  return (
    <Modal visible={props.visible} onRequestClose={props.onExit}>
      <Header title="Checkout" onPress={props.onExit} />
      {props.visible && (
        <Suspense fallback={null}>
          <CheckoutContent {...props} />
        </Suspense>
      )}
    </Modal>
  );
}

function CheckoutContent({ onExit, project }: CheckoutProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { theme } = useUnistyles();
  const stripeEnabled = useFeatureFlags((state) => state.isEnabled("stripe"));
  const formatMoney = useLocales((state) => state.formatMoney);
  const bookingFee = useLocales((state) => state.bookingFee);
  const exchange = useLocales((state) => state.exchange);
  const queryClient = useQueryClient();

  const teacherId = project.profile.id;

  const { data: allEligible } = useSuspenseQuery<EligiblePass[]>({
    queryKey: ["passes", teacherId],
    queryFn: async () => {
      const { data } = await supabase
        .from("pass_purchases")
        .select(
          "id, sessions, remaining_sessions, expires_at, status, price, created_at, passes!inner(id, name, photo_url, user_id)",
        )
        .eq("passes.user_id", teacherId)
        .eq("status", "Succeeded")
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: true })
        .throwOnError();
      return (data ?? []) as any;
    },
  });

  const { data: teacherPasses } = useSuspenseQuery<PassType[]>({
    queryKey: ["classes", "profiles", teacherId, "passes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("passes")
        .select("*")
        .eq("user_id", teacherId)
        .eq("active", true)
        .throwOnError();
      return data ?? [];
    },
  });

  const [spots, setSpots] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [redeemIndex, setRedeemIndex] = useState(0);
  const [catalogIndex, setCatalogIndex] = useState(0);
  const [passCheckoutVisible, setPassCheckoutVisible] = useState(false);

  const eligible = useMemo(
    () => allEligible.filter((p) => p.remainingSessions >= spots),
    [allEligible, spots],
  );

  const hasEligible = eligible.length > 0;
  const hasCatalog = teacherPasses.length > 0;
  const hasPassOption = hasEligible || hasCatalog;

  const [tab, setTab] = useState<Tab>(hasEligible ? "pass" : "card");

  useEffect(() => {
    if (!hasPassOption) setTab("card");
  }, [hasPassOption]);

  useEffect(() => {
    if (tab === "pass") setSpots(1);
  }, [tab]);

  const prevAllEligibleLength = useRef(allEligible.length);
  useEffect(() => {
    if (allEligible.length > prevAllEligibleLength.current) {
      setRedeemIndex(Math.max(0, eligible.length - 1));
    } else if (eligible.length > 0 && redeemIndex >= eligible.length) {
      setRedeemIndex(0);
    }
    prevAllEligibleLength.current = allEligible.length;
  }, [allEligible.length, eligible.length, redeemIndex]);

  useEffect(() => {
    if (teacherPasses.length > 0 && catalogIndex >= teacherPasses.length) {
      setCatalogIndex(0);
    }
  }, [teacherPasses.length, catalogIndex]);

  const currency = project.currency;
  const amount = project.price ?? 0;
  const price = amount * spots;
  const fee = exchange(bookingFee, "USD", currency) * spots;
  const total = price + fee;

  const selectedEligible = eligible[redeemIndex];
  const selectedCatalog = teacherPasses[catalogIndex];

  const isCardTab = tab === "card";
  const showRedeem = tab === "pass" && hasEligible;
  const showCatalog = tab === "pass" && !hasEligible && hasCatalog;

  const passPurchaseCards: PassPurchaseCardData[] = useMemo(
    () =>
      eligible.map((ep) => ({
        id: ep.id,
        status: ep.status,
        sessions: ep.sessions,
        remainingSessions: ep.remainingSessions,
        expiresAt: ep.expiresAt,
        price: ep.price,
        createdAt: ep.createdAt,
        pass: {
          id: ep.passes.id,
          name: ep.passes.name,
          photoUrl: ep.passes.photoUrl,
          teacher: {
            id: project.profile.id,
            fullName: project.profile.fullName,
            avatarUrl: project.profile.avatarUrl,
          },
        },
      })),
    [
      eligible,
      project.profile.id,
      project.profile.fullName,
      project.profile.avatarUrl,
    ],
  );

  const fetchPaymentSheetParams = async () => {
    if (amount <= 0) throw new Error("Error occurred. Please try again.");
    const { data, error } =
      await supabase.functions.invoke<PaymentIntentResponse>("payment", {
        body: { projectId: project.id, spots },
      });
    if (error) throw new Error(await parseFunctionsError(error));
    if (!data?.paymentIntentClientSecret || !data.customerSessionClientSecret) {
      throw new Error("Error occurred. Please try again.");
    }
    return data;
  };

  const redeemPass = async (passPurchaseId: string) => {
    const { error } = await supabase.functions.invoke("pass-redeem", {
      body: { passPurchaseId, projectId: project.id, spots },
    });
    if (error) throw new Error(await parseFunctionsError(error));
  };

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    setStatus("idle");
    setStatusMessage("");
  };

  const handleAction = async () => {
    if (loading) return;
    setStatus("idle");
    setStatusMessage("");

    if (showCatalog) {
      if (!selectedCatalog) return;
      setPassCheckoutVisible(true);
      return;
    }

    setLoading(true);
    try {
      if (showRedeem) {
        if (!selectedEligible) throw new Error("No pass selected.");
        await redeemPass(selectedEligible.id);
        setStatus("success");
        setStatusMessage("Booking completed!");
        await queryClient.invalidateQueries({
          predicate: (q) => q.queryKey.includes("passes"),
        });
        return;
      }

      const {
        customerId,
        paymentIntentClientSecret,
        customerSessionClientSecret,
        autoConfirmed,
        status: paymentStatus,
      } = await fetchPaymentSheetParams();

      if (autoConfirmed && paymentStatus === "succeeded") {
        setStatus("success");
        setStatusMessage("Booking completed!");
        return;
      }

      if (!isInitialized) {
        const { error } = await initPaymentSheet({
          merchantDisplayName: "WeeshWay",
          customerId,
          paymentIntentClientSecret,
          customerSessionClientSecret,
          paymentMethodOrder: ["card"],
          paymentMethodLayout: PaymentMethodLayout.Horizontal,
          applePay: { merchantCountryCode: MERCHANT_COUNTRY_CODE },
          googlePay: { merchantCountryCode: MERCHANT_COUNTRY_CODE },
          appearance: createStripeAppearance(theme),
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

  const handlePassCheckoutExit = async () => {
    setPassCheckoutVisible(false);
    await queryClient.invalidateQueries({
      predicate: (q) => q.queryKey.includes("passes"),
    });
  };

  const buttonLabel = (() => {
    if (status === "success") return "See you in class!";
    if (showCatalog) return "Purchase";
    if (showRedeem) return "Redeem";
    return "Pay";
  })();

  const carouselHeight = theme.gap(30);

  return (
    <>
      <View style={styles.content}>
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

        {hasPassOption && (
          <View style={styles.tabBar}>
            <Chip
              size="large"
              color={tab === "pass" ? "contrast" : undefined}
              label="By Pass"
              onPress={
                status !== "success" ? () => handleTabChange("pass") : undefined
              }
            />
            <Chip
              size="large"
              color={tab === "card" ? "contrast" : undefined}
              label="By Card"
              onPress={
                status !== "success" ? () => handleTabChange("card") : undefined
              }
            />
          </View>
        )}

        {isCardTab && (
          <SpotsSelector
            spots={spots}
            onSpotsChange={setSpots}
            loading={loading}
            disabled={status === "success"}
          />
        )}

        {showRedeem && (
          <Carousel
            data={passPurchaseCards}
            height={carouselHeight}
            onSnapToItem={setRedeemIndex}
            parallaxScrollingScale={0.95}
            parallaxAdjacentItemScale={0.88}
            renderItem={(item) => (
              <PassPurchaseCard passPurchase={item} showAction={false} />
            )}
          />
        )}

        {showCatalog && (
          <Carousel
            data={teacherPasses}
            height={carouselHeight}
            onSnapToItem={setCatalogIndex}
            parallaxScrollingScale={0.95}
            parallaxAdjacentItemScale={0.88}
            renderItem={(item) => (
              <PassSummaryCard pass={item} teacher={project.profile} />
            )}
          />
        )}

        {isCardTab && (
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
        )}

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
          label={buttonLabel}
          onPress={handleAction}
          disabled={status === "success" || loading}
        />
        <Button outlined label="Cancel" onPress={onExit} />
      </ButtonGroup>

      {selectedCatalog && (
        <PassCheckout
          visible={passCheckoutVisible}
          onExit={handlePassCheckoutExit}
          pass={selectedCatalog}
          teacherName={project.profile.fullName}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    flex: 1,
    paddingHorizontal: theme.gap(2),
    gap: theme.gap(2),
  },
  classInfo: {
    gap: theme.gap(0.5),
  },
  tabBar: {
    flexDirection: "row",
    gap: theme.gap(1),
    alignItems: "center",
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
