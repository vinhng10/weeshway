import { Header } from "@/components/header";
import { ControlBar, DisplayArea, Track } from "@/components/studio";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabase";
import { ItemType, ProjectEnrichedType } from "@/types";
import { useQuery } from "@tanstack/react-query";
import camelcaseKeys from "camelcase-keys";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Studio() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const profile = useAuth((state) => state.profile);
  const isLoggedIn = useAuth((state) => state.isLoggedIn);

  const { data: project } = useQuery<ProjectEnrichedType>({
    queryKey: ["projects", projectId, "studio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`*, song:songs(song_url)`)
        .eq("id", projectId)
        .eq("user_id", profile?.id)
        .single();

      if (error) throw error;
      if (!data) return null;

      const result = camelcaseKeys(data, { deep: true });
      return result;
    },
    enabled: isLoggedIn && !!profile && !!projectId,
  });

  const [songItems, setSongItems] = useState<ItemType[]>([]);
  const [countItems, setCountItems] = useState<ItemType[]>([]);

  useEffect(() => {
    if (project?.songItems) {
      setSongItems(project.songItems);
    }
    if (project?.countItems) {
      setCountItems(project.countItems);
    }
  }, [project?.songItems, project?.countItems]);

  const handleSongItemPress = (index: number) => {
    setSongItems((prevItems) => {
      const newItems = [...prevItems];
      newItems[index] = {
        ...newItems[index],
        selected: !newItems[index].selected,
      };
      return newItems;
    });
  };

  const handleCountItemPress = (index: number) => {
    setCountItems((prevItems) => {
      const newItems = [...prevItems];
      newItems[index] = {
        ...newItems[index],
        selected: !newItems[index].selected,
      };
      return newItems;
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header title="Studio" />

      <View style={styles.studioContainer}>
        <DisplayArea recognizing={true} transcript={""} />

        <ControlBar
          type="song"
          isPlaying={false}
          wakeWordEnabled={false}
          onLoadAudio={() => {}}
          onTogglePlayback={() => {}}
          onSplit={() => {}}
          onMerge={() => {}}
          onToggleWakeWord={() => {}}
          onToggleType={() => {}}
        />

        <View style={styles.tracksContainer}>
          <Track items={songItems} onItemPress={handleSongItemPress} />
          <Track items={countItems} onItemPress={handleCountItemPress} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
  },
  studioContainer: {
    flex: 1,
  },
  tracksContainer: {
    flexDirection: "column",
    gap: theme.gap(2),
  },
}));
