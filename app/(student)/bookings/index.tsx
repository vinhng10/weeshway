import {
  Avatar,
  Boundary,
  ChipBar,
  ChipBarItemProps,
  ProjectStatus,
  SectionListView,
  Tile,
} from "@/components";
import { StripePaymentStatusEnum, TimeEnum } from "@/constants";
import { useAuth, useSuspenseInfiniteQuery } from "@/hooks";
import { BookingEnrichedType, ProjectEnrichedType } from "@/types";
import { router } from "expo-router";
import React, { useState } from "react";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function BookingsContent() {
  const profile = useAuth((state) => state.profile);
  const [time, setTime] = useState<TimeEnum>(TimeEnum.Today);

  const {
    data: bookings,
    hasNextPage,
    fetchNextPage,
  } = useSuspenseInfiniteQuery<BookingEnrichedType>({
    queryKey: ["classes", "bookings", profile?.id, time],
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
        .eq("status", StripePaymentStatusEnum.Succeeded);

      const now = new Date();
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const nowISO = now.toISOString();
      const todayEndISO = todayEnd.toISOString();

      if (time === TimeEnum.Upcoming) {
        query = query.gt("project.start_at", todayEndISO);
      } else if (time === TimeEnum.Past) {
        query = query.lt("project.end_at", nowISO);
      } else if (time === TimeEnum.Today) {
        query = query
          .lte("project.start_at", todayEndISO)
          .gte("project.end_at", nowISO);
      }

      query = query.order("created_at", { ascending: false });
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
      rightContent={
        <>
          <Avatar source={data.profile.avatarUrl} shape="circle" bordered />
          <ProjectStatus data={data} />
        </>
      }
      onPress={() => router.push(`/(student)/classes/${data.id}`)}
    />
  );

  const options: ChipBarItemProps[] = [
    {
      label: "Time",
      value: time,
      options: TimeEnum,
      modal: false,
      onValueChange: setTime,
    },
  ];

  const sections: SectionListData<ProjectEnrichedType>[] = [
    {
      title: "Bookings",
      data: projects,
      render: renderTile,
    },
  ];

  return (
    <View style={styles.container}>
      <ChipBar padding items={options} />
      <SectionListView
        sections={sections}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
      />
    </View>
  );
}

export default function Bookings() {
  return (
    <Boundary>
      <BookingsContent />
    </Boundary>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
  },
}));
