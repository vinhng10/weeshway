import {
  Boundary,
  Button,
  ChipBar,
  ChipBarItemProps,
  SectionListView,
  ThemedText,
} from "@/components";
import { PassSummaryCard } from "@/components/pass-card";
import { PASS_PURCHASE_ACTIVE_STATUSES } from "@/constants";
import { useAuth, useSuspenseQuery } from "@/hooks";
import { supabase } from "@/supabase";
import { PassType } from "@/types";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type Scope = "Active" | "Inactive";

const SCOPE_OPTIONS = { Active: "Active", Inactive: "Inactive" } as const;

type PassWithCount = PassType & {
  passPurchases: { count: number }[];
};

function PassesContent({ scope }: { scope: Scope }) {
  const profile = useAuth((state) => state.profile);

  const { data, refetch, isRefetching } = useSuspenseQuery<PassWithCount[]>({
    queryKey: ["passes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("passes")
        .select("*, pass_purchases(count)")
        .in("pass_purchases.status", PASS_PURCHASE_ACTIVE_STATUSES)
        .eq("user_id", profile!.id)
        .order("created_at", { ascending: false })
        .throwOnError();
      return data as any;
    },
  });

  const filtered = useMemo(
    () => data.filter((p) => (scope === "Active" ? p.active : !p.active)),
    [data, scope],
  );

  const renderPass = useCallback((pass: PassWithCount): React.ReactElement => {
    const purchaseCount = pass.passPurchases?.[0]?.count ?? 0;
    return (
      <PassSummaryCard
        pass={pass}
        purchaseCount={purchaseCount}
        onPress={() => router.navigate(`./passes/${pass.id}`)}
      />
    );
  }, []);

  if (filtered.length === 0) {
    return (
      <View style={styles.empty}>
        <ThemedText type="h4">
          {scope === "Active" ? "No active passes" : "No inactive passes"}
        </ThemedText>
      </View>
    );
  }

  const sections = [{ title: "Passes", data: filtered, render: renderPass }];

  return (
    <SectionListView
      sections={sections}
      refetch={refetch}
      isRefetching={isRefetching}
    />
  );
}

export default function TeacherPasses() {
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
      <Button
        position="stickyBottom"
        label="Create Pass"
        onPress={() => router.navigate("./create-pass")}
      />
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
  },
}));
