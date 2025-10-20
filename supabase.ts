import { createClient } from "@supabase/supabase-js";
import Storage from "expo-native-storage";

const supabaseUrl = "http://10.0.0.25:54321";
const supabasePublishableKey = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: Storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
