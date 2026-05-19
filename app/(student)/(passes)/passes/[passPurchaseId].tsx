import {
  Boundary,
  Button,
  Header,
  SectionListView,
  TextBoxInput,
  Tile,
} from "@/components";
import { PassPurchaseCard } from "@/components/pass-card";
import {
  BOOKING_ACTIVE_STATUSES,
  PASS_COOLING_OFF_DAYS,
  PassPurchaseStatuses,
} from "@/constants";
import { useAlert, useLocales, useSuspenseQuery } from "@/hooks";
import { supabase } from "@/supabase";
import {
  BookingType,
  PassPurchaseType,
  PassType,
  ProfileType,
  ProjectType,
  SongType,
} from "@/types";
import { formatDate } from "@/utils";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type Redemption = Pick<BookingType, "id" | "status"> & {
  project:
    | (Pick<ProjectType, "id" | "startAt" | "style" | "level"> & {
        song: Pick<SongType, "name" | "artworkUrl"> | null;
      })
    | null;
};

type PassPurchaseDetail = PassPurchaseType & {
  pass:
    | (Pick<PassType, "id" | "name" | "photoUrl" | "description"> & {
        teacher: Pick<ProfileType, "id" | "fullName" | "avatarUrl"> | null;
      })
    | null;
  bookings: Redemption[];
};

const COOLING_OFF_MS = PASS_COOLING_OFF_DAYS * 24 * 60 * 60 * 1000;

function PassDetailContent() {
  const { passPurchaseId } = useLocalSearchParams<{ passPurchaseId: string }>();
  const queryClient = useQueryClient();
  const showAlert = useAlert((state) => state.showAlert);
  const transactionFee = useLocales((state) => state.transactionFee);

  const { data, refetch, isRefetching } = useSuspenseQuery<PassPurchaseDetail>({
    queryKey: ["passes", passPurchaseId],
    queryFn: async () => {
      const { data } = await supabase
        .from("pass_purchases")
        .select(
          `
          *,
          pass:passes (
            id, name, photo_url, description,
            teacher:profiles (id, full_name, avatar_url)
          ),
          bookings (
            id, status,
            project:projects (
              id, start_at, style, level,
              song:songs (name, artwork_url)
            )
          )
        `,
        )
        .eq("id", passPurchaseId)
        .in("bookings.status", BOOKING_ACTIVE_STATUSES)
        .single()
        .throwOnError();
      return data as any;
    },
  });

  const purchasedAt = new Date(data.createdAt);
  const canCancel =
    data.status === PassPurchaseStatuses.Succeeded &&
    data.remainingSessions === data.sessions &&
    Date.now() - purchasedAt.getTime() < COOLING_OFF_MS;

  const doCancel = async () => {
    try {
      await supabase
        .from("pass_purchases")
        .update({ status: PassPurchaseStatuses.Refunding })
        .eq("id", passPurchaseId)
        .throwOnError();
      await queryClient.invalidateQueries({
        predicate: (q) => q.queryKey.includes("passes"),
      });
      router.back();
    } catch (error: any) {
      showAlert(
        "Cancel Failed",
        error?.message ??
          "Couldn't process your refund request. Please try again.",
      );
    }
  };

  const handleCancel = () => {
    showAlert(
      "Cancel Your Pass?",
      `A ${transactionFee}% cancellation fee applies. The booking fee is non-refundable. This cannot be undone.`,
      { confirmLabel: "Confirm", onConfirm: doCancel },
    );
  };

  const redemptions: Redemption[] = data.bookings.filter((b) => !!b.project);

  const sections = [
    {
      title: "Redemptions",
      data: redemptions,
      render: (item: Redemption) => (
        <Tile
          imageSource={item.project?.song?.artworkUrl}
          title={item.project?.song?.name ?? "Class"}
          subtitle={
            item.project?.startAt
              ? formatDate(new Date(item.project.startAt))
              : undefined
          }
          metadata={[item.project?.style, item.project?.level]
            .filter(Boolean)
            .join(" • ")}
          onPress={() =>
            item.project && router.navigate(`../classes/${item.project.id}`)
          }
        />
      ),
    },
  ];

  return (
    <>
      <SectionListView
        sections={sections}
        ListHeaderComponent={
          <View style={styles.header}>
            <PassPurchaseCard passPurchase={data} />
            {!!data.pass?.description && (
              <TextBoxInput
                label="Description"
                value={data.pass.description}
                multiline
                numberOfLines={3}
                editable={false}
              />
            )}
          </View>
        }
        refetch={refetch}
        isRefetching={isRefetching}
      />
      {canCancel && (
        <Button
          position="stickyBottom"
          label="Cancel Pass"
          onPress={handleCancel}
        />
      )}
    </>
  );
}

export default function PassDetail() {
  return (
    <View style={styles.container}>
      <Header title="Pass" />
      <Boundary>
        <PassDetailContent />
      </Boundary>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
  header: {
    gap: theme.gap(2),
  },
}));
