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
  showAlert: (title: string, message: string, options?: AlertOptions) => void;
  hideAlert: () => void;
}

export const useAlert = create<AlertState>()((set) => ({
  visible: false,
  title: "",
  message: "",
  confirmLabel: undefined,
  onConfirm: undefined,
  showAlert: (title, message, options) =>
    set({ visible: true, title, message, ...options }),
  hideAlert: () =>
    set({
      visible: false,
      title: "",
      message: "",
      confirmLabel: undefined,
      onConfirm: undefined,
    }),
}));
