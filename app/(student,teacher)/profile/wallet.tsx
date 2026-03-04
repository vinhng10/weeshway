import {
  Boundary,
  Bullet,
  Button,
  Header,
  MenuItem,
  SectionListView,
  ThemedText,
} from "@/components";
import { RETURN_URL, ROLE } from "@/constants";
import {
  useAlert,
  useAuth,
  useLocales,
  useRole,
  useSuspenseQuery,
} from "@/hooks";
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
import { StyleSheet, useUnistyles } from "react-native-unistyles";

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
  const { theme } = useUnistyles();
  const showAlert = useAlert((state) => state.showAlert);
  const [isInitialized, setIsInitialized] = useState(false);

  const { data, refetch, isRefetching } = useSuspenseQuery<PaymentMethod[]>({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data, error } =
        await supabase.functions.invoke<PaymentMethodsResponse>(
          "payment-methods",
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
            "setup-session",
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
    [profile?.stripeAccountId],
  );

  const handleSetup = async () => {
    if (!profile?.stripeAccountId) {
      return;
    }

    try {
      // Initialize CustomerSheet if needed
      if (!isInitialized) {
        const { error } = await CustomerSheet.initialize({
          intentConfiguration: {
            paymentMethodTypes: ["card"],
          },
          clientSecretProvider,
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
                background: theme.colors.typography,
                text: theme.colors.background,
              },
              shapes: {
                borderRadius: theme.gap(2),
              },
            },
          },
        });

        if (error) {
          showAlert(
            "Payment Setup",
            "Couldn't initialize the payment setup. Please try again.",
          );
          return;
        }
        setIsInitialized(true);
      }

      const { error } = await CustomerSheet.present();
      if (error && error.code !== CustomerSheetError.Canceled) throw error;

      await refetch();
    } catch {
      showAlert(
        "Payment Setup",
        "Couldn't open the payment setup. Please try again.",
      );
    }
  };

  const renderPaymentMethod = (item: PaymentMethod): React.ReactElement => {
    const brand = item.brand.charAt(0).toUpperCase() + item.brand.slice(1);
    return (
      <MenuItem
        icon="card"
        title={`${brand}     •••• ${item.last4}`}
        showChevron={false}
      />
    );
  };

  const sections = [
    {
      title: "Payment Methods",
      data: data,
      render: renderPaymentMethod,
    },
  ];

  return (
    <>
      <SectionListView
        sections={sections}
        refetch={refetch}
        isRefetching={isRefetching}
      />
      <Button label="Setup" onPress={handleSetup} stickyBottom />
    </>
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
  const country = useLocales((state) => state.country);
  const showAlert = useAlert((state) => state.showAlert);
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

  const { data, refetch, isRefetching } = useSuspenseQuery<AccountResponse>({
    queryKey: ["profile", "stripe"],
    queryFn: async () => {
      const { data, error } =
        await supabase.functions.invoke<AccountResponse>("account");
      if (error) throw error;
      if (!data) throw new Error("Failed to retrieve account");
      return data;
    },
  });

  const { onboardingComplete, externalAccounts } = data;

  const handleStartOnboarding = async () => {
    try {
      const { data, error } = await supabase.functions.invoke<StripeResponse>(
        "onboard",
        {
          body: { country, returnUrl: RETURN_URL },
        },
      );

      if (error) throw error;

      const onboardingUrl = data?.url;

      if (!onboardingUrl) {
        throw new Error("The onboarding link was not returned.");
      }

      await WebBrowser.openAuthSessionAsync(onboardingUrl, RETURN_URL);

      await refetch();
      await fetchProfile();
    } catch {
      showAlert(
        "Setup Failed",
        "Couldn't start the wallet setup. Please try again.",
      );
    }
  };

  const handleOpenDashboard = async () => {
    if (!profile?.stripeAccountId || !onboardingComplete) return;

    try {
      const { data, error } =
        await supabase.functions.invoke<StripeResponse>("dashboard");

      if (error) throw error;

      const dashboardUrl = data?.url;

      if (!dashboardUrl) {
        throw new Error("The dashboard login link was not returned.");
      }

      await WebBrowser.openAuthSessionAsync(dashboardUrl, RETURN_URL);
    } catch {
      showAlert(
        "Dashboard Unavailable",
        "Couldn't open your payment dashboard. Please try again.",
      );
    }
  };

  const renderRequirement = (item: RequirementItem): React.ReactElement => {
    return <Bullet text={item.text} />;
  };

  const renderHeader = (content: string): React.ReactElement => {
    return <ThemedText color="dimmed">{content}</ThemedText>;
  };

  const renderExternalAccount = (
    item: AccountResponse["externalAccounts"][0],
  ): React.ReactElement => {
    const title = item.bankName;
    const subtitle = `•••• ${item.last4} (${item.currency.toUpperCase()})`;
    return (
      <MenuItem
        icon="card"
        title={title}
        subtitle={subtitle}
        showChevron={false}
      />
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

  return onboardingComplete ? (
    <>
      <SectionListView
        sections={externalAccountsSections}
        refetch={refetch}
        isRefetching={isRefetching}
      />
      <Button
        label="Stripe Dashboard"
        onPress={handleOpenDashboard}
        stickyBottom
      />
    </>
  ) : (
    <>
      <SectionListView
        sections={onboardingSections}
        refetch={refetch}
        isRefetching={isRefetching}
      />
      <Button label="Setup" onPress={handleStartOnboarding} stickyBottom />
    </>
  );
}

export default function Wallet() {
  const role = useRole((state) => state.role);

  return (
    <View style={styles.container}>
      <Header title="Wallet" />
      <Boundary>
        {role === ROLE.STUDENT ? (
          <StudentWalletContent />
        ) : (
          <TeacherWalletContent />
        )}
      </Boundary>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
  },
}));
