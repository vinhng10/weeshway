import { RoleEnum } from "@/constants";
import Storage from "expo-native-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface RoleState {
  role: RoleEnum;
  setRole: (role: RoleEnum) => void;
}

export const useRole = create<RoleState>()(
  persist(
    (set) => ({
      role: RoleEnum.Student,
      setRole: (role) => set(() => ({ role })),
    }),
    {
      name: "role-storage",
      storage: createJSONStorage(() => Storage),
    }
  )
);
