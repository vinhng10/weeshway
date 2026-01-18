import {
  Avatar,
  Boundary,
  ChipBar,
  ChipBarItemProps,
  ProjectStatus,
  SectionListView,
  Tile,
} from "@/components";
import { STRIPE_PAYMENT_STATUS, TIME } from "@/constants";
import { useAuth, useSuspenseInfiniteQuery } from "@/hooks";
import { BookingEnrichedType, ProjectEnrichedType, TimeType } from "@/types";
import { router } from "expo-router";
import React, { useState } from "react";
import { SectionListData, View } from "react-native";
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
        song:songs(*), 
        location:locations(*), 
        bookings:bookings(*)
      )
    `,
    pageSize: 10,
    trailingQuery: (query) => {
      query = query
        .eq("user_id", profile?.id)
        .in("status", [
          STRIPE_PAYMENT_STATUS.SUCCEEDED,
          STRIPE_PAYMENT_STATUS.REFUNDING,
          STRIPE_PAYMENT_STATUS.REFUNDED,
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

  const projects = bookings.map((booking) => booking.project);

  const renderTile = (data: ProjectEnrichedType): React.ReactElement => (
    <Tile
      imageSource={data.song.artworkUrl}
      title={data.song.name}
      subtitle={data.song.artistName}
      metadata={`${data.style} • ${data.level}`}
      previewUrl={data.song.previewUrl}
      avatar={
        <Avatar source={data.profile.avatarUrl} shape="circle" bordered />
      }
      status={<ProjectStatus data={data} />}
      onPress={() => router.navigate(`./classes/${data.id}`)}
    />
  );

  const sections: SectionListData<ProjectEnrichedType>[] = [
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
      <ChipBar padding items={options} />
      <Boundary>
        <BookingsContent time={time} />
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
