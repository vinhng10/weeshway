import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from "@/constants";
import { supabase } from "@/supabase";
import { ProfileType } from "@/types";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Session } from "@supabase/supabase-js";
import camelcaseKeys from "camelcase-keys";
import * as AppleAuthentication from "expo-apple-authentication";
import * as ExpoCrypto from "expo-crypto";
import { create } from "zustand";
import { useAlert } from "./useAlert";

interface AuthState {
  session: Session | null;
  profile: ProfileType | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
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
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()
        .throwOnError();

      set({
        profile: camelcaseKeys(data, { deep: true }) as ProfileType,
        isLoading: false,
      });
    } catch (error) {
      useAlert
        .getState()
        .showAlert(
          "Profile Error",
          "Couldn't load your profile. Please try again.",
        );
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        set({ session });
        // Do not await inside onAuthStateChange — it blocks the auth flow
        // and can deadlock when fetchProfile needs the token being set up.
        get().fetchProfile();
      } else if (event === "SIGNED_OUT") {
        // Single atomic update avoids two renders (and the resulting double
        // flash of the sign-in screen).
        set({ session: null, profile: null, isLoading: false });
      } else {
        set({ session });
      }
    });

    // Return cleanup to the caller (usually a useEffect)
    return () => subscription.unsubscribe();
  },

  signInWithGoogle: async () => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
    });

    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();

    if (!response.data?.idToken) {
      throw new Error("Google Sign-In did not return an ID token");
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: response.data.idToken,
    });
    if (error) throw error;
    // onAuthStateChange listener handles fetchProfile automatically
  },

  signInWithApple: async () => {
    const rawNonce = ExpoCrypto.randomUUID();
    const hashedNonce = await ExpoCrypto.digestStringAsync(
      ExpoCrypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      throw new Error("Apple Sign-In did not return an identity token");
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
      nonce: rawNonce,
    });
    if (error) throw error;
    // onAuthStateChange listener handles fetchProfile automatically
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },

  signUp: async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
  },

  verifyOtp: async (email, token) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) throw error;
  },

  resendOtp: async (email) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (error) throw error;
  },

  signOut: async () => {
    await GoogleSignin.signOut().catch(() => {});
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  deleteAccount: async () => {
    const { error } = await supabase.functions.invoke("deactivate-account");
    if (error) throw error;
    await supabase.auth.signOut();
  },
}));
