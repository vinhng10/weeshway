import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as DocumentPicker from "expo-document-picker";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet } from "react-native";
import { AudioRecorder } from "react-native-audio-api";
import { ExecutorchModule, ScalarType } from "react-native-executorch";
import { useModule } from "react-native-executorch/src/hooks/useModule";
import { HapticTab } from "./HapticTab";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

const DUCKING_VOLUME = 0.1;

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

  const player = useAudioPlayer(audioSource ? { uri: audioSource } : null);
  const status = useAudioPlayerStatus(player);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioHistoryRef = useRef<Float32Array>(new Float32Array(16000).fill(0));

  const model = useModule({
    module: ExecutorchModule,
    model: require("../assets/model.pte"),
  });

  useEffect(() => {
    if (status.didJustFinish) {
      stopAudio();
    }
  }, [status.didJustFinish]);

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

      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
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

  const startWakeWordRecorder = async () => {
    if (!model.isReady || recorderRef.current) return;

    const recorder = new AudioRecorder({
      sampleRate: 16000,
      bufferLengthInSamples: 2000,
    });

    recorder.onAudioReady(async ({ buffer }) => {
      try {
        if (!model.isReady) return;

        const newSamples = buffer.getChannelData(0);
        const newSamplesLength = newSamples.length;
        const totalInputLength = 16000;

        const history = audioHistoryRef.current;
        const remainingSamples = totalInputLength - newSamplesLength;

        const combinedSamples = new Float32Array(totalInputLength);
        combinedSamples.set(history.slice(newSamplesLength), 0);
        combinedSamples.set(newSamples, remainingSamples);

        audioHistoryRef.current = combinedSamples;

        const input = {
          dataPtr: combinedSamples,
          sizes: [1, 1, 16000],
          scalarType: ScalarType.FLOAT,
        };

        const output = await model.forward([input]);
        const outputData = new Float32Array(output[0].dataPtr as ArrayBuffer);

        if (outputData[0] > 0.5) {
          console.log("Wake word detected with confidence:", outputData[0]);
          setWakeTriggerAt(Date.now());
        }
      } catch (error) {
        // Silent catch to avoid spam in console
      }
    });

    recorderRef.current = recorder;

    try {
      await recorder.start();
      console.log("Wake word detection started");
    } catch (error) {
      console.error("Failed to start wake word detection:", error);
      recorderRef.current = null;
    }
  };

  const stopWakeWordRecorder = async () => {
    if (recorderRef.current) {
      try {
        await recorderRef.current.stop();
        recorderRef.current = null;
        audioHistoryRef.current.fill(0);
      } catch (error) {
        console.warn("Failed to stop wake word recorder:", error);
      }
    }
  };

  const startSpeechRecognitionOnce = async () => {
    try {
      const isCurrentlyPlaying = player.playing;
      setWasPlayingBeforeWakeWord(isCurrentlyPlaying);

      if (isCurrentlyPlaying) {
        duckAudioVolume();
      }

      await stopWakeWordRecorder();

      const permission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        console.warn("Speech permission not granted", permission);
        await startWakeWordRecorder();
        restoreAudioVolume();
        return;
      }

      const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
      if (!available) {
        console.warn("Speech recognition not available on this device");
        await startWakeWordRecorder();
        restoreAudioVolume();
        return;
      }

      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: false,
      });

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
      restoreAudioVolume();
      await startWakeWordRecorder();
    }
  };

  useSpeechRecognitionEvent("start", () => {
    setRecognizing(true);
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

    restoreAudioVolume();

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

    setWasPlayingBeforeWakeWord(false);

    // Restart wake word detection
    await startWakeWordRecorder();
  });

  useSpeechRecognitionEvent("result", (event) => {
    const next = event.results?.[0]?.transcript ?? "";
    setTranscript(next);
  });

  useSpeechRecognitionEvent("error", async (event) => {
    console.log("Speech error:", event.error, event.message);
    setRecognizing(false);
    setTranscript("");

    restoreAudioVolume();

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

    setWasPlayingBeforeWakeWord(false);

    // Restart wake word detection
    await startWakeWordRecorder();
  });

  // Initialize wake word detection when audio is loaded and model is ready
  useEffect(() => {
    if (!audioSource || !model.isReady) return;

    startWakeWordRecorder();

    return () => {
      stopWakeWordRecorder();
    };
  }, [audioSource, model.isReady]);

  // React to wake word detection
  useEffect(() => {
    if (!wakeTriggerAt) return;
    startSpeechRecognitionOnce();
  }, [wakeTriggerAt]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWakeWordRecorder();
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
            {formatTime(player.currentTime * 1000)} /{" "}
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
