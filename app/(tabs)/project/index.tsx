import { Boundary } from "@/components/boundary";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { ChipBar, ChipBarItemProps } from "@/components/chip-bar";
import { SectionListView } from "@/components/section-list";
import { Tile } from "@/components/tile";
import { IconSymbolName } from "@/components/ui/icon-symbol";
import { LevelEnum, ProjectStatusEnum, StyleEnum } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { useSuspenseInfiniteQuery } from "@/hooks/useSuspenseInfiniteQuery";
import { ProjectEnrichedType } from "@/types";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { SectionListData, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function ProjectsContent() {
  const [status, setStatus] = useState<ProjectStatusEnum | undefined>();
  const [style, setStyle] = useState<StyleEnum | undefined>();
  const [level, setLevel] = useState<LevelEnum | undefined>();
  const profile = useAuth((state) => state.profile);

  const { data, hasNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery<ProjectEnrichedType>({
      queryKey: ["projects", status, style, level],
      tableName: "projects",
      columns: `*, song:songs(*)`,
      pageSize: 10,
      trailingQuery: (query) => {
        let builder = query
          .eq("user_id", profile?.id)
          .order("created_at", { ascending: false });

        if (status) {
          builder = builder.eq("status", status);
        }
        if (style) {
          builder = builder.eq("style", style);
        }
        if (level) {
          builder = builder.eq("level", level);
        }

        return builder;
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
    return {
      thisWeekProjects: data.slice(0, 2),
      otherProjects: data.slice(2),
    };
  }, [data]);

  const renderTile = (data: ProjectEnrichedType): React.ReactElement => {
    let icon: IconSymbolName | undefined = undefined;
    let label = "";
    if (data.status === ProjectStatusEnum.Draft) {
      icon = "heart";
      label = `10`;
    }
    if (data.status === ProjectStatusEnum.Release) {
      icon = "person.fill";
      label = `5 | ${data.spots}`;
    }
    return (
      <Tile
        imageSource={data.song.artworkUrl}
        title={data.song.name ?? data.name}
        subtitle={data.song.artistName ?? ""}
        metadata={`${data.style} • ${data.level}`}
        previewUrl={data.song.previewUrl}
        rightContent={
          <>
            {icon && <Chip color="highlight" icon={icon} label={label} />}
            <Chip color="light" label={data.status} />
          </>
        }
        onPress={() => router.push(`/(tabs)/project/${data.id}`)}
      />
    );
  };

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
        onPress={() => router.push("/(tabs)/project/create")}
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
