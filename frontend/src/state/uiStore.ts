import { create } from "zustand";

export type ToastTone = "success" | "warning" | "error" | "loading";

export interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  subtitle: string;
  actionLabel?: string;
  until?: number;
  undo?: () => void;
}

interface UiState {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  toasts: ToastItem[];
  pushToast: (item: Omit<ToastItem, "id">) => string;
  dismissToast: (id: string) => void;
  undoLatest: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toasts: [],
  pushToast: (item) => {
    const id = `toast-${Date.now()}-${get().toasts.length}`;
    set({ toasts: [...get().toasts, { ...item, id }].slice(-3) });
    return id;
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((row) => row.id !== id) }),
  undoLatest: () => {
    const item = [...get().toasts].reverse().find((row) => row.undo && (!row.until || row.until > Date.now()));
    if (!item?.undo) {
      return;
    }
    item.undo();
    set({ toasts: get().toasts.filter((row) => row.id !== item.id) });
  },
}));
