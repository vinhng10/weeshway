import {
  Boundary,
  NotificationsPermission,
  ProjectStatus,
  SectionListView,
  ThemedText,
  Tile,
} from "@/components";
import { PROJECT_STATUS } from "@/constants";
import {
  useAuth,
  useLocales,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from "@/hooks";
import { supabase } from "@/supabase";
import { ProjectEnrichedType, StatsType } from "@/types";
import { formatTime } from "@/utils";
import { router } from "expo-router";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function HomeContent() {
  const profile = useAuth((state) => state.profile);
  const formatMoney = useLocales((state) => state.formatMoney);
  const exchange = useLocales((state) => state.exchange);
  const currency = useLocales((state) => state.currency);
  const transactionFee = useLocales((state) => state.transactionFee);

  const {
    data: projects,
    hasNextPage,
    fetchNextPage,
    refetch: refetchProjects,
    isRefetching: isRefetchingProjects,
  } = useSuspenseInfiniteQuery<ProjectEnrichedType>({
    queryKey: ["projects", "home"],
    tableName: "projects",
    columns: `
      *, 
      profile:profiles(*), 
      song:songs(*),
      location:locations(*),
      bookings:bookings(*)
    `,
    pageSize: 10,
    trailingQuery: (query) => {
      const now = new Date();
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      query = query
        .eq("user_id", profile?.id)
        .eq("status", PROJECT_STATUS.RELEASED)
        .lte("start_at", todayEnd.toISOString())
        .gte("end_at", now.toISOString())
        .order("start_at", { ascending: true });
      return query;
    },
  });

  const {
    data: stats,
    refetch: refetchStats,
    isRefetching: isRefetchingStats,
  } = useSuspenseQuery({
    queryKey: ["projects", "stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("stats")
        .select("*")
        .eq("user_id", profile?.id)
        .throwOnError();
      return [data];
    },
  });

  const renderStats = (data: StatsType[]) => {
    const totalEarnings = data.reduce(
      (sum, s) =>
        sum +
        Math.round(
          exchange(s.totalEarnings, s.currency, currency) *
            (1 - transactionFee / 100),
        ),
      0,
    );
    const bookingCount = data.reduce((sum, s) => sum + s.bookingCount, 0);

    return (
      <View style={styles.statsContainer}>
        <ThemedText color="dimmed">Earnings This Month</ThemedText>
        <ThemedText type="h1" color="primary">
          {formatMoney(totalEarnings)}
        </ThemedText>
        <ThemedText type="h3" color="dimmed">
          {bookingCount} {bookingCount > 1 ? "bookings" : "booking"}
        </ThemedText>
      </View>
    );
  };

  const renderTile = (data: ProjectEnrichedType) => (
    <Tile
      imageSource={data.artworkUrl ?? data.song.artworkUrl}
      title={data.song.name}
      subtitle={data.location?.displayName}
      metadata={`${formatTime(new Date(data.startAt!))} - ${formatTime(
        new Date(data.endAt!),
      )}`}
      previewUrl={data.song.previewUrl}
      status={<ProjectStatus data={data} />}
      onPress={() => router.navigate(`./projects/${data.id}`)}
    />
  );

  const sections = [
    {
      title: "Overview",
      data: stats,
      render: renderStats,
    },
    {
      title: "Today's Classes",
      data: projects,
      render: renderTile,
    },
  ];

  return (
    <SectionListView
      sections={sections}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      refetch={() => {
        refetchProjects();
        refetchStats();
      }}
      isRefetching={isRefetchingProjects || isRefetchingStats}
    />
  );
}

export default function Home() {
  const profile = useAuth((state) => state.profile);
  return (
    <View style={styles.container}>
      <ThemedText type="h1" style={styles.greeting}>
        Hello {profile?.fullName}!
      </ThemedText>
      <Boundary>
        <HomeContent />
      </Boundary>
      <NotificationsPermission />
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top,
    backgroundColor: theme.colors.background,
  },
  greeting: {
    paddingHorizontal: theme.gap(2),
  },
  statsContainer: {
    justifyContent: "center",
    paddingVertical: theme.gap(1.5),
    paddingHorizontal: theme.gap(1),
    backgroundColor: theme.colors.foreground,
    borderRadius: theme.gap(2),
  },
}));
