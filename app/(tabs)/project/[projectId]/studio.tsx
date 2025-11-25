import { Header } from "@/components/header";
import { ControlBar, DisplayArea, Track } from "@/components/studio";
import { StudioItemEnum } from "@/constants";
import { createStudioStore } from "@/hooks/useStudioStore";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Studio() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const useStudioStore = useMemo(
    () => createStudioStore(Number(projectId)),
    [projectId]
  );
  const {
    songItems,
    countItems,
    toggle,
    split,
    merge,
    syncToServer,
    syncFromServer,
  } = useStudioStore();
  const [currentType, setCurrentType] = useState<StudioItemEnum>(
    StudioItemEnum.Song
  );

  useEffect(() => {
    syncFromServer();
    return () => {
      syncToServer();
    };
  }, []);

  const handleItemPress = (index: number) => {
    toggle(currentType, index);
  };

  const handleSplit = () => {
    split(currentType, 5);
  };

  const handleMerge = () => {
    merge(currentType);
  };

  const handleToggleType = () => {
    setCurrentType((prev) =>
      prev === StudioItemEnum.Song ? StudioItemEnum.Count : StudioItemEnum.Song
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header title="Studio" />

      <View style={styles.studioContainer}>
        <DisplayArea recognizing={true} transcript={""} />

        <ControlBar
          type={currentType}
          isPlaying={false}
          wakeWordEnabled={false}
          onLoadAudio={() => {}}
          onTogglePlayback={() => {}}
          onSplit={handleSplit}
          onMerge={handleMerge}
          onToggleWakeWord={() => {}}
          onToggleType={handleToggleType}
        />

        <View style={styles.tracksContainer}>
          <Track items={songItems} onItemPress={handleItemPress} />
          <Track items={countItems} onItemPress={handleItemPress} />
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
