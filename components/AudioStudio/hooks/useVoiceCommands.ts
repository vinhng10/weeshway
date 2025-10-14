import type { AudioPlayer } from "expo-audio";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import Groq from "groq-sdk";
import { useState } from "react";
import { AudioPlayerAction, DUCKING_VOLUME } from "../types";

const llm = new Groq({
  apiKey: "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",
});

interface UseVoiceCommandsParams {
  player: AudioPlayer;
  onAudioAction: (action: AudioPlayerAction) => void;
  onWakeWordRecorderStart: () => Promise<void>;
  onWakeWordRecorderStop: () => Promise<void>;
}

export const useVoiceCommands = ({
  player,
  onAudioAction,
  onWakeWordRecorderStart,
  onWakeWordRecorderStop,
}: UseVoiceCommandsParams) => {
  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [wasPlayingBeforeWakeWord, setWasPlayingBeforeWakeWord] =
    useState(false);
  const [originalVolume, setOriginalVolume] = useState<number | null>(null);

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

  const fetchModelResponse = async (
    inputText: string
  ): Promise<AudioPlayerAction | null> => {
    try {
      const response = await llm.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "system",
            content:
              "You are an audio player voice assistant. Infer user's intent from the voice command and return the audio player action, target audio items, and audio type (music or count).",
          },
          { role: "user", content: "Play items three and five" },
          {
            role: "assistant",
            content: JSON.stringify({
              action: "play",
              items: [3, 5],
              type: "music",
            }),
          },
          { role: "user", content: "Stop the music" },
          {
            role: "assistant",
            content: JSON.stringify({
              action: "stop",
              items: [],
              type: "music",
            }),
          },
          { role: "user", content: "Play the last two section" },
          {
            role: "assistant",
            content: JSON.stringify({
              action: "play",
              items: [-2, -1],
              type: "music",
            }),
          },
          { role: "user", content: "Play one four six" },
          {
            role: "assistant",
            content: JSON.stringify({
              action: "play",
              items: [1, 4, 6],
              type: "music",
            }),
          },
          { role: "user", content: "Count to five" },
          {
            role: "assistant",
            content: JSON.stringify({
              action: "play",
              items: [5],
              type: "count",
            }),
          },
          { role: "user", content: "Stop counting" },
          {
            role: "assistant",
            content: JSON.stringify({
              action: "stop",
              items: [],
              type: "count",
            }),
          },
          { role: "user", content: inputText },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "audio_player_action",
            schema: {
              type: "object",
              properties: {
                action: { type: "string", enum: ["play", "stop"] },
                items: { type: "array", items: { type: "number" } },
                type: { type: "string", enum: ["music", "count"] },
              },
              required: ["action", "items", "type"],
              additionalProperties: false,
            },
          },
        },
        temperature: 0.2,
      });
      const parsed = JSON.parse(response.choices[0].message.content || "{}");
      if (
        typeof parsed === "object" &&
        parsed &&
        (parsed.action === "play" || parsed.action === "stop") &&
        Array.isArray(parsed.items) &&
        (parsed.type === "music" || parsed.type === "count")
      ) {
        return parsed as AudioPlayerAction;
      }
      return null;
    } catch (err) {
      console.warn("Groq request failed", err);
      return null;
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
      try {
        player.pause();
      } catch (e) {
        console.error("Failed to stop after command:", e);
      }
    }
  };

  const startSpeechRecognition = async () => {
    try {
      const isCurrentlyPlaying = player.playing;
      setWasPlayingBeforeWakeWord(isCurrentlyPlaying);

      if (isCurrentlyPlaying) {
        duckAudioVolume();
      }

      await onWakeWordRecorderStop();

      const permission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        console.warn("Speech permission not granted", permission);
        await onWakeWordRecorderStart();
        restoreAudioVolume();
        return;
      }

      const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
      if (!available) {
        console.warn("Speech recognition not available on this device");
        await onWakeWordRecorderStart();
        restoreAudioVolume();
        return;
      }

      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: false,
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
      await onWakeWordRecorderStart();
    }
  };

  // Speech recognition event handlers
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

  useSpeechRecognitionEvent("result", async (event) => {
    const next = event.results?.[0]?.transcript?.trim() ?? "";
    setTranscript(next);
    setRecognizing(false);

    let modelResult: AudioPlayerAction | null = null;
    if (next) {
      modelResult = await fetchModelResponse(next);
      if (modelResult) {
        console.log("Model result:", modelResult);
        onAudioAction(modelResult);
      } else {
        // Fallback to simple keywords if model fails
        handleTranscriptCommand(next);
      }
    }
    setTranscript("");

    restoreAudioVolume();

    if (wasPlayingBeforeWakeWord && !player.playing) {
      // Only auto-resume if model did not explicitly stop
      const shouldResume = !modelResult || modelResult.action !== "stop";
      if (!shouldResume) {
        setWasPlayingBeforeWakeWord(false);
      } else {
        try {
          player.play();
        } catch (playError) {
          console.warn(
            "Failed to resume audio playback after speech recognition",
            playError
          );
        }
      }
    }

    setWasPlayingBeforeWakeWord(false);

    // Restart wake word detection
    await onWakeWordRecorderStart();
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
    await onWakeWordRecorderStart();
  });

  return {
    recognizing,
    transcript,
    startSpeechRecognition,
  };
};
