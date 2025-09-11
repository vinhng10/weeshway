import {
  BuiltInKeywords,
  PorcupineManager,
} from "@picovoice/porcupine-react-native";
import { useAudioPlayer } from "expo-audio";
import * as DocumentPicker from "expo-document-picker";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet } from "react-native";
import { HapticTab } from "./HapticTab";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

export default function AudioPlayer() {
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [audioSource, setAudioSource] = useState<string | null>(null);
  const [wakeTriggerAt, setWakeTriggerAt] = useState<number | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [wasPlayingBeforeWakeWord, setWasPlayingBeforeWakeWord] =
    useState(false);
  const [originalVolume, setOriginalVolume] = useState<number | null>(null);

  // Volume ducking configuration (how much to reduce volume during speech recognition)
  const DUCKING_VOLUME = 0.2; // Reduce volume to 20% during speech recognition

  const player = useAudioPlayer(audioSource ? { uri: audioSource } : null);
  const porcupineRef = useRef<PorcupineManager | null>(null);
  const playerRef = useRef(player);

  // Replace with your Picovoice AccessKey
  const ACCESS_KEY = "";

  const formatTime = (milliseconds: number | null) => {
    if (!milliseconds) return "0:00";
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const pickAudioFile = async () => {
    try {
      setIsLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // Load new audio file
        setAudioSource(asset.uri);
        setFileName(asset.name);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load audio file");
      console.error("Error picking audio file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const pauseAudio = () => {
    try {
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to play/pause audio");
      console.error("Error playing/pausing audio:", error);
    }
  };

  const stopAudio = () => {
    try {
      player.pause();
      player.seekTo(0);
    } catch (error) {
      Alert.alert("Error", "Failed to stop audio");
      console.error("Error stopping audio:", error);
    }
  };

  const restartAudio = () => {
    try {
      player.seekTo(0);
      player.play();
    } catch (error) {
      Alert.alert("Error", "Failed to restart audio");
      console.error("Error restarting audio:", error);
    }
  };

  const handleTranscriptCommand = (text: string) => {
    const normalized = text.toLowerCase();
    if (normalized.includes("play the music")) {
      try {
        player.play();
      } catch (e) {
        console.error("Failed to play after command:", e);
      }
    } else if (normalized.includes("stop the music")) {
      stopAudio();
    }
  };

  const duckAudioVolume = () => {
    try {
      if (originalVolume === null) {
        // Store the current volume before ducking
        setOriginalVolume(player.volume || 1.0);
      }
      player.volume = DUCKING_VOLUME;
      console.log(`Audio volume ducked to ${DUCKING_VOLUME * 100}%`);
    } catch (error) {
      console.warn("Failed to duck audio volume:", error);
    }
  };

  const restoreAudioVolume = () => {
    try {
      if (originalVolume !== null) {
        player.volume = originalVolume;
        console.log(`Audio volume restored to ${originalVolume * 100}%`);
        setOriginalVolume(null);
      }
    } catch (error) {
      console.warn("Failed to restore audio volume:", error);
    }
  };

  const startSpeechRecognitionOnce = async () => {
    try {
      // Store if audio was playing before starting speech recognition
      const isCurrentlyPlaying = player.playing;
      setWasPlayingBeforeWakeWord(isCurrentlyPlaying);

      // Duck audio volume to reduce interference
      if (isCurrentlyPlaying) {
        duckAudioVolume();
      }

      // Stop Porcupine to free up audio input for speech recognition
      if (porcupineRef.current) {
        await porcupineRef.current.stop();
      }

      const permission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        console.warn("Speech permission not granted", permission);
        // Restart Porcupine if speech recognition failed to start
        if (porcupineRef.current) {
          await porcupineRef.current.start();
        }
        return;
      }
      const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
      if (!available) {
        console.warn("Speech recognition not available on this device");
        // Restart Porcupine if speech recognition failed to start
        if (porcupineRef.current) {
          await porcupineRef.current.start();
        }
        return;
      }

      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: false,
      });

      // Ensure audio continues playing if it was playing before
      if (isCurrentlyPlaying && !player.playing) {
        try {
          player.play();
        } catch (playError) {
          console.warn(
            "Failed to resume audio playback during speech recognition",
            playError
          );
        }
      }
    } catch (e) {
      console.warn("Failed to start speech recognition", e);
      // Restore volume if speech recognition failed
      restoreAudioVolume();
      // Restart Porcupine if speech recognition failed to start
      if (porcupineRef.current) {
        try {
          await porcupineRef.current.start();
        } catch (restartError) {
          console.warn(
            "Failed to restart Porcupine after speech recognition error",
            restartError
          );
        }
      }
    }
  };

  useSpeechRecognitionEvent("start", () => {
    setRecognizing(true);
    // Ensure audio continues playing during speech recognition with ducked volume
    if (wasPlayingBeforeWakeWord && !player.playing) {
      try {
        player.play();
      } catch (playError) {
        console.warn(
          "Failed to resume audio playback when speech recognition started",
          playError
        );
      }
    }
  });

  useSpeechRecognitionEvent("end", async () => {
    setRecognizing(false);
    if (transcript) {
      handleTranscriptCommand(transcript);
    }
    setTranscript("");

    // Restore original audio volume
    restoreAudioVolume();

    // Ensure audio continues playing if it was playing before wake word detection
    // (unless the voice command explicitly stopped it)
    if (
      wasPlayingBeforeWakeWord &&
      !player.playing &&
      !transcript.toLowerCase().includes("stop")
    ) {
      try {
        player.play();
      } catch (playError) {
        console.warn(
          "Failed to resume audio playback after speech recognition",
          playError
        );
      }
    }

    // Reset the state
    setWasPlayingBeforeWakeWord(false);

    // Restart Porcupine wake word detection after speech recognition ends
    if (porcupineRef.current) {
      try {
        await porcupineRef.current.start();
      } catch (restartError) {
        console.warn(
          "Failed to restart Porcupine after speech recognition ended",
          restartError
        );
      }
    }
  });
  useSpeechRecognitionEvent("result", (event) => {
    const next = event.results?.[0]?.transcript ?? "";
    setTranscript(next);
  });
  useSpeechRecognitionEvent("error", async (event) => {
    console.log("Speech error:", event.error, event.message);
    setRecognizing(false);
    setTranscript("");

    // Restore original audio volume
    restoreAudioVolume();

    // Restore audio playback if it was playing before wake word detection
    if (wasPlayingBeforeWakeWord && !player.playing) {
      try {
        player.play();
      } catch (playError) {
        console.warn(
          "Failed to resume audio playback after speech recognition error",
          playError
        );
      }
    }

    // Reset the state
    setWasPlayingBeforeWakeWord(false);

    // Restart Porcupine wake word detection after speech recognition error
    if (porcupineRef.current) {
      try {
        await porcupineRef.current.start();
      } catch (restartError) {
        console.warn(
          "Failed to restart Porcupine after speech recognition error",
          restartError
        );
      }
    }
  });

  // Keep a live ref to the current player instance
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  // Initialize Porcupine once an audio file is loaded
  useEffect(() => {
    const startPorcupine = async () => {
      if (!audioSource || porcupineRef.current || !ACCESS_KEY) return;
      try {
        const detectionCallback = (keywordIndex: number) => {
          // Wake word detected on native thread, signal JS thread
          setWakeTriggerAt(Date.now());
        };
        const processErrorCallback = (error: any) => {
          console.error("Porcupine error:", error);
        };
        porcupineRef.current = await PorcupineManager.fromBuiltInKeywords(
          ACCESS_KEY,
          [BuiltInKeywords.PORCUPINE, BuiltInKeywords.BUMBLEBEE],
          detectionCallback,
          processErrorCallback,
          undefined,
          [1.0, 1.0]
        );
        await porcupineRef.current.start();
      } catch (e) {
        console.error("Failed to initialize Porcupine:", e);
      }
    };
    startPorcupine();
  }, [audioSource, ACCESS_KEY]);

  // React to wake detection on JS thread: start speech recognition
  useEffect(() => {
    if (!wakeTriggerAt) return;
    const id = setTimeout(() => {
      startSpeechRecognitionOnce();
    }, 0);
    return () => clearTimeout(id);
  }, [wakeTriggerAt]);

  useEffect(() => {
    return () => {
      // cleanup wake word engine
      (async () => {
        try {
          if (porcupineRef.current) {
            await porcupineRef.current.stop();
            await porcupineRef.current.delete();
            porcupineRef.current = null;
          }
        } catch {}
      })();
    };
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Audio Player
      </ThemedText>

      <ThemedView style={styles.uploadSection}>
        <HapticTab
          style={[styles.button, styles.uploadButton]}
          onPress={pickAudioFile}
          disabled={isLoading}
        >
          <ThemedText style={styles.buttonText}>
            {isLoading ? "Loading..." : "Upload Audio File"}
          </ThemedText>
        </HapticTab>

        {isLoading && <ActivityIndicator size="small" style={styles.loader} />}
      </ThemedView>

      {audioSource && (
        <ThemedView style={styles.fileInfo}>
          <ThemedText type="subtitle" style={styles.fileName}>
            {fileName}
          </ThemedText>
          <ThemedText style={styles.timeInfo}>
            {formatTime(player.currentTime * 1000)} / {""}
            {formatTime(player.duration * 1000)}
          </ThemedText>
        </ThemedView>
      )}

      {recognizing && (
        <ThemedView style={styles.transcriptBox}>
          <ThemedText style={styles.transcriptText}>
            {transcript || "Listening..."}
          </ThemedText>
        </ThemedView>
      )}

      {audioSource && (
        <ThemedView style={styles.controlsSection}>
          <ThemedView style={styles.controlsRow}>
            <HapticTab
              style={[styles.button, styles.controlButton]}
              onPress={restartAudio}
            >
              <ThemedText style={styles.buttonText}>Restart</ThemedText>
            </HapticTab>

            <HapticTab
              style={[
                styles.button,
                styles.controlButton,
                styles.playPauseButton,
              ]}
              onPress={pauseAudio}
            >
              <ThemedText style={styles.buttonText}>
                {player.playing ? "Pause" : "Play"}
              </ThemedText>
            </HapticTab>

            <HapticTab
              style={[styles.button, styles.controlButton]}
              onPress={stopAudio}
            >
              <ThemedText style={styles.buttonText}>Stop</ThemedText>
            </HapticTab>
          </ThemedView>
        </ThemedView>
      )}

      {!audioSource && !isLoading && (
        <ThemedView style={styles.placeholder}>
          <ThemedText style={styles.placeholderText}>
            Upload an audio file to start playing
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 30,
  },
  uploadSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  uploadButton: {
    backgroundColor: "#007AFF",
  },
  controlButton: {
    backgroundColor: "#34C759",
    marginHorizontal: 5,
  },
  playPauseButton: {
    backgroundColor: "#FF9500",
    minWidth: 80,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loader: {
    marginTop: 10,
  },
  fileInfo: {
    alignItems: "center",
    marginBottom: 30,
    padding: 20,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    borderRadius: 15,
  },
  fileName: {
    textAlign: "center",
    marginBottom: 10,
  },
  timeInfo: {
    fontSize: 14,
    opacity: 0.7,
  },
  transcriptBox: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    marginBottom: 20,
    maxWidth: "90%",
  },
  transcriptText: {
    fontSize: 16,
  },
  controlsSection: {
    alignItems: "center",
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    alignItems: "center",
    marginTop: 50,
    padding: 30,
  },
  placeholderText: {
    textAlign: "center",
    opacity: 0.6,
    fontSize: 16,
  },
});
