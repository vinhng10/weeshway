import {
  Boundary,
  ChipBar,
  ChipBarItemProps,
  Search,
  SectionListView,
  Tile,
} from "@/components";
import { BOOKING_STATUS, TIME } from "@/constants";
import { useAuth, useSuspenseInfiniteQuery } from "@/hooks";
import { BookingEnrichedType, ProjectEnrichedType, TimeType } from "@/types";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";

import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface BookingsContentProps {
  time?: TimeType;
}

function BookingsContent({ time }: BookingsContentProps) {
  const profile = useAuth((state) => state.profile);

  const {
    data: bookings,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useSuspenseInfiniteQuery<BookingEnrichedType>({
    queryKey: ["classes", "bookings", time],
    tableName: "bookings",
    columns: `
      *, project:projects!inner(
        *, 
        profile:profiles(*), 
        song:songs(id, name, artist_name, preview_url, artwork_url),
        location:locations(*), 
        bookings:bookings(*)
      )
    `,
    trailingQuery: (query) => {
      query = query
        .eq("user_id", profile?.id)
        .in("status", [
          BOOKING_STATUS.SUCCEEDED,
          BOOKING_STATUS.CHECKED_IN,
          BOOKING_STATUS.TRANSFERRED,
          BOOKING_STATUS.REFUNDING,
          BOOKING_STATUS.REFUNDED,
        ]);

      const now = new Date();
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const nowISO = now.toISOString();
      const todayEndISO = todayEnd.toISOString();

      if (time === TIME.UPCOMING) {
        query = query.gt("project.start_at", todayEndISO);
      } else if (time === TIME.PAST) {
        query = query.lt("project.end_at", nowISO);
      } else if (time === TIME.TODAY) {
        query = query
          .lte("project.start_at", todayEndISO)
          .gte("project.end_at", nowISO);
      }

      return query;
    },
  });

  const projects = useMemo(
    () => bookings.map((booking) => booking.project),
    [bookings],
  );

  const renderTile = useCallback(
    (data: ProjectEnrichedType): React.ReactElement => (
      <Tile
        imageSource={data.artworkUrl ?? data.song.artworkUrl}
        title={data.song.name}
        subtitle={data.song.artistName}
        metadata={[data.style, data.level].filter(Boolean).join(" • ")}
        previewUrl={data.song.previewUrl}
        avatars={data.profile.avatarUrl ? [data.profile.avatarUrl] : undefined}
        stats={data}
        onPress={() => router.navigate(`./classes/${data.id}`)}
      />
    ),
    [],
  );

  const sections = [
    {
      title: "Bookings",
      data: projects,
      render: renderTile,
    },
  ];

  return (
    <SectionListView
      sections={sections}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      refetch={refetch}
      isRefetching={isRefetching}
    />
  );
}

export default function Bookings() {
  const [time, setTime] = useState<TimeType>(TIME.TODAY);

  const options: ChipBarItemProps[] = [
    {
      label: "Time",
      value: time,
      options: TIME,
      modal: false,
      onValueChange: setTime,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Search rpc="search_bookings" />
        <ChipBar items={options} />
      </View>
      <Boundary>
        <BookingsContent time={time} />
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
}));
