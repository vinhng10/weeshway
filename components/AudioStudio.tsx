import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as DocumentPicker from "expo-document-picker";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const PIXELS_PER_SECOND = 30;

interface AudioSegment {
  id: string;
  startTime: number;
  endTime: number;
  selected: boolean;
}

export default function AudioStudio() {
  const [audioSource, setAudioSource] = useState<string | null>(null);
  const player = useAudioPlayer(audioSource ? { uri: audioSource } : null);
  const status = useAudioPlayerStatus(player);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isManualScrolling, setIsManualScrolling] = useState(false);
  const [displayTime, setDisplayTime] = useState<number>(0);
  const scrollTimeoutRef = useRef<number | null>(null);
  const [segments, setSegments] = useState<AudioSegment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);

  // Use actual audio duration, fallback to 0 if not available
  const duration = status.duration || 0;
  const timelineWidth = duration * PIXELS_PER_SECOND;

  // Initialize segments when audio is loaded
  useEffect(() => {
    if (duration > 0 && segments.length === 0) {
      setSegments([
        {
          id: `segment-${Date.now()}`,
          startTime: 0,
          endTime: duration,
          selected: false,
        },
      ]);
    }
  }, [duration]);

  // Auto-scroll based on playback time and update display time
  useEffect(() => {
    if (player.playing && !isManualScrolling && duration > 0) {
      const interval = setInterval(() => {
        const currentTime = player.currentTime || 0;
        const scrollPosition = currentTime * PIXELS_PER_SECOND;

        // Update display time to match playback
        setDisplayTime(currentTime);

        scrollViewRef.current?.scrollTo({
          x: scrollPosition,
          animated: false, // Use false for smoother continuous scrolling
        });

        // Handle segment-based playback
        const selectedSegments = getSelectedSegments();
        if (selectedSegments.length > 0) {
          const currentSegment = selectedSegments[currentSegmentIndex];

          if (currentSegment && currentTime >= currentSegment.endTime) {
            // Move to next selected segment
            const nextIndex = currentSegmentIndex + 1;
            if (nextIndex < selectedSegments.length) {
              const nextSegment = selectedSegments[nextIndex];
              player.seekTo(nextSegment.startTime);
              setCurrentSegmentIndex(nextIndex);
            } else {
              // Finished all selected segments
              player.pause();
              setCurrentSegmentIndex(0);
            }
          }
        }
      }, 10);

      return () => clearInterval(interval);
    }
  }, [
    player.playing,
    isManualScrolling,
    duration,
    currentSegmentIndex,
    segments,
  ]);

  // Reset when audio finishes
  useEffect(() => {
    if (status.didJustFinish) {
      player.pause();
    }
  }, [status.didJustFinish]);

  // Handle scroll events
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!isManualScrolling) return;

    const scrollPosition = event.nativeEvent.contentOffset.x;

    // Calculate and update display time in real-time
    if (duration > 0 && timelineWidth > 0) {
      const playbackTime = (scrollPosition / timelineWidth) * duration;
      const clampedTime = Math.max(0, Math.min(playbackTime, duration));
      setDisplayTime(clampedTime);
    }
  };

  const handleScrollBegin = () => {
    setIsManualScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;

    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Wait a bit before seeking to avoid too many seeks during momentum scroll
    scrollTimeoutRef.current = setTimeout(() => {
      if (duration > 0 && timelineWidth > 0) {
        const playbackTime = (scrollPosition / timelineWidth) * duration;
        const clampedTime = Math.max(0, Math.min(playbackTime, duration));
        player.seekTo(clampedTime);
      }
      setIsManualScrolling(false);
    }, 100);
  };

  const loadAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const { uri } = result.assets[0];
        setAudioSource(uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load audio file");
      console.error("Error loading audio:", error);
    }
  };

  const togglePlayback = () => {
    try {
      if (player.playing) {
        player.pause();
      } else {
        const selectedSegments = getSelectedSegments();

        if (selectedSegments.length > 0) {
          // Start from the first selected segment
          const firstSegment = selectedSegments[0];
          player.seekTo(firstSegment.startTime);
          setCurrentSegmentIndex(0);
        }

        player.play();
      }
    } catch (error) {
      console.error("Playback error:", error);
    }
  };

  const handleSplit = () => {
    const splitTime = displayTime;

    // Find the segment that contains the current time
    const segmentIndex = segments.findIndex(
      (seg) => splitTime > seg.startTime && splitTime < seg.endTime
    );

    if (segmentIndex === -1) {
      Alert.alert(
        "Cannot Split",
        "Please position the cursor within a segment to split it."
      );
      return;
    }

    const segmentToSplit = segments[segmentIndex];

    // Create two new segments
    const newSegments = [...segments];
    newSegments.splice(
      segmentIndex,
      1,
      {
        id: `segment-${Date.now()}-1`,
        startTime: segmentToSplit.startTime,
        endTime: splitTime,
        selected: false,
      },
      {
        id: `segment-${Date.now()}-2`,
        startTime: splitTime,
        endTime: segmentToSplit.endTime,
        selected: false,
      }
    );

    setSegments(newSegments);
  };

  const handleMerge = () => {
    // Find indices of selected segments
    const selectedIndices = segments
      .map((segment, index) => (segment.selected ? index : -1))
      .filter((index) => index !== -1)
      .sort((a, b) => a - b);

    // Need at least two segments to merge
    if (selectedIndices.length < 2) return;

    // Check if all selected segments are consecutive
    for (let i = 1; i < selectedIndices.length; i++) {
      if (selectedIndices[i] !== selectedIndices[i - 1] + 1) {
        // Non-consecutive segments selected; do nothing
        return;
      }
    }

    // Get the segments to merge
    const firstIndex = selectedIndices[0];
    const lastIndex = selectedIndices[selectedIndices.length - 1];
    const segmentsToMerge = segments.slice(firstIndex, lastIndex + 1);

    // Create merged segment
    const merged: AudioSegment = {
      id: `segment-${Date.now()}`,
      startTime: segmentsToMerge[0].startTime,
      endTime: segmentsToMerge[segmentsToMerge.length - 1].endTime,
      selected: true,
    };

    // Create new segments array with merged segment
    const newSegments = [
      ...segments.slice(0, firstIndex),
      merged,
      ...segments.slice(lastIndex + 1),
    ];

    setSegments(newSegments);
  };

  const toggleSegmentSelection = (segmentId: string) => {
    setSegments((prevSegments) =>
      prevSegments.map((seg) =>
        seg.id === segmentId ? { ...seg, selected: !seg.selected } : seg
      )
    );
  };

  const getSelectedSegments = () => {
    return segments
      .filter((seg) => seg.selected)
      .sort((a, b) => a.startTime - b.startTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      {/* Main Display Area */}
      <View style={styles.displayArea}>
        <Text style={styles.text}>Placeholder</Text>
      </View>

      {/* Control Bar */}
      <View style={styles.controlBar}>
        <TouchableOpacity style={styles.controlButton} onPress={loadAudioFile}>
          <Ionicons name="musical-notes" size={26} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={togglePlayback}>
          <Ionicons
            name={player.playing ? "stop" : "play"}
            size={26}
            color="white"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={handleSplit}>
          <Ionicons name="cut" size={26} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={handleMerge}>
          <Ionicons name="git-merge" size={26} color="white" />
        </TouchableOpacity>
      </View>

      {/* Timeline */}
      <View style={styles.timelineContainer}>
        {/* Timestamp at top-right corner of track (shares style with time labels) */}
        <View style={styles.timestampContainer}>
          <Text style={styles.labelText}>
            {formatTime(displayTime)}/{formatTime(status.duration || 0)}
          </Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          onScrollBeginDrag={handleScrollBegin}
          onScrollEndDrag={handleScrollEnd}
          onMomentumScrollEnd={handleScrollEnd}
        >
          <View style={styles.timelineWrapper}>
            <View style={styles.spacer} />
            <View style={styles.timelineContent}>
              {/* Top ticks row aligned with the timestamp container */}
              <View style={[styles.ticksRow, { width: timelineWidth }]}>
                {duration > 0 &&
                  Array.from(
                    { length: Math.floor(duration / 5) + 1 },
                    (_, index) => {
                      const time = index * 5;
                      const position = time * PIXELS_PER_SECOND;

                      return (
                        <View
                          key={index}
                          style={[styles.marker, { left: position }]}
                        >
                          <Text style={styles.labelText}>
                            {formatTime(time)}
                          </Text>
                        </View>
                      );
                    }
                  )}
              </View>

              {/* Timeline track - segments */}
              <View style={[styles.track, { width: timelineWidth }]}>
                {segments.map((segment, index) => {
                  const segmentStart = segment.startTime * PIXELS_PER_SECOND;
                  const segmentWidth =
                    (segment.endTime - segment.startTime) * PIXELS_PER_SECOND;

                  return (
                    <Pressable
                      key={segment.id}
                      style={[
                        styles.segment,
                        segment.selected && styles.segmentSelected,
                        {
                          left: segmentStart,
                          width: segmentWidth,
                        },
                      ]}
                      onPress={() => toggleSegmentSelection(segment.id)}
                    ></Pressable>
                  );
                })}
              </View>
            </View>
            <View style={styles.spacer} />
          </View>
        </ScrollView>

        {/* Cursor */}
        <View style={styles.cursor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  displayArea: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  controlBar: {
    height: 50,
    backgroundColor: "#222",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  controlButton: {
    minHeight: "100%",
    minWidth: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  timelineContainer: {
    height: 200,
  },
  timelineWrapper: {
    flexDirection: "row",
  },
  timelineContent: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "stretch",
  },
  ticksRow: {
    height: 24,
    position: "relative",
    top: 6,
  },
  spacer: {
    width: screenWidth / 2,
  },
  track: {
    top: 26,
    height: 60,
    position: "relative",
    overflow: "hidden",
  },
  segment: {
    position: "absolute",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#1a3a1a",
    borderWidth: 3,
    borderColor: "#2a5a2a",
  },
  segmentSelected: {
    borderColor: "#ffffff",
    borderWidth: 3,
  },
  marker: {
    position: "absolute",
    top: 0,
    height: "100%",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  labelText: {
    color: "#c9c9c9",
    fontSize: 12,
    fontWeight: "600",
  },
  timestampContainer: {
    position: "absolute",
    top: 6,
    right: 12,
    zIndex: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  text: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  cursor: {
    position: "absolute",
    top: 40,
    bottom: 0,
    left: "50%",
    width: 2,
    backgroundColor: "#ffffff",
    zIndex: 10,
  },
});
