import { Header } from "@/components/header";
import { ControlBar, DisplayArea, Track } from "@/components/studio";
import { projects } from "@/mocks/projects";
import { ItemType } from "@/types";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Studio() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const project = useMemo(
    () => projects.find((p) => p.id === Number(projectId)),
    [projectId]
  );

  const [musicItems, setMusicItems] = useState<ItemType[]>(
    project?.music ?? []
  );
  const [countItems, setCountItems] = useState<ItemType[]>(
    project?.count ?? []
  );

  useEffect(() => {
    if (project?.music) {
      setMusicItems(project.music);
    }
    if (project?.count) {
      setCountItems(project.count);
    }
  }, [projectId, project?.music, project?.count]);

  const handleMusicItemPress = (index: number) => {
    setMusicItems((prevItems) => {
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
          type="music"
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
          <Track items={musicItems} onItemPress={handleMusicItemPress} />
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
