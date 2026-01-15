import Storage from "expo-native-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface PromptedState {
  location: boolean;
  notifications: boolean;
}

interface OnboardingState {
  prompted: PromptedState;
  setPrompted: (key: keyof PromptedState, value: boolean) => void;
}

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      prompted: {
        location: false,
        notifications: false,
      },
      setPrompted: (key, value) =>
        set((state) => ({
          prompted: { ...state.prompted, [key]: value },
        })),
    }),
    {
      name: "onboarding-storage",
      storage: createJSONStorage(() => Storage),
    }
  )
);
