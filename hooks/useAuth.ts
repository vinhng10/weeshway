import { supabase } from "@/supabase";
import { ProfileType } from "@/types";
import { Session } from "@supabase/supabase-js";
import camelcaseKeys from "camelcase-keys";
import { create } from "zustand";

interface AuthState {
  session: Session | null;
  profile: ProfileType | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => void;
  setSession: (session: Session | null) => void;
  fetchProfile: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: true,
  isLoggedIn: false,

  setSession: (session) => {
    set({ session, isLoggedIn: session != null });
    // Fetch profile when session changes
    get().fetchProfile();
  },

  fetchProfile: async () => {
    set({ isLoading: true });

    const session = get().session;
    if (session) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      set({ profile: camelcaseKeys(data, { deep: true }), isLoading: false });
    } else {
      set({ profile: null, isLoading: false });
    }
  },

  initialize: () => {
    const fetchSession = async () => {
      set({ isLoading: true });

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error fetching session:", error);
      }

      get().setSession(session);
    };

    fetchSession();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      get().setSession(session);
    });

    // Return cleanup function
    return () => {
      subscription.unsubscribe();
    };
  },

  signIn: async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  },

  signUp: async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
}));
