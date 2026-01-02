import { Avatar } from "@/components/avatar";
import { Boundary } from "@/components/boundary";
import { FloatBoxInput, IntBoxInput } from "@/components/input";
import { ProjectStatus } from "@/components/project-status";
import { SectionListView } from "@/components/section-list";
import { Tile } from "@/components/tile";
import { useAuth } from "@/hooks/useAuth";
import { useLocales } from "@/hooks/useLocales";
import { useSuspenseInfiniteQuery } from "@/hooks/useSuspenseInfiniteQuery";
import { useSuspenseQuery } from "@/hooks/useSuspenseQuery";
import { supabase } from "@/supabase";
import { ProjectEnrichedType, StatsType } from "@/types";
import { router } from "expo-router";
import React from "react";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function HomeContent() {
  const profile = useAuth((state) => state.profile);
  const formatMoney = useLocales((state) => state.formatMoney);
  const exchangeMoney = useLocales((state) => state.exchangeMoney);

  const {
    data: todayClasses,
    hasNextPage,
    fetchNextPage,
  } = useSuspenseInfiniteQuery<ProjectEnrichedType>({
    queryKey: ["projects", "home", profile?.id],
    tableName: "projects",
    columns: `
      *, 
      profile:profiles(*), 
      song:songs(*),
      bookings:bookings(*)
    `,
    pageSize: 10,
    trailingQuery: (query) => {
      const now = new Date();
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      query = query
        .eq("user_id", profile?.id)
        .lte("start_at", todayEnd.toISOString())
        .gte("end_at", now.toISOString())
        .order("start_at", { ascending: true });
      return query;
    },
  });

  const { data: stats } = useSuspenseQuery<StatsType[][]>({
    queryKey: ["projects", "stats", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stats")
        .select("*")
        .eq("user_id", profile?.id);

      if (error) throw error;
      return [data];
    },
  });

  const renderStats = (data: StatsType[]): React.ReactElement => {
    let totalEarnings = 0;
    let bookingCount = 0;

    for (let i = 0; i < data.length; i++) {
      const stats = data[i];
      totalEarnings += exchangeMoney(stats.totalEarnings, stats.currency);
      bookingCount += stats.bookingCount;
    }

    return (
      <View style={styles.row}>
        <FloatBoxInput
          label="Earning"
          value={formatMoney(totalEarnings)}
          editable={false}
        />
        <IntBoxInput
          label="Bookings"
          value={bookingCount.toString()}
          editable={false}
        />
      </View>
    );
  };

  const renderTile = (data: ProjectEnrichedType): React.ReactElement => (
    <Tile
      imageSource={data.song.artworkUrl}
      title={data.song.name}
      subtitle={data.song.artistName}
      metadata={`${data.style} • ${data.level}`}
      previewUrl={data.song.previewUrl}
      rightContent={
        <>
          <Avatar source={data.profile.avatarUrl} shape="circle" bordered />
          <ProjectStatus data={data} />
        </>
      }
      onPress={() => router.push(`/(teacher)/projects/${data.id}`)}
    />
  );

  const sections: SectionListData<ProjectEnrichedType | StatsType[]>[] = [
    {
      title: `Overview`,
      data: stats,
      render: renderStats,
    },
    {
      title: "Today",
      data: todayClasses,
      render: renderTile,
    },
  ];

  return (
    <View style={styles.container}>
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
  row: {
    flexDirection: "row",
    gap: theme.gap(2),
  },
}));
