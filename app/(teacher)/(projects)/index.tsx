import {
  Boundary,
  Button,
  ChipBar,
  ChipBarItemProps,
  ProjectStatus,
  Search,
  SectionListView,
  Tile,
} from "@/components";
import {
  BOOKING_ACTIVE_STATUSES,
  LEVEL,
  PROJECT_STATUS,
  STYLE,
} from "@/constants";
import { useAuth, useSuspenseInfiniteQuery } from "@/hooks";
import {
  LevelType,
  ProjectEnrichedType,
  ProjectStatusType,
  StyleType,
} from "@/types";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface ProjectsContentProps {
  status?: ProjectStatusType;
  style?: StyleType;
  level?: LevelType;
}

function ProjectsContent({ status, style, level }: ProjectsContentProps) {
  const profile = useAuth((state) => state.profile);

  const { data, hasNextPage, fetchNextPage, refetch, isRefetching } =
    useSuspenseInfiniteQuery<ProjectEnrichedType>({
      queryKey: ["projects", status, style, level],
      tableName: "projects",
      columns: `
        *,
        song:songs(id, name, artist_name, preview_url, artwork_url),
        bookings:bookings(*),
        watchings:watchings(*)
      `,
      trailingQuery: (query) => {
        query = query
          .eq("user_id", profile?.id)
          .in("bookings.status", BOOKING_ACTIVE_STATUSES)
          .order("updated_at", { ascending: false });
        if (status) query = query.eq("status", status);
        else query = query.neq("status", PROJECT_STATUS.DELETED);
        if (style) query = query.eq("style", style);
        if (level) query = query.eq("level", level);
        return query;
      },
    });

  // Filter projects by date for "This Week" section
  const { thisWeekProjects, otherProjects } = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const thisWeekProjects: ProjectEnrichedType[] = [];
    const otherProjects: ProjectEnrichedType[] = [];

    for (const project of data) {
      if (!project.startAt) {
        otherProjects.push(project);
        continue;
      }

      const startAt = new Date(project.startAt);
      if (startAt >= startOfWeek && startAt <= endOfWeek) {
        thisWeekProjects.push(project);
      } else {
        otherProjects.push(project);
      }
    }

    return { thisWeekProjects, otherProjects };
  }, [data]);

  const renderTile = (data: ProjectEnrichedType): React.ReactElement => (
    <Tile
      imageSource={data.artworkUrl ?? data.song.artworkUrl}
      title={data.song.name}
      subtitle={data.song.artistName ?? ""}
      metadata={[data.style, data.level].filter(Boolean).join(" • ")}
      previewUrl={data.song.previewUrl}
      status={<ProjectStatus data={data} />}
      onPress={() => router.navigate(`./projects/${data.id}`)}
    />
  );

  const sections = [
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
    <>
      <SectionListView
        sections={sections}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        refetch={refetch}
        isRefetching={isRefetching}
      />

      <Button
        stickyBottom
        label="Create Project"
        onPress={() => router.navigate("./create")}
      />
    </>
  );
}

export default function Projects() {
  const [status, setStatus] = useState<ProjectStatusType>();
  const [style, setStyle] = useState<StyleType>();
  const [level, setLevel] = useState<LevelType>();

  const options: ChipBarItemProps[] = [
    {
      label: "Status",
      value: status,
      options: PROJECT_STATUS,
      modal: true,
      onValueChange: setStatus,
    },
    {
      label: "Style",
      value: style,
      options: STYLE,
      modal: true,
      onValueChange: setStyle,
    },
    {
      label: "Level",
      value: level,
      options: LEVEL,
      modal: true,
      onValueChange: setLevel,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Search rpc="search_projects" />
        <ChipBar items={options} />
      </View>
      <Boundary>
        <ProjectsContent status={status} style={style} level={level} />
      </Boundary>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top,
    backgroundColor: theme.colors.background,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: theme.gap(2),
    paddingVertical: theme.gap(1),
    gap: theme.gap(1),
  },
}));
