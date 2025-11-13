import { Role } from "@/constants/options";
import Storage from "expo-native-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface RoleState {
  role: Role;
  setRole: (role: Role) => void;
}

export const useRole = create<RoleState>()(
  persist(
    (set) => ({
      role: Role.Student,
      setRole: (role) => set(() => ({ role })),
    }),
    {
      name: "role-storage",
      storage: createJSONStorage(() => Storage),
    }
  )
);
