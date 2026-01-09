import {
  Boundary,
  Button,
  Header,
  MenuItem,
  SectionListView,
  ThemedText,
} from "@/components";
import { IconSymbol } from "@/components/ui/icon-symbol";
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
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type StripeResponse = {
  url?: string;
};

type SetupSessionResponse = {
  customerId: string;
  clientSecret: string;
};

type SetupIntentResponse = {
  setupIntentClientSecret: string;
};

type PaymentMethod = {
  brand: string;
  last4: string;
};

type PaymentMethodsResponse = {
  paymentMethods: PaymentMethod[];
};

function StudentWalletContent() {
  const profile = useAuth((state) => state.profile);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);

  const { data, refetch } = useSuspenseQuery<PaymentMethod[]>({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data, error } =
        await supabase.functions.invoke<PaymentMethodsResponse>(
          "payment-methods"
        );
      if (error) throw error;
      return data ? data.paymentMethods : [];
    },
  });

  const clientSecretProvider: ClientSecretProvider = useMemo(
    () => ({
      // Must return an object with customerId and clientSecret
      async provideCustomerSessionClientSecret(): Promise<CustomerSessionClientSecret> {
        const { data, error } =
          await supabase.functions.invoke<SetupSessionResponse>(
            "setup-session"
          );

        if (error) throw error;
        if (!data) throw new Error("Failed to create customer session");
        return {
          customerId: data.customerId,
          clientSecret: data.clientSecret,
        };
      },

      // Must return a string
      async provideSetupIntentClientSecret(): Promise<string> {
        const { data, error } =
          await supabase.functions.invoke<SetupIntentResponse>("setup-intent");

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
          clientSecretProvider,
        });

        if (error) {
          console.error("CustomerSheet initialization error:", error);
          return;
        }
        setIsInitialized(true);
      }

      const { error } = await CustomerSheet.present();
      if (error && error.code !== CustomerSheetError.Canceled) throw error;

      await refetch();
    } catch (err: any) {
      console.error("Error presenting CustomerSheet:", err);
    } finally {
      setIsPresenting(false);
    }
  };

  const renderPaymentMethod = (item: PaymentMethod): React.ReactElement => {
    const brand = item.brand.charAt(0).toUpperCase() + item.brand.slice(1);
    return (
      <MenuItem
        icon="creditcard.fill"
        label={`${brand}     •••• ${item.last4}`}
        showChevron={false}
      />
    );
  };

  const sections: SectionListData<PaymentMethod>[] = [
    {
      title: "Payment Methods",
      data: data,
      render: renderPaymentMethod,
    },
  ];

  return (
    <View style={styles.container}>
      <Header title="Wallet" />
      <SectionListView sections={sections} />
      <Button
        label="Manage"
        onPress={handleSetup}
        loading={isPresenting}
        stickyBottom
      />
    </View>
  );
}

type RequirementItem = {
  text: string;
};

type AccountResponse = {
  onboardingComplete: boolean;
  externalAccounts: Array<{
    bankName: string | null;
    currency: string;
    last4: string;
  }>;
};

function TeacherWalletContent() {
  const profile = useAuth((state) => state.profile);
  const fetchProfile = useAuth((state) => state.fetchProfile);
  const [isLaunching, setIsLaunching] = useState(false);
  const country = useLocales((state) => state.country);
  const headerContent = [
    "To receive payments from students, you need to complete your payment account setup with Stripe.",
  ];
  const requirements: RequirementItem[] = [
    {
      text: "Government-issued ID",
    },
    {
      text: "Bank account details for receiving payouts",
    },
    {
      text: "Business information (if applicable)",
    },
  ];

  const { data, refetch } = useSuspenseQuery<AccountResponse>({
    queryKey: ["profile", "stripe"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<AccountResponse>(
        "account"
      );
      if (error) throw error;
      if (!data) throw new Error("Failed to retrieve account");
      return data;
    },
  });

  const { onboardingComplete, externalAccounts } = data;

  const handleStartOnboarding = async () => {
    setIsLaunching(true);
    try {
      const { data, error } = await supabase.functions.invoke<StripeResponse>(
        "onboard",
        {
          body: { country, returnUrl: RETURN_URL },
        }
      );

      if (error) throw error;

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
        "dashboard"
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

  const renderRequirement = (item: RequirementItem): React.ReactElement => {
    return (
      <View style={styles.requirementItem}>
        <IconSymbol name="checkmark.circle" size={20} color="#10B981" />
        <ThemedText style={styles.requirementText}>{item.text}</ThemedText>
      </View>
    );
  };

  const renderHeader = (content: string): React.ReactElement => {
    return <ThemedText color="dimmed">{content}</ThemedText>;
  };

  const renderExternalAccount = (
    item: AccountResponse["externalAccounts"][0]
  ): React.ReactElement => {
    const displayName = item.bankName
      ? `${item.bankName}\n•••• ${item.last4}`
      : `•••• ${item.last4}`;
    const label = `${displayName} (${item.currency.toUpperCase()})`;
    return (
      <MenuItem icon="creditcard.fill" label={label} showChevron={false} />
    );
  };

  const onboardingSections: SectionListData<string | RequirementItem>[] = [
    {
      title: "Setup required",
      data: headerContent,
      render: renderHeader,
    },
    {
      title: "What you'll need",
      data: requirements,
      render: renderRequirement,
    },
  ];

  const onboardedHeaderContent = [
    "Use the Stripe Dashboard to track your earnings, manage payouts to your bank account, and access tax documents.",
  ];

  const externalAccountsSections: SectionListData<
    string | AccountResponse["externalAccounts"][0]
  >[] = [
    {
      title: "You're All Set!",
      data: onboardedHeaderContent,
      render: renderHeader,
    },
    {
      title: "Bank Accounts",
      data: externalAccounts,
      render: renderExternalAccount,
    },
  ];

  return (
    <View style={styles.container}>
      <Header title="Wallet" />
      {onboardingComplete ? (
        <>
          <SectionListView sections={externalAccountsSections} />
          <Button
            label="Stripe Dashboard"
            onPress={handleOpenDashboard}
            loading={isLaunching}
            stickyBottom
          />
        </>
      ) : (
        <>
          <SectionListView sections={onboardingSections as any} />
          <Button
            label="Setup"
            onPress={handleStartOnboarding}
            loading={isLaunching}
            stickyBottom
          />
        </>
      )}
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
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1.5),
  },
  requirementText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
}));
