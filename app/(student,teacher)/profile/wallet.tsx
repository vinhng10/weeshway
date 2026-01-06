import { Boundary, Button, Header } from "@/components";
import { RETURN_URL } from "@/constants";
import { useAuth, useLocales, useSuspenseQuery } from "@/hooks";
import { supabase } from "@/supabase";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type StripeResponse = {
  url?: string;
};

function WalletContent() {
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

  const handleStartOnboarding = useCallback(async () => {
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
  }, [refetch, fetchProfile]);

  const handleOpenDashboard = useCallback(async () => {
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
  }, [profile?.stripeAccountId, onboardingComplete, fetchProfile]);

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
  return (
    <Boundary>
      <WalletContent />
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
