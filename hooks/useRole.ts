import { ROLE } from "@/constants";
import { RoleType } from "@/types";
import Storage from "expo-native-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface RoleState {
  role: RoleType;
  setRole: (role: RoleType) => void;
}

export const useRole = create<RoleState>()(
  persist(
    (set) => ({
      role: ROLE.STUDENT,
      setRole: (role) => set(() => ({ role })),
    }),
    {
      name: "role-storage",
      storage: createJSONStorage(() => Storage),
    }
  )
);
