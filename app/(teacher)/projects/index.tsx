import {
  Boundary,
  Button,
  ChipBar,
  ChipBarItemProps,
  ProjectStatus,
  SectionListView,
  Tile,
} from "@/components";
import {
  LevelEnum,
  ProjectStatusEnum,
  StripePaymentStatusEnum,
  StyleEnum,
} from "@/constants";
import { useAuth, useSuspenseInfiniteQuery } from "@/hooks";
import { ProjectEnrichedType } from "@/types";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function ProjectsContent() {
  const [status, setStatus] = useState<ProjectStatusEnum>();
  const [style, setStyle] = useState<StyleEnum>();
  const [level, setLevel] = useState<LevelEnum>();
  const profile = useAuth((state) => state.profile);

  const { data, hasNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery<ProjectEnrichedType>({
      queryKey: ["projects", status, style, level],
      tableName: "projects",
      columns: `*, song:songs(*), bookings:bookings(*)`,
      pageSize: 10,
      trailingQuery: (query) => {
        query = query
          .eq("user_id", profile?.id)
          .eq("bookings.status", StripePaymentStatusEnum.Succeeded)
          .order("updated_at", { ascending: false });
        if (status) query = query.eq("status", status);
        if (style) query = query.eq("style", style);
        if (level) query = query.eq("level", level);
        return query;
      },
    });

  const options: ChipBarItemProps[] = [
    {
      label: "Status",
      value: status,
      options: ProjectStatusEnum,
      modal: true,
      onValueChange: setStatus,
    },
    {
      label: "Style",
      value: style,
      options: StyleEnum,
      modal: true,
      onValueChange: setStyle,
    },
    {
      label: "Level",
      value: level,
      options: LevelEnum,
      modal: true,
      onValueChange: setLevel,
    },
  ];

  // Filter projects by date for "This Week" section
  const { thisWeekProjects, otherProjects } = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return data.reduce<{
      thisWeekProjects: ProjectEnrichedType[];
      otherProjects: ProjectEnrichedType[];
    }>(
      (acc, project) => {
        if (!project.startAt) {
          acc.otherProjects.push(project);
          return acc;
        }

        const startAt = new Date(project.startAt);
        const key =
          startAt >= startOfWeek && startAt <= endOfWeek
            ? "thisWeekProjects"
            : "otherProjects";
        acc[key].push(project);
        return acc;
      },
      { thisWeekProjects: [], otherProjects: [] }
    );
  }, [data]);

  const renderTile = (data: ProjectEnrichedType): React.ReactElement => (
    <Tile
      imageSource={data.song.artworkUrl}
      title={data.song.name ?? data.name}
      subtitle={data.song.artistName ?? ""}
      metadata={`${data.style} • ${data.level}`}
      previewUrl={data.song.previewUrl}
      rightContent={<ProjectStatus data={data} />}
      onPress={() => router.push(`/(teacher)/projects/${data.id}`)}
    />
  );

  const sections: SectionListData<ProjectEnrichedType>[] = [
    {
      title: "This Week",
      data: thisWeekProjects,
      render: renderTile,
    },
    {
      title: "Projects",
      data: otherProjects,
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

      <Button
        stickyBottom
        label="Create Project"
        onPress={() => router.push("/(teacher)/projects/create")}
      />
    </View>
  );
}

export default function Projects() {
  return (
    <Boundary>
      <ProjectsContent />
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
