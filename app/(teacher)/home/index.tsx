import {
  Boundary,
  formatTime,
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
import { router } from "expo-router";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function HomeContent() {
  const profile = useAuth((state) => state.profile);
  const formatMoney = useLocales((state) => state.formatMoney);
  const exchangeMoney = useLocales((state) => state.exchangeMoney);

  const {
    data: projects,
    hasNextPage,
    fetchNextPage,
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
        .eq("status", PROJECT_STATUS.RELEASE)
        .lte("start_at", todayEnd.toISOString())
        .gte("end_at", now.toISOString())
        .order("start_at", { ascending: true });
      return query;
    },
  });

  const { data: stats } = useSuspenseQuery<StatsType[][]>({
    queryKey: ["projects", "stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stats")
        .select("*")
        .eq("user_id", profile?.id);

      if (error) throw error;
      return [data];
    },
  });

  const renderStats = (data: StatsType[]) => {
    let totalEarnings = 0;
    let bookingCount = 0;

    for (let i = 0; i < data.length; i++) {
      const stats = data[i];
      totalEarnings += exchangeMoney(stats.totalEarnings, stats.currency);
      bookingCount += stats.bookingCount;
    }

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
      imageSource={data.song.artworkUrl}
      title={data.song.name}
      subtitle={data.location?.displayName}
      metadata={`${formatTime(new Date(data.startAt!))} - ${formatTime(
        new Date(data.endAt!)
      )}`}
      previewUrl={data.song.previewUrl}
      rightContent={<ProjectStatus data={data} />}
      onPress={() => router.push(`/(teacher)/projects/${data.id}`)}
    />
  );

  const sections: SectionListData<ProjectEnrichedType | StatsType[]>[] = [
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
    <View style={styles.container}>
      <ThemedText type="h1" style={styles.greeting}>
        Hello, {profile?.fullName}!
      </ThemedText>
      <SectionListView
        sections={sections}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
      />
    </View>
  );
}

export default function Home() {
  return (
    <Boundary>
      <HomeContent />
    </Boundary>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
  },
  greeting: {
    paddingHorizontal: theme.gap(2),
  },
  statsContainer: {
    justifyContent: "center",
    paddingVertical: theme.gap(2),
    paddingHorizontal: theme.gap(1),
    backgroundColor: theme.colors.foreground,
    borderRadius: theme.gap(2),
    gap: theme.gap(1),
  },
}));
