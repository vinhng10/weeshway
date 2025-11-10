import Storage from "expo-native-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Role = "student" | "teacher";

interface RoleState {
  role: Role;
  setRole: (role: Role) => void;
}

export const useRole = create<RoleState>()(
  persist(
    (set) => ({
      role: "student",
      setRole: (role) => set(() => ({ role })),
    }),
    {
      name: "role-storage",
      storage: createJSONStorage(() => Storage),
    }
  )
);
