import { create } from "zustand";
import type { ActorRole, ScreenId, ViewMode } from "../api/types";

interface DemoStore {
  screen: ScreenId;
  viewMode: ViewMode;
  userRole: ActorRole;
  setScreen: (screen: ScreenId) => void;
  setViewMode: (mode: ViewMode) => void;
  setUserRole: (role: ActorRole) => void;
}

/** Demo Control Bar UI state (pmndrs/zustand) — без бизнес-расчётов. */
export const useDemoStore = create<DemoStore>((set) => ({
  screen: 1,
  viewMode: "business",
  userRole: "CEO_OWNER",
  setScreen: (screen) => set({ screen }),
  setViewMode: (viewMode) => set({ viewMode }),
  setUserRole: (userRole) => set({ userRole }),
}));
