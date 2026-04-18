import { supabase } from "@/supabase";
import { create } from "zustand";

interface FeatureFlagsState {
  flags: Record<string, boolean>;
  isLoaded: boolean;
  initFlags: () => Promise<void>;
  isEnabled: (flag: string) => boolean;
}

export const useFeatureFlags = create<FeatureFlagsState>((set, get) => ({
  flags: {},
  isLoaded: false,

  initFlags: async () => {
    try {
      const { data } = await supabase.from("flags").select("flag, enabled");
      const map = Object.fromEntries(
        (data ?? []).map((r) => [r.flag, r.enabled])
      );
      set({ flags: map, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  isEnabled: (flag: string) => get().flags[flag] ?? false,
}));
