import { supabase } from "@/supabase";
import { useAlertStore } from "./useAlertStore";
import { ProfileType } from "@/types";
import { Session } from "@supabase/supabase-js";
import camelcaseKeys from "camelcase-keys";
import { create } from "zustand";

interface AuthState {
  session: Session | null;
  profile: ProfileType | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: true,

  fetchProfile: async () => {
    const session = get().session;
    if (!session) {
      set({ profile: null, isLoading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;

      set({
        profile: camelcaseKeys(data, { deep: true }) as ProfileType,
        isLoading: false,
      });
    } catch (error) {
      useAlertStore.getState().show("Profile Error", "Couldn't load your profile. Please try again.");
      set({ profile: null, isLoading: false });
    }
  },

  initialize: () => {
    // 1. Check for an existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session });
      if (session) {
        get().fetchProfile();
      } else {
        set({ isLoading: false });
      }
    });

    // 2. Setup the listener for all future auth events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      set({ session });

      if (event === "SIGNED_IN" && session) {
        await get().fetchProfile();
      } else if (event === "SIGNED_OUT") {
        set({ profile: null, session: null, isLoading: false });
      }
    });

    // Return cleanup to the caller (usually a useEffect)
    return () => subscription.unsubscribe();
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
}));
