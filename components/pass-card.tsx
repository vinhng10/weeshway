import { PASS_PURCHASE_STATUS } from "@/constants";
import { useLocales } from "@/hooks";
import { PassPurchaseType, PassType, ProfileType } from "@/types";
import { formatExpiry } from "@/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ReactNode, useState } from "react";
import { View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { Avatar } from "./avatar";
import { Button } from "./input/button";
import { PassCheckout } from "./input/pass-checkout";
import { Pressable } from "./pressable";
import { ThemedText } from "./themed-text";

const UniLinearGradient = withUnistyles(LinearGradient, (theme) => ({
  colors: ["transparent", theme.colors.background] as const,
}));

export type PassPurchaseCardData = Pick<
  PassPurchaseType,
  | "id"
  | "status"
  | "remainingSessions"
  | "sessions"
  | "price"
  | "createdAt"
  | "expiresAt"
  | "name"
  | "photoUrl"
> & {
  seller: Pick<ProfileType, "id" | "fullName" | "avatarUrl"> | null;
};

type Stat = { label: string; value: string };

type TeacherSlot = {
  avatarUrl?: string | null;
};

interface PassCardLayoutProps {
  photoUrl: string | null;
  title: string;
  teacher: TeacherSlot | null;
  stats: Stat[];
  action?: ReactNode;
  onPress?: () => void;
}

function PassCardLayout({
  photoUrl,
  title,
  teacher,
  stats,
  action,
  onPress,
}: PassCardLayoutProps) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      {photoUrl ? (
        <Image source={photoUrl} style={styles.background} contentFit="cover" />
      ) : (
        <View style={[styles.background, styles.fallback]} />
      )}
      <UniLinearGradient
        style={styles.overlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.row}>
          <ThemedText type="h3" numberOfLines={1} style={styles.grow}>
            {title}
          </ThemedText>
          {teacher && (
            <Avatar
              source={teacher.avatarUrl ?? undefined}
              shape="circle"
              bordered
            />
          )}
        </View>

        <View style={styles.bottomGroup}>
          <View style={styles.statsRow}>
            {stats.map((stat) => (
              <View key={stat.label}>
                <ThemedText color="dimmed">{stat.label}</ThemedText>
                <ThemedText type="h5">{stat.value}</ThemedText>
              </View>
            ))}
          </View>
          {action}
        </View>
      </UniLinearGradient>
    </Pressable>
  );
}

interface PassCardProps {
  pass: PassType;
  teacher?: Pick<ProfileType, "fullName" | "avatarUrl"> | null;
}

export function PassCard({ pass, teacher }: PassCardProps) {
  const formatMoney = useLocales((state) => state.formatMoney);
  const queryClient = useQueryClient();
  const [checkoutVisible, setCheckoutVisible] = useState(false);

  const handleCheckoutExit = async () => {
    setCheckoutVisible(false);
    await queryClient.invalidateQueries({
      predicate: (q) => q.queryKey.includes("passes"),
    });
  };

  return (
    <>
      <PassCardLayout
        photoUrl={pass.photoUrl}
        title={pass.name}
        teacher={teacher ? { avatarUrl: teacher.avatarUrl } : null}
        stats={[
          { label: "SESSIONS", value: String(pass.sessions) },
          { label: "VALID", value: `${pass.expiryDays} days` },
          { label: "PRICE", value: formatMoney(pass.price) },
        ]}
        action={
          <Button label="Purchase" onPress={() => setCheckoutVisible(true)} />
        }
      />
      <PassCheckout
        visible={checkoutVisible}
        onExit={handleCheckoutExit}
        pass={pass}
        teacherName={teacher?.fullName}
      />
    </>
  );
}

interface PassSummaryCardProps {
  pass: PassType;
  purchaseCount?: number;
  teacher?: Pick<ProfileType, "avatarUrl"> | null;
  onPress?: () => void;
}

export function PassSummaryCard({
  pass,
  purchaseCount,
  teacher,
  onPress,
}: PassSummaryCardProps) {
  const formatMoney = useLocales((state) => state.formatMoney);

  return (
    <PassCardLayout
      photoUrl={pass.photoUrl}
      title={pass.name}
      teacher={teacher ? { avatarUrl: teacher.avatarUrl } : null}
      stats={[
        { label: "SESSIONS", value: String(pass.sessions) },
        { label: "VALID", value: `${pass.expiryDays} days` },
        { label: "PRICE", value: formatMoney(pass.price, pass.currency) },
      ]}
      action={
        purchaseCount !== undefined ? (
          <Button label={`${purchaseCount} sold`} disabled />
        ) : undefined
      }
      onPress={onPress}
    />
  );
}

const statusLabel = (
  status: PassPurchaseType["status"],
  remainingSessions: number,
): string => {
  if (status === PASS_PURCHASE_STATUS.SUCCEEDED && remainingSessions === 0) {
    return PASS_PURCHASE_STATUS.USED;
  }
  if (status === PASS_PURCHASE_STATUS.SUCCEEDED) return "Active";
  return status;
};

function usePassPurchaseDisplay(passPurchase: PassPurchaseCardData) {
  const formatMoney = useLocales((state) => state.formatMoney);

  const seller = passPurchase.seller ?? null;
  const expiresAt = passPurchase.expiresAt
    ? new Date(passPurchase.expiresAt)
    : null;
  const redeemable =
    passPurchase.status === PASS_PURCHASE_STATUS.SUCCEEDED &&
    passPurchase.remainingSessions > 0 &&
    !!expiresAt &&
    expiresAt.getTime() > Date.now();

  const stats: Stat[] = [
    {
      label: "SESSIONS",
      value: `${passPurchase.remainingSessions}/${passPurchase.sessions}`,
    },
  ];
  if (redeemable) {
    stats.push({ label: "VALID", value: formatExpiry(expiresAt, true) });
  }
  stats.push({ label: "PRICE", value: formatMoney(passPurchase.price) });

  return {
    seller,
    redeemable,
    stats,
    photoUrl: passPurchase.photoUrl,
    title: passPurchase.name,
    sellerSlot: seller ? { avatarUrl: seller.avatarUrl } : { avatarUrl: null },
  };
}

interface PassPurchaseCardProps {
  passPurchase: PassPurchaseCardData;
  onPress?: () => void;
  showAction?: boolean;
}

export function PassPurchaseCard({
  passPurchase,
  onPress,
  showAction = true,
}: PassPurchaseCardProps) {
  const { seller, redeemable, stats, photoUrl, title, sellerSlot } =
    usePassPurchaseDisplay(passPurchase);

  const action = showAction ? (
    redeemable && seller ? (
      <Button
        label="Redeem"
        onPress={() => router.navigate(`/teacher/${seller.id}`)}
      />
    ) : (
      <Button
        label={statusLabel(passPurchase.status, passPurchase.remainingSessions)}
        disabled
      />
    )
  ) : undefined;

  return (
    <PassCardLayout
      photoUrl={photoUrl}
      title={title}
      teacher={sellerSlot}
      stats={stats}
      action={action}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    height: theme.gap(28),
    borderRadius: theme.gap(2),
    overflow: "hidden",
  },
  background: {
    ...StyleSheet.absoluteFill,
  },
  fallback: {
    backgroundColor: theme.colors.dimmed,
  },
  overlay: {
    flex: 1,
    padding: theme.gap(2),
    justifyContent: "space-between",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
  },
  grow: {
    flex: 1,
  },
  bottomGroup: {
    gap: theme.gap(0.5),
  },
  statsRow: {
    flexDirection: "row",
    gap: theme.gap(3),
  },
}));
