import {
  Boundary,
  ChipBar,
  ChipBarItemProps,
  PassPurchaseCard,
  PassPurchaseCardData,
  SectionListView,
  ThemedText,
} from "@/components";
import { PASS_PURCHASE_STATUS } from "@/constants";
import { useAuth, useSuspenseQuery } from "@/hooks";
import { supabase } from "@/supabase";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type Scope = "Active" | "Past";

const SCOPE_OPTIONS = { Active: "Active", Past: "Past" } as const;

interface PassesContentProps {
  scope: Scope;
}

function PassesContent({ scope }: PassesContentProps) {
  const profile = useAuth((state) => state.profile);

  const { data, refetch, isRefetching } = useSuspenseQuery<
    PassPurchaseCardData[]
  >({
    queryKey: ["passes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pass_purchases")
        .select(
          `
          *,
          seller:profiles!seller_id (id, full_name, avatar_url)
        `,
        )
        .eq("user_id", profile!.id)
        .in("status", [
          PASS_PURCHASE_STATUS.SUCCEEDED,
          PASS_PURCHASE_STATUS.USED,
          PASS_PURCHASE_STATUS.EXPIRED,
          PASS_PURCHASE_STATUS.REFUNDING,
          PASS_PURCHASE_STATUS.REFUNDED,
        ])
        .order("created_at", { ascending: false })
        .throwOnError();
      return data as any;
    },
  });

  const filtered = useMemo(() => {
    const now = Date.now();
    const isActive = (p: PassPurchaseCardData) =>
      p.status === PASS_PURCHASE_STATUS.SUCCEEDED &&
      p.remainingSessions > 0 &&
      !!p.expiresAt &&
      new Date(p.expiresAt).getTime() > now;

    if (scope === "Active") {
      return data
        .filter(isActive)
        .sort(
          (a, b) =>
            new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime(),
        );
    }
    return data
      .filter((p) => !isActive(p))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [data, scope]);

  const renderItem = useCallback(
    (item: PassPurchaseCardData): React.ReactElement => (
      <PassPurchaseCard
        passPurchase={item}
        onPress={() => router.navigate(`./passes/${item.id}`)}
      />
    ),
    [],
  );

  if (filtered.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={styles.empty}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <ThemedText type="h4">
          {scope === "Active" ? "No active passes" : "No past passes."}
        </ThemedText>
      </ScrollView>
    );
  }

  const sections = [{ title: "Passes", data: filtered, render: renderItem }];

  return (
    <SectionListView
      sections={sections}
      refetch={refetch}
      isRefetching={isRefetching}
    />
  );
}

export default function StudentPasses() {
  const [scope, setScope] = useState<Scope>("Active");

  const options: ChipBarItemProps[] = [
    {
      label: "Status",
      value: scope,
      options: SCOPE_OPTIONS,
      modal: false,
      onValueChange: (v: Scope) => setScope(v),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <ChipBar items={options} />
      </View>
      <Boundary>
        <PassesContent scope={scope} />
      </Boundary>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(1),
    gap: theme.gap(1),
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: theme.gap(1),
    paddingHorizontal: theme.gap(4),
  },
}));
