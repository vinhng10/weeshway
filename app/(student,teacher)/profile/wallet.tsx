import { Boundary, Button, Header } from "@/components";
import { RETURN_URL, ROLE } from "@/constants";
import { useAuth, useLocales, useRole, useSuspenseQuery } from "@/hooks";
import { supabase } from "@/supabase";
import {
  ClientSecretProvider,
  CustomerSessionClientSecret,
  CustomerSheet,
  CustomerSheetError,
} from "@stripe/stripe-react-native";
import * as WebBrowser from "expo-web-browser";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type StripeResponse = {
  url?: string;
};

function StudentWalletContent() {
  const profile = useAuth((state) => state.profile);
  const fetchProfile = useAuth((state) => state.fetchProfile);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);

  const clientSecretProvider: ClientSecretProvider = useMemo(
    () => ({
      // Must return an object with customerId and clientSecret
      async provideCustomerSessionClientSecret(): Promise<CustomerSessionClientSecret> {
        const { data, error } = await supabase.functions.invoke<{
          customerId: string;
          clientSecret: string;
        }>("setup-session", {
          body: {
            stripeAccountId: profile?.stripeAccountId,
          },
        });

        if (error) throw error;
        if (!data) throw new Error("Failed to create customer session");
        return {
          customerId: data.customerId,
          clientSecret: data.clientSecret,
        };
      },

      // Must return a string
      async provideSetupIntentClientSecret(): Promise<string> {
        const { data, error } = await supabase.functions.invoke<{
          setupIntentClientSecret: string;
        }>("setup-intent", {
          body: {
            stripeAccountId: profile?.stripeAccountId,
          },
        });

        if (error) throw error;
        if (!data?.setupIntentClientSecret)
          throw new Error("Failed to create setup intent");
        return data.setupIntentClientSecret;
      },
    }),
    [profile?.stripeAccountId]
  );

  const handleSetup = async () => {
    if (!profile?.stripeAccountId) {
      return;
    }

    setIsPresenting(true);
    try {
      // Initialize CustomerSheet if needed
      if (!isInitialized) {
        const { error } = await CustomerSheet.initialize({
          intentConfiguration: {
            paymentMethodTypes: ["card"],
          },
          clientSecretProvider: clientSecretProvider,
          headerTextForSelectionScreen: "Manage your payment method",
          returnURL: "danceai://",
        });

        if (error) {
          console.error("CustomerSheet initialization error:", error);
          return;
        }
        setIsInitialized(true);
      }

      const { error, paymentOption, paymentMethod } =
        await CustomerSheet.present();

      if (error) {
        if (error.code === CustomerSheetError.Canceled) {
        } else {
          // Show the error in your UI
        }
      } else {
        if (paymentOption) {
          try {
            // paymentOption.id may exist at runtime even if TypeScript doesn't recognize it
            // Fallback to paymentMethod.id if paymentOption.id is not available
            const paymentMethodId =
              (paymentOption as any).id || paymentMethod?.id;

            if (paymentMethodId) {
              const { error } = await supabase
                .from("profiles")
                .update({ default_payment_method: paymentMethodId })
                .eq("id", profile?.id);

              if (error) {
                console.error("Error updating default payment method:", error);
              } else {
                await fetchProfile();
              }
            }
          } catch (err: any) {
            console.error("Error saving payment method:", err);
          }
        }
      }
    } catch (err: any) {
      console.error("Error presenting CustomerSheet:", err);
    } finally {
      setIsPresenting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Wallet" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Button
          label="Manage Payment Methods"
          onPress={handleSetup}
          loading={isPresenting}
        />
      </ScrollView>
    </View>
  );
}

function TeacherWalletContent() {
  const profile = useAuth((state) => state.profile);
  const fetchProfile = useAuth((state) => state.fetchProfile);
  const [isLaunching, setIsLaunching] = useState(false);
  const country = useLocales((state) => state.country);

  const { data: onboardingComplete, refetch } = useSuspenseQuery<boolean>({
    queryKey: ["profile", "stripe"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_stripe_onboarded");
      if (error) throw error;
      return data;
    },
  });

  const handleStartOnboarding = async () => {
    setIsLaunching(true);
    try {
      const { data, error } = await supabase.functions.invoke<StripeResponse>(
        "onboard",
        {
          body: { country, returnUrl: RETURN_URL },
        }
      );

      if (error) {
        throw error;
      }

      const onboardingUrl = data?.url;

      if (!onboardingUrl) {
        throw new Error("The onboarding link was not returned.");
      }

      await WebBrowser.openAuthSessionAsync(onboardingUrl, RETURN_URL);

      await refetch();
      await fetchProfile();
    } catch (error: any) {
      console.error("Error launching onboarding:", error);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleOpenDashboard = async () => {
    if (!profile?.stripeAccountId || !onboardingComplete) return;

    setIsLaunching(true);
    try {
      const { data, error } = await supabase.functions.invoke<StripeResponse>(
        "dashboard",
        {
          body: { accountId: profile.stripeAccountId },
        }
      );

      if (error) throw error;

      const dashboardUrl = data?.url;

      if (!dashboardUrl) {
        throw new Error("The dashboard login link was not returned.");
      }

      await WebBrowser.openAuthSessionAsync(dashboardUrl, RETURN_URL);
    } catch (error: any) {
      console.error("Error opening dashboard:", error);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Wallet" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {onboardingComplete ? (
          <Button
            label={"Stripe Dashboard"}
            onPress={handleOpenDashboard}
            loading={isLaunching}
          />
        ) : (
          <Button
            label={"Onboarding"}
            onPress={handleStartOnboarding}
            loading={isLaunching}
          />
        )}
      </ScrollView>
    </View>
  );
}

export default function Wallet() {
  const role = useRole((state) => state.role);

  return (
    <Boundary>
      {role === ROLE.STUDENT ? (
        <StudentWalletContent />
      ) : (
        <TeacherWalletContent />
      )}
    </Boundary>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    paddingHorizontal: theme.gap(2),
    paddingBottom: theme.gap(16),
    flexGrow: 1,
  },
}));
