import AudioStudio from "@/components/AudioStudio";
import React, { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";

export default function ProjectDetailScreen() {
  const params = useLocalSearchParams<{
    projectId?: string | string[];
    playbackType?: string | string[];
    autoplay?: string | string[];
  }>();

  const { projectId, playbackType, autoplay } = params;

  const resolvedProjectId = useMemo(() => {
    if (Array.isArray(projectId)) return projectId[0];
    return projectId ?? "";
  }, [projectId]);

  const normalizedPlaybackType = useMemo<"music" | "count">(() => {
    const value = Array.isArray(playbackType) ? playbackType[0] : playbackType;
    return value === "count" ? "count" : "music";
  }, [playbackType]);

  const shouldAutoplay = useMemo(() => {
    const value = Array.isArray(autoplay) ? autoplay[0] : autoplay;
    return value === "1" || value === "true";
  }, [autoplay]);

  if (!resolvedProjectId) {
    return null;
  }

  return (
    <AudioStudio
      projectId={resolvedProjectId}
      initialType={normalizedPlaybackType}
      autoPlay={shouldAutoplay}
    />
  );
}
