import { create } from "zustand";

interface TempDataStoreState {
  data: unknown;
  setData: <T>(value: T | null) => void;
  getData: <T>() => T | null;
  reset: () => void;
}

export const useTempDataStore = create<TempDataStoreState>((set, get) => ({
  data: null,

  setData: (value) => set({ data: value }),

  getData: <T>() => (get().data as T) ?? null,

  reset: () => set({ data: null }),
}));
