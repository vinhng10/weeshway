import { create } from "zustand";

interface AlertOptions {
  confirmLabel?: string;
  onConfirm?: () => void;
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  show: (title: string, message: string, options?: AlertOptions) => void;
  hide: () => void;
}

export const useAlert = create<AlertState>()((set) => ({
  visible: false,
  title: "",
  message: "",
  confirmLabel: undefined,
  onConfirm: undefined,
  show: (title, message, options) =>
    set({ visible: true, title, message, ...options }),
  hide: () =>
    set({
      visible: false,
      title: "",
      message: "",
      confirmLabel: undefined,
      onConfirm: undefined,
    }),
}));
