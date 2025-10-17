import { useEffect, useRef, useState } from "react";
import { AudioRecorder } from "react-native-audio-api";
import { ExecutorchModule, ScalarType } from "react-native-executorch";
import { useModule } from "react-native-executorch/src/hooks/useModule";

export const useWakeWordDetection = (
  enabled: boolean,
  audioSource: string | null
) => {
  const [wakeTriggerAt, setWakeTriggerAt] = useState<number | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioHistoryRef = useRef<Float32Array>(new Float32Array(16000).fill(0));

  const model = useModule({
    module: ExecutorchModule,
    model: require("../../../assets/model.pte"),
  });

  const startWakeWordRecorder = async () => {
    if (!model.isReady || recorderRef.current || !enabled) return;

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

        if (outputData[0] > 0.7) {
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

  // Initialize wake word detection when audio is loaded and model is ready
  useEffect(() => {
    if (!audioSource || !model.isReady || !enabled) return;

    startWakeWordRecorder();

    return () => {
      stopWakeWordRecorder();
    };
  }, [audioSource, model.isReady, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWakeWordRecorder();
    };
  }, []);

  return {
    wakeTriggerAt,
    startWakeWordRecorder,
    stopWakeWordRecorder,
  };
};
